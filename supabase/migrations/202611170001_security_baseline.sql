-- Fresh Supabase projects ONLY. Existing installations require a schema-specific migration.
begin;
do $$ begin
  if to_regclass('public.properties') is not null or to_regclass('public.agents') is not null then
    raise exception 'Existing marketplace tables found. Export schema and policies; reconcile before migration.';
  end if;
  if exists (select 1 from storage.buckets where id in ('property-images','property-videos')) then
    raise exception 'Existing media buckets found. Review objects and policies before migration.';
  end if;
end $$;

create schema zoya_private;
revoke all on schema zoya_private from public, anon, authenticated;
create table zoya_private.administrators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table zoya_private.submissions (
  owner_id uuid not null,
  submission_id uuid not null,
  property_id uuid not null,
  payload jsonb not null,
  primary key(owner_id, submission_id)
);
create table zoya_private.moderation_events (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null,
  actor_id uuid not null,
  previous_status text not null,
  new_status text not null,
  reason text not null check (length(btrim(reason)) between 5 and 1000),
  created_at timestamptz not null default now()
);
revoke all on all tables in schema zoya_private from public, anon, authenticated;

create function public.is_marketplace_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from zoya_private.administrators where user_id = auth.uid());
$$;
revoke all on function public.is_marketplace_admin() from public, anon;
grant execute on function public.is_marketplace_admin() to authenticated;

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  company text, profile_image_url text, phone text, email text,
  city text, location text, bio text,
  verified boolean not null default false,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.agents enable row level security;
revoke all on public.agents from public, anon, authenticated;
grant select on public.agents to anon, authenticated;
create policy agents_public_read on public.agents for select to anon, authenticated using (active);
create policy agents_self_read on public.agents for select to authenticated using (user_id = (select auth.uid()));

create function public.ensure_agent(p_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  insert into public.agents(user_id, name) values (auth.uid(), p_name)
    on conflict (user_id) do nothing;
  select id into result from public.agents where user_id = auth.uid();
  return result;
end $$;
revoke all on function public.ensure_agent(text) from public, anon;
grant execute on function public.ensure_agent(text) to authenticated;

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  submission_id uuid not null,
  title text not null check (length(btrim(title)) between 3 and 160),
  description text check (length(description) <= 10000),
  listing_type text not null check (listing_type in ('sale','rent')),
  property_type text not null check (property_type in ('apartment','house','office','shop','warehouse','land','development')),
  price numeric(16,2) not null check (price > 0 and price <= 99999999999999.99),
  currency text not null check (currency in ('TZS','USD')),
  rent_period text,
  location text not null check (length(btrim(location)) between 2 and 200),
  city text not null check (length(btrim(city)) between 2 and 100),
  bedrooms integer not null check (bedrooms between 0 and 100),
  bathrooms integer not null check (bathrooms between 0 and 100),
  area_sqm numeric check (area_sqm > 0 and area_sqm <= 1000000000),
  agent_name text not null check (length(btrim(agent_name)) between 1 and 120),
  agent_phone text not null check (agent_phone ~ '^\+[1-9][0-9]{7,14}$'),
  agent_whatsapp text not null check (agent_whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  verified boolean not null default false,
  image_url text not null,
  image_urls text[] not null check (cardinality(image_urls) between 1 and 10 and array_position(image_urls, null) is null),
  video_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, submission_id),
  check ((listing_type = 'sale' and rent_period is null) or
         (listing_type = 'rent' and rent_period is not null and rent_period in ('day','week','month','year'))),
  check (image_url = image_urls[1])
);
create index properties_public_latest on public.properties(created_at desc) where status = 'approved';
create index properties_owner on public.properties(owner_id, created_at desc);
alter table public.properties enable row level security;
revoke all on public.properties from public, anon, authenticated;
grant select on public.properties to anon, authenticated;
create policy properties_public_read on public.properties for select to anon, authenticated using (status = 'approved');
create policy properties_owner_read on public.properties for select to authenticated using (owner_id = (select auth.uid()));
create policy properties_admin_read on public.properties for select to authenticated using ((select public.is_marketplace_admin()));

