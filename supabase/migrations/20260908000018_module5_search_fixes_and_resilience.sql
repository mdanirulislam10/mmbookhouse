-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 5: Advanced Live Search & Typo-Tolerant Typeahead Search Engine
-- Migration: 20260908000018_module5_search_fixes_and_resilience.sql
-- ==============================================================================

-- Ensure book_variants has is_default column for default edition selection
ALTER TABLE book_variants ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE FUNCTION sanitize_search_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    IF input_text IS NULL THEN
        RETURN '';
    END IF;
    RETURN LOWER(TRIM(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(input_text, '[\-_,;:/\\(\)\[\]{}|+=]', ' ', 'g'),
                '[''"\.]', '', 'g'
            ),
            '\s+', ' ', 'g'
        )
    ));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE TABLE IF NOT EXISTS search_wanted_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_text VARCHAR(255) NOT NULL,
    category_hint VARCHAR(100),
    search_count INT NOT NULL DEFAULT 1,
    last_searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    customer_ip_hash VARCHAR(64),
    is_fulfilled BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wanted_books_query ON search_wanted_books(query_text);
CREATE INDEX IF NOT EXISTS idx_wanted_books_count ON search_wanted_books(search_count DESC);

CREATE OR REPLACE FUNCTION log_zero_result_search(
    p_query TEXT,
    p_category TEXT DEFAULT NULL,
    p_ip_hash TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    clean_q TEXT;
BEGIN
    clean_q := sanitize_search_text(p_query);
    IF LENGTH(clean_q) < 2 THEN
        RETURN;
    END IF;

    INSERT INTO search_wanted_books (query_text, category_hint, customer_ip_hash, search_count, last_searched_at)
    VALUES (clean_q, p_category, p_ip_hash, 1, NOW())
    ON CONFLICT (query_text) DO UPDATE
    SET search_count = search_wanted_books.search_count + 1,
        last_searched_at = NOW(),
        category_hint = COALESCE(EXCLUDED.category_hint, search_wanted_books.category_hint);
EXCEPTION WHEN OTHERS THEN
    RETURN;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION search_books_typeahead(
    search_query TEXT,
    target_category TEXT DEFAULT 'all',
    result_limit INT DEFAULT 4,
    similarity_cutoff REAL DEFAULT 0.3
)
RETURNS TABLE (
    book_id UUID,
    title VARCHAR,
    title_bn VARCHAR,
    slug VARCHAR,
    publisher_name VARCHAR,
    author_name VARCHAR,
    author_name_bn VARCHAR,
    category_id VARCHAR,
    selling_price NUMERIC,
    mrp NUMERIC,
    discount_percent NUMERIC,
    in_stock BOOLEAN,
    match_score REAL
) AS $$
DECLARE
    clean_query TEXT;
    canonical_query TEXT;
    safe_ts_query_str TEXT;
    compiled_tsquery TSQUERY;
BEGIN
    clean_query := sanitize_search_text(search_query);

    IF LENGTH(clean_query) < 2 THEN
        RETURN;
    END IF;

    SELECT s.canonical_term INTO canonical_query 
    FROM search_synonyms s 
    WHERE s.synonym_term = clean_query 
    LIMIT 1;

    IF canonical_query IS NULL THEN
        canonical_query := clean_query;
    END IF;

    SELECT string_agg(REGEXP_REPLACE(word, '[&|!:<>()*]', '', 'g') || ':*', ' & ') INTO safe_ts_query_str
    FROM unnest(string_to_array(clean_query, ' ')) AS word
    WHERE LENGTH(REGEXP_REPLACE(word, '[&|!:<>()*]', '', 'g')) >= 2;

    IF safe_ts_query_str IS NULL OR LENGTH(safe_ts_query_str) = 0 THEN
        safe_ts_query_str := REGEXP_REPLACE(clean_query, '[&|!:<>()*]', '', 'g') || ':*';
    END IF;

    BEGIN
        compiled_tsquery := to_tsquery('simple', safe_ts_query_str);
    EXCEPTION WHEN OTHERS THEN
        compiled_tsquery := plainto_tsquery('simple', clean_query);
    END;

    RETURN QUERY
    WITH book_candidates AS (
        SELECT 
            b.id AS b_id,
            b.title AS b_title,
            b.title_bn AS b_title_bn,
            b.slug AS b_slug,
            COALESCE(p.name, 'M.M প্রকাশনী') AS b_publisher,
            COALESCE(a.name, 'M.M বিশেষজ্ঞ প্যানেল') AS b_author,
            COALESCE(a.name_bn, a.name, 'M.M বিশেষজ্ঞ প্যানেল') AS b_author_bn,
            COALESCE(c.slug, 'all') AS b_category,
            COALESCE(bv.selling_price, 0) AS b_price,
            COALESCE(bv.mrp, 0) AS b_mrp,
            COALESCE(bv.discount_percent, 0) AS b_discount,
            (COALESCE(inv.stock_quantity, 0) > 0) AS b_in_stock,
            (
                setweight(to_tsvector('simple', COALESCE(b.title, '')), 'A') ||
                setweight(to_tsvector('simple', COALESCE(b.title_bn, '')), 'A') ||
                setweight(to_tsvector('simple', COALESCE(a.name, '')), 'B') ||
                setweight(to_tsvector('simple', COALESCE(a.name_bn, '')), 'B') ||
                setweight(to_tsvector('simple', COALESCE(p.name, '')), 'C') ||
                setweight(to_tsvector('simple', COALESCE(c.name, '')), 'C')
            ) AS search_vector,
            GREATEST(
                similarity(clean_query, sanitize_search_text(b.title)),
                word_similarity(clean_query, sanitize_search_text(b.title)),
                similarity(clean_query, sanitize_search_text(b.title_bn)),
                word_similarity(clean_query, sanitize_search_text(b.title_bn)),
                similarity(canonical_query, sanitize_search_text(b.title)),
                word_similarity(canonical_query, sanitize_search_text(b.title)),
                similarity(clean_query, sanitize_search_text(a.name)),
                similarity(clean_query, sanitize_search_text(a.name_bn))
            ) AS calc_similarity
        FROM books b
        LEFT JOIN publishers p ON b.publisher_id = p.id
        LEFT JOIN book_authors ba ON b.id = ba.book_id AND ba.display_order = 1
        LEFT JOIN authors a ON ba.author_id = a.id
        LEFT JOIN book_categories bc ON b.id = bc.book_id
        LEFT JOIN categories c ON bc.category_id = c.id
        LEFT JOIN book_variants bv ON b.id = bv.book_id AND (bv.is_default = TRUE OR bv.is_active = TRUE)
        LEFT JOIN inventory inv ON bv.id = inv.variant_id
        WHERE 
            b.is_active = TRUE
            AND (target_category = 'all' OR c.slug = target_category OR target_category IS NULL)
            AND (
                (compiled_tsquery IS NOT NULL AND compiled_tsquery @@ (
                    setweight(to_tsvector('simple', COALESCE(b.title, '')), 'A') ||
                    setweight(to_tsvector('simple', COALESCE(b.title_bn, '')), 'A') ||
                    setweight(to_tsvector('simple', COALESCE(a.name, '')), 'B') ||
                    setweight(to_tsvector('simple', COALESCE(a.name_bn, '')), 'B')
                ))
                OR word_similarity(clean_query, sanitize_search_text(b.title)) >= similarity_cutoff
                OR word_similarity(clean_query, sanitize_search_text(b.title_bn)) >= similarity_cutoff
                OR word_similarity(canonical_query, sanitize_search_text(b.title)) >= similarity_cutoff
                OR similarity(clean_query, sanitize_search_text(b.title)) >= similarity_cutoff
                OR clean_query = ANY(b.keywords)
                OR canonical_query = ANY(b.keywords)
                OR (
                    LENGTH(clean_query) >= 4 
                    AND LENGTH(clean_query) <= 25
                    AND levenshtein_less_equal(
                        clean_query, 
                        SUBSTRING(sanitize_search_text(b.title) FROM 1 FOR 30), 
                        2
                    ) <= 2
                )
            )
    )
    SELECT 
        bc.b_id,
        bc.b_title,
        bc.b_title_bn,
        bc.b_slug,
        bc.b_publisher,
        bc.b_author,
        bc.b_author_bn,
        bc.b_category,
        bc.b_price,
        bc.b_mrp,
        bc.b_discount,
        bc.b_in_stock,
        ROUND(
            (
                (COALESCE(ts_rank_cd('{0.1, 0.4, 0.7, 1.0}', bc.search_vector, compiled_tsquery), 0.0) * 50.0) +
                (bc.calc_similarity * 40.0) +
                (CASE WHEN bc.b_in_stock THEN 20.0 ELSE -35.0 END)
            )::numeric, 
            2
        )::REAL AS match_score
    FROM book_candidates bc
    ORDER BY 
        bc.b_in_stock DESC,
        match_score DESC,
        bc.calc_similarity DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;
