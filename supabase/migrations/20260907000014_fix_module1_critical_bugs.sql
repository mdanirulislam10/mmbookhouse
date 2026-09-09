-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Critical P0 Bug Fixes & Schema Enhancements
-- Migration: 20260907000014_fix_module1_critical_bugs.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TASK 1 PRE-REQUISITE: EXPAND STOCK ADJUSTMENTS AUDIT LEDGER REASONS
-- & PREVENT DOUBLE STOCK REDUCTION IN TRIGGER
-- ------------------------------------------------------------------------------
-- Allow 'online_sale', 'pos_sale', and 'manual_adjustment' in stock_adjustments ledger
ALTER TABLE stock_adjustments DROP CONSTRAINT IF EXISTS stock_adjustments_reason_check;
ALTER TABLE stock_adjustments ADD CONSTRAINT stock_adjustments_reason_check CHECK (
    reason IN (
        'damaged', 'defective', 'lost', 'audit_correction', 
        'return_restock', 'new_stock_arrival', 'supplier_consignment',
        'online_sale', 'pos_sale', 'manual_adjustment'
    )
);

-- Ensure apply_stock_adjustment trigger does NOT double-deduct stock for online_sale/pos_sale
-- because the order checkout transactions explicitly decrement inventory directly.
CREATE OR REPLACE FUNCTION apply_stock_adjustment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reason NOT IN ('online_sale', 'pos_sale') THEN
        UPDATE inventory
        SET stock_quantity = stock_quantity + NEW.change_quantity,
            updated_at = NOW()
        WHERE variant_id = NEW.variant_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- TASKS 1, 2, 3: MASTER ATOMIC PLACE_ORDER_FROM_CART HARDENING
--   1. [P0 BUG] Stock Reduction & stock_adjustments Audit Entry
--   2. [P0 BUG] validate_and_apply_coupon() Parameter Order & JSONB Extraction
--   3. [FINANCIAL BUG] Exact Loyalty Points Deduction (-v_loyalty_discount::INT)
-- ------------------------------------------------------------------------------
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
    v_available_stock INT := 0;
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

    -- 3. Stock validation (with pre-order bypass)
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
        -- If NOT pre-order, verify that available stock >= required quantity
        IF NOT COALESCE(v_cart_item.is_preorder, FALSE) THEN
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

    -- 5. Validate & Apply Coupon if provided (TASK 2 FIX: Correct parameter sequence and JSONB extraction)
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

        -- Max allowable redemption is 50% of items total
        v_loyalty_discount := LEAST(p_redeem_points::NUMERIC, FLOOR(v_total_items_price * 0.50));
    END IF;

    -- Calculate net total discount
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

    -- 8. Insert Order Items Snapshot & TASK 1 FIX: Deduct stock from inventory and log stock_adjustments
    FOR v_cart_item IN
        SELECT 
            ci.variant_id,
            ci.quantity,
            ci.is_freebie,
            bv.is_preorder,
            b.title AS book_title,
            b.title_bn AS book_title_bn,
            COALESCE(b.preview_images->>0, '') AS cover_image_url,
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

        -- TASK 1 FIX: Deduct stock from inventory
        UPDATE inventory 
        SET stock_quantity = stock_quantity - v_cart_item.quantity
        WHERE variant_id = v_cart_item.variant_id;

        -- TASK 1 FIX: Record audit trail in stock_adjustments
        INSERT INTO stock_adjustments (
            variant_id, change_quantity, reason, notes, adjusted_by
        ) VALUES (
            v_cart_item.variant_id,
            -v_cart_item.quantity,
            'online_sale',
            'Stock deducted for Order #' || v_order_number,
            p_user_id
        );
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

    -- 10. TASK 3 FIX: Record Loyalty Points Redemption in Ledger using actual discount applied (-v_loyalty_discount::INT)
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

    -- Return created order info
    RETURN QUERY
    SELECT v_order_id, v_order_number, v_total_payable;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION place_order_from_cart IS 'Atomically places an order from customer cart, deducts inventory stock, logs stock adjustments, extracts coupon discount from JSONB, and deducts actual loyalty discount';

