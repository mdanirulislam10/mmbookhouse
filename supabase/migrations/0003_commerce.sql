-- 0003 Commerce: cart, wishlist, addresses, delivery, coupons, orders, payments, RPCs
-- All money is INR with 2 decimals. Prices are always recomputed on the server.

-- ---------------------------------------------------------------- cart ---
create table public.cart_items (
  user_id         uuid not null references auth.users(id) on delete cascade,
  book_id         uuid not null references public.books(id) on delete cascade,
  qty             integer not null default 1 check (qty between 1 and 99),
  saved_for_later boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (user_id, book_id)
);
create trigger trg_cart_updated before update on public.cart_items
  for each row execute function public.set_updated_at();

create table public.wishlist_items (
  user_id     uuid not null references auth.users(id) on delete cascade,
  book_id     uuid not null references public.books(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, book_id)
);

create table public.stock_alerts (
  user_id     uuid not null references auth.users(id) on delete cascade,
  book_id     uuid not null references public.books(id) on delete cascade,
  created_at  timestamptz not null default now(),
  notified_at timestamptz,
  primary key (user_id, book_id)
);

alter table public.cart_items     enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.stock_alerts   enable row level security;
create policy cart_own on public.cart_items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy wishlist_own on public.wishlist_items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy stock_alerts_own on public.stock_alerts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------ addresses ---
create table public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text not null default 'Home',
  full_name   text not null check (length(btrim(full_name)) > 1),
  phone       text not null check (phone ~ '^[0-9+][0-9 -]{7,14}$'),
  line1       text not null check (length(btrim(line1)) > 2),
  line2       text,
  landmark    text,
  city        text not null,
  district    text,
  state       text not null default 'West Bengal',
  pincode     text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_addresses_user on public.addresses (user_id);
create unique index uq_addresses_one_default on public.addresses (user_id) where is_default;
create trigger trg_addresses_updated before update on public.addresses
  for each row execute function public.set_updated_at();

alter table public.addresses enable row level security;
create policy addresses_own on public.addresses for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Making an address default clears the previous default atomically.
create or replace function public.addresses_single_default() returns trigger
language plpgsql as $$
begin
  if new.is_default then
    update public.addresses set is_default = false
     where user_id = new.user_id and id <> new.id and is_default;
  end if;
  return new;
end $$;
create trigger trg_addresses_default before insert or update of is_default on public.addresses
  for each row when (new.is_default) execute function public.addresses_single_default();

