import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Real PostgreSQL engine (WASM). Auth/Storage service schemas are minimal fixtures,
// NOT a substitute for a final integration run against a staging Supabase project.
const migration = await readFile(new URL('../supabase/migrations/202611170001_security_baseline.sql', import.meta.url),'utf8');
const owner='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
const admin='33333333-3333-4333-8333-333333333333';
const object='44444444-4444-4444-8444-444444444444.jpg';
const media=`/api/media/property-images/${owner}/${object}`;
const payload={submission_id:'55555555-5555-4555-8555-555555555555',title:'Dar apartment',description:null,listing_type:'sale',property_type:'apartment',price:100000,currency:'TZS',rent_period:null,location:'Mikocheni',city:'Dar es Salaam',bedrooms:2,bathrooms:1,area_sqm:80,agent_name:'Owner',agent_phone:'+255712345678',agent_whatsapp:'+255712345678',image_urls:[media],video_url:null};

async function bootstrap(db) {
 await db.exec(`
 create role anon nologin; create role authenticated nologin;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
 create schema storage;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,owner_id text);
 alter table storage.objects enable row level security;
 grant usage on schema storage to anon,authenticated;
 grant select on storage.objects to anon; grant select,insert,update,delete on storage.objects to authenticated;
 insert into auth.users values ('${owner}'),('${other}'),('${admin}');
 `);
}

