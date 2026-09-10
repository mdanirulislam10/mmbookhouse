-- ============================================================================
-- Migration: 20260910000019_module6_faceted_search_indices.sql
-- Module 6: Search Results Page, Faceted Filter & Sorting Engine
-- Purpose:
--   1. High-performance composite B-Tree and GIN indexes for multi-faceted filters
--   2. PostgreSQL Disjunctive Faceted Search RPC Function (fn_faceted_search)
-- ============================================================================

-- 1. Composite & Specialized Indexes for Multi-Facet Filtering
CREATE INDEX IF NOT EXISTS idx_book_variants_binding_condition 
ON public.book_variants (binding, condition) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_books_rating_reviews_active 
ON public.books (average_rating DESC, reviews_count DESC) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_books_newest_arrivals 
ON public.books (created_at DESC) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_books_language_active 
ON public.books (language) 
WHERE is_active = true;

-- 2. Faceted Search & Aggregation Stored Function (fn_faceted_search)
CREATE OR REPLACE FUNCTION public.fn_faceted_search(
    p_query TEXT DEFAULT NULL,
    p_category_id UUID DEFAULT NULL,
    p_authors TEXT[] DEFAULT NULL,
    p_publishers UUID[] DEFAULT NULL,
    p_formats TEXT[] DEFAULT NULL,
    p_conditions TEXT[] DEFAULT NULL,
    p_languages TEXT[] DEFAULT NULL,
    p_min_rating NUMERIC DEFAULT NULL,
    p_min_price NUMERIC DEFAULT NULL,
    p_max_price NUMERIC DEFAULT NULL,
    p_min_discount INT DEFAULT NULL,
    p_sort TEXT DEFAULT 'relevance',
    p_page INT DEFAULT 1,
    p_page_size INT DEFAULT 24
)
RETURNS TABLE (
    book_id UUID,
    title TEXT,
    title_bn TEXT,
    author TEXT,
    publisher TEXT,
    category TEXT,
    price NUMERIC,
    mrp NUMERIC,
    discount_percentage INT,
    rating NUMERIC,
    reviews_count INT,
    binding TEXT,
    condition TEXT,
    language TEXT,
    in_stock BOOLEAN,
    stock_quantity INT,
    created_at TIMESTAMPTZ,
    total_count BIGINT
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_offset INT;
BEGIN
    v_offset := GREATEST(0, (COALESCE(p_page, 1) - 1) * COALESCE(p_page_size, 24));

    RETURN QUERY
    WITH filtered_books AS (
        SELECT DISTINCT ON (b.id)
            b.id AS b_id,
            b.title::TEXT AS b_title,
            COALESCE(b.title_bn, b.title)::TEXT AS b_title_bn,
            v.author_names::TEXT AS b_author,
            COALESCE(p.name, '')::TEXT AS b_publisher,
            COALESCE(c.name, '')::TEXT AS b_category,
            v.min_price AS b_price,
            v.highest_mrp AS b_mrp,
            ROUND(v.highest_discount_percent)::INT AS b_discount_percentage,
            b.average_rating AS b_rating,
            b.reviews_count AS b_reviews_count,
            CASE WHEN v.has_hardcover THEN 'hardcover' ELSE 'paperback' END::TEXT AS b_binding,
            CASE WHEN v.has_used_copy THEN 'used' ELSE 'new' END::TEXT AS b_condition,
            b.language::TEXT AS b_language,
            v.is_in_stock AS b_in_stock,
            v.total_available_stock AS b_stock_quantity,
            b.created_at AS b_created_at
        FROM public.books b
        JOIN public.v_catalog_books v ON b.id = v.book_id
        LEFT JOIN public.publishers p ON p.id = b.publisher_id
        LEFT JOIN public.book_categories bc ON bc.book_id = b.id
        LEFT JOIN public.categories c ON c.id = bc.category_id
        WHERE b.is_active = true 
          AND b.deleted_at IS NULL
          -- Text Query Match
          AND (
              p_query IS NULL OR TRIM(p_query) = '' OR
              b.title ILIKE '%' || TRIM(p_query) || '%' OR
              COALESCE(b.title_bn, '') ILIKE '%' || TRIM(p_query) || '%' OR
              COALESCE(v.author_names, '') ILIKE '%' || TRIM(p_query) || '%' OR
              COALESCE(p.name, '') ILIKE '%' || TRIM(p_query) || '%'
          )
          -- Category Filter
          AND (p_category_id IS NULL OR bc.category_id = p_category_id)
          -- Publishers Filter
          AND (p_publishers IS NULL OR CARDINALITY(p_publishers) = 0 OR b.publisher_id = ANY(p_publishers))
          -- Format Filter
          AND (p_formats IS NULL OR CARDINALITY(p_formats) = 0 OR 
              ('paperback' = ANY(p_formats) AND v.has_paperback) OR
              ('hardcover' = ANY(p_formats) AND v.has_hardcover))
          -- Condition Filter
          AND (p_conditions IS NULL OR CARDINALITY(p_conditions) = 0 OR
              ('used' = ANY(p_conditions) AND v.has_used_copy) OR
              ('new' = ANY(p_conditions)))
          -- Language Filter
          AND (p_languages IS NULL OR CARDINALITY(p_languages) = 0 OR b.language = ANY(p_languages))
          -- Rating Filter
          AND (p_min_rating IS NULL OR b.average_rating >= p_min_rating)
          -- Price Range Filter
          AND (p_min_price IS NULL OR v.min_price >= p_min_price)
          AND (p_max_price IS NULL OR v.min_price <= p_max_price)
          -- Discount Filter
          AND (p_min_discount IS NULL OR v.highest_discount_percent >= p_min_discount)
    ),
    counted AS (
        SELECT COUNT(*) AS cnt FROM filtered_books
    )
    SELECT 
        fb.b_id,
        fb.b_title,
        fb.b_title_bn,
        fb.b_author,
        fb.b_publisher,
        fb.b_category,
        fb.b_price,
        fb.b_mrp,
        fb.b_discount_percentage,
        fb.b_rating,
        fb.b_reviews_count,
        fb.b_binding,
        fb.b_condition,
        fb.b_language,
        fb.b_in_stock,
        fb.b_stock_quantity,
        fb.b_created_at,
        c.cnt AS total_count
    FROM filtered_books fb
    CROSS JOIN counted c
    ORDER BY
        CASE WHEN p_sort = 'price-asc' THEN fb.b_in_stock END DESC NULLS LAST,
        CASE WHEN p_sort = 'price-asc' THEN fb.b_price END ASC NULLS LAST,
        CASE WHEN p_sort = 'price-desc' THEN fb.b_in_stock END DESC NULLS LAST,
        CASE WHEN p_sort = 'price-desc' THEN fb.b_price END DESC NULLS LAST,
        CASE WHEN p_sort = 'rating' THEN ((fb.b_reviews_count * fb.b_rating) + (5 * 4.0)) / (fb.b_reviews_count + 5) END DESC NULLS LAST,
        CASE WHEN p_sort = 'newest' THEN fb.b_created_at END DESC NULLS LAST,
        CASE WHEN p_sort = 'bestselling' THEN fb.b_reviews_count END DESC NULLS LAST,
        -- Default: relevance
        fb.b_in_stock DESC,
        fb.b_rating DESC,
        fb.b_reviews_count DESC
    LIMIT COALESCE(p_page_size, 24)
    OFFSET v_offset;
END;
$$;

-- Grant execute permissions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.fn_faceted_search TO anon, authenticated, service_role;