-- ------------------------------------------------------------- delivery ---
-- match_value: '' = everywhere, otherwise a pincode prefix ('732' = the shop's own district, '732101' = one pincode).
-- The longest matching prefix wins.
create table public.delivery_rules (
  id             uuid primary key default gen_random_uuid(),
  label          text not null,
  label_bn       text,
  match_value    text not null default '' check (match_value ~ '^[0-9]{0,6}$'),
  fee            numeric(8, 2) not null default 0 check (fee >= 0),
  free_above     numeric(10, 2) check (free_above is null or free_above >= 0),
  eta_min_days   integer not null default 2 check (eta_min_days >= 0),
  eta_max_days   integer not null default 4 check (eta_max_days >= eta_min_days),
  cod_available  boolean not null default true,
  is_active      boolean not null default true,
  unique (match_value)
);
alter table public.delivery_rules enable row level security;
create policy delivery_rules_read on public.delivery_rules for select to anon, authenticated
  using (is_active);

insert into public.delivery_rules (label, label_bn, match_value, fee, free_above, eta_min_days, eta_max_days, cod_available) values
  ('Local area',         'স্থানীয় এলাকা (দোকানের কাছাকাছি)', '732', 30, 299, 1, 2, true),
  ('West Bengal',        'পশ্চিমবঙ্গ',           '7',   60, 499, 2, 4, true),
  ('Rest of India',      'ভারতের অন্যান্য অংশ',    '',    90, 799, 4, 8, false);

create or replace function public.quote_delivery(p_pincode text, p_subtotal numeric)
returns table (rule_id uuid, label text, label_bn text, fee numeric, eta_min_days int, eta_max_days int, cod_available boolean)
language sql stable set search_path = public as $$
  select r.id, r.label, r.label_bn,
         case when r.free_above is not null and p_subtotal >= r.free_above then 0::numeric else r.fee end,
         r.eta_min_days, r.eta_max_days, r.cod_available
    from public.delivery_rules r
   where r.is_active and p_pincode like r.match_value || '%'
   order by length(r.match_value) desc
   limit 1;
$$;

-- --------------------------------------------------------------- coupons ---
create table public.coupons (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique check (code = upper(code) and code ~ '^[A-Z0-9_-]{3,24}$'),
  description     text,
  kind            text not null check (kind in ('percent', 'flat')),
  value           numeric(10, 2) not null check (value > 0),
  max_discount    numeric(10, 2) check (max_discount is null or max_discount > 0),
  min_order       numeric(10, 2) not null default 0 check (min_order >= 0),
  starts_at       timestamptz,
  ends_at         timestamptz,
  usage_limit     integer check (usage_limit is null or usage_limit > 0),
  per_user_limit  integer not null default 1 check (per_user_limit > 0),
  used_count      integer not null default 0 check (used_count >= 0),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  check (kind <> 'percent' or value <= 100)
);
alter table public.coupons enable row level security;   -- service role + RPC only

create table public.coupon_redemptions (
  id          uuid primary key default gen_random_uuid(),
  coupon_id   uuid not null references public.coupons(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  order_id    uuid,
  amount      numeric(10, 2) not null,
  created_at  timestamptz not null default now()
);
create index idx_coupon_redemptions on public.coupon_redemptions (coupon_id, user_id);
alter table public.coupon_redemptions enable row level security;   -- service role + RPC only

create or replace function public.evaluate_coupon(p_code text, p_user uuid, p_subtotal numeric)
returns table (coupon_id uuid, discount numeric)
language plpgsql security definer set search_path = public as $$
declare
  c public.coupons;
  d numeric;
begin
  select * into c from public.coupons where code = upper(btrim(p_code)) for update;
  if not found or not c.is_active then raise exception 'COUPON_INVALID'; end if;
  if c.starts_at is not null and now() < c.starts_at then raise exception 'COUPON_NOT_STARTED'; end if;
  if c.ends_at is not null and now() > c.ends_at then raise exception 'COUPON_EXPIRED'; end if;
  if p_subtotal < c.min_order then
    raise exception 'COUPON_MIN_ORDER' using detail = c.min_order::text;
  end if;
  if c.usage_limit is not null and c.used_count >= c.usage_limit then raise exception 'COUPON_EXHAUSTED'; end if;
  if (select count(*) from public.coupon_redemptions r where r.coupon_id = c.id and r.user_id = p_user) >= c.per_user_limit then
    raise exception 'COUPON_ALREADY_USED';
  end if;

  d := case c.kind when 'percent' then floor(p_subtotal * c.value / 100) else c.value end;
  if c.max_discount is not null then d := least(d, c.max_discount); end if;
  d := least(d, p_subtotal);
  return query select c.id, d;
end $$;
revoke execute on function public.evaluate_coupon(text, uuid, numeric) from public, anon, authenticated;

-- Cart preview: does not consume the coupon.
create or replace function public.validate_coupon(p_code text, p_subtotal numeric)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r record;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into r from public.evaluate_coupon(p_code, auth.uid(), p_subtotal);
  return jsonb_build_object('code', upper(btrim(p_code)), 'discount', r.discount);
end $$;
revoke execute on function public.validate_coupon(text, numeric) from public, anon;
grant execute on function public.validate_coupon(text, numeric) to authenticated;

-- ---------------------------------------------------------------- orders ---
create sequence public.order_no_seq start 1001;

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_no         text not null unique,
  user_id          uuid references auth.users(id) on delete set null,
  status           text not null default 'pending' check (status in
                     ('pending', 'confirmed', 'processing', 'ready', 'dispatched', 'delivered', 'cancelled', 'returned')),
  channel          text not null default 'online' check (channel in ('online', 'pos')),
  payment_method   text not null check (payment_method in ('cod', 'upi', 'online', 'cash')),
  payment_status   text not null default 'unpaid' check (payment_status in
                     ('unpaid', 'pending_verification', 'paid', 'failed', 'refunded')),
  fulfillment      text not null default 'delivery' check (fulfillment in ('delivery', 'pickup')),
  subtotal         numeric(10, 2) not null check (subtotal >= 0),
  discount_total   numeric(10, 2) not null default 0 check (discount_total >= 0),
  delivery_fee     numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  total            numeric(10, 2) not null check (total >= 0),
  coupon_code      text,
  customer_email   text,
  ship_name        text not null,
  ship_phone       text not null,
  ship_line1       text,
  ship_line2       text,
  ship_landmark    text,
  ship_city        text,
  ship_district    text,
  ship_state       text,
  ship_pincode     text,
  notes            text,
  pickup_otp       text check (pickup_otp is null or pickup_otp ~ '^[0-9]{4}$'),
  courier_name     text,
  awb              text,
  tracking_url     text,
  cancel_reason    text,
  placed_at        timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index idx_orders_user on public.orders (user_id, placed_at desc);
create index idx_orders_status on public.orders (status, placed_at desc);
create index idx_orders_placed on public.orders (placed_at desc);
create index idx_orders_phone on public.orders (ship_phone);
create index idx_orders_channel on public.orders (channel, placed_at desc);
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  book_id      uuid references public.books(id) on delete set null,
  title        text not null,
  slug         text,
  isbn         text,
  cover_url    text,
  unit_price   numeric(10, 2) not null check (unit_price >= 0),
  mrp          numeric(10, 2) not null check (mrp >= 0),
  qty          integer not null check (qty > 0),
  line_total   numeric(10, 2) not null check (line_total >= 0)
);
create index idx_order_items_order on public.order_items (order_id);
create index idx_order_items_book on public.order_items (book_id);

-- Wholesale cost snapshot for profit reports; staff/service role only.
create table public.order_item_costs (
  order_item_id uuid primary key references public.order_items(id) on delete cascade,
  unit_cost     numeric(10, 2)
);

create table public.order_events (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders(id) on delete cascade,
  status      text not null,
  note        text,
  actor_id    uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index idx_order_events_order on public.order_events (order_id, created_at);

create table public.payments (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  method        text not null,
  amount        numeric(10, 2) not null check (amount >= 0),
  status        text not null default 'pending' check (status in ('pending', 'verifying', 'success', 'failed', 'refunded')),
  utr           text unique check (utr is null or utr ~ '^[0-9A-Za-z]{10,22}$'),
  gateway_ref   text,
  payload       jsonb,
  verified_by   uuid references auth.users(id) on delete set null,
  verified_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index idx_payments_order on public.payments (order_id);
create index idx_payments_status on public.payments (status) where status = 'verifying';

alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.order_item_costs enable row level security;   -- service role only
alter table public.order_events     enable row level security;
alter table public.payments         enable row level security;

create policy orders_own on public.orders for select to authenticated using (user_id = auth.uid());
create policy order_items_own on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy order_events_own on public.order_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy payments_own on public.payments for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- ------------------------------------------------------------ place_order ---
create or replace function public.place_order(
  p_address_id     uuid,
  p_payment_method text,
  p_fulfillment    text default 'delivery',
  p_coupon         text default null,
  p_notes          text default null,
  p_items          jsonb default null      -- Buy Now: [{"book_id": "...", "qty": 1}]; null = use the cart
) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_uid        uuid := auth.uid();
  v_pay        jsonb;
  v_chk        jsonb;
  v_max_qty    integer;
  v_addr       public.addresses;
  v_profile    public.profiles;
  v_email      text;
  v_quote      record;
  v_cpn        record;
  v_item       record;
  v_subtotal   numeric(10, 2) := 0;
  v_discount   numeric(10, 2) := 0;
  v_fee        numeric(10, 2) := 0;
  v_total      numeric(10, 2);
  v_order      uuid := gen_random_uuid();
  v_order_no   text;
  v_otp        text;
  v_item_id    uuid;
  v_from_cart  boolean := p_items is null;
  v_lines      jsonb;
  v_count      integer := 0;
  v_name       text;
  v_phone      text;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_payment_method not in ('cod', 'upi') then raise exception 'PAYMENT_METHOD_INVALID'; end if;
  if p_fulfillment not in ('delivery', 'pickup') then raise exception 'FULFILLMENT_INVALID'; end if;

  select value into v_pay from public.site_settings where key = 'payment';
  select value into v_chk from public.site_settings where key = 'checkout';
  if (select (value ->> 'enabled')::boolean from public.site_settings where key = 'maintenance') then
    raise exception 'STORE_MAINTENANCE';
  end if;
  if p_payment_method = 'cod' and not coalesce((v_pay ->> 'cod_enabled')::boolean, true) then raise exception 'COD_DISABLED'; end if;
  if p_payment_method = 'upi' and not coalesce((v_pay ->> 'upi_enabled')::boolean, true) then raise exception 'UPI_DISABLED'; end if;
  if p_fulfillment = 'pickup' and not coalesce((v_chk ->> 'pickup_enabled')::boolean, true) then raise exception 'PICKUP_DISABLED'; end if;
  v_max_qty := coalesce((v_chk ->> 'max_qty_per_item')::int, 10);

  -- 1. Collect requested lines (cart or Buy Now), merged per book.
  if v_from_cart then
    select coalesce(jsonb_agg(jsonb_build_object('book_id', ci.book_id, 'qty', ci.qty)), '[]'::jsonb) into v_lines
      from public.cart_items ci where ci.user_id = v_uid and not ci.saved_for_later;
  else
    select coalesce(jsonb_agg(jsonb_build_object('book_id', x.book_id, 'qty', x.qty)), '[]'::jsonb) into v_lines
      from (select (e ->> 'book_id')::uuid as book_id, sum(coalesce((e ->> 'qty')::int, 1))::int as qty
              from jsonb_array_elements(p_items) e group by 1) x;
  end if;
  v_count := jsonb_array_length(v_lines);
  if v_count = 0 then raise exception 'EMPTY_CART'; end if;
  if exists (select 1 from jsonb_to_recordset(v_lines) as l(book_id uuid, qty int) where l.qty < 1 or l.qty > v_max_qty) then
    raise exception 'QTY_INVALID' using detail = v_max_qty::text;
  end if;

  -- 2. Lock stock rows in a fixed order (no deadlocks) and validate.
  perform 1 from public.inventory i
    where i.book_id in (select l.book_id from jsonb_to_recordset(v_lines) as l(book_id uuid, qty int))
    order by i.book_id for update;
  for v_item in
    select l.book_id, l.qty, b.title, b.status, coalesce(i.on_hand, 0) as on_hand
      from jsonb_to_recordset(v_lines) as l(book_id uuid, qty int)
      left join public.books b on b.id = l.book_id
      left join public.inventory i on i.book_id = l.book_id
  loop
    if v_item.title is null or v_item.status <> 'active' then raise exception 'BOOK_UNAVAILABLE'; end if;
    if v_item.on_hand < v_item.qty then
      raise exception 'OUT_OF_STOCK' using detail = v_item.title;
    end if;
    v_subtotal := v_subtotal + public.book_effective_price(v_item.book_id) * v_item.qty;
  end loop;

  -- 3. Recipient + delivery fee.
  select * into v_profile from public.profiles where id = v_uid;
  select email into v_email from auth.users where id = v_uid;
  if p_address_id is not null then
    select * into v_addr from public.addresses where id = p_address_id and user_id = v_uid;
    if not found then raise exception 'ADDRESS_INVALID'; end if;
  end if;

  if p_fulfillment = 'delivery' then
    if v_addr.id is null then raise exception 'ADDRESS_REQUIRED'; end if;
    select * into v_quote from public.quote_delivery(v_addr.pincode, v_subtotal);
    if not found then raise exception 'NOT_SERVICEABLE'; end if;
    v_fee := v_quote.fee;
    if p_payment_method = 'cod' and not v_quote.cod_available then raise exception 'COD_NOT_AVAILABLE_HERE'; end if;
  end if;
  v_name  := coalesce(v_addr.full_name, v_profile.full_name);
  v_phone := coalesce(v_addr.phone, v_profile.phone);
  if v_name is null or v_phone is null then raise exception 'CONTACT_REQUIRED'; end if;

  -- 4. Coupon.
  if p_coupon is not null and btrim(p_coupon) <> '' then
    select * into v_cpn from public.evaluate_coupon(p_coupon, v_uid, v_subtotal);
    v_discount := v_cpn.discount;
  end if;

  v_total := v_subtotal - v_discount + v_fee;
  if p_payment_method = 'cod' and v_total > coalesce((v_pay ->> 'cod_max_order')::numeric, 1e9) then
    raise exception 'COD_LIMIT_EXCEEDED' using detail = (v_pay ->> 'cod_max_order');
  end if;

  v_order_no := 'MMB-' || to_char(now() at time zone 'Asia/Kolkata', 'YYMM') || '-' || lpad(nextval('public.order_no_seq')::text, 5, '0');
  v_otp := case when p_fulfillment = 'pickup' then lpad((floor(random() * 10000))::int::text, 4, '0') end;

  insert into public.orders (id, order_no, user_id, payment_method, fulfillment, subtotal, discount_total, delivery_fee, total,
                             coupon_code, customer_email, ship_name, ship_phone, ship_line1, ship_line2, ship_landmark,
                             ship_city, ship_district, ship_state, ship_pincode, notes, pickup_otp)
  values (v_order, v_order_no, v_uid, p_payment_method, p_fulfillment, v_subtotal, v_discount, v_fee, v_total,
          case when v_discount > 0 then upper(btrim(p_coupon)) end, v_email, v_name, v_phone,
          v_addr.line1, v_addr.line2, v_addr.landmark, v_addr.city, v_addr.district, v_addr.state, v_addr.pincode,
          nullif(btrim(coalesce(p_notes, '')), ''), v_otp);

  -- 5. Lines, stock, cost snapshot.
  for v_item in
    select l.book_id, l.qty, b.title, b.slug, b.isbn, b.cover_url, b.mrp,
           public.book_effective_price(l.book_id) as price, bp.cost_price
      from jsonb_to_recordset(v_lines) as l(book_id uuid, qty int)
      join public.books b on b.id = l.book_id
      left join public.book_private bp on bp.book_id = l.book_id
  loop
    v_item_id := gen_random_uuid();
    insert into public.order_items (id, order_id, book_id, title, slug, isbn, cover_url, unit_price, mrp, qty, line_total)
    values (v_item_id, v_order, v_item.book_id, v_item.title, v_item.slug, v_item.isbn, v_item.cover_url,
            v_item.price, v_item.mrp, v_item.qty, v_item.price * v_item.qty);
    insert into public.order_item_costs (order_item_id, unit_cost) values (v_item_id, v_item.cost_price);
    update public.inventory set on_hand = on_hand - v_item.qty where book_id = v_item.book_id;
    update public.books set sold_count = sold_count + v_item.qty where id = v_item.book_id;
    insert into public.stock_movements (book_id, delta, reason, order_id, actor_id)
    values (v_item.book_id, -v_item.qty, 'order', v_order, v_uid);
  end loop;

  insert into public.payments (order_id, method, amount) values (v_order, p_payment_method, v_total);
  insert into public.order_events (order_id, status, note, actor_id)
  values (v_order, 'pending', 'Order placed', v_uid);

  if v_discount > 0 then
    insert into public.coupon_redemptions (coupon_id, user_id, order_id, amount) values (v_cpn.coupon_id, v_uid, v_order, v_discount);
    update public.coupons set used_count = used_count + 1 where id = v_cpn.coupon_id;
  end if;

  if v_from_cart then
    delete from public.cart_items where user_id = v_uid and not saved_for_later;
  end if;

  return jsonb_build_object('order_id', v_order, 'order_no', v_order_no, 'total', v_total,
                            'payment_method', p_payment_method);
end $$;
revoke execute on function public.place_order(uuid, text, text, text, text, jsonb) from public, anon;
grant execute on function public.place_order(uuid, text, text, text, text, jsonb) to authenticated;

-- --------------------------------------------- order lifecycle (internal) ---
-- Restocks and reverses the coupon. Shared by customer cancel and staff status changes.
create or replace function public._release_order(p_order uuid, p_actor uuid, p_reason text, p_restock boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare
  it record;
begin
  if p_restock then
    for it in select book_id, qty from public.order_items where order_id = p_order and book_id is not null order by book_id loop
      update public.inventory set on_hand = on_hand + it.qty where book_id = it.book_id;
      update public.books set sold_count = greatest(sold_count - it.qty, 0) where id = it.book_id;
      insert into public.stock_movements (book_id, delta, reason, order_id, actor_id, note)
      values (it.book_id, it.qty, case p_reason when 'return' then 'return' else 'cancel' end, p_order, p_actor, p_reason);
    end loop;
  end if;
  with del as (delete from public.coupon_redemptions where order_id = p_order returning coupon_id)
  update public.coupons c set used_count = greatest(used_count - 1, 0)
    where c.id in (select coupon_id from del);
end $$;
revoke execute on function public._release_order(uuid, uuid, text, boolean) from public, anon, authenticated;

-- Customer: cancel own order while it has not been packed.
create or replace function public.cancel_my_order(p_order uuid, p_reason text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
begin
  select * into o from public.orders where id = p_order and user_id = auth.uid() for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.status not in ('pending', 'confirmed') then raise exception 'ORDER_NOT_CANCELLABLE'; end if;
  perform public._release_order(o.id, auth.uid(), 'cancel', true);
  update public.orders
     set status = 'cancelled', cancel_reason = nullif(btrim(coalesce(p_reason, '')), ''),
         payment_status = case when payment_status = 'paid' then 'refunded' else payment_status end
   where id = o.id;
  update public.payments set status = case when status = 'success' then 'refunded' else 'failed' end
   where order_id = o.id and status in ('pending', 'verifying', 'success');
  insert into public.order_events (order_id, status, note, actor_id) values (o.id, 'cancelled', coalesce(p_reason, 'Cancelled by customer'), auth.uid());
end $$;
revoke execute on function public.cancel_my_order(uuid, text) from public, anon;
grant execute on function public.cancel_my_order(uuid, text) to authenticated;

-- Customer: submit the UPI transaction reference (UTR) for manual verification.
create or replace function public.submit_utr(p_order uuid, p_utr text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
begin
  select * into o from public.orders where id = p_order and user_id = auth.uid() for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.payment_method <> 'upi' or o.status in ('cancelled', 'returned') then raise exception 'PAYMENT_NOT_APPLICABLE'; end if;
  if o.payment_status not in ('unpaid', 'failed') then raise exception 'PAYMENT_ALREADY_SUBMITTED'; end if;
  if p_utr !~ '^[0-9A-Za-z]{10,22}$' then raise exception 'UTR_INVALID'; end if;
  if exists (select 1 from public.payments where utr = p_utr and order_id <> o.id) then raise exception 'UTR_ALREADY_USED'; end if;

  update public.payments set utr = p_utr, status = 'verifying'
   where id = (select id from public.payments where order_id = o.id order by created_at desc limit 1);
  update public.orders set payment_status = 'pending_verification' where id = o.id;
  insert into public.order_events (order_id, status, note, actor_id) values (o.id, o.status, 'UTR submitted: ' || p_utr, auth.uid());
end $$;
revoke execute on function public.submit_utr(uuid, text) from public, anon;
grant execute on function public.submit_utr(uuid, text) to authenticated;

-- Staff (service role only): move an order through the pipeline.
create or replace function public.admin_set_order_status(
  p_order uuid, p_status text, p_note text, p_actor uuid, p_restock boolean default true
) returns void
language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  allowed text[];
begin
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;

  allowed := case o.status
    when 'pending'    then array['confirmed', 'processing', 'cancelled']
    when 'confirmed'  then array['processing', 'cancelled']
    when 'processing' then array['ready', 'dispatched', 'cancelled']
    when 'ready'      then array['dispatched', 'delivered', 'cancelled']
    when 'dispatched' then array['delivered', 'returned']
    when 'delivered'  then array['returned']
    else array[]::text[] end;
  if not (p_status = any (allowed)) then
    raise exception 'STATUS_TRANSITION_INVALID' using detail = o.status || ' -> ' || p_status;
  end if;

  if p_status in ('cancelled', 'returned') then
    perform public._release_order(o.id, p_actor, case when p_status = 'returned' then 'return' else 'cancel' end, p_restock);
    update public.orders
       set payment_status = case when payment_status = 'paid' then 'refunded' else payment_status end,
           cancel_reason = coalesce(nullif(btrim(coalesce(p_note, '')), ''), cancel_reason)
     where id = o.id;
    update public.payments set status = case when status = 'success' then 'refunded' else 'failed' end
     where order_id = o.id and status in ('pending', 'verifying', 'success');
  end if;

  if p_status = 'delivered' and o.payment_method = 'cod' and o.payment_status <> 'paid' then
    update public.orders set payment_status = 'paid' where id = o.id;
    update public.payments set status = 'success', verified_by = p_actor, verified_at = now()
     where order_id = o.id and status in ('pending', 'verifying');
  end if;

  update public.orders set status = p_status where id = o.id;
  insert into public.order_events (order_id, status, note, actor_id) values (o.id, p_status, p_note, p_actor);
end $$;
revoke execute on function public.admin_set_order_status(uuid, text, text, uuid, boolean) from public, anon, authenticated;

-- Staff (service role only): approve or reject a UPI payment.
create or replace function public.admin_review_payment(p_order uuid, p_approve boolean, p_note text, p_actor uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.payment_status <> 'pending_verification' then raise exception 'NOTHING_TO_VERIFY'; end if;

  if p_approve then
    update public.payments set status = 'success', verified_by = p_actor, verified_at = now()
     where order_id = o.id and status = 'verifying';
    update public.orders set payment_status = 'paid', status = case when status = 'pending' then 'confirmed' else status end
     where id = o.id;
    insert into public.order_events (order_id, status, note, actor_id)
    values (o.id, case when o.status = 'pending' then 'confirmed' else o.status end, coalesce(p_note, 'Payment verified'), p_actor);
  else
    update public.payments set status = 'failed', verified_by = p_actor, verified_at = now()
     where order_id = o.id and status = 'verifying';
    update public.orders set payment_status = 'failed' where id = o.id;
    insert into public.order_events (order_id, status, note, actor_id)
    values (o.id, o.status, coalesce(p_note, 'Payment could not be verified'), p_actor);
  end if;
end $$;
revoke execute on function public.admin_review_payment(uuid, boolean, text, uuid) from public, anon, authenticated;

-- Public order tracking by order number + phone (no login needed).
create or replace function public.track_order(p_order_no text, p_phone text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  digits text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
begin
  if length(digits) < 8 then return null; end if;
  select * into o from public.orders
   where order_no = upper(btrim(p_order_no))
     and right(regexp_replace(ship_phone, '[^0-9]', '', 'g'), 10) = right(digits, 10);
  if not found then return null; end if;
  return jsonb_build_object(
    'order_no', o.order_no, 'status', o.status, 'payment_status', o.payment_status,
    'fulfillment', o.fulfillment, 'total', o.total, 'placed_at', o.placed_at,
    'courier_name', o.courier_name, 'awb', o.awb, 'tracking_url', o.tracking_url,
    'events', coalesce((select jsonb_agg(jsonb_build_object('status', e.status, 'note', e.note, 'at', e.created_at) order by e.created_at)
                          from public.order_events e where e.order_id = o.id and e.note is distinct from null and e.note not like 'UTR submitted%'), '[]'::jsonb),
    'items', coalesce((select jsonb_agg(jsonb_build_object('title', i.title, 'qty', i.qty)) from public.order_items i where i.order_id = o.id), '[]'::jsonb));
end $$;
grant execute on function public.track_order(text, text) to anon, authenticated;
