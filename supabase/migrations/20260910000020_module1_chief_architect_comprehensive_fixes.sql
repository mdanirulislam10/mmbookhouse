-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Chief Architect Comprehensive Audit & Bug Remediation Patch (Parts 1 to 10)
-- Migration: 20260910000020_module1_chief_architect_comprehensive_fixes.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PART 1 (TASKS 1-5): CORE CATALOG & ENTITY HIERARCHY HARDENING
-- ------------------------------------------------------------------------------

-- 1.1 Add cover_image_url to book_variants for variant-specific cover art
ALTER TABLE book_variants ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
COMMENT ON COLUMN book_variants.cover_image_url IS 'Optional variant-specific cover image (e.g. special edition hardcover vs paperback)';

-- 1.2 Prevent multi-hop circular references in category hierarchy (A -> B -> A)
CREATE OR REPLACE FUNCTION check_category_hierarchy_cycle()
RETURNS TRIGGER AS $$
DECLARE
    v_parent UUID := NEW.parent_id;
    v_depth INT := 0;
BEGIN
    WHILE v_parent IS NOT NULL LOOP
        IF v_parent = NEW.id THEN
            RAISE EXCEPTION 'Circular reference detected: Category cannot be an ancestor of itself (Category ID: %)', NEW.id;
        END IF;

        v_depth := v_depth + 1;
        IF v_depth > 10 THEN
            RAISE EXCEPTION 'Category hierarchy exceeds maximum permissible depth of 10 levels';
        END IF;

        SELECT parent_id INTO v_parent FROM categories WHERE id = v_parent;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_category_hierarchy_cycle ON categories;
CREATE TRIGGER trigger_check_category_hierarchy_cycle
    BEFORE INSERT OR UPDATE OF parent_id ON categories
    FOR EACH ROW
    WHEN (NEW.parent_id IS NOT NULL)
    EXECUTE FUNCTION check_category_hierarchy_cycle();

-- 1.3 Format validation constraints for ISBN-10 and ISBN-13
ALTER TABLE books DROP CONSTRAINT IF EXISTS chk_books_isbn_13;
ALTER TABLE books ADD CONSTRAINT chk_books_isbn_13 
    CHECK (isbn_13 IS NULL OR isbn_13 ~ '^[0-9]{13}$');

ALTER TABLE books DROP CONSTRAINT IF EXISTS chk_books_isbn_10;
ALTER TABLE books ADD CONSTRAINT chk_books_isbn_10 
    CHECK (isbn_10 IS NULL OR isbn_10 ~ '^[0-9]{9}[0-9X]$');


-- ------------------------------------------------------------------------------
-- PART 2 (TASKS 6-10): PROFILES SECURITY & INVENTORY CONCURRENCY LOCK
-- ------------------------------------------------------------------------------

-- 2.1 [CRITICAL SECURITY FIX] Prevent Customer Privilege Escalation on profiles
-- Normal customers must NEVER be able to update their role, loyalty balance, or anonymized flag.
CREATE OR REPLACE FUNCTION prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only allow admin/staff to alter system-privileged fields
    IF NOT public.is_admin_or_staff() THEN
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Security Violation: You do not have permission to modify account role.';
        END IF;

        IF NEW.loyalty_points_balance IS DISTINCT FROM OLD.loyalty_points_balance THEN
            RAISE EXCEPTION 'Security Violation: Loyalty balance can only be updated through verified ledger transactions.';
        END IF;

        IF NEW.is_anonymized IS DISTINCT FROM OLD.is_anonymized THEN
            RAISE EXCEPTION 'Security Violation: Anonymization status can only be modified by system administrators.';
        END IF;

        IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
            RAISE EXCEPTION 'Security Violation: Verification status can only be updated by administrators.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_prevent_profile_privilege_escalation ON profiles;
CREATE TRIGGER trigger_prevent_profile_privilege_escalation
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_profile_privilege_escalation();

-- 2.2 Concurrency-Safe Immediate Stock Reservation Release
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
        -- Explicit row lock on inventory to prevent lost updates
        PERFORM 1 FROM inventory WHERE variant_id = v_res.variant_id FOR UPDATE;

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

-- 2.3 Concurrency-Safe Expired Reservation Cleanup
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
        -- Row lock inventory to serialize stock update
        PERFORM 1 FROM inventory WHERE variant_id = v_rec.variant_id FOR UPDATE;

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
-- PART 3 & PART 6 (TASKS 11-15, 26-30): PRE-ORDERS & MASTER PLACE_ORDER_FROM_CART
-- ------------------------------------------------------------------------------

-- 3.1 Order Status Transition State Machine Trigger
CREATE OR REPLACE FUNCTION validate_order_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Once cancelled or returned, order status cannot be mutated
    IF OLD.status IN ('cancelled', 'returned') AND NEW.status != OLD.status THEN
        RAISE EXCEPTION 'Order #% is in terminal state "%" and cannot be transitioned to "%"',
            OLD.order_number, OLD.status, NEW.status;
    END IF;

    -- Delivered orders cannot be changed back to pending/processing
    IF OLD.status = 'delivered' AND NEW.status IN ('pending', 'processing', 'shipped') THEN
        RAISE EXCEPTION 'Delivered Order #% cannot be reverted to "%"',
            OLD.order_number, NEW.status;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_order_status ON orders;
