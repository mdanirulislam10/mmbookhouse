-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 5: Advanced Live Search & Typo-Tolerant Typeahead Search Engine
-- Division 4 (Tasks 16 to 20): Bilingual Search, Phonetics, Stopwords & Weighted Full-Text Vectors
-- Database Engine: Supabase (PostgreSQL 16)
-- Migration: 20260908000017_module5_bilingual_phonetics_and_weighted_search.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TASK 16 & 17: PHONETIC & TRANSLITERATION DICTIONARY EXPANSIONS
-- ------------------------------------------------------------------------------
INSERT INTO search_synonyms (synonym_term, canonical_term, category_hint)
VALUES
    -- Romanized Bengali subjects (Task 16)
    ('sahitya', 'sahitya', 'bengali-literature'),
    ('sahitto', 'sahitya', 'bengali-literature'),
    ('gonit', 'mathematics', 'school-college-exam'),
    ('ganit', 'mathematics', 'school-college-exam'),
    ('vugol', 'geography', NULL),
    ('upanyas', 'novel', 'bengali-literature'),
    ('golpo', 'story', 'bengali-literature'),
    ('kobita', 'poetry', 'bengali-literature'),
    ('byakaran', 'grammar', NULL),
    ('shiksha', 'education', NULL),
    ('dharapat', 'dharapat', 'primary-school'),
    ('barnaparichay', 'barnaparichay', 'primary-school'),

    -- Author Phonetic Families (Task 17)
    ('moitra', 'maitra', 'academic-authors'),
    ('mitra', 'maitra', 'academic-authors'),
    ('মৈত্র', 'maitra', 'academic-authors'),
    ('মিত্র', 'maitra', 'academic-authors'),
    ('bandyopadhyay', 'banerjee', 'academic-authors'),
    ('বন্দ্যোপাধ্যায়', 'banerjee', 'academic-authors'),
    ('ব্যানার্জি', 'banerjee', 'academic-authors'),
    ('mukhopadhyay', 'mukherjee', 'academic-authors'),
    ('মুখোপাধ্যায়', 'mukherjee', 'academic-authors'),
    ('মুখার্জি', 'mukherjee', 'academic-authors'),
    ('chattopadhyay', 'chatterjee', 'academic-authors'),
    ('চট্টোপাধ্যায়', 'chatterjee', 'academic-authors'),
    ('চ্যাটার্জি', 'chatterjee', 'academic-authors'),
    ('bhattacharjee', 'bhattacharya', 'academic-authors'),
    ('ভট্টাচার্য', 'bhattacharya', 'academic-authors'),
    ('ray', 'roy', 'academic-authors'),
    ('রায়', 'roy', 'academic-authors'),
    ('রায়', 'roy', 'academic-authors'),
    ('ghose', 'ghosh', 'academic-authors'),
    ('ঘোষ', 'ghosh', 'academic-authors'),
    ('shen', 'sen', 'academic-authors'),
    ('সেন', 'sen', 'academic-authors'),
    ('datta', 'dutta', 'academic-authors'),
    ('দত্ত', 'dutta', 'academic-authors'),
    ('chakravarty', 'chakraborty', 'academic-authors'),
    ('চক্রবর্তী', 'chakraborty', 'academic-authors'),
    ('dash', 'das', 'academic-authors'),
    ('দাশ', 'das', 'academic-authors'),
    ('দাস', 'das', 'academic-authors'),
    ('basu', 'bose', 'academic-authors'),
    ('বসু', 'bose', 'academic-authors'),
    ('বোস', 'bose', 'academic-authors')
ON CONFLICT (synonym_term) DO UPDATE 
SET canonical_term = EXCLUDED.canonical_term,
    category_hint = EXCLUDED.category_hint;

-- ------------------------------------------------------------------------------
-- TASK 19 & 20: UPGRADED TYPEAHEAD RPC WITH WEIGHTED FULL-TEXT SEARCH (setweight)
-- Weight A (1.0): Book Title (title & title_bn)
-- Weight B (0.7): Author Name (name & name_bn)
-- Weight C (0.4): Publisher Name & Keywords
-- Multi-word boolean AND with prefix scanning (:*)
-- ------------------------------------------------------------------------------
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
    ts_query_str TEXT;
BEGIN
    clean_query := sanitize_search_text(search_query);

    IF LENGTH(clean_query) < 2 THEN
        RETURN;
    END IF;

    -- Look up canonical synonym / transliterated term if available
    SELECT s.canonical_term INTO canonical_query 
    FROM search_synonyms s 
    WHERE s.synonym_term = clean_query 
    LIMIT 1;

    IF canonical_query IS NULL THEN
        canonical_query := clean_query;
    END IF;

    -- Build boolean multi-word prefix query for tsquery (Task 19)
    -- e.g. "ইতিহাস মৈত্র" -> "ইতিহাস:* & মৈত্র:*"
    SELECT string_agg(word || ':*', ' & ') INTO ts_query_str
    FROM unnest(string_to_array(clean_query, ' ')) AS word
    WHERE LENGTH(word) >= 2;

    IF ts_query_str IS NULL OR LENGTH(ts_query_str) = 0 THEN
        ts_query_str := clean_query || ':*';
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
            -- Task 20: Weighted Full-Text Search Vector
            -- Weight A: Title (1.0), Weight B: Author (0.7), Weight C: Publisher & Category (0.4)
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
        LEFT JOIN book_variants bv ON b.id = bv.book_id AND bv.is_default = TRUE
        LEFT JOIN inventory inv ON bv.id = inv.variant_id
        WHERE 
            b.is_active = TRUE
            AND (target_category = 'all' OR c.slug = target_category OR target_category IS NULL)
            AND (
                -- Task 19: Boolean Full-Text prefix match
                (
                    to_tsquery('simple', ts_query_str) @@ (
                        setweight(to_tsvector('simple', COALESCE(b.title, '')), 'A') ||
                        setweight(to_tsvector('simple', COALESCE(b.title_bn, '')), 'A') ||
                        setweight(to_tsvector('simple', COALESCE(a.name, '')), 'B') ||
                        setweight(to_tsvector('simple', COALESCE(a.name_bn, '')), 'B')
                    )
                )
                -- Task 12: Word Similarity > 0.3 threshold
                OR word_similarity(clean_query, sanitize_search_text(b.title)) >= similarity_cutoff
                OR word_similarity(clean_query, sanitize_search_text(b.title_bn)) >= similarity_cutoff
                OR word_similarity(canonical_query, sanitize_search_text(b.title)) >= similarity_cutoff
                OR similarity(clean_query, sanitize_search_text(b.title)) >= similarity_cutoff
                -- Task 15 & 16: Keywords & Synonyms containment
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
        -- Task 20: Weighted scoring formula combining text rank, similarity and stock status
        ROUND(
            (
                (COALESCE(ts_rank_cd('{0.1, 0.4, 0.7, 1.0}', bc.search_vector, to_tsquery('simple', ts_query_str)), 0.0) * 50.0) +
                (bc.calc_similarity * 40.0) +
                (CASE WHEN bc.b_in_stock THEN 15.0 ELSE -25.0 END)
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
