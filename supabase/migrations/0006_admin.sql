-- 0006 Admin: counters, dashboard, reports, stock adjustment, counter (POS) sales.
-- Everything here is SECURITY DEFINER and executable by the service role only;
-- the Next.js server calls it after checking the staff member's role.

create sequence public.pos_no_seq start 1001;

-- ---------------------------------------------------------------- counters ---
create or replace function public.admin_counters() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'pending_orders',  (select count(*) from public.orders where status = 'pending' and channel = 'online'),
    'verify_payments', (select count(*) from public.orders where payment_status = 'pending_verification' and status not in ('cancelled', 'returned')),
    'low_stock',       (select count(*) from public.inventory i join public.books b on b.id = i.book_id
                         where b.status = 'active' and i.on_hand <= i.low_stock_threshold),
    'enquiries',       (select count(*) from public.enquiries where status = 'new'),
    'reviews',         (select count(*) from public.reviews where status = 'pending')
                     + (select count(*) from public.book_questions where status = 'pending'));
$$;

-- --------------------------------------------------------------- dashboard ---
create or replace function public.admin_dashboard(p_days integer default 30) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  tz constant text := 'Asia/Kolkata';
  today date := (now() at time zone tz)::date;
  days integer := greatest(least(p_days, 366), 1);
  res jsonb;
begin
  with o as (
    select o.*, (o.placed_at at time zone tz)::date as d
      from public.orders o
     where o.status not in ('cancelled', 'returned')
       and o.placed_at >= (today - days)::timestamp at time zone tz
  ),
  day_series as (
    select gs::date as d,
           coalesce(sum(o.total), 0) as sales,
           count(o.id) as orders
      from generate_series(today - (days - 1), today, interval '1 day') gs
      left join o on o.d = gs::date
     group by gs
  ),
  top as (
    select oi.title, sum(oi.qty)::int as qty, sum(oi.line_total) as revenue
      from public.order_items oi join o on o.id = oi.order_id
     group by oi.title order by sum(oi.qty) desc, sum(oi.line_total) desc limit 10
  ),
  profit as (
    -- Only lines whose wholesale cost is known count towards profit (unknown cost would look like 100% margin).
    select coalesce(sum(oi.line_total - c.unit_cost * oi.qty), 0) as p,
           count(*) as known
      from public.order_items oi
      join o on o.id = oi.order_id
      join public.order_item_costs c on c.order_item_id = oi.id and c.unit_cost is not null
  )
  select jsonb_build_object(
    'today',     jsonb_build_object('sales', coalesce((select sum(total) from o where d = today), 0),
                                    'orders', (select count(*) from o where d = today)),
    'yesterday', jsonb_build_object('sales', coalesce((select sum(total) from o where d = today - 1), 0),
                                    'orders', (select count(*) from o where d = today - 1)),
    'period',    jsonb_build_object('sales', coalesce((select sum(total) from o), 0),
                                    'orders', (select count(*) from o),
                                    'aov', coalesce((select round(avg(total), 2) from o), 0),
                                    'profit', (select p from profit)),
    'to_dispatch', (select count(*) from public.orders where status in ('confirmed', 'processing', 'ready') and channel = 'online'),
    'series',    coalesce((select jsonb_agg(jsonb_build_object('d', d, 'sales', sales, 'orders', orders) order by d) from day_series), '[]'::jsonb),
    'top_books', coalesce((select jsonb_agg(jsonb_build_object('title', title, 'qty', qty, 'revenue', revenue)) from top), '[]'::jsonb)
  ) into res;
  return res;
end $$;

-- ------------------------------------------------------------------ stock ---
create or replace function public.admin_low_stock(p_limit integer default 50)
returns table (book_id uuid, title text, slug text, on_hand integer, threshold integer, rack_location text)
language sql stable security definer set search_path = public as $$
  select b.id, b.title, b.slug, i.on_hand, i.low_stock_threshold, bp.rack_location
    from public.inventory i
    join public.books b on b.id = i.book_id
    left join public.book_private bp on bp.book_id = b.id
   where b.status = 'active' and i.on_hand <= i.low_stock_threshold
   order by i.on_hand asc, b.title
   limit greatest(p_limit, 1);
$$;

create or replace function public.admin_adjust_stock(p_book uuid, p_delta integer, p_reason text, p_note text, p_actor uuid)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  cur integer;
begin
  if p_delta = 0 then raise exception 'DELTA_ZERO'; end if;
  if p_reason not in ('restock', 'adjust', 'import', 'return') then raise exception 'REASON_INVALID'; end if;
  select on_hand into cur from public.inventory where book_id = p_book for update;
  if not found then raise exception 'BOOK_NOT_FOUND'; end if;
  if cur + p_delta < 0 then raise exception 'STOCK_NEGATIVE' using detail = cur::text; end if;
  update public.inventory set on_hand = cur + p_delta where book_id = p_book;
  insert into public.stock_movements (book_id, delta, reason, note, actor_id) values (p_book, p_delta, p_reason, p_note, p_actor);
  -- Back in stock: flag customers who asked to be notified.
  if cur = 0 and cur + p_delta > 0 then
    update public.stock_alerts set notified_at = null where book_id = p_book;
  end if;
  return cur + p_delta;