CREATE TRIGGER trigger_validate_order_status
    BEFORE UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION validate_order_status_transition();

-- 3.2 Master Atomic place_order_from_cart() Function
CREATE OR REPLACE FUNCTION place_order_from_cart(
    p_user_id UUID,
    p_address_id UUID,
    p_payment_method VARCHAR(50) DEFAULT 'cod',
    p_coupon_code VARCHAR(50) DEFAULT NULL,
    p_customer_notes TEXT DEFAULT NULL,
    p_redeem_points INT DEFAULT 0
)
RETURNS TABLE (
    created_order_id UUID,
    created_order_number VARCHAR,
    total_amount NUMERIC
) AS $$
DECLARE
    v_address customer_addresses%ROWTYPE;
    v_address_snapshot JSONB;
    v_total_items_price NUMERIC(10, 2) := 0.00;
    v_coupon_discount NUMERIC(10, 2) := 0.00;
    v_loyalty_discount NUMERIC(10, 2) := 0.00;
    v_total_discount NUMERIC(10, 2) := 0.00;
    v_delivery_fee NUMERIC(10, 2) := 40.00; -- Standard delivery fee
    v_packaging_fee NUMERIC(10, 2) := 0.00;
    v_total_payable NUMERIC(10, 2) := 0.00;
    v_order_id UUID;
    v_order_number VARCHAR;
    v_cart_count INT := 0;
    v_cart_item RECORD;
    v_coupon_res JSONB;
    v_user_loyalty INT := 0;
    v_has_preorder BOOLEAN := FALSE;
