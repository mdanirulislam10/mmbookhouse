-- ============================================================================
-- mmbookhouse — RESET PUBLIC SCHEMA  (DESTRUCTIVE, run once, by the owner)
-- ----------------------------------------------------------------------------
-- Deletes EVERY table, view, function, type and row in the `public` schema and
-- recreates it empty with the standard Supabase grants. It does NOT touch
-- `auth` (customer/staff accounts stay), `storage` or other schemas.
--
-- Run this in: Supabase Dashboard -> SQL Editor. Then run the migrations in
-- supabase/migrations/ (or the single file supabase/all_migrations.sql).
--
-- If you still need the old data, run the encrypted backup first
-- (GitHub Actions -> "Encrypted database backup" -> Run workflow).
-- ============================================================================

drop schema if exists public cascade;
create schema public;

alter schema public owner to postgres;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;

-- Same defaults a fresh Supabase project has; RLS (enabled per table in the
-- migrations) is what actually protects the data.
alter default privileges in schema public grant all on tables    to postgres, service_role;
alter default privileges in schema public grant all on functions to postgres, service_role;
alter default privileges in schema public grant all on sequences to postgres, service_role;

alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated;

comment on schema public is 'mmbookhouse storefront + admin (rebuild v2)';
