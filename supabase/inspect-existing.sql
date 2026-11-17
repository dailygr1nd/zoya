-- READ ONLY. Run in the existing project's Supabase SQL Editor.
-- Returns schema/security metadata, not customer rows, tokens, passwords or keys.
-- Export each result set and review before sharing.
select table_schema, table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' order by table_name, ordinal_position;

select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity as rls_enabled,
 c.relforcerowsecurity as rls_forced
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public','storage') and c.relkind in ('r','p') order by 1,2;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies where schemaname in ('public','storage') order by 1,2,3;

select table_schema, table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema in ('public','storage') and grantee in ('PUBLIC','anon','authenticated')
order by 1,2,3,4;

select n.nspname as schema_name, c.relname as table_name, con.conname,
 pg_get_constraintdef(con.oid) as definition
from pg_constraint con join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public'
order by 1,2,3;

select n.nspname as schema_name, p.proname as function_name,
 pg_get_function_identity_arguments(p.oid) as arguments,
 p.prosecdef as security_definer, p.proconfig as configuration
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' order by 1,2;

select event_object_schema, event_object_table, trigger_name, action_timing,
 event_manipulation, action_statement
from information_schema.triggers where event_object_schema = 'public' order by 1,2,3;

select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets order by id;
