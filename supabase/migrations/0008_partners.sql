-- 0008 Partners: publishers, authors and suppliers (Indian or foreign) who apply to supply books.
-- The shop approves an application; an approved partner can then submit books, which the shop
-- reviews and turns into its own (draft) catalogue entries. Partners never sell directly.
-- Safe to run more than once.

create table if not exists public.partners (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null unique references auth.users(id) on delete cascade,
  kind               text not null check (kind in ('publisher', 'author', 'supplier')),
  name               text not null check (length(btrim(name)) between 2 and 150),
  contact_person     text not null check (length(btrim(contact_person)) between 2 and 100),
  email              text not null check (length(email) between 5 and 200),
  phone              text not null check (length(phone) between 6 and 25),
  country            text not null check (length(btrim(country)) between 2 and 60),
  address            text not null check (length(btrim(address)) between 5 and 500),
  website            text check (website is null or length(website) <= 300),
  tax_id             text check (tax_id is null or length(tax_id) <= 40),
  catalogue          text not null check (length(btrim(catalogue)) between 10 and 2000),
  terms_version      text not null,
  terms_accepted_at  timestamptz not null default now(),
  status             text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  admin_note         text check (admin_note is null or length(admin_note) <= 1000),
  reviewed_by        uuid references auth.users(id) on delete set null,
  reviewed_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists idx_partners_status on public.partners (status, created_at desc);

create table if not exists public.partner_submissions (
  id            uuid primary key default gen_random_uuid(),
  partner_id    uuid not null references public.partners(id) on delete cascade,
  title         text not null check (length(btrim(title)) between 1 and 250),
  title_bn      text check (title_bn is null or length(title_bn) <= 250),
  authors       text not null check (length(btrim(authors)) between 2 and 500),
  publisher     text check (publisher is null or length(publisher) <= 120),
  isbn          text check (isbn is null or isbn ~ '^\d{10}(\d{3})?$'),
  language      text not null default 'bn' check (language in ('bn', 'en', 'hi', 'ur', 'sa', 'other')),
  binding       text not null default 'paperback' check (binding in ('paperback', 'hardcover')),
  edition       text check (edition is null or length(edition) <= 60),
  pages         integer check (pages is null or pages between 1 and 20000),
  mrp           numeric(10, 2) not null check (mrp > 0 and mrp <= 1000000),
  supply_price  numeric(10, 2) not null check (supply_price >= 0 and supply_price <= 1000000),
  currency      text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  quantity      integer check (quantity is null or quantity between 0 and 1000000),
  description   text check (description is null or length(description) <= 4000),
  cover_url     text check (cover_url is null or length(cover_url) <= 500),
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note    text check (admin_note is null or length(admin_note) <= 1000),
  book_id       uuid references public.books(id) on delete set null,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists idx_partner_sub_partner on public.partner_submissions (partner_id, created_at desc);
create index if not exists idx_partner_sub_pending on public.partner_submissions (created_at) where status = 'pending';

alter table public.partners enable row level security;
alter table public.partner_submissions enable row level security;
drop policy if exists partners_select_own on public.partners;
create policy partners_select_own on public.partners for select to authenticated using (user_id = auth.uid());
drop policy if exists partner_sub_select_own on public.partner_submissions;
create policy partner_sub_select_own on public.partner_submissions for select to authenticated
  using (exists (select 1 from public.partners p where p.id = partner_id and p.user_id = auth.uid()));
-- Writes: the functions below (partners) or the service role (admin panel).

-- Apply, or re-apply after a rejection. Approved and suspended partners cannot overwrite their record.
create or replace function public.apply_partner(p jsonb, p_terms_version text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_existing public.partners;
  v_id uuid;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if coalesce(p_terms_version, '') = '' then raise exception 'TERMS_REQUIRED'; end if;
  if not public.hit_rate_limit('partner-apply:' || v_uid::text, 5, 86400) then raise exception 'RATE_LIMITED'; end if;
  select * into v_existing from public.partners where user_id = v_uid;
  if v_existing.id is not null and v_existing.status in ('approved', 'suspended') then raise exception 'PARTNER_EXISTS'; end if;

  insert into public.partners (user_id, kind, name, contact_person, email, phone, country, address, website, tax_id, catalogue, terms_version, terms_accepted_at, status)
  values (v_uid, p ->> 'kind', btrim(p ->> 'name'), btrim(p ->> 'contact_person'), lower(btrim(p ->> 'email')), btrim(p ->> 'phone'),
          btrim(p ->> 'country'), btrim(p ->> 'address'), nullif(btrim(coalesce(p ->> 'website', '')), ''),
          nullif(btrim(coalesce(p ->> 'tax_id', '')), ''), btrim(p ->> 'catalogue'), p_terms_version, now(), 'pending')
  on conflict (user_id) do update set
    kind = excluded.kind, name = excluded.name, contact_person = excluded.contact_person, email = excluded.email,
    phone = excluded.phone, country = excluded.country, address = excluded.address, website = excluded.website,
    tax_id = excluded.tax_id, catalogue = excluded.catalogue, terms_version = excluded.terms_version,
    terms_accepted_at = now(), status = 'pending', admin_note = null, reviewed_by = null, reviewed_at = null, updated_at = now()
  returning id into v_id;
  return v_id;
end $$;
revoke execute on function public.apply_partner(jsonb, text) from public, anon;
grant execute on function public.apply_partner(jsonb, text) to authenticated;

-- Submit a book for review (approved partners only, max 50 a day).
create or replace function public.submit_partner_book(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_partner uuid;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select id into v_partner from public.partners where user_id = auth.uid() and status = 'approved';
  if v_partner is null then raise exception 'PARTNER_NOT_APPROVED'; end if;
  if not public.hit_rate_limit('partner-book:' || v_partner::text, 50, 86400) then raise exception 'RATE_LIMITED'; end if;
  insert into public.partner_submissions (partner_id, title, title_bn, authors, publisher, isbn, language, binding, edition, pages,
                                          mrp, supply_price, currency, quantity, description, cover_url)
  values (v_partner, btrim(p ->> 'title'), nullif(btrim(coalesce(p ->> 'title_bn', '')), ''), btrim(p ->> 'authors'),
          nullif(btrim(coalesce(p ->> 'publisher', '')), ''), nullif(p ->> 'isbn', ''), coalesce(p ->> 'language', 'bn'),
          coalesce(p ->> 'binding', 'paperback'), nullif(btrim(coalesce(p ->> 'edition', '')), ''), nullif(p ->> 'pages', '')::int,
          (p ->> 'mrp')::numeric, (p ->> 'supply_price')::numeric, coalesce(p ->> 'currency', 'INR'), nullif(p ->> 'quantity', '')::int,
          nullif(btrim(coalesce(p ->> 'description', '')), ''), nullif(p ->> 'cover_url', ''))
  returning id into v_id;
  return v_id;
end $$;
revoke execute on function public.submit_partner_book(jsonb) from public, anon;
grant execute on function public.submit_partner_book(jsonb) to authenticated;