end $$;

create or replace function public.admin_set_stock(p_book uuid, p_on_hand integer, p_note text, p_actor uuid)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  cur integer;
begin
  if p_on_hand < 0 then raise exception 'STOCK_NEGATIVE'; end if;
  select on_hand into cur from public.inventory where book_id = p_book for update;
  if not found then raise exception 'BOOK_NOT_FOUND'; end if;
  if p_on_hand = cur then return cur; end if;
  update public.inventory set on_hand = p_on_hand where book_id = p_book;
  insert into public.stock_movements (book_id, delta, reason, note, actor_id) values (p_book, p_on_hand - cur, 'adjust', p_note, p_actor);
  return p_on_hand;
end $$;

-- ------------------------------------------------------- counter (POS) sale ---
-- p_items: [{"book_id": "...", "qty": 1, "unit_price": 350}]  (unit_price optional, capped at MRP)
create or replace function public.admin_pos_sale(p_items jsonb, p_actor uuid, p_payment text default 'cash', p_customer text default null, p_phone text default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order uuid := gen_random_uuid();
  v_no text;
  v_item record;
  v_line_id uuid;
  v_total numeric(10, 2) := 0;
  v_price numeric(10, 2);
begin
  if p_payment not in ('cash', 'upi') then raise exception 'PAYMENT_METHOD_INVALID'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'EMPTY_CART'; end if;

  perform 1 from public.inventory i
    where i.book_id in (select (e ->> 'book_id')::uuid from jsonb_array_elements(p_items) e)
    order by i.book_id for update;

  for v_item in
    select (e ->> 'book_id')::uuid as book_id, sum((e ->> 'qty')::int)::int as qty,
           max(nullif(e ->> 'unit_price', '')::numeric) as unit_price
      from jsonb_array_elements(p_items) e group by 1
  loop
    if v_item.qty < 1 then raise exception 'QTY_INVALID'; end if;
    if (select coalesce(on_hand, 0) from public.inventory where book_id = v_item.book_id) < v_item.qty then
      raise exception 'OUT_OF_STOCK' using detail = (select title from public.books where id = v_item.book_id);
    end if;
    v_price := coalesce(v_item.unit_price, public.book_effective_price(v_item.book_id));
    if v_price < 0 or v_price > (select mrp from public.books where id = v_item.book_id) then raise exception 'PRICE_INVALID'; end if;
    v_total := v_total + v_price * v_item.qty;
  end loop;

  v_no := 'POS-' || to_char(now() at time zone 'Asia/Kolkata', 'YYMM') || '-' || lpad(nextval('public.pos_no_seq')::text, 5, '0');
  insert into public.orders (id, order_no, user_id, channel, status, payment_method, payment_status, fulfillment, subtotal, total,
                             ship_name, ship_phone, placed_at)
  values (v_order, v_no, null, 'pos', 'delivered', p_payment, 'paid', 'pickup', v_total, v_total,
          coalesce(nullif(btrim(p_customer), ''), 'Walk-in customer'), coalesce(nullif(btrim(p_phone), ''), '0000000000'), now());

  for v_item in
    select l.book_id, l.qty, coalesce(l.unit_price, public.book_effective_price(l.book_id)) as price,
           b.title, b.slug, b.isbn, b.cover_url, b.mrp, bp.cost_price
      from (select (e ->> 'book_id')::uuid as book_id, sum((e ->> 'qty')::int)::int as qty,
                   max(nullif(e ->> 'unit_price', '')::numeric) as unit_price
              from jsonb_array_elements(p_items) e group by 1) l
      join public.books b on b.id = l.book_id
      left join public.book_private bp on bp.book_id = l.book_id
  loop
    v_line_id := gen_random_uuid();
    insert into public.order_items (id, order_id, book_id, title, slug, isbn, cover_url, unit_price, mrp, qty, line_total)
    values (v_line_id, v_order, v_item.book_id, v_item.title, v_item.slug, v_item.isbn, v_item.cover_url,
            v_item.price, v_item.mrp, v_item.qty, v_item.price * v_item.qty);
    insert into public.order_item_costs (order_item_id, unit_cost) values (v_line_id, v_item.cost_price);
    update public.inventory set on_hand = on_hand - v_item.qty where book_id = v_item.book_id;
    update public.books set sold_count = sold_count + v_item.qty where id = v_item.book_id;
    insert into public.stock_movements (book_id, delta, reason, order_id, actor_id, note)
    values (v_item.book_id, -v_item.qty, 'pos_sale', v_order, p_actor, 'Counter sale');
  end loop;

  insert into public.payments (order_id, method, amount, status, verified_by, verified_at)
  values (v_order, p_payment, v_total, 'success', p_actor, now());
  insert into public.order_events (order_id, status, note, actor_id) values (v_order, 'delivered', 'Counter sale', p_actor);

  return jsonb_build_object('order_id', v_order, 'order_no', v_no, 'total', v_total);
end $$;

-- ----------------------------------------------------------------- reports ---
-- Sales summary between two IST dates (inclusive). Cancelled/returned orders are excluded.
create or replace function public.admin_sales_report(p_from date, p_to date) returns jsonb
language sql stable security definer set search_path = public as $$
  with o as (
    select o.*, (o.placed_at at time zone 'Asia/Kolkata')::date as d,
           extract(hour from (o.placed_at at time zone 'Asia/Kolkata'))::int as h
      from public.orders o
     where o.status not in ('cancelled', 'returned')
       and (o.placed_at at time zone 'Asia/Kolkata')::date between p_from and p_to
  )
  select jsonb_build_object(
    'totals', (select jsonb_build_object('orders', count(*), 'gross', coalesce(sum(subtotal), 0), 'discount', coalesce(sum(discount_total), 0),
                                         'delivery', coalesce(sum(delivery_fee), 0), 'net', coalesce(sum(total), 0),
                                         'units', coalesce((select sum(oi.qty) from public.order_items oi where oi.order_id in (select id from o)), 0),
                                         'profit', coalesce((select sum(oi.line_total - c.unit_cost * oi.qty) from public.order_items oi join public.order_item_costs c on c.order_item_id = oi.id and c.unit_cost is not null
                                                              where oi.order_id in (select id from o)), 0))
                 from o),
    'by_day', coalesce((select jsonb_agg(x order by x.d) from (select d, count(*) as orders, sum(total) as net from o group by d) x), '[]'::jsonb),
    'by_hour', coalesce((select jsonb_agg(x order by x.h) from (select h, count(*) as orders, sum(total) as net from o group by h) x), '[]'::jsonb),
    'by_payment', coalesce((select jsonb_agg(x) from (select payment_method, count(*) as orders, sum(total) as net from o group by payment_method) x), '[]'::jsonb),
    'by_channel', coalesce((select jsonb_agg(x) from (select channel, count(*) as orders, sum(total) as net from o group by channel) x), '[]'::jsonb),
    'by_district', coalesce((select jsonb_agg(x order by x.orders desc) from (
        select coalesce(nullif(ship_district, ''), nullif(ship_city, ''), 'Unknown') as district, count(*) as orders, sum(total) as net
          from o where channel = 'online' group by 1 order by 2 desc limit 15) x), '[]'::jsonb),
    'top_books', coalesce((select jsonb_agg(x) from (
        select oi.title, sum(oi.qty)::int as qty, sum(oi.line_total) as revenue
          from public.order_items oi where oi.order_id in (select id from o) group by oi.title order by 2 desc, 3 desc limit 20) x), '[]'::jsonb)
  );
$$;

-- Slow movers: in stock, but nothing sold for p_days days.
create or replace function public.admin_dead_stock(p_days integer default 90, p_limit integer default 100)
returns table (book_id uuid, title text, slug text, on_hand integer, cost_value numeric, last_sold date)
language sql stable security definer set search_path = public as $$
  select b.id, b.title, b.slug, i.on_hand,
         coalesce(bp.cost_price, 0) * i.on_hand,
         (select max((o.placed_at at time zone 'Asia/Kolkata')::date)
            from public.order_items oi join public.orders o on o.id = oi.order_id
           where oi.book_id = b.id and o.status not in ('cancelled', 'returned'))
    from public.books b
    join public.inventory i on i.book_id = b.id
    left join public.book_private bp on bp.book_id = b.id
   where b.status = 'active' and i.on_hand > 0
     and not exists (select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
                      where oi.book_id = b.id and o.status not in ('cancelled', 'returned')
                        and o.placed_at >= now() - make_interval(days => p_days))
   order by coalesce(bp.cost_price, 0) * i.on_hand desc, i.on_hand desc
   limit greatest(p_limit, 1);
$$;

-- HSN-wise summary for GSTR-1 (printed books, HSN 4901, nil-rated).
create or replace function public.admin_hsn_summary(p_from date, p_to date)
returns table (hsn_code text, description text, uqc text, total_qty bigint, total_value numeric, taxable_value numeric, gst_rate numeric)
language sql stable security definer set search_path = public as $$
  select coalesce(b.hsn_code, '4901'), 'Printed books, brochures, leaflets', 'NOS',
         sum(oi.qty)::bigint, sum(oi.line_total), (case when max(b.gst_rate) = 0 then 0 else sum(oi.line_total) end), coalesce(max(b.gst_rate), 0)
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    left join public.books b on b.id = oi.book_id
   where o.status not in ('cancelled', 'returned')
     and (o.placed_at at time zone 'Asia/Kolkata')::date between p_from and p_to
   group by coalesce(b.hsn_code, '4901')
   order by 1;
$$;

-- Revoke the default PUBLIC/anon/authenticated execute on every admin function.
do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as sig
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname like 'admin\_%'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;
