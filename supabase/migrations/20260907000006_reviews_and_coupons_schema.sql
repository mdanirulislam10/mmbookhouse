-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Part 4 (Tasks 16 to 20): Reviews, Coupons, RLS Hierarchy & Indexing
-- Database Engine: Supabase (PostgreSQL 16)
-- Migration: 20260907000006_reviews_and_coupons_schema.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TASK 16: BOOKS STATS EXTENSION & REVIEWS TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE books ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3, 2) NOT NULL DEFAULT 0.00 CHECK (average_rating >= 0 AND average_rating <= 5);
ALTER TABLE books ADD COLUMN IF NOT EXISTS reviews_count INT NOT NULL DEFAULT 0 CHECK (reviews_count >= 0);

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(255),
    comment TEXT,
    is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
    is_approved BOOLEAN NOT NULL DEFAULT TRUE,
    helpful_votes_count INT NOT NULL DEFAULT 0 CHECK (helpful_votes_count >= 0),
    review_images JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_book_user_review UNIQUE (book_id, user_id)
);

COMMENT ON TABLE reviews IS 'Customer reviews and star ratings with verified buyer status and moderation';

CREATE TRIGGER trigger_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-check verified buyer status from delivered orders
CREATE OR REPLACE FUNCTION set_verified_purchase_status()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN book_variants bv ON oi.variant_id = bv.id
        WHERE o.user_id = NEW.user_id 
          AND bv.book_id = NEW.book_id 
          AND o.status = 'delivered'
    ) THEN
        NEW.is_verified_purchase := TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_verified_purchase ON reviews;
CREATE TRIGGER trigger_set_verified_purchase
    BEFORE INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION set_verified_purchase_status();

-- Sync average rating and reviews count on books table
CREATE OR REPLACE FUNCTION sync_book_review_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_target_book_id UUID;
    v_avg NUMERIC(3, 2);
    v_count INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_target_book_id := OLD.book_id;
    ELSE
        v_target_book_id := NEW.book_id;
    END IF;

    SELECT 
        COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0.00),
        COUNT(*)
    INTO v_avg, v_count
    FROM reviews
    WHERE book_id = v_target_book_id AND is_approved = TRUE;

    UPDATE books
    SET average_rating = v_avg,
        reviews_count = v_count,
        updated_at = NOW()
    WHERE id = v_target_book_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_book_review_stats ON reviews;
CREATE TRIGGER trigger_sync_book_review_stats
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION sync_book_review_stats();

-- ------------------------------------------------------------------------------
-- TASK 17: COUPONS & COUPON USAGES ENGINE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    max_discount_amount NUMERIC(10, 2),
    min_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (min_order_amount >= 0),
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    usage_limit_total INT,
    usage_limit_per_user INT NOT NULL DEFAULT 1 CHECK (usage_limit_per_user > 0),
    times_used INT NOT NULL DEFAULT 0 CHECK (times_used >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE coupons IS 'Promotional discount coupons with percentage or flat rate rules and usage caps';

CREATE TRIGGER trigger_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS coupon_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    discount_applied NUMERIC(10, 2) NOT NULL CHECK (discount_applied >= 0),
    used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_coupon_order UNIQUE (coupon_id, order_id)
);

COMMENT ON TABLE coupon_usages IS 'Tracks each coupon redemption per customer and order to prevent limit bypass';

-- Function: Validate and Apply Coupon
CREATE OR REPLACE FUNCTION validate_and_apply_coupon(
    p_coupon_code VARCHAR,
    p_user_id UUID,
    p_order_subtotal NUMERIC
)
RETURNS JSONB AS $$
DECLARE
    v_coupon coupons%ROWTYPE;
    v_user_uses INT := 0;
    v_discount NUMERIC(10, 2) := 0.00;
