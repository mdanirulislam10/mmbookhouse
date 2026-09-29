-- 0002 Catalog: publishers, authors, categories, books, inventory, flash deals, public view

-- ------------------------------------------------------------- publishers ---
create table public.publishers (
  id       uuid primary key default gen_random_uuid(),
  slug     text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  name     text not null,
  name_bn  text,
  created_at timestamptz not null default now()
);
create table public.authors (
  id       uuid primary key default gen_random_uuid(),
  slug     text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  name     text not null,
  name_bn  text,
  bio      text,
  created_at timestamptz not null default now()
);
create index idx_authors_name_trgm on public.authors using gin (name extensions.gin_trgm_ops);
create index idx_authors_name_bn_trgm on public.authors using gin (name_bn extensions.gin_trgm_ops);

-- ------------------------------------------------------------- categories ---
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references public.categories(id) on delete restrict,
  slug        text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  name        text not null,
  name_bn     text,
  image_url   text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  show_on_home boolean not null default false,
  created_at  timestamptz not null default now(),
  check (parent_id is distinct from id)
);
create index idx_categories_parent on public.categories (parent_id, sort_order);

-- ------------------------------------------------------------------ books ---
create type public.book_status as enum ('draft', 'active', 'archived');

create table public.books (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  title          text not null check (length(btrim(title)) > 0),
  title_bn       text,
  subtitle       text,
  description    text,
  description_bn text,
  isbn           text unique check (isbn is null or isbn ~ '^[0-9]{10}([0-9]{3})?$'),
  publisher_id   uuid references public.publishers(id) on delete set null,
  language       text not null default 'bn' check (language in ('bn', 'en', 'hi', 'ur', 'sa', 'other')),
  edition        text,
  edition_year   integer check (edition_year is null or edition_year between 1800 and 2100),
  pages          integer check (pages is null or pages > 0),
  binding        text not null default 'paperback' check (binding in ('paperback', 'hardcover')),
  condition      text not null default 'new' check (condition in ('new', 'used')),
  weight_g       integer check (weight_g is null or weight_g > 0),
  class_level    text,
  mrp            numeric(10, 2) not null check (mrp >= 0),
  sale_price     numeric(10, 2) not null check (sale_price >= 0),
  hsn_code       text not null default '4901',
  gst_rate       numeric(5, 2) not null default 0 check (gst_rate between 0 and 28),
  cover_url      text,
  gallery        jsonb not null default '[]'::jsonb,
  preview_pages  jsonb not null default '[]'::jsonb,
  status         public.book_status not null default 'draft',
  is_featured    boolean not null default false,
  sold_count     integer not null default 0 check (sold_count >= 0),
  rating_avg     numeric(3, 2) not null default 0,
  rating_count   integer not null default 0,
  search_text    text not null default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (sale_price <= mrp)
);
create index idx_books_status on public.books (status);
create index idx_books_publisher on public.books (publisher_id);
create index idx_books_created on public.books (created_at desc) where status = 'active';
create index idx_books_sold on public.books (sold_count desc) where status = 'active';
create index idx_books_search_trgm on public.books using gin (search_text extensions.gin_trgm_ops);
create trigger trg_books_updated before update on public.books
  for each row execute function public.set_updated_at();

create table public.book_authors (
  book_id    uuid not null references public.books(id) on delete cascade,
  author_id  uuid not null references public.authors(id) on delete cascade,
  role       text not null default 'author' check (role in ('author', 'editor', 'translator')),
  position   integer not null default 0,
  primary key (book_id, author_id, role)
);
create index idx_book_authors_author on public.book_authors (author_id);

create table public.book_categories (
  book_id      uuid not null references public.books(id) on delete cascade,
  category_id  uuid not null references public.categories(id) on delete cascade,
  primary key (book_id, category_id)
);
create index idx_book_categories_cat on public.book_categories (category_id);