-- ------------------------------------------------------------------------------
-- TASK 4: [SECURITY HOLE] ORDERS TABLE RLS LOCKDOWN
-- Prevent direct client-side price tampering by dropping user INSERT policies.
-- Orders can ONLY be placed via SECURITY DEFINER functions (place_order_from_cart).
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
DROP POLICY IF EXISTS "Order items insertable with order" ON order_items;

-- Maintain staff and admin administrative creation capability
DROP POLICY IF EXISTS "Admin and staff can insert orders" ON orders;
CREATE POLICY "Admin and staff can insert orders" 
    ON orders FOR INSERT 
    WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS "Admin and staff can insert order items" ON order_items;
CREATE POLICY "Admin and staff can insert order items" 
    ON order_items FOR INSERT 
    WITH CHECK (public.is_admin_or_staff());

-- ------------------------------------------------------------------------------
-- TASK 5: [SEARCH LIMITATION] ENHANCE SEARCH_BOOKS()
-- Searches books(title, title_bn, keywords), authors(name, name_bn), and publishers(name).
-- Optionally filters by p_category_id using book_categories.
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS search_books(TEXT, REAL, INT);
DROP FUNCTION IF EXISTS search_books(TEXT, INT, UUID);
DROP FUNCTION IF EXISTS search_books(TEXT);

CREATE OR REPLACE FUNCTION search_books(
    search_query TEXT,
    result_limit INT DEFAULT 20,
    p_category_id UUID DEFAULT NULL
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
    PERFORM set_limit(0.2);

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
                similarity(COALESCE(b.title_bn, ''), search_query),
                COALESCE((
                    SELECT MAX(GREATEST(
                        similarity(a.name, search_query),
                        similarity(COALESCE(a.name_bn, ''), search_query)
                    ))
                    FROM book_authors ba
                    JOIN authors a ON ba.author_id = a.id
                    WHERE ba.book_id = b.id AND a.deleted_at IS NULL
                ), 0.0),
                COALESCE((
                    SELECT similarity(p.name, search_query)
                    FROM publishers p
                    WHERE p.id = b.publisher_id AND p.deleted_at IS NULL
                ), 0.0)
            )::REAL AS sim_score
        FROM books b
        WHERE b.is_active = TRUE 
          AND b.deleted_at IS NULL
          AND (
              p_category_id IS NULL OR EXISTS (
                  SELECT 1 FROM book_categories bc
                  WHERE bc.book_id = b.id AND bc.category_id = p_category_id
              )
          )
          AND (
              b.title % search_query
              OR b.title_bn % search_query
              OR search_query = ANY(b.keywords)
              OR b.title ILIKE ('%' || search_query || '%')
              OR b.title_bn ILIKE ('%' || search_query || '%')
              OR EXISTS (
                  SELECT 1 FROM book_authors ba
                  JOIN authors a ON ba.author_id = a.id
                  WHERE ba.book_id = b.id
                    AND a.deleted_at IS NULL
                    AND (
                        a.name % search_query
                        OR a.name ILIKE ('%' || search_query || '%')
                        OR a.name_bn % search_query
                        OR a.name_bn ILIKE ('%' || search_query || '%')
                    )
              )
              OR EXISTS (
                  SELECT 1 FROM publishers p
                  WHERE p.id = b.publisher_id
                    AND p.deleted_at IS NULL
                    AND (
                        p.name % search_query
                        OR p.name ILIKE ('%' || search_query || '%')
                    )
              )
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
          AND a.deleted_at IS NULL
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
          AND bv.deleted_at IS NULL
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
    LEFT JOIN publishers p ON mb.m_publisher_id = p.id AND p.deleted_at IS NULL
    LEFT JOIN matched_book_authors mba ON mb.matched_book_id = mba.book_id
    LEFT JOIN matched_book_prices mbp ON mb.matched_book_id = mbp.book_id
    ORDER BY mb.sim_score DESC, max_discount_percent DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_books(TEXT, INT, UUID) IS 'Enhanced multi-entity book search matching titles, bilingual fields, authors, publishers, keywords, and optional category filter';

-- ------------------------------------------------------------------------------
-- TASK 6: [B2B SCHEMA] INSTITUTIONAL QUOTATIONS
-- Tables, constraints, indexes, and RLS policies for school/coaching bulk quotes.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    institution_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    book_list TEXT,
    estimated_quantity VARCHAR(100),
    pincode VARCHAR(20),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'quoted', 'accepted', 'rejected', 'fulfilled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE quotation_requests IS 'B2B institutional and bulk book quotation requests from schools, coaching centers, and libraries';

CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES quotation_requests(id) ON DELETE CASCADE,
    book_title TEXT NOT NULL,
    variant_id UUID REFERENCES book_variants(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE quotation_items IS 'Line items associated with a B2B institutional quotation request';

-- Indexes for quotation tables
CREATE INDEX IF NOT EXISTS idx_quotation_requests_status ON quotation_requests(status);
CREATE INDEX IF NOT EXISTS idx_quotation_requests_user ON quotation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_quotation_requests_created_at ON quotation_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_variant_id ON quotation_items(variant_id);

-- Auto-update updated_at timestamp on quotation_requests
DROP TRIGGER IF EXISTS trigger_quotation_requests_updated_at ON quotation_requests;
CREATE TRIGGER trigger_quotation_requests_updated_at
    BEFORE UPDATE ON quotation_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) for Institutional Quotations
ALTER TABLE quotation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (public or logged-in) can submit a quotation request
DROP POLICY IF EXISTS "Anyone can submit quotation request" ON quotation_requests;
CREATE POLICY "Anyone can submit quotation request" 
    ON quotation_requests FOR INSERT 
    WITH CHECK (true);

-- 2. Customers can view their own quotation requests, admin/staff can view all
DROP POLICY IF EXISTS "Users can view own quotation requests or admin all" ON quotation_requests;
CREATE POLICY "Users can view own quotation requests or admin all" 
    ON quotation_requests FOR SELECT 
    USING (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id) 
        OR public.is_admin_or_staff()
    );