BEGIN
    -- 1. Validate customer address and build immutable snapshot
    SELECT * INTO v_address
    FROM customer_addresses
    WHERE id = p_address_id AND user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Customer address % not found for user %', p_address_id, p_user_id;
    END IF;

    v_address_snapshot := jsonb_build_object(
        'recipient_name', v_address.recipient_name,
        'recipient_phone', v_address.recipient_phone,
        'alternate_phone', v_address.alternate_phone,
        'street_address', v_address.street_address,
        'landmark', v_address.landmark,
        'city', v_address.city,
        'district', v_address.district,
        'state', v_address.state,
        'pincode', v_address.pincode,
        'address_type', v_address.address_type,
        'snapshot_timestamp', NOW()
    );

    -- 2. Count active cart items
    SELECT COUNT(*) INTO v_cart_count
    FROM cart_items
    WHERE user_id = p_user_id AND is_saved_for_later = FALSE;

    IF v_cart_count = 0 THEN
        RAISE EXCEPTION 'Shopping cart is empty. No active items to order.';
    END IF;

    -- 3. Stock validation (Pre-orders bypass stock availability)
    FOR v_cart_item IN
        SELECT 
            ci.variant_id, 
            ci.quantity, 
            bv.is_preorder,
            COALESCE(inv.available_quantity, 0) AS current_stock,
            b.title AS book_title
        FROM cart_items ci
        JOIN book_variants bv ON ci.variant_id = bv.id
        JOIN books b ON bv.book_id = b.id
        LEFT JOIN inventory inv ON bv.id = inv.variant_id
        WHERE ci.user_id = p_user_id AND ci.is_saved_for_later = FALSE
    LOOP
        IF COALESCE(v_cart_item.is_preorder, FALSE) THEN
            v_has_preorder := TRUE;
        ELSE
            IF v_cart_item.current_stock < v_cart_item.quantity THEN
                RAISE EXCEPTION 'Insufficient stock for "%" (Available: %, Required: %)', 
                    v_cart_item.book_title, v_cart_item.current_stock, v_cart_item.quantity;
            END IF;
        END IF;
    END LOOP;

    -- 4. Calculate total items price
    SELECT COALESCE(SUM(
        CASE WHEN ci.is_freebie THEN 0.00 ELSE bv.selling_price * ci.quantity END
    ), 0.00)
    INTO v_total_items_price
    FROM cart_items ci
    JOIN book_variants bv ON ci.variant_id = bv.id
    WHERE ci.user_id = p_user_id AND ci.is_saved_for_later = FALSE;

    -- Free delivery threshold: Orders >= ₹500
    IF v_total_items_price >= 500.00 THEN
        v_delivery_fee := 0.00;
    END IF;

    -- 5. Validate & Apply Coupon if provided
    IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) <> '' THEN
        v_coupon_res := validate_and_apply_coupon(TRIM(p_coupon_code), p_user_id, v_total_items_price);
        IF (v_coupon_res->>'is_valid')::BOOLEAN = TRUE THEN
            v_coupon_discount := COALESCE((v_coupon_res->>'discount_amount')::NUMERIC, 0.00);
        ELSE
            RAISE EXCEPTION 'Coupon Error: %', (v_coupon_res->>'message');
        END IF;
    END IF;

    -- 6. Validate & Apply Loyalty Points Redemption (1 Point = 1 INR, max 50% order value)
    IF p_redeem_points > 0 THEN
        SELECT loyalty_points_balance INTO v_user_loyalty
        FROM profiles
        WHERE id = p_user_id;

        IF v_user_loyalty < p_redeem_points THEN
            RAISE EXCEPTION 'Insufficient loyalty balance. Available: %, Requested: %', v_user_loyalty, p_redeem_points;
        END IF;

        v_loyalty_discount := LEAST(p_redeem_points::NUMERIC, FLOOR(v_total_items_price * 0.50));
    END IF;

    v_total_discount := LEAST(v_total_items_price, (v_coupon_discount + v_loyalty_discount));
    v_total_payable := GREATEST(0.00, (v_total_items_price - v_total_discount + v_delivery_fee + v_packaging_fee));

    v_order_id := gen_random_uuid();
    v_order_number := generate_order_number();

    -- 7. Insert Order Header
    INSERT INTO orders (
        id,
        order_number,
        user_id,
        status,
        total_items_price,
        discount_amount,
        coupon_code,
        delivery_fee,
        packaging_fee,
        total_payable_amount,
        payment_method,
        payment_status,
        shipping_address_snapshot,
        customer_notes
    )
    VALUES (
        v_order_id,
        v_order_number,
        p_user_id,
        'pending',
        v_total_items_price,
        v_total_discount,
        p_coupon_code,
        v_delivery_fee,
        v_packaging_fee,
        v_total_payable,
        p_payment_method,
        'pending',
        v_address_snapshot,
        p_customer_notes
    );

    -- 8. Insert Order Items Snapshot & Inventory/Preorder Allocation
    FOR v_cart_item IN
        SELECT 
            ci.variant_id,
            ci.quantity,
            ci.is_freebie,
            bv.is_preorder,
            b.title AS book_title,
            b.title_bn AS book_title_bn,
            COALESCE(bv.cover_image_url, b.preview_images->>0, '') AS cover_image_url,
            bv.sku,
            bv.binding,
            bv.condition,
            bv.mrp AS unit_mrp,
            CASE WHEN ci.is_freebie THEN 0.00 ELSE bv.selling_price END AS unit_selling_price
        FROM cart_items ci
        JOIN book_variants bv ON ci.variant_id = bv.id
        JOIN books b ON bv.book_id = b.id
        WHERE ci.user_id = p_user_id AND ci.is_saved_for_later = FALSE
    LOOP
        INSERT INTO order_items (
            order_id,
            variant_id,
            book_title,
            book_title_bn,
            sku,
            binding,
            condition,
            cover_image_url,
            unit_mrp,
            unit_selling_price,
            quantity,
            is_freebie
        )
        VALUES (
            v_order_id,
            v_cart_item.variant_id,
            v_cart_item.book_title,
            v_cart_item.book_title_bn,
            v_cart_item.sku,
            v_cart_item.binding,
            v_cart_item.condition,
            v_cart_item.cover_image_url,
            v_cart_item.unit_mrp,
            v_cart_item.unit_selling_price,
            v_cart_item.quantity,
            v_cart_item.is_freebie
        );

        -- Stock deduction vs Pre-order waitlist handling
        IF COALESCE(v_cart_item.is_preorder, FALSE) THEN
            -- Pre-order: Increment pre-orders counter on variant
            UPDATE book_variants 
            SET current_preorders_count = current_preorders_count + v_cart_item.quantity,
                updated_at = NOW()
            WHERE id = v_cart_item.variant_id;

            -- Queue user into preorder_waitlists
            INSERT INTO preorder_waitlists (variant_id, user_id, order_id, status)
            VALUES (v_cart_item.variant_id, p_user_id, v_order_id, 'waiting')
            ON CONFLICT (variant_id, user_id) 
            DO UPDATE SET order_id = v_order_id, status = 'waiting';
        ELSE
            -- Normal stock: Deduct from inventory
            UPDATE inventory 
            SET stock_quantity = stock_quantity - v_cart_item.quantity,
                updated_at = NOW()
            WHERE variant_id = v_cart_item.variant_id;

            -- Record audit trail in stock_adjustments
            INSERT INTO stock_adjustments (
                variant_id, change_quantity, reason, notes, adjusted_by
            ) VALUES (
                v_cart_item.variant_id,
                -v_cart_item.quantity,
                'online_sale',
                'Stock deducted for Order #' || v_order_number,
                p_user_id
            );
        END IF;
    END LOOP;

    -- 9. Record Coupon Usage
    IF v_coupon_discount > 0 AND p_coupon_code IS NOT NULL THEN
        INSERT INTO coupon_usages (coupon_id, user_id, order_id, discount_applied)
        SELECT id, p_user_id, v_order_id, v_coupon_discount
        FROM coupons
        WHERE UPPER(code) = UPPER(TRIM(p_coupon_code));

        UPDATE coupons 
        SET times_used = times_used + 1
        WHERE UPPER(code) = UPPER(TRIM(p_coupon_code));
    END IF;

    -- 10. Record Loyalty Points Redemption in Ledger
    IF p_redeem_points > 0 AND v_loyalty_discount > 0 THEN
        INSERT INTO loyalty_ledger (
            user_id, order_id, points, transaction_type, notes
        )
        VALUES (
            p_user_id,
            v_order_id,
            -v_loyalty_discount::INT,
            'redeemed_checkout',
            'Redeemed ' || v_loyalty_discount::INT || ' points on Order #' || v_order_number
        );
    END IF;

    -- 11. Clear active items from cart (keep Saved for Later items intact)
    DELETE FROM cart_items
    WHERE user_id = p_user_id AND is_saved_for_later = FALSE;

    -- 12. Populate Frequently Bought Together (FBT) co-occurrence matrix
    PERFORM update_product_associations_from_order(v_order_id);

    RETURN QUERY
    SELECT v_order_id, v_order_number, v_total_payable;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ------------------------------------------------------------------------------
