-- Patch 2026-09-29: profit counts only books with a known cost price. Safe to run more than once.
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

revoke execute on function public.admin_dashboard(integer) from public, anon, authenticated;
revoke execute on function public.admin_sales_report(date, date) from public, anon, authenticated;
