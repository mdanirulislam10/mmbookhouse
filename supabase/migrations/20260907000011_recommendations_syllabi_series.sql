-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Part 9 (Tasks 41 to 45): Recommendations, Semantic Search, Syllabi & Series
-- Database Engine: Supabase (PostgreSQL 16)
-- Migration: 20260907000011_recommendations_syllabi_series.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TASK 41: FREQUENTLY BOUGHT TOGETHER (FBT) CO-OCCURRENCE ENGINE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    associated_book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    co_occurrence_count INT NOT NULL DEFAULT 1 CHECK (co_occurrence_count >= 0),
    confidence_score NUMERIC(5, 4) DEFAULT 0.0000,
    association_type VARCHAR(50) NOT NULL DEFAULT 'bought_together' CHECK (
        association_type IN ('bought_together', 'viewed_together', 'curated_bundle')
    ),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_book_association UNIQUE(book_id, associated_book_id, association_type),
    CONSTRAINT chk_no_self_association CHECK (book_id <> associated_book_id)
);

COMMENT ON TABLE product_associations IS 'Co-occurrence matrix tracking books frequently bought or viewed together';

CREATE INDEX IF NOT EXISTS idx_product_associations_book 
    ON product_associations(book_id, association_type, co_occurrence_count DESC);
CREATE INDEX IF NOT EXISTS idx_product_associations_target 
    ON product_associations(associated_book_id);