BEGIN
    SELECT * INTO v_coupon
    FROM coupons
    WHERE UPPER(code) = UPPER(TRIM(p_coupon_code));

    IF NOT FOUND THEN
        RETURN jsonb_build_object('is_valid', false, 'message', 'Invalid coupon code');
    END IF;

    IF v_coupon.is_active = FALSE THEN
        RETURN jsonb_build_object('is_valid', false, 'message', 'This coupon is no longer active');
    END IF;

    IF v_coupon.valid_from > NOW() THEN
        RETURN jsonb_build_object('is_valid', false, 'message', 'This coupon is not valid yet');
    END IF;

    IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < NOW() THEN
        RETURN jsonb_build_object('is_valid', false, 'message', 'This coupon has expired');
    END IF;

    IF p_order_subtotal < v_coupon.min_order_amount THEN
        RETURN jsonb_build_object(
            'is_valid', false, 
            'message', 'Minimum order amount for this coupon is ₹' || v_coupon.min_order_amount
        );
    END IF;

    IF v_coupon.usage_limit_total IS NOT NULL AND v_coupon.times_used >= v_coupon.usage_limit_total THEN
        RETURN jsonb_build_object('is_valid', false, 'message', 'Coupon total usage limit reached');
    END IF;

    -- Check per-user limit
    SELECT COUNT(*) INTO v_user_uses
    FROM coupon_usages
    WHERE coupon_id = v_coupon.id AND user_id = p_user_id;

    IF v_user_uses >= v_coupon.usage_limit_per_user THEN
        RETURN jsonb_build_object('is_valid', false, 'message', 'You have already used this coupon maximum allowed times');
    END IF;

    -- Calculate Discount Amount
    IF v_coupon.discount_type = 'percentage' THEN
        v_discount := ROUND((p_order_subtotal * (v_coupon.discount_value / 100.0)), 2);
        IF v_coupon.max_discount_amount IS NOT NULL AND v_discount > v_coupon.max_discount_amount THEN
            v_discount := v_coupon.max_discount_amount;
        END IF;
    ELSE
        v_discount := LEAST(v_coupon.discount_value, p_order_subtotal);
    END IF;

    RETURN jsonb_build_object(
        'is_valid', true,
        'coupon_id', v_coupon.id,
        'code', v_coupon.code,
        'discount_type', v_coupon.discount_type,
        'discount_amount', v_discount,
        'message', 'Coupon applied successfully! You saved ₹' || v_discount
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- TASK 18: ROW LEVEL SECURITY (RLS) POLICIES FOR REVIEWS & COUPONS
-- ------------------------------------------------------------------------------

-- 1. Reviews RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved reviews are viewable by everyone" ON reviews;
CREATE POLICY "Approved reviews are viewable by everyone" 
    ON reviews FOR SELECT 
    USING (is_approved = TRUE OR auth.uid() = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Customers can insert their own reviews" ON reviews;
CREATE POLICY "Customers can insert their own reviews" 
    ON reviews FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Customers can update their own reviews" ON reviews;
CREATE POLICY "Customers can update their own reviews" 
    ON reviews FOR UPDATE 
    USING (auth.uid() = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Reviews deletable by author or admin" ON reviews;
CREATE POLICY "Reviews deletable by author or admin" 
    ON reviews FOR DELETE 
    USING (auth.uid() = user_id OR public.is_admin_or_staff());

-- 2. Coupons RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active coupons are viewable by public" ON coupons;
CREATE POLICY "Active coupons are viewable by public" 
    ON coupons FOR SELECT 
    USING (is_active = TRUE OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Coupons modifiable by admin/staff only" ON coupons;
CREATE POLICY "Coupons modifiable by admin/staff only" 
    ON coupons FOR ALL 
    USING (public.is_admin_or_staff());

-- 3. Coupon Usages RLS
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own coupon usages" ON coupon_usages;
CREATE POLICY "Users can view own coupon usages" 
    ON coupon_usages FOR SELECT 
    USING (auth.uid() = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Coupon usages insertable by user or admin" ON coupon_usages;
CREATE POLICY "Coupon usages insertable by user or admin" 
    ON coupon_usages FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Coupon usages modifiable by admin only" ON coupon_usages;
CREATE POLICY "Coupon usages modifiable by admin only" 
    ON coupon_usages FOR ALL 
    USING (public.is_admin_or_staff());

-- ------------------------------------------------------------------------------
-- TASK 19: STRATEGIC COMPOSITE & B-TREE INDEXING
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_reviews_book_approved ON reviews (book_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews (rating);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons (code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons (is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user_coupon ON coupon_usages (user_id, coupon_id);
CREATE INDEX IF NOT EXISTS idx_books_rating_reviews ON books (average_rating DESC, reviews_count DESC);
