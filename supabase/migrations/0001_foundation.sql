-- 0001 Foundation: extensions, helpers, profiles, staff, settings, audit, rate limits, backups
-- Idempotent where practical; designed to run on a freshly reset `public` schema.

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
-- Search functions run as the caller, so the roles need to see the trigram functions.
grant usage on schema extensions to anon, authenticated, service_role;

-- ---------------------------------------------------------------- helpers ---
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Recognises the logged-in user in Supabase (auth.uid()) and in the PGlite test harness.
-- Server-only functions (service_role) must revoke execute from anon/authenticated.

-- ---------------------------------------------------------------- profiles ---
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text check (phone is null or phone ~ '^[0-9+][0-9 -]{7,14}$'),
  avatar_url  text,
  lang        text not null default 'bn' check (lang in ('bn', 'en')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
create policy profiles_select_own on public.profiles for select to authenticated
  using (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Every new auth user gets a profile row.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    null,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------- staff ---
create type public.staff_role as enum ('super_admin', 'inventory_manager', 'dispatch_staff');

create table public.staff_members (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  role          public.staff_role not null,
  display_name  text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_staff_updated before update on public.staff_members
  for each row execute function public.set_updated_at();

alter table public.staff_members enable row level security;
-- A staff member may read only their own row; everything else is service-role only.
create policy staff_select_own on public.staff_members for select to authenticated
  using (user_id = auth.uid());

-- -------------------------------------------------------------- settings ---
-- Key/value store editable from the admin panel. Public keys are readable by
-- the storefront (store profile, notice bar, UPI id …); private keys are not.
create table public.site_settings (
  key         text primary key check (key ~ '^[a-z][a-z0-9_]{1,60}$'),
  value       jsonb not null,
  is_public   boolean not null default false,
  updated_by  uuid references auth.users(id) on delete set null,
  updated_at  timestamptz not null default now()
);
create trigger trg_settings_updated before update on public.site_settings
  for each row execute function public.set_updated_at();

alter table public.site_settings enable row level security;
create policy settings_public_read on public.site_settings for select to anon, authenticated
  using (is_public);

insert into public.site_settings (key, value, is_public) values
  ('store_profile', jsonb_build_object(
      'name', 'mmbookhouse',
      'name_bn', 'এম এম বুক হাউস',
      'tagline', 'Your trusted online bookstore',
      'tagline_bn', 'অনলাইনে আপনার বিশ্বস্ত বইয়ের দোকান',
      'address', 'Borokamdol, Sambalpur (Tal), Pukhuria, Malda, West Bengal',
      'address_bn', 'গ্রাম— বড়ো কামডোল, পোস্ট অফিস— সাম্বলপুর (টাল), থানা— পুখুরিয়া, জেলা— মালদা',
      'pincode', '732101',
      'phone', '9733196010',
      'whatsapp', '',
      'email', '',
      'hours', '10:00 - 21:00'), true),
  ('notice_bar', jsonb_build_object('enabled', false, 'text', '', 'text_bn', '', 'href', ''), true),
  ('maintenance', jsonb_build_object('enabled', false, 'message', '', 'message_bn', ''), true),
  ('payment', jsonb_build_object(
      'cod_enabled', true,
      'cod_max_order', 3000,
      'upi_enabled', true,
      'upi_id', '',
      'upi_payee_name', 'mmbookhouse'), true),
  ('checkout', jsonb_build_object(
      'pickup_enabled', true,
      'pickup_address', 'Borokamdol, Sambalpur (Tal), Pukhuria, Malda, West Bengal',
      'max_qty_per_item', 10), true);

-- ----------------------------------------------------------------- audit ---
create table public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references auth.users(id) on delete set null,
  actor_role  text,
  action      text not null,
  entity      text not null,
  entity_id   text,
  before_data jsonb,
  after_data  jsonb,
  ip          text,
  created_at  timestamptz not null default now()
);
create index idx_audit_created on public.audit_logs (created_at desc);
create index idx_audit_entity on public.audit_logs (entity, entity_id);
alter table public.audit_logs enable row level security;   -- service role only

-- Append-only: nobody (not even service role) can edit history through the API.
-- The single allowed change is the FK action "on delete set null" for actor_id.
create or replace function public.audit_logs_immutable() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE'
     and new.actor_id is null
     and (to_jsonb(new) - 'actor_id') = (to_jsonb(old) - 'actor_id') then
    return new;
  end if;
  raise exception 'audit_logs is append-only';
end $$;
create trigger trg_audit_no_update before update or delete on public.audit_logs
  for each row execute function public.audit_logs_immutable();

-- ----------------------------------------------------------- rate limits ---
create table public.rate_limits (
  key           text primary key,
  window_start  timestamptz not null default now(),
  hits          integer not null default 0,
  blocked_until timestamptz
);
alter table public.rate_limits enable row level security;   -- service role only

-- Fixed-window limiter. Returns true when the call is allowed.
-- Exceeding `p_max` inside the window blocks the key for `p_block_seconds`.
create or replace function public.hit_rate_limit(
  p_key text, p_max integer, p_window_seconds integer, p_block_seconds integer default 0
) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  r public.rate_limits;
begin
  insert into public.rate_limits (key, window_start, hits)
  values (p_key, now(), 0)
  on conflict (key) do nothing;

  select * into r from public.rate_limits where key = p_key for update;

  if r.blocked_until is not null and r.blocked_until > now() then
    return false;
  end if;

  if r.window_start < now() - make_interval(secs => p_window_seconds) then
    update public.rate_limits set window_start = now(), hits = 1, blocked_until = null where key = p_key;
    return true;
  end if;

  if r.hits + 1 > p_max then
    update public.rate_limits
       set hits = r.hits + 1,
           blocked_until = case when p_block_seconds > 0 then now() + make_interval(secs => p_block_seconds) else null end
     where key = p_key;
    return false;
  end if;

  update public.rate_limits set hits = r.hits + 1 where key = p_key;
  return true;
end $$;

create or replace function public.reset_rate_limit(p_key text) returns void
language sql security definer set search_path = public as $$
  delete from public.rate_limits where key = p_key;
$$;

revoke execute on function public.hit_rate_limit(text, integer, integer, integer) from public, anon, authenticated;
revoke execute on function public.reset_rate_limit(text) from public, anon, authenticated;

-- ---------------------------------------------------------- backup jobs ---
-- Used by the GitHub Actions backup workflow and the admin "Backups" page.
create table public.backup_jobs (
  id                    uuid primary key default gen_random_uuid(),
  trigger_type          text not null check (trigger_type in ('manual', 'scheduled')),
  status                text not null default 'queued'
                          check (status in ('queued', 'running', 'succeeded', 'failed')),
  requested_by          uuid references auth.users(id) on delete set null,
  file_name             text,
  drive_file_id         text,
  drive_web_view_link   text,
  file_size_bytes       bigint check (file_size_bytes is null or file_size_bytes >= 0),
  sha256                text,
  error_message         text,
  started_at            timestamptz,
  completed_at          timestamptz,
  created_at            timestamptz not null default now()
);
create index idx_backup_jobs_created on public.backup_jobs (created_at desc);
alter table public.backup_jobs enable row level security;   -- service role only