-- Function: Automatically update book co-occurrences when an order is completed
CREATE OR REPLACE FUNCTION update_product_associations_from_order(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
    v_book_ids UUID[];
    v_b1 UUID;
    v_b2 UUID;
BEGIN
    -- Extract distinct books from the order
    SELECT ARRAY_AGG(DISTINCT b.id) INTO v_book_ids
    FROM order_items oi
    JOIN book_variants bv ON oi.variant_id = bv.id
    JOIN books b ON bv.book_id = b.id
    WHERE oi.order_id = p_order_id;

    IF v_book_ids IS NULL OR array_length(v_book_ids, 1) < 2 THEN
        RETURN;
    END IF;

    -- Pairwise increment co-occurrence count
    FOREACH v_b1 IN ARRAY v_book_ids
    LOOP
        FOREACH v_b2 IN ARRAY v_book_ids
        LOOP
            IF v_b1 <> v_b2 THEN
                INSERT INTO product_associations (
                    book_id, associated_book_id, co_occurrence_count, association_type, updated_at
                )
                VALUES (
                    v_b1, v_b2, 1, 'bought_together', NOW()
                )
                ON CONFLICT (book_id, associated_book_id, association_type)
                DO UPDATE SET
                    co_occurrence_count = product_associations.co_occurrence_count + 1,
                    updated_at = NOW();
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Fetch Top Frequently Bought Together books for storefront
CREATE OR REPLACE FUNCTION get_frequently_bought_together(
    p_book_id UUID,
    p_limit INT DEFAULT 3
)
RETURNS TABLE (
    associated_book_id UUID,
    title VARCHAR,
    title_bn VARCHAR,
    slug VARCHAR,
    cover_image_url TEXT,
    min_selling_price NUMERIC,
    co_occurrence_count INT,
    confidence_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pa.associated_book_id,
        b.title,
        b.title_bn,
        b.slug,
        (SELECT bv.cover_image_url FROM book_variants bv WHERE bv.book_id = b.id AND bv.is_active = TRUE ORDER BY bv.selling_price ASC LIMIT 1) AS cover_image_url,
        (SELECT MIN(bv.selling_price) FROM book_variants bv WHERE bv.book_id = b.id AND bv.is_active = TRUE) AS min_selling_price,
        pa.co_occurrence_count,
        pa.confidence_score
    FROM product_associations pa
    JOIN books b ON pa.associated_book_id = b.id
    WHERE pa.book_id = p_book_id
      AND pa.association_type = 'bought_together'
      AND b.is_active = TRUE
    ORDER BY pa.co_occurrence_count DESC, pa.confidence_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ------------------------------------------------------------------------------
-- TASK 42: PGVECTOR EXTENSION & 1536-DIM VECTOR EMBEDDING (SEMANTIC SEARCH)
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;

-- Add 1536-dimensional vector embedding column to books table (OpenAI / Gemini format)
ALTER TABLE books ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- High-speed Hierarchical Navigable Small World (HNSW) Index for Cosine Similarity
CREATE INDEX IF NOT EXISTS idx_books_embedding_hnsw 
    ON books USING hnsw (embedding vector_cosine_ops);

-- RPC Function: Semantic book search using cosine distance
CREATE OR REPLACE FUNCTION semantic_search_books(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    title_bn VARCHAR,
    slug VARCHAR,
    average_rating NUMERIC,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id,
        b.title,
        b.title_bn,
        b.slug,
        b.average_rating,
        (1 - (b.embedding <=> query_embedding))::FLOAT AS similarity
    FROM books b
    WHERE b.is_active = TRUE
      AND b.embedding IS NOT NULL
      AND (1 - (b.embedding <=> query_embedding)) >= match_threshold
    ORDER BY b.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION semantic_search_books IS 'AI Semantic book discovery matching contextual book queries using cosine vector distance';

-- ------------------------------------------------------------------------------
-- TASK 43: EXAM SYLLABI & TOPIC MAPPING
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_syllabi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    name_bn VARCHAR(255),
    slug VARCHAR(255) UNIQUE NOT NULL,
    exam_category VARCHAR(100) NOT NULL CHECK (
        exam_category IN ('civil_services', 'teaching', 'police', 'defence', 'railways', 'university_ug', 'university_pg', 'general')
    ),
    conducting_body VARCHAR(255) NOT NULL,
    syllabus_year INT NOT NULL DEFAULT 2026,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE exam_syllabi IS 'Competitive examination syllabi and West Bengal university curriculum catalogs';

CREATE TABLE IF NOT EXISTS syllabus_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    syllabus_id UUID NOT NULL REFERENCES exam_syllabi(id) ON DELETE CASCADE,
    paper_name VARCHAR(255) NOT NULL,
    paper_code VARCHAR(50),
    topic_name VARCHAR(255) NOT NULL,
    topic_name_bn VARCHAR(255),
    weightage_percentage NUMERIC(5, 2),
    display_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE syllabus_topics IS 'Granular exam papers and subject topics within an exam syllabus';

CREATE INDEX IF NOT EXISTS idx_syllabus_topics_syllabus ON syllabus_topics(syllabus_id);

CREATE TABLE IF NOT EXISTS book_syllabus_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    syllabus_id UUID NOT NULL REFERENCES exam_syllabi(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES syllabus_topics(id) ON DELETE SET NULL,
    relevance_score VARCHAR(50) NOT NULL DEFAULT 'core_text' CHECK (
        relevance_score IN ('core_text', 'reference_book', 'practice_mcq', 'previous_years')
    ),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_book_syllabus_topic UNIQUE(book_id, syllabus_id, topic_id)
);

COMMENT ON TABLE book_syllabus_mappings IS 'Junction mapping connecting textbooks and reference guides directly to exam syllabus topics';

CREATE INDEX IF NOT EXISTS idx_book_syllabus_mappings_book ON book_syllabus_mappings(book_id);
CREATE INDEX IF NOT EXISTS idx_book_syllabus_mappings_topic ON book_syllabus_mappings(syllabus_id, topic_id);

-- ------------------------------------------------------------------------------
-- TASK 44: EXTENDED AUTHOR PROFILES & AUTHOR FOLLOWERS SYSTEM
-- ------------------------------------------------------------------------------
ALTER TABLE authors ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS awards TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE authors ADD COLUMN IF NOT EXISTS birth_year INT;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS death_year INT;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS notable_works TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE authors ADD COLUMN IF NOT EXISTS followers_count INT NOT NULL DEFAULT 0 CHECK (followers_count >= 0);

CREATE TABLE IF NOT EXISTS author_followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    notify_on_new_book BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_author_follower UNIQUE(user_id, author_id)
);

COMMENT ON TABLE author_followers IS 'Customer subscriptions to follow authors for new edition and release notifications';

CREATE INDEX IF NOT EXISTS idx_author_followers_author ON author_followers(author_id);
CREATE INDEX IF NOT EXISTS idx_author_followers_user ON author_followers(user_id);

-- Trigger: Synchronize author followers count
CREATE OR REPLACE FUNCTION sync_author_followers_count()
RETURNS TRIGGER AS $$
DECLARE
    v_auth_id UUID;
    v_count INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_auth_id := OLD.author_id;
    ELSE
        v_auth_id := NEW.author_id;
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM author_followers
    WHERE author_id = v_auth_id;

    UPDATE authors
    SET followers_count = v_count,
        updated_at = NOW()
    WHERE id = v_auth_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_author_followers_count ON author_followers;
CREATE TRIGGER trigger_sync_author_followers_count
    AFTER INSERT OR DELETE ON author_followers
    FOR EACH ROW
    EXECUTE FUNCTION sync_author_followers_count();

-- ------------------------------------------------------------------------------
-- TASK 45: MULTI-VOLUME BOOK SERIES & BOXED SETS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS book_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    title_bn VARCHAR(255),
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    total_volumes INT NOT NULL DEFAULT 1 CHECK (total_volumes >= 1),
    is_completed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE book_series IS 'Master catalog for multi-part novels, trilogies, and multi-volume reference books';

-- Extend books table with series relation and volume sequencing
ALTER TABLE books ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES book_series(id) ON DELETE SET NULL;
ALTER TABLE books ADD COLUMN IF NOT EXISTS volume_number NUMERIC(4, 1);
ALTER TABLE books ADD COLUMN IF NOT EXISTS box_set_discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00 
    CHECK (box_set_discount_percentage >= 0.00 AND box_set_discount_percentage <= 100.00);

CREATE INDEX IF NOT EXISTS idx_books_series_volume ON books(series_id, volume_number);

-- RPC Function: Get complete series volumes in sequence
CREATE OR REPLACE FUNCTION get_series_books(p_series_id UUID)
RETURNS TABLE (
    book_id UUID,
    title VARCHAR,
    title_bn VARCHAR,
    slug VARCHAR,
    volume_number NUMERIC,
    cover_image_url TEXT,
    min_selling_price NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id AS book_id,
        b.title,
        b.title_bn,
        b.slug,
        b.volume_number,
        (SELECT bv.cover_image_url FROM book_variants bv WHERE bv.book_id = b.id AND bv.is_active = TRUE ORDER BY bv.selling_price ASC LIMIT 1) AS cover_image_url,
        (SELECT MIN(bv.selling_price) FROM book_variants bv WHERE bv.book_id = b.id AND bv.is_active = TRUE) AS min_selling_price
    FROM books b
    WHERE b.series_id = p_series_id
      AND b.is_active = TRUE
    ORDER BY b.volume_number ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- ------------------------------------------------------------------------------
-- RLS POLICIES FOR PART 9 TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE product_associations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Product associations viewable by everyone" ON product_associations;
CREATE POLICY "Product associations viewable by everyone" 
    ON product_associations FOR SELECT 
    USING (TRUE);

DROP POLICY IF EXISTS "Product associations modifiable by admin only" ON product_associations;
CREATE POLICY "Product associations modifiable by admin only" 
    ON product_associations FOR ALL 
    USING (public.is_admin_or_staff());

ALTER TABLE exam_syllabi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active syllabi viewable by everyone" ON exam_syllabi;
CREATE POLICY "Active syllabi viewable by everyone" 
    ON exam_syllabi FOR SELECT 
    USING (is_active = TRUE OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Syllabi modifiable by admin only" ON exam_syllabi;
CREATE POLICY "Syllabi modifiable by admin only" 
    ON exam_syllabi FOR ALL 
    USING (public.is_admin_or_staff());

ALTER TABLE syllabus_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Syllabus topics viewable by everyone" ON syllabus_topics;
CREATE POLICY "Syllabus topics viewable by everyone" 
    ON syllabus_topics FOR SELECT 
    USING (TRUE);

DROP POLICY IF EXISTS "Syllabus topics modifiable by admin only" ON syllabus_topics;
CREATE POLICY "Syllabus topics modifiable by admin only" 
    ON syllabus_topics FOR ALL 
    USING (public.is_admin_or_staff());

ALTER TABLE book_syllabus_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Syllabus mappings viewable by everyone" ON book_syllabus_mappings;
CREATE POLICY "Syllabus mappings viewable by everyone" 
    ON book_syllabus_mappings FOR SELECT 
    USING (TRUE);

DROP POLICY IF EXISTS "Syllabus mappings modifiable by admin only" ON book_syllabus_mappings;
CREATE POLICY "Syllabus mappings modifiable by admin only" 
    ON book_syllabus_mappings FOR ALL 
    USING (public.is_admin_or_staff());

ALTER TABLE author_followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own author follows" ON author_followers;
CREATE POLICY "Users can view own author follows" 
    ON author_followers FOR SELECT 
    USING (auth.uid() = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Users can follow or unfollow authors" ON author_followers;
CREATE POLICY "Users can follow or unfollow authors" 
    ON author_followers FOR ALL 
    USING (auth.uid() = user_id OR public.is_admin_or_staff())
    WITH CHECK (auth.uid() = user_id OR public.is_admin_or_staff());

ALTER TABLE book_series ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Book series viewable by everyone" ON book_series;
CREATE POLICY "Book series viewable by everyone" 
    ON book_series FOR SELECT 
    USING (TRUE);

DROP POLICY IF EXISTS "Book series modifiable by admin only" ON book_series;
CREATE POLICY "Book series modifiable by admin only" 
    ON book_series FOR ALL 
    USING (public.is_admin_or_staff());