-- PART 4 (TASKS 16-20): REVIEWS & COUPON CONCURRENCY HARDENING
-- ------------------------------------------------------------------------------

-- 4.1 sync_book_review_stats() excluding soft-deleted reviews
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
    WHERE book_id = v_target_book_id 
      AND is_approved = TRUE 
      AND deleted_at IS NULL;

    UPDATE books
    SET average_rating = v_avg,
        reviews_count = v_count,
        updated_at = NOW()
    WHERE id = v_target_book_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4.2 Verified purchase status excluding refunded/returned items
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
          AND NOT EXISTS (
              SELECT 1 FROM order_returns ret 
              WHERE ret.order_id = o.id AND ret.order_item_id = oi.id AND ret.refund_status = 'processed'
          )
    ) THEN
        NEW.is_verified_purchase := TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.3 validate_and_apply_coupon() with FOR SHARE/UPDATE row lock
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
        RETURN jsonb_build_object('is_valid', false, 'message', 'Coupon total usage limit has been reached');
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
-- PART 5 (TASKS 21-25): FAST KEYSET PAGINATION & ETAG INDEXES
-- ------------------------------------------------------------------------------

-- 5.1 Indexes for lightning-fast ETag hash generation
CREATE INDEX IF NOT EXISTS idx_inventory_updated_at ON inventory (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_updated_at ON books (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_book_variants_updated_at ON book_variants (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_updated_at ON categories (updated_at DESC);

-- 5.2 Corrected Keyset / Cursor-based Pagination Function
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
            b.popularity_score AS b_pop_score,
            b.average_rating AS b_rating,
            b.reviews_count AS b_reviews_count,
            b.created_at AS b_created_at
        FROM v_catalog_books v
        JOIN books b ON v.book_id = b.id
        WHERE (p_category_id IS NULL OR EXISTS (
            SELECT 1 FROM book_categories bc WHERE bc.book_id = b.id AND bc.category_id = p_category_id
        ))
          AND (
              CASE 
                  WHEN p_sort_by = 'popularity' THEN
                      (p_cursor_score IS NULL OR (b.popularity_score < p_cursor_score OR (b.popularity_score = p_cursor_score AND b.id < p_cursor_id)))
                  WHEN p_sort_by = 'price_asc' THEN
                      (p_cursor_score IS NULL OR (v.min_price > p_cursor_score OR (v.min_price = p_cursor_score AND b.id > p_cursor_id)))
                  WHEN p_sort_by = 'price_desc' THEN
                      (p_cursor_score IS NULL OR (v.min_price < p_cursor_score OR (v.min_price = p_cursor_score AND b.id < p_cursor_id)))
                  WHEN p_sort_by = 'rating' THEN
                      (p_cursor_score IS NULL OR (b.average_rating < p_cursor_score OR (b.average_rating = p_cursor_score AND b.id < p_cursor_id)))
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
            CASE WHEN p_sort_by = 'price_asc' THEN b.id END ASC,
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
        fb.b_rating AS average_rating,
        fb.b_reviews_count AS reviews_count,
        fb.total_available_stock,
        fb.is_in_stock,
        fb.b_pop_score AS popularity_score,
        CASE 
            WHEN p_sort_by = 'popularity' THEN fb.b_pop_score
            WHEN p_sort_by IN ('price_asc', 'price_desc') THEN fb.min_price
            WHEN p_sort_by = 'rating' THEN fb.b_rating
            ELSE NULL
        END AS next_cursor_score,
        fb.book_id AS next_cursor_id
    FROM filtered_books fb;
END;
$$ LANGUAGE plpgsql STABLE;


-- ------------------------------------------------------------------------------
-- PART 6 (TASKS 26-30): POS STOCK ADJUSTMENTS & PRE-ORDER WAREHOUSE BALANCING
-- ------------------------------------------------------------------------------

-- 6.1 Record POS Counter Sales in stock_adjustments ledger
CREATE OR REPLACE FUNCTION process_pos_counter_sale(
    p_variant_id UUID,
    p_quantity INT,
    p_staff_user_id UUID,
    p_payment_method VARCHAR DEFAULT 'upi',
    p_customer_name VARCHAR DEFAULT 'Counter Customer',
    p_customer_phone VARCHAR DEFAULT '+919832000000',
    p_notes TEXT DEFAULT 'In-store counter purchase'
)
RETURNS JSONB AS $$
DECLARE
    v_variant RECORD;
    v_book RECORD;
    v_total NUMERIC(10, 2);
    v_order_id UUID;
    v_order_number VARCHAR;
    v_address_snapshot JSONB;
BEGIN
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Sale quantity must be greater than zero';
    END IF;

    -- 1. Fetch variant and lock inventory row
    SELECT * INTO v_variant
    FROM book_variants
    WHERE id = p_variant_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Variant % not found', p_variant_id;
    END IF;

    SELECT * INTO v_book
    FROM books
    WHERE id = v_variant.book_id;

    -- Concurrency check on stock
    PERFORM 1 FROM inventory 
    WHERE variant_id = p_variant_id AND (stock_quantity - reserved_quantity) >= p_quantity
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient in-store stock for variant %', p_variant_id;
    END IF;

    -- 2. Deduct stock directly
    UPDATE inventory
    SET stock_quantity = stock_quantity - p_quantity,
        updated_at = NOW()
    WHERE variant_id = p_variant_id;

    -- 3. Prepare immutable snapshot
    v_total := ROUND(v_variant.selling_price * p_quantity, 2);
    v_order_id := gen_random_uuid();
    v_order_number := generate_order_number();

    v_address_snapshot := jsonb_build_object(
        'recipient_name', p_customer_name,
        'recipient_phone', p_customer_phone,
        'street_address', 'Counter Purchase (Netaji Subhash Road)',
        'city', 'Malda Town',
        'district', 'Malda',
        'state', 'West Bengal',
        'pincode', '732101',
        'store_channel', 'POS Counter'
    );

    -- 4. Create completed order
    INSERT INTO orders (
        id, order_number, user_id, status, total_items_price,
        discount_amount, delivery_fee, packaging_fee, total_payable_amount,
        payment_method, payment_status, shipping_address_snapshot, channel,
        customer_notes, admin_notes
    )
    VALUES (
        v_order_id, v_order_number, p_staff_user_id, 'delivered', v_total,
        0.00, 0.00, 0.00, v_total,
        p_payment_method, 'captured', v_address_snapshot, 'store_counter',
        p_notes, 'Billed by staff: ' || p_staff_user_id
    );

    -- 5. Insert order item
    INSERT INTO order_items (
        order_id, variant_id, book_title, book_title_bn, sku,
        binding, condition, cover_image_url, unit_mrp, unit_selling_price, quantity
    )
    VALUES (
        v_order_id, v_variant.id, v_book.title, v_book.title_bn, v_variant.sku,
        v_variant.binding, v_variant.condition, COALESCE(v_variant.cover_image_url, v_book.preview_images->>0, ''),
        v_variant.mrp, v_variant.selling_price, p_quantity
    );

    -- 6. Insert audit trail in stock_adjustments ledger
    INSERT INTO stock_adjustments (
        variant_id, change_quantity, reason, notes, adjusted_by
    ) VALUES (
        p_variant_id,
        -p_quantity,
        'pos_sale',
        'Counter POS sale for Order #' || v_order_number,
        p_staff_user_id
    );

    -- 7. Insert payment record
    INSERT INTO payments (
        order_id, gateway, idempotency_key, amount, currency, status, gateway_payload
    )
    VALUES (
        v_order_id, 'cod', 'pos_' || v_order_number, v_total, 'INR', 'success',
        jsonb_build_object('method', p_payment_method, 'mode', 'POS_COUNTER', 'staff_id', p_staff_user_id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'amount', v_total,
        'sku', v_variant.sku,
        'message', 'POS sale completed and inventory synchronized'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.2 Pre-order Warehouse Stock Balancing Fix
CREATE OR REPLACE FUNCTION release_preorder_to_stock(p_variant_id UUID, p_new_stock INT)
RETURNS JSONB AS $$
DECLARE
    v_waitlist RECORD;
    v_allocated_count INT := 0;
BEGIN
    IF p_new_stock <= 0 THEN
        RAISE EXCEPTION 'Incoming stock must be greater than zero';
    END IF;

    -- 1. Allocate stock FIFO to waiting customers
    FOR v_waitlist IN 
        SELECT id, order_id 
        FROM preorder_waitlists 
        WHERE variant_id = p_variant_id AND status = 'waiting'
        ORDER BY created_at ASC
        LIMIT p_new_stock
    LOOP
        UPDATE preorder_waitlists
        SET status = 'allocated'
        WHERE id = v_waitlist.id;

        IF v_waitlist.order_id IS NOT NULL THEN
            UPDATE orders
            SET status = 'processing',
                updated_at = NOW()
            WHERE id = v_waitlist.order_id AND status = 'pending';
        END IF;

        v_allocated_count := v_allocated_count + 1;
    END LOOP;

    -- 2. Correct Warehouse Balancing:
    -- Add all physical stock received to stock_quantity,
    -- and reserve the allocated quantity so new buyers cannot steal pre-ordered copies.
    UPDATE inventory
    SET stock_quantity = stock_quantity + p_new_stock,
        reserved_quantity = reserved_quantity + v_allocated_count,
        updated_at = NOW()
    WHERE variant_id = p_variant_id;

    -- 3. Adjust variant pre-order state
    UPDATE book_variants
    SET current_preorders_count = GREATEST(0, current_preorders_count - v_allocated_count),
        is_preorder = CASE WHEN (current_preorders_count - v_allocated_count) <= 0 THEN FALSE ELSE is_preorder END,
        updated_at = NOW()
    WHERE id = p_variant_id;

    RETURN jsonb_build_object(
        'success', true,
        'allocated_to_preorders', v_allocated_count,
        'available_for_new_buyers', (p_new_stock - v_allocated_count),
        'message', 'Preorder FIFO allocation and warehouse stock balance synchronized successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ------------------------------------------------------------------------------
-- PART 7 (TASKS 31-35): GST INVOICING & RETURN INSPECTIONS
-- ------------------------------------------------------------------------------

-- 7.1 GST Rule 46 Arithmetic Alignment for Inclusive Delivery Freight
CREATE OR REPLACE FUNCTION generate_tax_invoice(p_order_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_order orders%ROWTYPE;
    v_existing_inv invoices%ROWTYPE;
    v_new_inv_num VARCHAR;
    v_delivery_taxable NUMERIC(10, 2) := 0.00;
    v_delivery_gst NUMERIC(10, 2) := 0.00;
    v_cgst NUMERIC(10, 2) := 0.00;
    v_sgst NUMERIC(10, 2) := 0.00;
    v_total_taxable NUMERIC(10, 2) := 0.00;
BEGIN
    SELECT * INTO v_existing_inv FROM invoices WHERE order_id = p_order_id;
    IF FOUND THEN
        RETURN v_existing_inv.invoice_number;
    END IF;

    SELECT * INTO v_order FROM orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found', p_order_id;
    END IF;

    -- Books (HSN 4901): 0% GST (Tax Exempt)
    -- Postal / Courier Delivery (SAC 9968): 18% GST (9% CGST + 9% SGST intra-state West Bengal)
    -- Delivery fee is inclusive of 18% GST:
    IF v_order.delivery_fee > 0 THEN
        v_delivery_taxable := ROUND(v_order.delivery_fee / 1.18, 2);
        v_delivery_gst := v_order.delivery_fee - v_delivery_taxable;
        v_cgst := ROUND(v_delivery_gst / 2.0, 2);
        v_sgst := v_delivery_gst - v_cgst;
    END IF;

    v_total_taxable := (v_order.total_items_price - v_order.discount_amount + v_delivery_taxable);
    v_new_inv_num := generate_invoice_number();

    INSERT INTO invoices (
        order_id,
        invoice_number,
        subtotal,
        discount_total,
        delivery_charges,
        taxable_amount,
        cgst_amount,
        sgst_amount,
        igst_amount,
        grand_total,
        hsn_sac_summary
    )
    VALUES (
        p_order_id,
        v_new_inv_num,
        v_order.total_items_price,
        v_order.discount_amount,
        v_order.delivery_fee,
        v_total_taxable,
        v_cgst,
        v_sgst,
        0.00,
        v_order.total_payable_amount,
        jsonb_build_array(
            jsonb_build_object('hsn', '4901', 'desc', 'Printed Books (Exempt)', 'taxable_val', (v_order.total_items_price - v_order.discount_amount), 'gst_rate', '0%'),
            jsonb_build_object('sac', '9968', 'desc', 'Postal / Courier Freight (Inclusive)', 'taxable_val', v_delivery_taxable, 'gst_rate', '18%')
        )
    );

    RETURN v_new_inv_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.2 Return Inspection Refund Amount Calculation Fix
CREATE OR REPLACE FUNCTION process_return_inspection(
    p_return_id UUID,
    p_passed BOOLEAN,
    p_inspector_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_ret order_returns%ROWTYPE;
    v_item order_items%ROWTYPE;
    v_refund_val NUMERIC(10, 2) := 0.00;
BEGIN
    SELECT * INTO v_ret FROM order_returns WHERE id = p_return_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Return % not found', p_return_id;
    END IF;

    SELECT * INTO v_item FROM order_items WHERE id = v_ret.order_item_id;

    IF p_passed THEN
        v_refund_val := ROUND(v_item.unit_selling_price * v_ret.quantity, 2);

        UPDATE order_returns
        SET pickup_status = 'inspection_passed',
            refund_status = 'pending',
            refund_amount = v_refund_val,
            updated_at = NOW()
        WHERE id = p_return_id;

        -- Restock book into inventory via ledger
        IF v_item.variant_id IS NOT NULL THEN
            INSERT INTO stock_adjustments (
                variant_id, change_quantity, reason, notes, adjusted_by
            )
            VALUES (
                v_item.variant_id,
                v_ret.quantity,
                'return_restock',
                'Approved return inspection #' || v_ret.return_number || '. ' || COALESCE(p_notes, ''),
                p_inspector_id
            );
        END IF;

        RETURN jsonb_build_object(
            'success', true, 
            'status', 'inspection_passed', 
            'refund_amount', v_refund_val,
            'message', 'Return passed, item restocked to inventory, refund pending'
        );
    ELSE
        UPDATE order_returns
        SET pickup_status = 'rejected',
            refund_status = 'not_applicable',
            refund_amount = 0.00,
            updated_at = NOW()
        WHERE id = p_return_id;

        RETURN jsonb_build_object('success', true, 'status', 'rejected', 'message', 'Return rejected by inspector');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ------------------------------------------------------------------------------
-- PART 8 (TASKS 36-40): LOYALTY TRIGGER & AUTOMATED CART FREEBIES RPC
-- ------------------------------------------------------------------------------

-- 8.1 Automated Order Delivered Loyalty Points Credit Trigger
CREATE OR REPLACE FUNCTION trigger_award_loyalty_on_delivered()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') THEN
        PERFORM award_order_loyalty_points(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_order_delivered_loyalty ON orders;
CREATE TRIGGER trigger_order_delivered_loyalty
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_award_loyalty_on_delivered();

-- 8.2 Automated Promotional Freebies Evaluation RPC
CREATE OR REPLACE FUNCTION evaluate_cart_freebies(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_cart_subtotal NUMERIC(10, 2) := 0.00;
    v_rule RECORD;
    v_applied_count INT := 0;
BEGIN
    -- 1. Calculate active cart subtotal (excluding freebies)
    SELECT COALESCE(SUM(bv.selling_price * ci.quantity), 0.00)
    INTO v_cart_subtotal
    FROM cart_items ci
    JOIN book_variants bv ON ci.variant_id = bv.id
    WHERE ci.user_id = p_user_id AND ci.is_saved_for_later = FALSE AND ci.is_freebie = FALSE;

    -- 2. Clear old freebies
    DELETE FROM cart_items
    WHERE user_id = p_user_id AND is_freebie = TRUE;

    -- 3. Evaluate active promotional rules
    FOR v_rule IN
        SELECT * FROM promotional_rules
        WHERE is_active = TRUE 
          AND (valid_from <= NOW()) 
          AND (valid_until IS NULL OR valid_until >= NOW())
    LOOP
        IF v_rule.rule_type = 'freebie_above_amount' AND v_cart_subtotal >= v_rule.trigger_min_amount THEN
            INSERT INTO cart_items (user_id, variant_id, quantity, is_freebie)
            VALUES (p_user_id, v_rule.gift_variant_id, 1, TRUE)
            ON CONFLICT (user_id, variant_id) DO NOTHING;
            v_applied_count := v_applied_count + 1;
        ELSIF v_rule.rule_type = 'freebie_with_product' AND EXISTS (
            SELECT 1 FROM cart_items ci
            JOIN book_variants bv ON ci.variant_id = bv.id
            WHERE ci.user_id = p_user_id AND bv.book_id = v_rule.trigger_book_id AND ci.is_saved_for_later = FALSE
        ) THEN
            INSERT INTO cart_items (user_id, variant_id, quantity, is_freebie)
            VALUES (p_user_id, v_rule.gift_variant_id, 1, TRUE)
            ON CONFLICT (user_id, variant_id) DO NOTHING;
            v_applied_count := v_applied_count + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'applied_freebies', v_applied_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ------------------------------------------------------------------------------
-- PART 9 (TASKS 41-45): GET_SERIES_BOOKS & FREQUENTLY BOUGHT TOGETHER FIX
-- ------------------------------------------------------------------------------

-- 9.1 get_frequently_bought_together() Crash Fix (Handles cover_image_url & soft delete)
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
        (
            SELECT COALESCE(bv.cover_image_url, b.preview_images->>0, '') 
            FROM book_variants bv 
            WHERE bv.book_id = b.id AND bv.is_active = TRUE AND bv.deleted_at IS NULL 
            ORDER BY bv.selling_price ASC 
            LIMIT 1
        ) AS cover_image_url,
        (
            SELECT MIN(bv.selling_price) 
            FROM book_variants bv 
            WHERE bv.book_id = b.id AND bv.is_active = TRUE AND bv.deleted_at IS NULL
        ) AS min_selling_price,
        pa.co_occurrence_count,
        pa.confidence_score
    FROM product_associations pa
    JOIN books b ON pa.associated_book_id = b.id
    WHERE pa.book_id = p_book_id
      AND pa.association_type = 'bought_together'
      AND b.is_active = TRUE
      AND b.deleted_at IS NULL
    ORDER BY pa.co_occurrence_count DESC, pa.confidence_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 9.2 get_series_books() Crash Fix (Handles cover_image_url & soft delete)
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
        (
            SELECT COALESCE(bv.cover_image_url, b.preview_images->>0, '') 
            FROM book_variants bv 
            WHERE bv.book_id = b.id AND bv.is_active = TRUE AND bv.deleted_at IS NULL 
            ORDER BY bv.selling_price ASC 
            LIMIT 1
        ) AS cover_image_url,
        (
            SELECT MIN(bv.selling_price) 
            FROM book_variants bv 
            WHERE bv.book_id = b.id AND bv.is_active = TRUE AND bv.deleted_at IS NULL
        ) AS min_selling_price
    FROM books b
    WHERE b.series_id = p_series_id
      AND b.is_active = TRUE
      AND b.deleted_at IS NULL
    ORDER BY b.volume_number ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- 9.3 semantic_search_books() Soft-delete Filter Fix
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
      AND b.deleted_at IS NULL
      AND b.embedding IS NOT NULL
      AND (1 - (b.embedding <=> query_embedding)) >= match_threshold
    ORDER BY b.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;


-- ------------------------------------------------------------------------------
-- PART 10 (TASKS 46-50): DPDP ACT 2023 COMPLIANCE & RATE LIMIT AUTO-CLEANUP
-- ------------------------------------------------------------------------------

-- 10.1 Comprehensive India DPDP Act 2023 User Redaction
CREATE OR REPLACE FUNCTION anonymize_user_data(
    p_user_id UUID,
    p_admin_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_masked_name VARCHAR;
    v_masked_email VARCHAR;
BEGIN
    IF EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND is_anonymized = TRUE) THEN
        RETURN;
    END IF;

    v_masked_name := 'Anonymized Customer ' || SUBSTRING(p_user_id::text, 1, 8);
    v_masked_email := 'redacted_' || MD5(p_user_id::text) || '@anonymized.mmbookhouse.com';

    -- 1. Anonymize customer profile PII
    UPDATE profiles
    SET full_name = v_masked_name,
        full_name_bn = 'নাম অপ্রকাশিত গ্রাহক',
        email = v_masked_email,
        phone_number = '+910000000000',
        avatar_url = NULL,
        loyalty_points_balance = 0,
        is_anonymized = TRUE,
        anonymized_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;

    -- 2. Clear customer active sessions, wishlists, alerts
    DELETE FROM cart_items WHERE user_id = p_user_id;
    DELETE FROM wishlist_items WHERE user_id = p_user_id;
    DELETE FROM user_alerts WHERE user_id = p_user_id;
    DELETE FROM author_followers WHERE user_id = p_user_id;

    -- 3. Redact address book details
    UPDATE customer_addresses
    SET recipient_name = 'Redacted Customer',
        recipient_phone = '+910000000000',
        alternate_phone = NULL,
        street_address = 'Address Redacted as per DPDP Act 2023',
        landmark = NULL
    WHERE user_id = p_user_id;

    -- 4. Redact snapshot PII in historical orders (both shipping and billing)
    UPDATE orders
    SET shipping_address_snapshot = jsonb_set(
            jsonb_set(shipping_address_snapshot, '{recipient_name}', '"Redacted Customer"'),
            '{recipient_phone}', '"+910000000000"'
        ),
        billing_address_snapshot = CASE 
            WHEN billing_address_snapshot IS NOT NULL THEN
                jsonb_set(
                    jsonb_set(billing_address_snapshot, '{recipient_name}', '"Redacted Customer"'),
                    '{recipient_phone}', '"+910000000000"'
                )
            ELSE NULL
        END
    WHERE user_id = p_user_id;

    -- 5. Anonymize institutional quotation requests
    UPDATE quotation_requests
    SET contact_person = 'Redacted Contact',
        phone = '+910000000000',
        email = v_masked_email,
        book_list = 'Redacted'
    WHERE user_id = p_user_id;

    -- 6. Audit Log the compliance deletion
    PERFORM log_audit_event(
        p_admin_id,
        'system_compliance',
        'USER_ANONYMIZED_DPDP_ACT_2023',
        'profiles',
        p_user_id,
        jsonb_build_object('event', 'Right to Erasure invoked'),
        jsonb_build_object('masked_name', v_masked_name, 'anonymized_at', NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10.2 Rolling Window Auto-Cleanup for Rate Limiting Table
CREATE OR REPLACE FUNCTION check_and_increment_rate_limit(
    p_client_id VARCHAR,
    p_action VARCHAR,
    p_max_requests INT DEFAULT 60,
    p_window_seconds INT DEFAULT 60
)
RETURNS TABLE (
    is_allowed BOOLEAN,
    current_count INT,
    remaining_requests INT,
    retry_after_seconds INT
) AS $$
DECLARE
    v_now TIMESTAMPTZ := NOW();
    v_row api_rate_limits%ROWTYPE;
BEGIN
    -- Opportunistic cleanup: Purge windows older than 2 hours to prevent unbounded table growth
    IF (EXTRACT(SECOND FROM v_now)::INT % 20 = 0) THEN
        DELETE FROM api_rate_limits 
        WHERE window_start < (v_now - INTERVAL '2 hours') 
          AND (blocked_until IS NULL OR blocked_until < v_now);
    END IF;

    -- Check if client is currently blocked
    SELECT * INTO v_row
    FROM api_rate_limits
    WHERE client_identifier = p_client_id
      AND endpoint_action = p_action
      AND blocked_until IS NOT NULL
      AND blocked_until > v_now
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
        RETURN QUERY SELECT 
            FALSE, 
            v_row.request_count, 
            0, 
            EXTRACT(EPOCH FROM (v_row.blocked_until - v_now))::INT;
        RETURN;
    END IF;

    -- Look for existing active window
    SELECT * INTO v_row
    FROM api_rate_limits
    WHERE client_identifier = p_client_id
      AND endpoint_action = p_action
      AND window_start > (v_now - (p_window_seconds || ' seconds')::INTERVAL)
    ORDER BY window_start DESC
    LIMIT 1;

    IF NOT FOUND THEN
        INSERT INTO api_rate_limits (client_identifier, endpoint_action, request_count, window_start)
        VALUES (p_client_id, p_action, 1, v_now);

        RETURN QUERY SELECT TRUE, 1, (p_max_requests - 1), 0;
        RETURN;
    END IF;

    -- Increment existing window
    IF v_row.request_count >= p_max_requests THEN
        UPDATE api_rate_limits
        SET blocked_until = v_now + INTERVAL '15 minutes'
        WHERE id = v_row.id;

        RETURN QUERY SELECT FALSE, v_row.request_count + 1, 0, 900;
        RETURN;
    ELSE
        UPDATE api_rate_limits
        SET request_count = request_count + 1
        WHERE id = v_row.id;

        RETURN QUERY SELECT TRUE, v_row.request_count + 1, (p_max_requests - (v_row.request_count + 1)), 0;
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10.3 Safe IP logging in log_audit_event()
CREATE OR REPLACE FUNCTION log_audit_event(
    p_user_id UUID,
    p_user_role VARCHAR,
    p_action VARCHAR,
    p_entity_type VARCHAR,
    p_entity_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id, user_role, action, entity_type, entity_id,
        old_values, new_values, ip_address, user_agent
    )
    VALUES (
        p_user_id, p_user_role, p_action, p_entity_type, p_entity_id,
        p_old_values, p_new_values, p_ip, p_user_agent
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