test('database authorization and lifecycle', async t => {
 const db = new PGlite();
 await bootstrap(db); await db.exec(migration);
 await db.query('insert into zoya_private.administrators(user_id) values ($1)',[admin]);
 async function as(role, user, query, params=[]) {
   await db.exec('begin');
   try {
     await db.exec(`set local role ${role}`);
     await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user || '']);
     const result=await db.query(query,params); await db.exec('commit'); return result.rows;
   } catch(error) { await db.exec('rollback'); throw error; }
 }
 let id;
 await t.test('anonymous cannot submit',async()=>assert.rejects(as('anon',null,'select public.submit_property($1)',[payload]),/permission denied/));
 await t.test('anonymous cannot upload',async()=>assert.rejects(as('anon',null,"insert into storage.objects(bucket_id,name,owner_id) values ('property-images',$1,$2)",[`${owner}/${object}`,owner])));
 await t.test('authenticated user cannot upload into another account',async()=>assert.rejects(as('authenticated',other,"insert into storage.objects(bucket_id,name,owner_id) values ('property-images',$1,$2)",[`${owner}/${object}`,other]),/row-level security/));
 await t.test('owner may upload allowed path',async()=>as('authenticated',owner,"insert into storage.objects(bucket_id,name,owner_id) values ('property-images',$1,$2)",[`${owner}/${object}`,owner]));
 await t.test('SVG path rejected by policy',async()=>assert.rejects(as('authenticated',owner,"insert into storage.objects(bucket_id,name,owner_id) values ('property-images',$1,$2)",[`${owner}/44444444-4444-4444-8444-444444444444.svg`,owner])));
 await t.test('unpublished media hidden from public and unrelated account',async()=>{
  assert.equal((await as('anon',null,'select * from storage.objects')).length,0);
  assert.equal((await as('authenticated',other,'select * from storage.objects')).length,0);
 });
 await t.test('owner can read own media',async()=>assert.equal((await as('authenticated',owner,'select * from storage.objects')).length,1));
 await t.test('cannot spoof approval or ownership through RPC',async()=>{
  for(const extra of [{owner_id:other},{status:'approved'},{verified:true}]) await assert.rejects(as('authenticated',owner,'select public.submit_property($1)',[{...payload,...extra}]),/Unexpected field/);
 });
 await t.test('cannot submit nonexistent or foreign media',async()=>{
  await assert.rejects(as('authenticated',other,'select public.submit_property($1)',[payload]),/media ownership/);
  await assert.rejects(as('authenticated',owner,'select public.submit_property($1)',[{...payload,image_urls:[media.replace(object,'99999999-9999-4999-8999-999999999999.jpg')]}]),/missing or not owned/);
 });
 await t.test('database validates business fields independently of API',async()=>{
  for(const patch of [{price:-1},{listing_type:'rent',rent_period:null},{agent_phone:'0712345678'},{image_urls:[]},{currency:'BAD'}]) await assert.rejects(as('authenticated',owner,'select public.submit_property($1)',[{...payload,...patch}]));
 });
 await t.test('valid submission binds owner and starts pending/unverified',async()=>{
  id=(await as('authenticated',owner,'select public.submit_property($1) as id',[payload]))[0].id;
  const row=(await as('authenticated',owner,'select * from public.properties'))[0];
  assert.equal(row.owner_id,owner);assert.equal(row.status,'pending');assert.equal(row.verified,false);
 });
 await t.test('retry returns same listing',async()=>assert.equal((await as('authenticated',owner,'select public.submit_property($1) as id',[payload]))[0].id,id));
 await t.test('retry key cannot silently accept changed content',async()=>assert.rejects(as('authenticated',owner,'select public.submit_property($1)',[{...payload,title:'Different title'}]),/different content/));
 await t.test('pending listing invisible publicly and across accounts',async()=>{
  assert.equal((await as('anon',null,'select * from public.properties')).length,0);
  assert.equal((await as('authenticated',other,'select * from public.properties')).length,0);
 });
 await t.test('direct writes cannot bypass RPCs',async()=>{
  await assert.rejects(as('authenticated',owner,"update public.properties set verified=true where id=$1",[id]),/permission denied/);
  await assert.rejects(as('authenticated',admin,"update public.properties set status='approved' where id=$1",[id]),/permission denied/);
  await assert.rejects(as('authenticated',owner,'delete from public.properties where id=$1',[id]),/permission denied/);
 });
 await t.test('ordinary user cannot moderate or grant administrator role',async()=>{
  await assert.rejects(as('authenticated',owner,"select public.moderate_property($1,'approved','pending','Looks good')",[id]),/Administrator required/);
  await assert.rejects(as('authenticated',owner,'insert into zoya_private.administrators(user_id) values ($1)',[owner]),/permission denied/);
 });
 await t.test('admin can review pending media and listing',async()=>{
  assert.equal((await as('authenticated',admin,'select * from public.properties')).length,1);
  assert.equal((await as('authenticated',admin,'select * from storage.objects')).length,1);
 });
 await t.test('moderation requires reason',async()=>assert.rejects(as('authenticated',admin,"select public.moderate_property($1,'approved','pending','')",[id]),/reason required/));
 await t.test('approval is audited and does not verify ownership',async()=>{
  await as('authenticated',admin,"select public.moderate_property($1,'approved','pending','Reviewed listing content')",[id]);
  const row=(await as('anon',null,'select * from public.properties'))[0];assert.equal(row.verified,false);
  assert.equal((await db.query('select * from zoya_private.moderation_events')).rows.length,1);
  assert.equal((await as('anon',null,'select * from storage.objects')).length,1);
 });
 await t.test('stale review fails without adding audit event',async()=>{
  await assert.rejects(as('authenticated',admin,"select public.moderate_property($1,'rejected','pending','Stale review')",[id]),/Listing changed/);
  assert.equal((await db.query('select * from zoya_private.moderation_events')).rows.length,1);
 });
 await t.test('published media cannot be replaced or deleted by owner',async()=>{
  assert.equal((await as('authenticated',owner,"update storage.objects set name='replacement' returning *")).length,0);
  assert.equal((await as('authenticated',owner,'delete from storage.objects returning *')).length,0);
 });
 await t.test('rejection removes public listing and media access',async()=>{
  await as('authenticated',admin,"select public.moderate_property($1,'rejected','approved','Listing withdrawn for review')",[id]);
  assert.equal((await as('anon',null,'select * from public.properties')).length,0);
  assert.equal((await as('anon',null,'select * from storage.objects')).length,0);
 });
 await t.test('audit records unavailable to normal accounts',async()=>assert.rejects(as('authenticated',owner,'select * from zoya_private.moderation_events'),/permission denied/));
 await t.test('profile creation binds current account without granting verification',async()=>{
  await as('authenticated',owner,"select public.ensure_agent('Owner')");
  const rows=await as('authenticated',owner,'select * from public.agents');assert.equal(rows[0].user_id,owner);assert.equal(rows[0].verified,false);assert.equal(rows[0].active,false);
  assert.equal((await as('anon',null,'select * from public.agents')).length,0);
  await assert.rejects(as('authenticated',owner,'update public.agents set verified=true'),/permission denied/);
 });
 await t.test('daily quota enforced in database; retries still succeed',async()=>{
  for(let i=1;i<10;i++) await as('authenticated',owner,'select public.submit_property($1)',[{...payload,submission_id:`66666666-6666-4666-8666-${String(i).padStart(12,'0')}`}]);
  await assert.rejects(as('authenticated',owner,'select public.submit_property($1)',[{...payload,submission_id:'77777777-7777-4777-8777-777777777777'}]),/Daily listing limit/);
  assert.equal((await as('authenticated',owner,'select public.submit_property($1) as id',[payload]))[0].id,id);
 });
 await t.test('existing installation guard prevents replay',async()=>{
  await assert.rejects(db.exec(migration),/Existing marketplace tables/);await db.exec('rollback');
 });
 await db.close();
});
