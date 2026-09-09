-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Part 5 (Tasks 21 to 25): Performance, Scalability, Caching & Keyset Pagination
-- Database Engine: Supabase (PostgreSQL 16)
-- Migration: 20260907000007_performance_caching_pagination.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TASK 21: VIEWS COUNT, SALES COUNTER & POPULARITY SCORE ENGINE
-- ------------------------------------------------------------------------------
ALTER TABLE books ADD COLUMN IF NOT EXISTS views_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS monthly_sales_count INT NOT NULL DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS popularity_score NUMERIC(10, 4) NOT NULL DEFAULT 0.0000;

-- Buffered/Batched view counter increment function
CREATE OR REPLACE FUNCTION increment_book_views(p_book_id UUID, p_increment INT DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    UPDATE books
    SET views_count = views_count + p_increment
    WHERE id = p_book_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_book_views IS 'Increments book views count (called by Next.js edge API / Redis sync)';

-- Batch function to recalculate monthly sales and overall popularity scores
CREATE OR REPLACE FUNCTION recalculate_popularity_scores()
RETURNS INT AS $$
DECLARE
    v_updated_count INT := 0;
BEGIN
    -- 1. Compute recent 30-day delivered sales per book
    WITH recent_sales AS (
        SELECT 
            bv.book_id,
            COALESCE(SUM(oi.quantity), 0)::INT AS sales_30d
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN book_variants bv ON oi.variant_id = bv.id
        WHERE o.status = 'delivered' 
          AND o.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY bv.book_id
    )
    -- 2. Update books table with monthly sales and weighted popularity score
    -- Formula: (30-day sales * 10) + (views * 0.05) + (rating * reviews * 2.0)
    UPDATE books b
    SET 
        monthly_sales_count = COALESCE(rs.sales_30d, 0),
        popularity_score = ROUND(
            (COALESCE(rs.sales_30d, 0) * 10.0) + 
            (b.views_count * 0.05) + 
            (b.average_rating * b.reviews_count * 2.0),
            4
        ),
        updated_at = NOW()
    FROM (
        SELECT id FROM books WHERE is_active = TRUE AND deleted_at IS NULL
    ) active_b
    LEFT JOIN recent_sales rs ON active_b.id = rs.book_id
    WHERE b.id = active_b.id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION recalculate_popularity_scores IS 'Hourly/Daily cron function to rank bestsellers and trending books';

-- Indexes for lightning-fast popularity and recency lookups
CREATE INDEX IF NOT EXISTS idx_books_popularity ON books (popularity_score DESC, id) WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_books_created_at_id ON books (created_at DESC, id) WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_books_rating_id ON books (average_rating DESC, reviews_count DESC, id) WHERE is_active = TRUE AND deleted_at IS NULL;

-- ------------------------------------------------------------------------------
-- TASK 22: FAST CURSOR-BASED (KEYSET) PAGINATION ENGINE (Constant O(1) Speed)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_catalog_books_paginated(
    p_category_id UUID DEFAULT NULL,
    p_cursor_score NUMERIC DEFAULT NULL,
    p_cursor_id UUID DEFAULT NULL,
    p_limit INT DEFAULT 20,
    p_sort_by VARCHAR DEFAULT 'popularity'
)
RETURNS TABLE (
    book_id UUID,
    title VARCHAR,
    title_bn VARCHAR,
    slug VARCHAR,
    publisher_name VARCHAR,
    author_names TEXT,
    cover_image_url TEXT,
    min_price NUMERIC,
    highest_discount_percent NUMERIC,
    average_rating NUMERIC,
    reviews_count INT,
    total_available_stock INT,
    is_in_stock BOOLEAN,
    popularity_score NUMERIC,
    next_cursor_score NUMERIC,
    next_cursor_id UUID
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered_books AS (
        SELECT 
            v.*,
            b.popularity_score AS b_pop_score
        FROM v_catalog_books v
        JOIN books b ON v.book_id = b.id
        LEFT JOIN book_categories bc ON b.id = bc.book_id
        WHERE (p_category_id IS NULL OR bc.category_id = p_category_id)
          AND (
              -- Keyset pagination condition based on sort
              CASE 
                  WHEN p_sort_by = 'popularity' THEN
                      (p_cursor_score IS NULL OR (b.popularity_score, b.id) < (p_cursor_score, p_cursor_id))
                  WHEN p_sort_by = 'price_asc' THEN
                      (p_cursor_score IS NULL OR (v.min_price, b.id) > (p_cursor_score, p_cursor_id))
                  WHEN p_sort_by = 'price_desc' THEN
                      (p_cursor_score IS NULL OR (v.min_price, b.id) < (p_cursor_score, p_cursor_id))
                  WHEN p_sort_by = 'rating' THEN
                      (p_cursor_score IS NULL OR (b.average_rating, b.id) < (p_cursor_score, p_cursor_id))
                  ELSE -- newest
                      (p_cursor_id IS NULL OR b.id < p_cursor_id)
              END
          )
        ORDER BY 
            CASE WHEN p_sort_by = 'popularity' THEN b.popularity_score END DESC,
            CASE WHEN p_sort_by = 'price_asc' THEN v.min_price END ASC,
            CASE WHEN p_sort_by = 'price_desc' THEN v.min_price END DESC,
            CASE WHEN p_sort_by = 'rating' THEN b.average_rating END DESC,
            CASE WHEN p_sort_by = 'newest' THEN b.created_at END DESC,
            b.id DESC
        LIMIT p_limit
    )
    SELECT 
        fb.book_id,
        fb.title,
        fb.title_bn,
        fb.slug,
        fb.publisher_name,
        fb.author_names,
        fb.cover_image_url,
        fb.min_price,
        fb.highest_discount_percent,
        b.average_rating,
        b.reviews_count,
        fb.total_available_stock,
        fb.is_in_stock,
        fb.b_pop_score,
        CASE 
            WHEN p_sort_by = 'popularity' THEN fb.b_pop_score
            WHEN p_sort_by IN ('price_asc', 'price_desc') THEN fb.min_price
            WHEN p_sort_by = 'rating' THEN b.average_rating
            ELSE NULL
        END AS next_cursor_score,
        fb.book_id AS next_cursor_id
    FROM filtered_books fb
    JOIN books b ON fb.book_id = b.id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_catalog_books_paginated IS 'High-speed Keyset cursor pagination avoiding OFFSET performance penalties';

-- ------------------------------------------------------------------------------
-- TASK 23: HTTP ETAG & ISR CACHE INVALIDATION GENERATOR
-- ------------------------------------------------------------------------------
-- Global catalog ETag: combines max updated_at of books, variants, and categories
CREATE OR REPLACE FUNCTION get_catalog_etag()
RETURNS TEXT AS $$
DECLARE
    v_max_ts TIMESTAMPTZ;
BEGIN
    SELECT GREATEST(
        (SELECT MAX(updated_at) FROM books),
        (SELECT MAX(updated_at) FROM book_variants),
        (SELECT MAX(updated_at) FROM categories),
        (SELECT MAX(updated_at) FROM inventory)
    ) INTO v_max_ts;

    RETURN 'W/"' || MD5(COALESCE(v_max_ts, NOW())::TEXT) || '"';
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_catalog_etag IS 'Generates weak HTTP ETag for Next.js ISR / edge 304 Not Modified caching';

-- Single book ETag
CREATE OR REPLACE FUNCTION get_book_etag(p_book_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_ts TIMESTAMPTZ;
BEGIN
    SELECT GREATEST(
        b.updated_at,
        (SELECT MAX(updated_at) FROM book_variants WHERE book_id = p_book_id),
        (SELECT MAX(updated_at) FROM reviews WHERE book_id = p_book_id)
    ) INTO v_ts
    FROM books b
    WHERE b.id = p_book_id;

    IF v_ts IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN 'W/"' || MD5(v_ts::TEXT) || '"';
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_book_etag IS 'Generates HTTP ETag for specific book product page';

-- ------------------------------------------------------------------------------
-- TASK 24: POSTGRESQL TOAST EXTENDED STORAGE OPTIMIZATION
-- ------------------------------------------------------------------------------
-- Ensure large markdown descriptions and jsonb arrays are stored out-of-line
-- so that sequential index and table scans remain memory-cached in RAM
ALTER TABLE books ALTER COLUMN description SET STORAGE EXTENDED;
ALTER TABLE books ALTER COLUMN description_bn SET STORAGE EXTENDED;
ALTER TABLE books ALTER COLUMN table_of_contents SET STORAGE EXTENDED;
ALTER TABLE books ALTER COLUMN preview_images SET STORAGE EXTENDED;

-- ------------------------------------------------------------------------------
-- TASK 25: SUPAVISOR CONNECTION POOLER CONFIGURATION & AUDIT VIEW
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_database_pooler_config AS
SELECT 
    'Supavisor Transaction Pooler (AWS Mumbai)' AS pooler_type,
    6543 AS recommended_port,
    'Transaction Mode' AS recommended_mode,
    'Serverless Next.js App Router (Client SSR / Actions)' AS ideal_use_case,
    5432 AS direct_session_port,
    'Database Migrations, Admin & Long-running scripts' AS session_use_case,
    'statement_timeout = 8000 (8s)' AS recommended_timeout;

COMMENT ON VIEW v_database_pooler_config IS 'Architectural reference for Supabase connection pooler configuration';