-- Staff-only data (wholesale cost, shelf location). Never exposed to customers.
create table public.book_private (
  book_id        uuid primary key references public.books(id) on delete cascade,
  cost_price     numeric(10, 2) check (cost_price is null or cost_price >= 0),
  rack_location  text,
  supplier_note  text
);

-- Frequently bought together / related titles curated by the owner.
create table public.related_books (
  book_id          uuid not null references public.books(id) on delete cascade,
  related_book_id  uuid not null references public.books(id) on delete cascade,
  kind             text not null default 'fbt' check (kind in ('fbt', 'similar')),
  position         integer not null default 0,
  primary key (book_id, related_book_id, kind),
  check (book_id <> related_book_id)
);

-- -------------------------------------------------------------- inventory ---
create table public.inventory (
  book_id              uuid primary key references public.books(id) on delete cascade,
  on_hand              integer not null default 0 check (on_hand >= 0),
  low_stock_threshold  integer not null default 5 check (low_stock_threshold >= 0),
  updated_at           timestamptz not null default now()
);
create trigger trg_inventory_updated before update on public.inventory
  for each row execute function public.set_updated_at();

create table public.stock_movements (
  id          bigint generated always as identity primary key,
  book_id     uuid not null references public.books(id) on delete cascade,
  delta       integer not null check (delta <> 0),
  reason      text not null check (reason in ('order', 'cancel', 'return', 'restock', 'adjust', 'pos_sale', 'import')),
  order_id    uuid,
  note        text,
  actor_id    uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index idx_stock_movements_book on public.stock_movements (book_id, created_at desc);
alter table public.stock_movements enable row level security;   -- service role only

create or replace function public.books_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.inventory (book_id) values (new.id) on conflict do nothing;
  insert into public.book_private (book_id) values (new.id) on conflict do nothing;
  return new;
end $$;
revoke execute on function public.books_after_insert() from public, anon, authenticated;
create trigger trg_books_after_insert after insert on public.books
  for each row execute function public.books_after_insert();

-- ------------------------------------------------------- search text sync ---
-- One lowercase blob (titles, authors, publisher, ISBN) that trigram search runs on.
create or replace function public.refresh_book_search(p_book uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.books b
     set search_text = lower(concat_ws(' ',
           b.title, b.title_bn, b.subtitle, b.isbn,
           (select string_agg(concat_ws(' ', a.name, a.name_bn), ' ')
              from public.book_authors ba join public.authors a on a.id = ba.author_id
             where ba.book_id = b.id),
           (select concat_ws(' ', p.name, p.name_bn) from public.publishers p where p.id = b.publisher_id)))
   where b.id = p_book;
end $$;
revoke execute on function public.refresh_book_search(uuid) from public, anon, authenticated;

create or replace function public.trg_books_search() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.search_text := lower(concat_ws(' ',
    new.title, new.title_bn, new.subtitle, new.isbn,
    (select string_agg(concat_ws(' ', a.name, a.name_bn), ' ')
       from public.book_authors ba join public.authors a on a.id = ba.author_id
      where ba.book_id = new.id),
    (select concat_ws(' ', p.name, p.name_bn) from public.publishers p where p.id = new.publisher_id)));
  return new;
end $$;
revoke execute on function public.trg_books_search() from public, anon, authenticated;
create trigger trg_books_search before insert or update of title, title_bn, subtitle, isbn, publisher_id
  on public.books for each row execute function public.trg_books_search();

create or replace function public.trg_book_authors_search() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.refresh_book_search(coalesce(new.book_id, old.book_id));
  return null;
end $$;
revoke execute on function public.trg_book_authors_search() from public, anon, authenticated;
create trigger trg_book_authors_search after insert or update or delete on public.book_authors
  for each row execute function public.trg_book_authors_search();

-- ------------------------------------------------------------ flash deals ---
create table public.flash_deals (
  id          uuid primary key default gen_random_uuid(),
  book_id     uuid not null references public.books(id) on delete cascade,
  deal_price  numeric(10, 2) not null check (deal_price >= 0),
  title       text,
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index idx_flash_deals_book on public.flash_deals (book_id);
create index idx_flash_deals_window on public.flash_deals (starts_at, ends_at) where is_active;

-- Price a customer pays right now: the cheapest live deal, never above sale_price.
create or replace function public.book_effective_price(p_book uuid) returns numeric
language sql stable set search_path = public as $$
  select least(
    b.sale_price,
    coalesce((select min(d.deal_price) from public.flash_deals d
               where d.book_id = b.id and d.is_active
                 and now() >= d.starts_at and now() < d.ends_at), b.sale_price))
  from public.books b where b.id = p_book;
$$;

-- ------------------------------------------------------------ public view ---
create view public.v_books with (security_invoker = true) as
select
  b.id, b.slug, b.title, b.title_bn, b.subtitle, b.cover_url, b.language, b.binding,
  b.condition, b.is_featured, b.sold_count, b.rating_avg, b.rating_count, b.created_at,
  b.publisher_id, p.name as publisher_name, p.name_bn as publisher_name_bn,
  b.mrp, b.sale_price,
  eff.price as price,
  case when b.mrp > 0 then round((b.mrp - eff.price) * 100 / b.mrp)::int else 0 end as discount_pct,
  eff.deal_ends_at,
  coalesce(i.on_hand, 0) as on_hand,
  coalesce(i.on_hand, 0) > 0 as in_stock,
  coalesce(i.on_hand, 0) <= coalesce(i.low_stock_threshold, 5) as low_stock,
  (select string_agg(a.name, ', ' order by ba.position)
     from public.book_authors ba join public.authors a on a.id = ba.author_id
    where ba.book_id = b.id and ba.role = 'author') as author_names,
  (select string_agg(coalesce(a.name_bn, a.name), ', ' order by ba.position)
     from public.book_authors ba join public.authors a on a.id = ba.author_id
    where ba.book_id = b.id and ba.role = 'author') as author_names_bn
from public.books b
left join public.publishers p on p.id = b.publisher_id
left join public.inventory i on i.book_id = b.id
cross join lateral (
  select least(b.sale_price, coalesce(
           (select min(d.deal_price) from public.flash_deals d
             where d.book_id = b.id and d.is_active and now() >= d.starts_at and now() < d.ends_at),
           b.sale_price)) as price,
         (select min(d.ends_at) from public.flash_deals d
           where d.book_id = b.id and d.is_active and now() >= d.starts_at and now() < d.ends_at
             and d.deal_price < b.sale_price) as deal_ends_at
) eff;

-- -------------------------------------------------------------------- RLS ---
alter table public.publishers      enable row level security;
alter table public.authors         enable row level security;
alter table public.categories      enable row level security;
alter table public.books           enable row level security;
alter table public.book_authors    enable row level security;
alter table public.book_categories enable row level security;
alter table public.book_private    enable row level security;   -- service role only
alter table public.related_books   enable row level security;
alter table public.inventory       enable row level security;
alter table public.flash_deals     enable row level security;

create policy publishers_read on public.publishers for select to anon, authenticated using (true);
create policy authors_read on public.authors for select to anon, authenticated using (true);
create policy categories_read on public.categories for select to anon, authenticated using (is_active);
create policy books_read on public.books for select to anon, authenticated using (status = 'active');
create policy book_authors_read on public.book_authors for select to anon, authenticated
  using (exists (select 1 from public.books b where b.id = book_id and b.status = 'active'));
create policy book_categories_read on public.book_categories for select to anon, authenticated
  using (exists (select 1 from public.books b where b.id = book_id and b.status = 'active'));
create policy related_books_read on public.related_books for select to anon, authenticated
  using (exists (select 1 from public.books b where b.id = related_books.related_book_id and b.status = 'active'));
create policy inventory_read on public.inventory for select to anon, authenticated
  using (exists (select 1 from public.books b where b.id = book_id and b.status = 'active'));
create policy flash_deals_read on public.flash_deals for select to anon, authenticated
  using (is_active and now() < ends_at);