-- No direct table writes: RPCs are the only client mutation interface.
create function public.submit_property(p_input jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare result uuid; original_payload jsonb; images text[]; media text; bucket text; object_name text;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if jsonb_typeof(p_input) is distinct from 'object' then raise exception 'Expected object' using errcode = '22023'; end if;
  if exists (select 1 from jsonb_object_keys(p_input) k where k not in
    ('submission_id','title','description','listing_type','property_type','price','currency','rent_period','location','city','bedrooms','bathrooms','area_sqm','agent_name','agent_phone','agent_whatsapp','image_urls','video_url')) then
    raise exception 'Unexpected field' using errcode = '22023';
  end if;
  -- Serializes retries and per-account submission limits across application instances.
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  select property_id, payload into result, original_payload from zoya_private.submissions
    where owner_id = auth.uid() and submission_id = (p_input->>'submission_id')::uuid;
  if result is not null then
    if original_payload is distinct from p_input then
      raise exception 'Submission reference already used with different content' using errcode = '23505';
    end if;
    return result;
  end if;
  if (select count(*) from public.properties where owner_id = auth.uid() and created_at > now() - interval '1 day') >= 10 then
    raise exception 'Daily listing limit reached' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_input->'image_urls') is distinct from 'array' then raise exception 'Images required' using errcode = '22023'; end if;
  select array_agg(value) into images from jsonb_array_elements_text(p_input->'image_urls');
  if cardinality(images) <> (select count(distinct x) from unnest(images) x) then
    raise exception 'Duplicate images' using errcode = '22023';
  end if;
  foreach media in array coalesce(images, array[]::text[]) ||
    case when p_input->>'video_url' is null then array[]::text[] else array[p_input->>'video_url'] end loop
    bucket := case when media = p_input->>'video_url' then 'property-videos' else 'property-images' end;
    if media !~ ('^/api/media/' || bucket || '/' || auth.uid()::text || '/[0-9a-f-]{36}\.(jpg|png|webp|mp4|webm)$') then
      raise exception 'Invalid media ownership' using errcode = '22023';
    end if;
    object_name := substring(media from length('/api/media/' || bucket || '/') + 1);
    if not exists (select 1 from storage.objects where bucket_id = bucket and name = object_name and owner_id = auth.uid()::text) then
      raise exception 'Media object missing or not owned' using errcode = '22023';
    end if;
  end loop;
  insert into public.properties(owner_id, submission_id, title, description, listing_type, property_type,
    price, currency, rent_period, location, city, bedrooms, bathrooms, area_sqm,
    agent_name, agent_phone, agent_whatsapp, image_url, image_urls, video_url)
  values (auth.uid(), (p_input->>'submission_id')::uuid, p_input->>'title', p_input->>'description',
    p_input->>'listing_type', p_input->>'property_type', (p_input->>'price')::numeric,
    p_input->>'currency', p_input->>'rent_period', p_input->>'location', p_input->>'city',
    (p_input->>'bedrooms')::integer, (p_input->>'bathrooms')::integer, (p_input->>'area_sqm')::numeric,
    p_input->>'agent_name', p_input->>'agent_phone', p_input->>'agent_whatsapp',
    images[1], images, p_input->>'video_url') returning id into result;
  insert into zoya_private.submissions(owner_id, submission_id, property_id, payload)
    values(auth.uid(), (p_input->>'submission_id')::uuid, result, p_input);
  return result;
end $$;
revoke all on function public.submit_property(jsonb) from public, anon;
grant execute on function public.submit_property(jsonb) to authenticated;

create function public.moderate_property(p_id uuid, p_status text, p_expected_status text, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare previous text;
begin
  if not public.is_marketplace_admin() then raise exception 'Administrator required' using errcode = '42501'; end if;
  if p_status is null or p_status not in ('pending','approved','rejected') or p_expected_status is null then
    raise exception 'Invalid status' using errcode = '22023';
  end if;
  if p_reason is null or length(btrim(p_reason)) not between 5 and 1000 then
    raise exception 'Review reason required' using errcode = '22023';
  end if;
  select status into previous from public.properties where id = p_id for update;
  if previous is null then raise exception 'Property not found' using errcode = 'P0002'; end if;
  if previous <> p_expected_status then raise exception 'Listing changed; refresh before reviewing' using errcode = '40001'; end if;
  if previous = p_status then return; end if;
  update public.properties set status = p_status, updated_at = now() where id = p_id;
  -- Publication approval NEVER implies identity or ownership verification.
  insert into zoya_private.moderation_events(property_id, actor_id, previous_status, new_status, reason)
    values (p_id, auth.uid(), previous, p_status, btrim(p_reason));
end $$;
revoke all on function public.moderate_property(uuid,text,text,text) from public, anon;
grant execute on function public.moderate_property(uuid,text,text,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('property-images','property-images',false,10485760,array['image/jpeg','image/png','image/webp']),
 ('property-videos','property-videos',false,52428800,array['video/mp4','video/webm']);

create policy zoya_media_upload on storage.objects for insert to authenticated with check (
 owner_id = (select auth.uid())::text and
 ((bucket_id = 'property-images' and name ~ ('^' || (select auth.uid())::text || '/[0-9a-f-]{36}\.(jpg|png|webp)$')) or
  (bucket_id = 'property-videos' and name ~ ('^' || (select auth.uid())::text || '/[0-9a-f-]{36}\.(mp4|webm)$')))
);
create policy zoya_media_owner_read on storage.objects for select to authenticated using (
 bucket_id in ('property-images','property-videos') and owner_id = (select auth.uid())::text
);
create policy zoya_media_admin_read on storage.objects for select to authenticated using (
 bucket_id in ('property-images','property-videos') and (select public.is_marketplace_admin())
);
create policy zoya_media_public_read on storage.objects for select to anon, authenticated using (
 bucket_id in ('property-images','property-videos') and exists (
  select 1 from public.properties p where p.status = 'approved' and
   (('/api/media/' || bucket_id || '/' || name) = any(p.image_urls) or
    ('/api/media/' || bucket_id || '/' || name) = p.video_url)
 )
);
-- No client UPDATE or DELETE policies: published media cannot be replaced underneath a review.
commit;
