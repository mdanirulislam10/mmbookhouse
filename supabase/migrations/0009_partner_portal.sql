-- 0009 Partner portal: payments to partners, partner sales statement, partner profile edits.
-- Safe to run more than once.

create table if not exists public.partner_payouts (
  id          uuid primary key default gen_random_uuid(),
  partner_id  uuid not null references public.partners(id) on delete cascade,
  amount      numeric(12, 2) not null check (amount > 0 and amount <= 100000000),
  currency    text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  paid_on     date not null default current_date,
  method      text check (method is null or length(method) <= 60),
  reference   text check (reference is null or length(reference) <= 120),
  note        text check (note is null or length(note) <= 500),
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_partner_payouts_partner on public.partner_payouts (partner_id, paid_on desc);
alter table public.partner_payouts enable row level security;
drop policy if exists partner_payouts_select_own on public.partner_payouts;
create policy partner_payouts_select_own on public.partner_payouts for select to authenticated
  using (exists (select 1 from public.partners p where p.id = partner_id and p.user_id = auth.uid()));

-- Per-book sales of a partner's accepted books, counted from orders placed after the book was accepted.
-- Only quantities and the partner's own supply price are returned, never customer details.
--   sold    = copies in delivered orders (counter sales are recorded as delivered)
--   pending = copies in orders still being processed
create or replace function public.partner_sales_for(p_partner uuid)
returns table (book_id uuid, title text, slug text, status text, currency text, supply_price numeric, sold bigint, pending bigint, earned numeric)
language sql stable security definer set search_path = public as $$
  with subs as (
    select distinct on (s.book_id) s.book_id, s.currency, s.supply_price, s.reviewed_at
      from public.partner_submissions s
     where s.partner_id = p_partner and s.status = 'approved' and s.book_id is not null
     order by s.book_id, s.reviewed_at desc
  )
  select b.id, coalesce(b.title_bn, b.title), b.slug, b.status::text, subs.currency, subs.supply_price,
         coalesce(sum(oi.qty) filter (where o.status = 'delivered'), 0)::bigint,
         coalesce(sum(oi.qty) filter (where o.status in ('pending', 'confirmed', 'processing', 'ready', 'dispatched')), 0)::bigint,
         coalesce(sum(oi.qty) filter (where o.status = 'delivered'), 0) * subs.supply_price
    from subs
    join public.books b on b.id = subs.book_id
    left join public.order_items oi on oi.book_id = subs.book_id
    left join public.orders o on o.id = oi.order_id and o.placed_at >= coalesce(subs.reviewed_at, '-infinity'::timestamptz)
   group by b.id, b.title_bn, b.title, b.slug, b.status, subs.currency, subs.supply_price
   order by 7 desc, 2;
$$;
revoke execute on function public.partner_sales_for(uuid) from public, anon, authenticated;

-- The signed-in partner's own statement.
create or replace function public.my_partner_sales()
returns table (book_id uuid, title text, slug text, status text, currency text, supply_price numeric, sold bigint, pending bigint, earned numeric)
language sql stable security definer set search_path = public as $$
  select * from public.partner_sales_for((select p.id from public.partners p where p.user_id = auth.uid()));
$$;
revoke execute on function public.my_partner_sales() from public, anon;
grant execute on function public.my_partner_sales() to authenticated;

-- A partner keeps their contact details up to date (name, type and status stay with the shop).
create or replace function public.update_my_partner_profile(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  update public.partners set
    contact_person = btrim(p ->> 'contact_person'),
    email          = lower(btrim(p ->> 'email')),
    phone          = btrim(p ->> 'phone'),
    country        = btrim(p ->> 'country'),
    address        = btrim(p ->> 'address'),
    website        = nullif(btrim(coalesce(p ->> 'website', '')), ''),
    tax_id         = nullif(btrim(coalesce(p ->> 'tax_id', '')), ''),
    catalogue      = btrim(p ->> 'catalogue'),
    updated_at     = now()
  where user_id = auth.uid() and status in ('pending', 'approved', 'suspended');
  if not found then raise exception 'NOT_FOUND'; end if;
end $$;
revoke execute on function public.update_my_partner_profile(jsonb) from public, anon;
grant execute on function public.update_my_partner_profile(jsonb) to authenticated;
