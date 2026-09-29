-- 0005 Search: typo-tolerant, bilingual catalog search with filters and sorting.
-- Runs as the caller (security invoker) so RLS keeps drafts/archived books out.

create or replace function public.escape_like(p_text text) returns text
language sql immutable as $$
  select replace(replace(replace(p_text, '\', '\\'), '%', '\%'), '_', '\_');
$$;

create or replace function public.search_books(
  p_q          text    default null,
  p_category   uuid    default null,
  p_min        numeric default null,
  p_max        numeric default null,
  p_lang       text    default null,
  p_in_stock   boolean default false,
  p_sort       text    default 'relevance',
  p_limit      integer default 24,
  p_offset     integer default 0
) returns table (
  id uuid, slug text, title text, title_bn text, cover_url text,
  mrp numeric, price numeric, discount_pct integer, rating_avg numeric, rating_count integer,
  in_stock boolean, low_stock boolean, on_hand integer, author_names text, author_names_bn text,
  publisher_name text, language text, deal_ends_at timestamptz, total_count bigint
)
language sql stable security invoker set search_path = public, extensions as $$
  with recursive
  cats as (
    select c.id from public.categories c where c.id = p_category
    union
    select c.id from public.categories c join cats on c.parent_id = cats.id
  ),
  q as (
    select nullif(lower(btrim(coalesce(p_q, ''))), '') as t
  ),
  hits as (
    select v.*, b.search_text,
           case
             when q.t is null then 0::real
             else greatest(
               word_similarity(q.t, b.search_text),
               similarity(b.search_text, q.t),
               case when not exists (
                      select 1 from unnest(string_to_array(q.t, ' ')) tok
                       where tok <> '' and b.search_text not like '%' || public.escape_like(tok) || '%')
                    then 0.95::real else 0::real end)
           end as score
      from public.v_books v
      join public.books b on b.id = v.id
      cross join q
     where (q.t is null
            or not exists (
                 select 1 from unnest(string_to_array(q.t, ' ')) tok
                  where tok <> '' and b.search_text not like '%' || public.escape_like(tok) || '%')
            or word_similarity(q.t, b.search_text) >= 0.4)
       and (p_category is null
            or exists (select 1 from public.book_categories bc
                        where bc.book_id = v.id and bc.category_id in (select cats.id from cats)))
       and (p_min is null or v.price >= p_min)
       and (p_max is null or v.price <= p_max)
       and (p_lang is null or v.language = p_lang)
       and (not p_in_stock or v.in_stock)
  )
  select h.id, h.slug, h.title, h.title_bn, h.cover_url, h.mrp, h.price, h.discount_pct, h.rating_avg, h.rating_count,
         h.in_stock, h.low_stock, h.on_hand, h.author_names, h.author_names_bn, h.publisher_name, h.language,
         h.deal_ends_at, count(*) over () as total_count
    from hits h
   order by
     case p_sort when 'price_asc'  then h.price end asc,
     case p_sort when 'price_desc' then h.price end desc,
     case p_sort when 'newest'     then h.created_at end desc,
     case p_sort when 'popular'    then h.sold_count end desc,
     case p_sort when 'rating'     then h.rating_avg end desc,
     case p_sort when 'discount'   then h.discount_pct end desc,
     h.score desc,
     h.in_stock desc,
     h.sold_count desc,
     h.title asc
   limit greatest(least(p_limit, 100), 1)
  offset greatest(p_offset, 0);
$$;
