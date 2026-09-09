-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 5: Advanced Live Search & Typo-Tolerant Typeahead Search Engine
-- Division 3 (Tasks 11 to 15): Database Indexing, Trigrams, Typo-Tolerance & Synonyms
-- Database Engine: Supabase (PostgreSQL 16)
-- Migration: 20260908000016_module5_typeahead_search_engine.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TASK 11: POSTGRESQL EXTENSIONS & GIN TRIGRAM INDEXING
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- Trigram GIN Indexes for high-speed sub-50ms search on books
CREATE INDEX IF NOT EXISTS idx_books_title_trgm_v5 ON books USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_books_title_bn_trgm_v5 ON books USING gin (title_bn gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_books_keywords_gin_v5 ON books USING gin (keywords);

-- Trigram GIN Indexes for authors & publishers
CREATE INDEX IF NOT EXISTS idx_authors_name_trgm_v5 ON authors USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_authors_name_bn_trgm_v5 ON authors USING gin (name_bn gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_publishers_name_trgm_v5 ON publishers USING gin (name gin_trgm_ops);

-- ------------------------------------------------------------------------------
-- TASK 14: REGEX SANITIZER FUNCTION (Punctuation & Special Characters)
-- "M.M" vs "MM", "W.B.C.S" vs "WBCS", "ড. অতুল" vs "ড অতুল"
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sanitize_search_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    IF input_text IS NULL THEN
        RETURN '';
    END IF;
    -- Remove periods, hyphens, underscores, quotes, commas, colons
    RETURN LOWER(TRIM(REGEXP_REPLACE(input_text, '[.\-_,:;''"/\\()[\]]', '', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ------------------------------------------------------------------------------
-- TASK 15: BENGALI NORMALIZED SYNONYMS & KEYWORDS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS search_synonyms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    synonym_term VARCHAR(100) NOT NULL UNIQUE,
    canonical_term VARCHAR(100) NOT NULL,
    category_hint VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_synonyms_term ON search_synonyms(synonym_term);

-- Seed Essential Academic & Competitive Synonyms for Malda Students
INSERT INTO search_synonyms (synonym_term, canonical_term, category_hint)
VALUES
    ('ডব্লুবিসিএস', 'wbcs', 'wbcs-special'),
    ('ডব্লিউবিসিএস', 'wbcs', 'wbcs-special'),
    ('civil service', 'wbcs', 'wbcs-special'),
    ('সিভিল সার্ভিস', 'wbcs', 'wbcs-special'),
    ('ugb', 'ugb', 'college-university'),
    ('গৌড়বঙ্গ', 'ugb', 'college-university'),
    ('গৌড়বঙ্গ', 'ugb', 'college-university'),
    ('gour banga', 'ugb', 'college-university'),
    ('টেট', 'tet', 'primary-tet-slst'),
    ('primary tet', 'tet', 'primary-tet-slst'),
    ('slst', 'slst', 'primary-tet-slst'),
    ('স্কুল সার্ভিস', 'slst', 'primary-tet-slst'),
    ('ইতিহাস', 'history', NULL),
    ('itihas', 'history', NULL),
    ('ভূগোল', 'geography', NULL),
    ('bhugol', 'geography', NULL),
    ('পুলিশ', 'police', 'competitive-exams'),
    ('wb police', 'police', 'competitive-exams'),
    ('রেল', 'railway', 'competitive-exams'),
    ('railway', 'railway', 'competitive-exams'),
    ('ব্যোমকেশ', 'byomkesh', 'bengali-literature'),
    ('রবীন্দ্রনাথ', 'rabindranath', 'bengali-literature')
ON CONFLICT (synonym_term) DO UPDATE 
SET canonical_term = EXCLUDED.canonical_term,
    category_hint = EXCLUDED.category_hint;

-- ------------------------------------------------------------------------------
-- TASKS 12 & 13: ADVANCED TYPEAHEAD LIVE SEARCH RPC
-- With Word Similarity > 0.3, Levenshtein distance 1-2 char tolerance, and In-Stock priority
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_books_typeahead(
    search_query TEXT,
    target_category TEXT DEFAULT 'all',
    result_limit INT DEFAULT 6,
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
BEGIN
    clean_query := sanitize_search_text(search_query);

    IF LENGTH(clean_query) < 2 THEN
        RETURN;
    END IF;

    -- Look up canonical synonym if available
    SELECT s.canonical_term INTO canonical_query 
    FROM search_synonyms s 
    WHERE s.synonym_term = clean_query 
    LIMIT 1;

    IF canonical_query IS NULL THEN
        canonical_query := clean_query;
    END IF;

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
        LEFT JOIN book_variants bv ON b.id = bv.book_id AND bv.is_default = TRUE
        LEFT JOIN inventory inv ON bv.id = inv.variant_id
        WHERE 
            b.is_active = TRUE
            AND (target_category = 'all' OR c.slug = target_category OR target_category IS NULL)
            AND (
                -- Task 12: Word Similarity > 0.3 threshold
                word_similarity(clean_query, sanitize_search_text(b.title)) >= similarity_cutoff
                OR word_similarity(clean_query, sanitize_search_text(b.title_bn)) >= similarity_cutoff
                OR word_similarity(canonical_query, sanitize_search_text(b.title)) >= similarity_cutoff
                OR similarity(clean_query, sanitize_search_text(b.title)) >= similarity_cutoff
                -- Task 15: Keywords containment
                OR clean_query = ANY(b.keywords)
                OR canonical_query = ANY(b.keywords)
                -- Task 13: Levenshtein distance <= 2 for words >= 4 chars
                OR (
                    LENGTH(clean_query) >= 4 
                    AND LENGTH(b.title) <= 50 
                    AND levenshtein_less_equal(clean_query, SUBSTRING(sanitize_search_text(b.title) FROM 1 FOR LENGTH(clean_query)), 2) <= 2
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
        -- In-stock items receive higher weighting
        (bc.calc_similarity + CASE WHEN bc.b_in_stock THEN 0.2 ELSE -0.2 END) AS match_score
    FROM book_candidates bc
    ORDER BY match_score DESC, bc.b_in_stock DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;