-- 3. Staff and admin can update quotation requests (status transitions, admin notes)
DROP POLICY IF EXISTS "Admin and staff can update quotation requests" ON quotation_requests;
CREATE POLICY "Admin and staff can update quotation requests" 
    ON quotation_requests FOR UPDATE 
    USING (public.is_admin_or_staff());

-- 4. Staff and admin can delete quotation requests
DROP POLICY IF EXISTS "Admin and staff can delete quotation requests" ON quotation_requests;
CREATE POLICY "Admin and staff can delete quotation requests" 
    ON quotation_requests FOR DELETE 
    USING (public.is_admin_or_staff());

-- 5. Anyone can insert quotation items accompanying a request
DROP POLICY IF EXISTS "Anyone can insert quotation items" ON quotation_items;
CREATE POLICY "Anyone can insert quotation items" 
    ON quotation_items FOR INSERT 
    WITH CHECK (true);

-- 6. Users can view their own quotation items, admin/staff can view all
DROP POLICY IF EXISTS "Users can view own quotation items or admin all" ON quotation_items;
CREATE POLICY "Users can view own quotation items or admin all" 
    ON quotation_items FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM quotation_requests qr
            WHERE qr.id = quotation_items.quotation_id
              AND ((auth.uid() IS NOT NULL AND qr.user_id = auth.uid()) OR public.is_admin_or_staff())
        )
    );

-- 7. Staff and admin can manage all quotation items
DROP POLICY IF EXISTS "Admin and staff can manage quotation items" ON quotation_items;
CREATE POLICY "Admin and staff can manage quotation items" 
    ON quotation_items FOR ALL 
    USING (public.is_admin_or_staff());
