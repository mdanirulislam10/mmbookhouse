-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Part 2 (Tasks 6 to 10): Search, Pricing, Preview, Stock Lock & User Profile
-- Database Engine: Supabase (PostgreSQL 16)
-- Migration: 20260907000002_search_pricing_inventory_profile.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TASK 6: BILINGUAL SEARCH & PG_TRGM EXTENSION
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add search keywords and table of contents to books if not already present
ALTER TABLE books ADD COLUMN IF NOT EXISTS keywords TEXT[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE books ADD COLUMN IF NOT EXISTS table_of_contents JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Trigram GIN Indexes for high-speed typo-tolerant search across English & Bengali
CREATE INDEX IF NOT EXISTS idx_books_title_trgm ON books USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_books_title_bn_trgm ON books USING gin (title_bn gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_books_keywords ON books USING gin (keywords);
CREATE INDEX IF NOT EXISTS idx_authors_name_trgm ON authors USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_authors_name_bn_trgm ON authors USING gin (name_bn gin_trgm_ops);

-- Stored Function for Typo-Tolerant Unified Bilingual Search
CREATE OR REPLACE FUNCTION search_books(
    search_query TEXT,
    similarity_threshold REAL DEFAULT 0.2,
    result_limit INT DEFAULT 20
)
RETURNS TABLE (
    book_id UUID,
    title VARCHAR,
    title_bn VARCHAR,
    slug VARCHAR,
    publisher_name VARCHAR,
    author_names TEXT,
    min_selling_price NUMERIC,
    max_mrp NUMERIC,
    max_discount_percent NUMERIC,
    similarity_score REAL
) AS $$
BEGIN
    RETURN QUERY
    WITH book_author_agg AS (
        SELECT 
            ba.book_id,
            STRING_AGG(COALESCE(a.name_bn, a.name), ', ' ORDER BY ba.display_order) AS authors_list
        FROM book_authors ba
        JOIN authors a ON ba.author_id = a.id
        GROUP BY ba.book_id
    ),
    book_price_agg AS (
        SELECT 
            bv.book_id,
            MIN(bv.selling_price) AS min_price,
            MAX(bv.mrp) AS max_mrp,
            MAX(bv.discount_percent) AS max_discount
        FROM book_variants bv
        WHERE bv.is_active = TRUE
        GROUP BY bv.book_id
    )
    SELECT 
        b.id AS book_id,
        b.title,
        b.title_bn,
        b.slug,
        p.name AS publisher_name,
        COALESCE(bagg.authors_list, '') AS author_names,
        COALESCE(bp.min_price, 0.00) AS min_selling_price,
        COALESCE(bp.max_mrp, 0.00) AS max_mrp,
        COALESCE(bp.max_discount, 0.00) AS max_discount_percent,
        GREATEST(
            similarity(b.title, search_query),
            similarity(COALESCE(b.title_bn, ''), search_query),
            similarity(COALESCE(bagg.authors_list, ''), search_query)
        )::REAL AS similarity_score
    FROM books b
    LEFT JOIN publishers p ON b.publisher_id = p.id
    LEFT JOIN book_author_agg bagg ON b.id = bagg.book_id
    LEFT JOIN book_price_agg bp ON b.id = bp.book_id
    WHERE b.is_active = TRUE 
      AND b.deleted_at IS NULL
      AND (
          b.title % search_query
          OR b.title_bn % search_query
          OR bagg.authors_list % search_query
          OR search_query = ANY(b.keywords)
          OR b.title ILIKE ('%' || search_query || '%')
          OR b.title_bn ILIKE ('%' || search_query || '%')
          OR bagg.authors_list ILIKE ('%' || search_query || '%')
      )
    ORDER BY similarity_score DESC, bp.max_discount DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_books IS 'Unified typo-tolerant search across English/Bengali titles, authors, and keywords';

-- ------------------------------------------------------------------------------
-- TASK 7: PRICING & DISCOUNT FACETED FILTERING VIEW & COMPOSITE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_book_variants_pricing_filter 
    ON book_variants (selling_price, discount_percent) 
    WHERE is_active = TRUE;

-- Optimized view for catalog browsing and price range aggregations
CREATE OR REPLACE VIEW v_catalog_books AS
SELECT 
    b.id AS book_id,
    b.title,
    b.title_bn,
    b.slug,
    b.publisher_id,
    p.name AS publisher_name,
    p.name_bn AS publisher_name_bn,
    b.language,
    b.edition,
    b.published_year,
    b.preview_pdf_url,
    b.preview_images,
    b.table_of_contents,
    b.syllabus_importance,
    MIN(bv.selling_price) AS min_price,
    MAX(bv.selling_price) AS max_price,
    MAX(bv.mrp) AS highest_mrp,
    MAX(bv.discount_percent) AS highest_discount_percent,
    BOOL_OR(bv.binding = 'paperback') AS has_paperback,
    BOOL_OR(bv.binding = 'hardcover') AS has_hardcover,
    BOOL_OR(bv.condition = 'used') AS has_used_copy,
    COUNT(bv.id) AS total_variants,
    b.created_at,
    b.updated_at
FROM books b
LEFT JOIN publishers p ON b.publisher_id = p.id
LEFT JOIN book_variants bv ON b.id = bv.book_id AND bv.is_active = TRUE
WHERE b.is_active = TRUE AND b.deleted_at IS NULL
GROUP BY b.id, p.id;

COMMENT ON VIEW v_catalog_books IS 'Aggregated catalog view providing real-time pricing range and binding variants';

-- ------------------------------------------------------------------------------
-- TASK 8: LOOK INSIDE & TABLE OF CONTENTS PREVIEW HELPER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_book_preview(p_book_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'book_id', b.id,
        'title', b.title,
        'title_bn', b.title_bn,
        'preview_pdf_url', b.preview_pdf_url,
        'preview_images', b.preview_images,
        'table_of_contents', b.table_of_contents,
        'syllabus_importance', b.syllabus_importance
    ) INTO v_result
    FROM books b
    WHERE b.id = p_book_id AND b.is_active = TRUE AND b.deleted_at IS NULL;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_book_preview IS 'Fetches preview images, PDF sample link, and structured table of contents for Amazon Look Inside';

-- ------------------------------------------------------------------------------
-- TASK 9: TWO-PHASE INVENTORY RESERVATION ENGINE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES book_variants(id) ON DELETE CASCADE,
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    available_quantity INT GENERATED ALWAYS AS (stock_quantity - reserved_quantity) STORED,
    low_stock_threshold INT NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_inventory_variant UNIQUE (variant_id),
    CONSTRAINT chk_stock_ge_reserved CHECK (stock_quantity >= reserved_quantity)
);

COMMENT ON TABLE inventory IS 'Real-time inventory table with auto-calculated available quantity and threshold alerts';

CREATE TRIGGER trigger_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Temporary checkout reservations table (10-minute TTL)
CREATE TABLE IF NOT EXISTS inventory_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    variant_id UUID NOT NULL REFERENCES book_variants(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    user_id UUID,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'committed', 'released', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE inventory_reservations IS 'Holds stock for customers during checkout session to prevent overselling';

CREATE INDEX IF NOT EXISTS idx_reservations_token ON inventory_reservations (reservation_token);
CREATE INDEX IF NOT EXISTS idx_reservations_expiry ON inventory_reservations (expires_at) WHERE status = 'active';

-- Function 1: Reserve Stock (Concurrency-Safe using SELECT ... FOR UPDATE)
CREATE OR REPLACE FUNCTION reserve_stock(
    p_variant_id UUID,
    p_quantity INT,
    p_user_id UUID DEFAULT NULL,
    p_duration_minutes INT DEFAULT 10
)
RETURNS UUID AS $$
DECLARE
    v_inventory inventory%ROWTYPE;
    v_token UUID;
BEGIN
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be greater than zero';
    END IF;

    -- Row-level lock on inventory to prevent race conditions
    SELECT * INTO v_inventory
    FROM inventory
    WHERE variant_id = p_variant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inventory record for variant % not found', p_variant_id;
    END IF;

    -- Check if sufficient stock is available
    IF (v_inventory.stock_quantity - v_inventory.reserved_quantity) < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', 
            (v_inventory.stock_quantity - v_inventory.reserved_quantity), p_quantity;
    END IF;

    -- Increment reserved quantity
    UPDATE inventory
    SET reserved_quantity = reserved_quantity + p_quantity,
        updated_at = NOW()
    WHERE variant_id = p_variant_id;

    -- Create reservation record
    v_token := gen_random_uuid();
    INSERT INTO inventory_reservations (
        reservation_token,
        variant_id,
        quantity,
        user_id,
        expires_at,
        status
    )
    VALUES (
        v_token,
        p_variant_id,
        p_quantity,
        p_user_id,
        NOW() + (p_duration_minutes || ' minutes')::INTERVAL,
        'active'
    );

    RETURN v_token;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Commit Stock Reservation (When Payment / Order is Successful)
CREATE OR REPLACE FUNCTION commit_stock_reservation(p_reservation_token UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_res inventory_reservations%ROWTYPE;
BEGIN
    SELECT * INTO v_res
    FROM inventory_reservations
    WHERE reservation_token = p_reservation_token
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reservation % not found', p_reservation_token;
    END IF;

    IF v_res.status != 'active' THEN
        RAISE EXCEPTION 'Reservation is not active (current status: %)', v_res.status;
    END IF;

    -- Lock inventory and deduct stock permanently
    UPDATE inventory
    SET stock_quantity = stock_quantity - v_res.quantity,
        reserved_quantity = reserved_quantity - v_res.quantity,
        updated_at = NOW()
    WHERE variant_id = v_res.variant_id;

    -- Mark reservation as committed
    UPDATE inventory_reservations
    SET status = 'committed'
    WHERE id = v_res.id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function 3: Release Expired Reservations (Cron or trigger-invoked clean-up)
CREATE OR REPLACE FUNCTION release_expired_reservations()
RETURNS INT AS $$
DECLARE
    v_rec RECORD;
    v_released_count INT := 0;
BEGIN
    FOR v_rec IN 
        SELECT id, variant_id, quantity 
        FROM inventory_reservations
        WHERE status = 'active' AND expires_at < NOW()
        FOR UPDATE SKIP LOCKED
    LOOP
        -- Release reserved stock in inventory
        UPDATE inventory
        SET reserved_quantity = GREATEST(0, reserved_quantity - v_rec.quantity),
            updated_at = NOW()
        WHERE variant_id = v_rec.variant_id;

        -- Update reservation status
        UPDATE inventory_reservations
        SET status = 'expired'
        WHERE id = v_rec.id;

        v_released_count := v_released_count + 1;
    END LOOP;

    RETURN v_released_count;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- TASK 10: SUPABASE AUTH INTEGRATION & PROFILES SCHEMA
-- ------------------------------------------------------------------------------
-- Ensure compatibility with standalone postgres and Supabase environments
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    full_name VARCHAR(255),
    full_name_bn VARCHAR(255),
    phone_number VARCHAR(20) UNIQUE,
    avatar_url TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff', 'delivery_partner')),
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'bn' CHECK (preferred_language IN ('bn', 'en')),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Customer and staff profiles linked to Supabase authentication';

CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-sync trigger function for Supabase auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        phone_number,
        avatar_url,
        preferred_language
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone_number'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'bn')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Connect trigger if auth schema exists (Supabase Cloud standard)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
    ) THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;
