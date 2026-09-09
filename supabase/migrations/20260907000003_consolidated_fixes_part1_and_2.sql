-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Consolidated Fixes & Security Hardening (Parts 1 & 2 Audit Remediation)
-- Migration: 20260907000003_consolidated_fixes_part1_and_2.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- HELPER: ADMIN/STAFF ROLE CHECK FOR ROW LEVEL SECURITY
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'staff')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------------------------
-- 1. [CRITICAL 1] ROW LEVEL SECURITY (RLS) ACTIVATION & POLICIES
-- ------------------------------------------------------------------------------

-- 1.1 Publishers
ALTER TABLE publishers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Publishers are viewable by everyone" ON publishers;
CREATE POLICY "Publishers are viewable by everyone" 
    ON publishers FOR SELECT 
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Publishers modifiable by admin/staff only" ON publishers;
CREATE POLICY "Publishers modifiable by admin/staff only" 
    ON publishers FOR ALL 
    USING (public.is_admin_or_staff());

-- 1.2 Authors
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authors are viewable by everyone" ON authors;
CREATE POLICY "Authors are viewable by everyone" 
    ON authors FOR SELECT 
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Authors modifiable by admin/staff only" ON authors;
CREATE POLICY "Authors modifiable by admin/staff only" 
    ON authors FOR ALL 
    USING (public.is_admin_or_staff());

-- 1.3 Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories are viewable by everyone" 
    ON categories FOR SELECT 
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Categories modifiable by admin/staff only" ON categories;
CREATE POLICY "Categories modifiable by admin/staff only" 
    ON categories FOR ALL 
    USING (public.is_admin_or_staff());

