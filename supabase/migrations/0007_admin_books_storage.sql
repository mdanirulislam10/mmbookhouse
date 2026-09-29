-- 0007 Admin book editor (atomic save) and media storage bucket.

-- p: {
--   id?: uuid, slug, title, title_bn?, subtitle?, description?, description_bn?, isbn?,
--   language, binding, condition, edition?, edition_year?, pages?, weight_g?, class_level?,
--   mrp, sale_price, hsn_code?, gst_rate?, cover_url?, gallery: [url], preview_pages: [url],
--   status, is_featured,
--   publisher?: {name, name_bn?, slug}, authors: [{name, name_bn?, slug, role?}], category_ids: [uuid],
--   cost_price?, rack_location?, supplier_note?, on_hand? (new books only), low_stock_threshold?
-- }
create or replace function public.admin_save_book(p jsonb, p_actor uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_pub uuid;
  v_author uuid;
  v_slug text;
  a jsonb;
  pos integer := 0;
  is_new boolean := v_id is null;
begin
  if p ->> 'publisher' is not null and p -> 'publisher' <> 'null'::jsonb and nullif(btrim(p -> 'publisher' ->> 'name'), '') is not null then
    select id into v_pub from public.publishers where lower(name) = lower(btrim(p -> 'publisher' ->> 'name'));
    if v_pub is null then
      v_slug := p -> 'publisher' ->> 'slug';
      if exists (select 1 from public.publishers where slug = v_slug) then v_slug := v_slug || '-' || substr(md5(random()::text), 1, 4); end if;
      insert into public.publishers (slug, name, name_bn)
      values (v_slug, btrim(p -> 'publisher' ->> 'name'), nullif(btrim(coalesce(p -> 'publisher' ->> 'name_bn', '')), ''))
      returning id into v_pub;
    end if;
  end if;

  if is_new then
    insert into public.books (slug, title, title_bn, subtitle, description, description_bn, isbn, publisher_id, language, edition,
                              edition_year, pages, binding, condition, weight_g, class_level, mrp, sale_price, hsn_code, gst_rate,
                              cover_url, gallery, preview_pages, status, is_featured)
    values (p ->> 'slug', btrim(p ->> 'title'), nullif(btrim(coalesce(p ->> 'title_bn', '')), ''), nullif(btrim(coalesce(p ->> 'subtitle', '')), ''),
            nullif(btrim(coalesce(p ->> 'description', '')), ''), nullif(btrim(coalesce(p ->> 'description_bn', '')), ''),
            nullif(btrim(coalesce(p ->> 'isbn', '')), ''), v_pub, coalesce(p ->> 'language', 'bn'), nullif(btrim(coalesce(p ->> 'edition', '')), ''),
            nullif(p ->> 'edition_year', '')::int, nullif(p ->> 'pages', '')::int, coalesce(p ->> 'binding', 'paperback'),
            coalesce(p ->> 'condition', 'new'), nullif(p ->> 'weight_g', '')::int, nullif(btrim(coalesce(p ->> 'class_level', '')), ''),
            (p ->> 'mrp')::numeric, (p ->> 'sale_price')::numeric, coalesce(nullif(p ->> 'hsn_code', ''), '4901'),
            coalesce(nullif(p ->> 'gst_rate', '')::numeric, 0), nullif(p ->> 'cover_url', ''),
            coalesce(p -> 'gallery', '[]'::jsonb), coalesce(p -> 'preview_pages', '[]'::jsonb),
            coalesce(p ->> 'status', 'draft')::public.book_status, coalesce((p ->> 'is_featured')::boolean, false))
    returning id into v_id;
  else
    update public.books set
      slug = coalesce(nullif(p ->> 'slug', ''), slug),
      title = btrim(p ->> 'title'), title_bn = nullif(btrim(coalesce(p ->> 'title_bn', '')), ''),
      subtitle = nullif(btrim(coalesce(p ->> 'subtitle', '')), ''),
      description = nullif(btrim(coalesce(p ->> 'description', '')), ''), description_bn = nullif(btrim(coalesce(p ->> 'description_bn', '')), ''),
      isbn = nullif(btrim(coalesce(p ->> 'isbn', '')), ''), publisher_id = v_pub,
      language = coalesce(p ->> 'language', language), edition = nullif(btrim(coalesce(p ->> 'edition', '')), ''),
      edition_year = nullif(p ->> 'edition_year', '')::int, pages = nullif(p ->> 'pages', '')::int,
      binding = coalesce(p ->> 'binding', binding), condition = coalesce(p ->> 'condition', condition),
      weight_g = nullif(p ->> 'weight_g', '')::int, class_level = nullif(btrim(coalesce(p ->> 'class_level', '')), ''),
      mrp = (p ->> 'mrp')::numeric, sale_price = (p ->> 'sale_price')::numeric,
      hsn_code = coalesce(nullif(p ->> 'hsn_code', ''), hsn_code), gst_rate = coalesce(nullif(p ->> 'gst_rate', '')::numeric, gst_rate),
      cover_url = nullif(p ->> 'cover_url', ''), gallery = coalesce(p -> 'gallery', gallery),
      preview_pages = coalesce(p -> 'preview_pages', preview_pages),
      status = coalesce(p ->> 'status', status::text)::public.book_status,
      is_featured = coalesce((p ->> 'is_featured')::boolean, is_featured)
    where id = v_id;
    if not found then raise exception 'BOOK_NOT_FOUND'; end if;
  end if;

  -- Authors: replace the list, creating unknown authors on the fly.
  if p ? 'authors' then
    delete from public.book_authors where book_id = v_id;
    for a in select * from jsonb_array_elements(p -> 'authors') loop
      continue when nullif(btrim(a ->> 'name'), '') is null;
      select id into v_author from public.authors where lower(name) = lower(btrim(a ->> 'name'));
      if v_author is null then
        v_slug := a ->> 'slug';
        if exists (select 1 from public.authors where slug = v_slug) then v_slug := v_slug || '-' || substr(md5(random()::text), 1, 4); end if;
        insert into public.authors (slug, name, name_bn)
        values (v_slug, btrim(a ->> 'name'), nullif(btrim(coalesce(a ->> 'name_bn', '')), ''))
        returning id into v_author;
      end if;
      insert into public.book_authors (book_id, author_id, role, position)
      values (v_id, v_author, coalesce(a ->> 'role', 'author'), pos)
      on conflict do nothing;
      pos := pos + 1;
    end loop;
  end if;

  if p ? 'category_ids' then
    delete from public.book_categories where book_id = v_id;
    insert into public.book_categories (book_id, category_id)
    select v_id, (c)::uuid from jsonb_array_elements_text(p -> 'category_ids') c
    on conflict do nothing;
  end if;

  -- Staff-only fields and stock settings.
  insert into public.book_private (book_id, cost_price, rack_location, supplier_note)
  values (v_id, nullif(p ->> 'cost_price', '')::numeric, nullif(btrim(coalesce(p ->> 'rack_location', '')), ''), nullif(btrim(coalesce(p ->> 'supplier_note', '')), ''))
  on conflict (book_id) do update set
    cost_price = case when p ? 'cost_price' then excluded.cost_price else public.book_private.cost_price end,
    rack_location = excluded.rack_location,
    supplier_note = excluded.supplier_note;

  if is_new and nullif(p ->> 'on_hand', '') is not null and (p ->> 'on_hand')::int > 0 then
    update public.inventory set on_hand = (p ->> 'on_hand')::int where book_id = v_id;
    insert into public.stock_movements (book_id, delta, reason, note, actor_id)
    values (v_id, (p ->> 'on_hand')::int, 'restock', 'Opening stock', p_actor);
  end if;
  if nullif(p ->> 'low_stock_threshold', '') is not null then
    update public.inventory set low_stock_threshold = (p ->> 'low_stock_threshold')::int where book_id = v_id;
  end if;

  perform public.refresh_book_search(v_id);
  return v_id;
end $$;
revoke execute on function public.admin_save_book(jsonb, uuid) from public, anon, authenticated;

-- Bulk price tool: change price for every book of a publisher / category by a percentage of MRP.
-- p_mode 'discount_pct': set sale_price = mrp * (1 - pct/100); 'adjust_pct': sale_price * (1 + pct/100) (capped at MRP).
create or replace function public.admin_bulk_price(p_publisher uuid, p_category uuid, p_mode text, p_pct numeric, p_actor uuid)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  n integer;
begin
  if p_publisher is null and p_category is null then raise exception 'SCOPE_REQUIRED'; end if;
  if p_mode not in ('discount_pct', 'adjust_pct') then raise exception 'MODE_INVALID'; end if;
  if p_mode = 'discount_pct' and (p_pct < 0 or p_pct > 90) then raise exception 'PCT_INVALID'; end if;
  if p_mode = 'adjust_pct' and (p_pct < -90 or p_pct > 100) then raise exception 'PCT_INVALID'; end if;

  update public.books b set sale_price = least(b.mrp, greatest(0, round(
      case p_mode when 'discount_pct' then b.mrp * (1 - p_pct / 100) else b.sale_price * (1 + p_pct / 100) end, 0)))
   where b.status <> 'archived'
     and (p_publisher is null or b.publisher_id = p_publisher)
     and (p_category is null or exists (select 1 from public.book_categories bc where bc.book_id = b.id and bc.category_id = p_category));
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.admin_bulk_price(uuid, uuid, text, numeric, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------- storage ---
-- Public bucket for book covers, previews and banners. Uploads go through the
-- server (service role); everyone can read.
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];
  end if;
end $$;