-- 1.4 Books
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Books are viewable by everyone" ON books;
CREATE POLICY "Books are viewable by everyone" 
    ON books FOR SELECT 
    USING (is_active = TRUE AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Books modifiable by admin/staff only" ON books;
CREATE POLICY "Books modifiable by admin/staff only" 
    ON books FOR ALL 
    USING (public.is_admin_or_staff());

-- 1.5 Book Variants
ALTER TABLE book_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Book variants are viewable by everyone" ON book_variants;
CREATE POLICY "Book variants are viewable by everyone" 
    ON book_variants FOR SELECT 
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Book variants modifiable by admin/staff only" ON book_variants;
CREATE POLICY "Book variants modifiable by admin/staff only" 
    ON book_variants FOR ALL 
    USING (public.is_admin_or_staff());

-- 1.6 Book Authors
ALTER TABLE book_authors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Book authors viewable by everyone" ON book_authors;
CREATE POLICY "Book authors viewable by everyone" 
    ON book_authors FOR SELECT 
    USING (TRUE);

DROP POLICY IF EXISTS "Book authors modifiable by admin/staff only" ON book_authors;
CREATE POLICY "Book authors modifiable by admin/staff only" 
    ON book_authors FOR ALL 
    USING (public.is_admin_or_staff());

-- 1.7 Book Categories
ALTER TABLE book_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Book categories viewable by everyone" ON book_categories;
CREATE POLICY "Book categories viewable by everyone" 
    ON book_categories FOR SELECT 
    USING (TRUE);

DROP POLICY IF EXISTS "Book categories modifiable by admin/staff only" ON book_categories;
CREATE POLICY "Book categories modifiable by admin/staff only" 
    ON book_categories FOR ALL 
    USING (public.is_admin_or_staff());

-- 1.8 Profiles (Self read/update, Admin full access)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile or admin can view all" ON profiles;
CREATE POLICY "Users can view own profile or admin can view all" 
    ON profiles FOR SELECT 
    USING (auth.uid() = id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Users can update own profile or admin can update all" ON profiles;
CREATE POLICY "Users can update own profile or admin can update all" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Profiles insertable on signup or by admin" ON profiles;
CREATE POLICY "Profiles insertable on signup or by admin" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id OR public.is_admin_or_staff());

-- 1.9 Inventory & Reservations (Controlled via SECURITY DEFINER functions; Direct write blocked)
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inventory viewable by admin/staff only" ON inventory;
CREATE POLICY "Inventory viewable by admin/staff only" 
    ON inventory FOR SELECT 
    USING (public.is_admin_or_staff());

DROP POLICY IF EXISTS "Inventory modifiable by admin/staff only" ON inventory;
CREATE POLICY "Inventory modifiable by admin/staff only" 
    ON inventory FOR ALL 
    USING (public.is_admin_or_staff());

ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reservations viewable by owner or admin" ON inventory_reservations;
CREATE POLICY "Reservations viewable by owner or admin" 
    ON inventory_reservations FOR SELECT 
    USING (auth.uid() = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Reservations modifiable by admin only" ON inventory_reservations;
CREATE POLICY "Reservations modifiable by admin only" 
    ON inventory_reservations FOR ALL 
    USING (public.is_admin_or_staff());

-- ------------------------------------------------------------------------------
-- 2. [CRITICAL 2] IMMEDIATE STOCK RESERVATION RELEASE FUNCTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION release_stock_reservation(p_reservation_token UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_res inventory_reservations%ROWTYPE;
BEGIN
    SELECT * INTO v_res 
    FROM inventory_reservations 
    WHERE reservation_token = p_reservation_token 
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    IF v_res.status = 'active' THEN
        UPDATE inventory 
        SET reserved_quantity = GREATEST(0, reserved_quantity - v_res.quantity),
            updated_at = NOW()
        WHERE variant_id = v_res.variant_id;

        UPDATE inventory_reservations 
        SET status = 'released' 
        WHERE id = v_res.id;

        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION release_stock_reservation IS 'Instantly releases held stock when checkout is cancelled or payment fails';

-- ------------------------------------------------------------------------------
-- 3. [CRITICAL 3] LAZY CLEANUP IN RESERVE_STOCK & SECURITY DEFINER UPGRADE
-- ------------------------------------------------------------------------------
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
    -- Lazy cleanup of expired reservations before holding new stock
    PERFORM release_expired_reservations();

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security Definer upgrade for commit function
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security Definer upgrade for release expired function
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
        UPDATE inventory
        SET reserved_quantity = GREATEST(0, reserved_quantity - v_rec.quantity),
            updated_at = NOW()
        WHERE variant_id = v_rec.variant_id;

        UPDATE inventory_reservations
        SET status = 'expired'
        WHERE id = v_rec.id;

        v_released_count := v_released_count + 1;
    END LOOP;

    RETURN v_released_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 4. [HIGH 4] OPTIMIZE SEARCH_BOOKS (Filter-first & Threshold Enforcement)
-- ------------------------------------------------------------------------------
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
    -- Apply the similarity threshold dynamically
    PERFORM set_limit(similarity_threshold);

    RETURN QUERY
    WITH matched_books AS (
        SELECT 
            b.id AS matched_book_id,
            b.title AS m_title,
            b.title_bn AS m_title_bn,
            b.slug AS m_slug,
            b.publisher_id AS m_publisher_id,
            GREATEST(
                similarity(b.title, search_query),
                similarity(COALESCE(b.title_bn, ''), search_query)
            )::REAL AS sim_score
        FROM books b
        WHERE b.is_active = TRUE 
          AND b.deleted_at IS NULL
          AND (
              b.title % search_query
              OR b.title_bn % search_query
              OR search_query = ANY(b.keywords)
              OR b.title ILIKE ('%' || search_query || '%')
              OR b.title_bn ILIKE ('%' || search_query || '%')
          )
        ORDER BY sim_score DESC
        LIMIT result_limit
    ),
    matched_book_authors AS (
        SELECT 
            ba.book_id,
            STRING_AGG(COALESCE(a.name_bn, a.name), ', ' ORDER BY ba.display_order) AS authors_list
        FROM book_authors ba
        JOIN authors a ON ba.author_id = a.id
        WHERE ba.book_id IN (SELECT matched_book_id FROM matched_books)
        GROUP BY ba.book_id
    ),
    matched_book_prices AS (
        SELECT 
            bv.book_id,
            MIN(bv.selling_price) AS min_price,
            MAX(bv.mrp) AS max_mrp,
            MAX(bv.discount_percent) AS max_discount
        FROM book_variants bv
        WHERE bv.book_id IN (SELECT matched_book_id FROM matched_books)
          AND bv.is_active = TRUE
        GROUP BY bv.book_id
    )
    SELECT 
        mb.matched_book_id AS book_id,
        mb.m_title AS title,
        mb.m_title_bn AS title_bn,
        mb.m_slug AS slug,
        p.name AS publisher_name,
        COALESCE(mba.authors_list, '') AS author_names,
        COALESCE(mbp.min_price, 0.00) AS min_selling_price,
        COALESCE(mbp.max_mrp, 0.00) AS max_mrp,
        COALESCE(mbp.max_discount, 0.00) AS max_discount_percent,
        mb.sim_score AS similarity_score
    FROM matched_books mb
    LEFT JOIN publishers p ON mb.m_publisher_id = p.id
    LEFT JOIN matched_book_authors mba ON mb.matched_book_id = mba.book_id
    LEFT JOIN matched_book_prices mbp ON mb.matched_book_id = mbp.book_id
    ORDER BY mb.sim_score DESC, max_discount_percent DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ------------------------------------------------------------------------------
-- 5. [HIGH 5] UPDATE V_CATALOG_BOOKS VIEW (Author names, Cover image & Stock)
-- ------------------------------------------------------------------------------
DROP VIEW IF EXISTS v_catalog_books CASCADE;
CREATE OR REPLACE VIEW v_catalog_books AS
WITH author_agg AS (
    SELECT 
        ba.book_id,
        STRING_AGG(COALESCE(a.name_bn, a.name), ', ' ORDER BY ba.display_order) AS author_names
    FROM book_authors ba
    JOIN authors a ON ba.author_id = a.id
    GROUP BY ba.book_id
),
variant_stock_agg AS (
    SELECT 
        bv.book_id,
        MIN(bv.selling_price) AS min_price,
        MAX(bv.selling_price) AS max_price,
        MAX(bv.mrp) AS highest_mrp,
        MAX(bv.discount_percent) AS highest_discount_percent,
        BOOL_OR(bv.binding = 'paperback') AS has_paperback,
        BOOL_OR(bv.binding = 'hardcover') AS has_hardcover,
        BOOL_OR(bv.condition = 'used') AS has_used_copy,
        COUNT(bv.id) AS total_variants,
        COALESCE(SUM(inv.available_quantity), 0)::INT AS total_available_stock
    FROM book_variants bv
    LEFT JOIN inventory inv ON bv.id = inv.variant_id
    WHERE bv.is_active = TRUE
    GROUP BY bv.book_id
)
SELECT 
    b.id AS book_id,
    b.title,
    b.title_bn,
    b.slug,
    b.publisher_id,
    p.name AS publisher_name,
    p.name_bn AS publisher_name_bn,
    COALESCE(aa.author_names, '') AS author_names,
    COALESCE(b.preview_images->>0, '') AS cover_image_url,
    b.language,
    b.edition,
    b.published_year,
    b.preview_pdf_url,
    b.preview_images,
    b.table_of_contents,
    b.syllabus_importance,
    COALESCE(vsa.min_price, 0.00) AS min_price,
    COALESCE(vsa.max_price, 0.00) AS max_price,
    COALESCE(vsa.highest_mrp, 0.00) AS highest_mrp,
    COALESCE(vsa.highest_discount_percent, 0.00) AS highest_discount_percent,
    COALESCE(vsa.has_paperback, FALSE) AS has_paperback,
    COALESCE(vsa.has_hardcover, FALSE) AS has_hardcover,
    COALESCE(vsa.has_used_copy, FALSE) AS has_used_copy,
    COALESCE(vsa.total_variants, 0) AS total_variants,
    COALESCE(vsa.total_available_stock, 0) AS total_available_stock,
    (COALESCE(vsa.total_available_stock, 0) > 0) AS is_in_stock,
    b.created_at,
    b.updated_at
FROM books b
LEFT JOIN publishers p ON b.publisher_id = p.id
LEFT JOIN author_agg aa ON b.id = aa.book_id
LEFT JOIN variant_stock_agg vsa ON b.id = vsa.book_id
WHERE b.is_active = TRUE AND b.deleted_at IS NULL;

-- ------------------------------------------------------------------------------
-- 6. [HIGH 6] PROFILES EMAIL COLUMN & ENHANCED HANDLE_NEW_USER TRIGGER
-- ------------------------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        phone_number,
        avatar_url,
        preferred_language
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone_number'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'bn')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 7. [DATA INTEGRITY 7] PREVENT CATEGORY SELF-PARENTING
-- ------------------------------------------------------------------------------
ALTER TABLE categories DROP CONSTRAINT IF EXISTS chk_category_no_self_parent;
ALTER TABLE categories ADD CONSTRAINT chk_category_no_self_parent 
    CHECK (parent_id IS NULL OR parent_id != id);

-- ------------------------------------------------------------------------------
-- 8. [DATA INTEGRITY 8] SINGLE PRIMARY CATEGORY PER BOOK CONSTRAINT
-- ------------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_book_single_primary_category 
    ON book_categories (book_id) 
    WHERE is_primary = TRUE;

-- ------------------------------------------------------------------------------
-- 9. [OPTIMIZATION 9] DROP REDUNDANT COVERED INDEXES
-- ------------------------------------------------------------------------------
DROP INDEX IF EXISTS idx_book_authors_book_id;
DROP INDEX IF EXISTS idx_book_categories_book_id;

-- ------------------------------------------------------------------------------
-- 10. [AUTOMATION 10] AUTO-INITIALIZE INVENTORY ON NEW BOOK VARIANT
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_init_variant_inventory()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO inventory (variant_id, stock_quantity, reserved_quantity, low_stock_threshold)
    VALUES (NEW.id, 0, 0, 5)
    ON CONFLICT (variant_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_init_variant_inventory ON book_variants;
CREATE TRIGGER trigger_auto_init_variant_inventory
    AFTER INSERT ON book_variants
    FOR EACH ROW
    EXECUTE FUNCTION auto_init_variant_inventory();
