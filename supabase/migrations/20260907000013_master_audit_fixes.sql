-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Consolidated Master Audit Patch (Addressing Senior Architect Feedback)
-- Database Engine: Supabase (PostgreSQL 16)
-- Migration: 20260907000013_master_audit_fixes.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENHANCE V_CATALOG_BOOKS WITH SOFT DELETE (deleted_at IS NULL)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_catalog_books AS
WITH author_agg AS (
    SELECT 
        ba.book_id,
        STRING_AGG(COALESCE(a.name_bn, a.name), ', ' ORDER BY ba.display_order) AS author_names
    FROM book_authors ba
    JOIN authors a ON ba.author_id = a.id
    WHERE a.deleted_at IS NULL
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
    WHERE bv.is_active = TRUE AND bv.deleted_at IS NULL
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
LEFT JOIN publishers p ON b.publisher_id = p.id AND p.deleted_at IS NULL
LEFT JOIN author_agg aa ON b.id = aa.book_id
LEFT JOIN variant_stock_agg vsa ON b.id = vsa.book_id
WHERE b.is_active = TRUE AND b.deleted_at IS NULL;

-- ------------------------------------------------------------------------------
-- 2. ENHANCE SEARCH_BOOKS WITH SOFT DELETE (deleted_at IS NULL)
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

-- ------------------------------------------------------------------------------
-- 3. ENHANCE GET_SERIES_BOOKS & GET_FREQUENTLY_BOUGHT_TOGETHER WITH SOFT DELETE
-- ------------------------------------------------------------------------------
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
        (SELECT bv.cover_image_url FROM book_variants bv WHERE bv.book_id = b.id AND bv.is_active = TRUE AND bv.deleted_at IS NULL ORDER BY bv.selling_price ASC LIMIT 1) AS cover_image_url,
        (SELECT MIN(bv.selling_price) FROM book_variants bv WHERE bv.book_id = b.id AND bv.is_active = TRUE AND bv.deleted_at IS NULL) AS min_selling_price
    FROM books b
    WHERE b.series_id = p_series_id
      AND b.is_active = TRUE
      AND b.deleted_at IS NULL
    ORDER BY b.volume_number ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

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
        (SELECT bv.cover_image_url FROM book_variants bv WHERE bv.book_id = b.id AND bv.is_active = TRUE AND bv.deleted_at IS NULL ORDER BY bv.selling_price ASC LIMIT 1) AS cover_image_url,
        (SELECT MIN(bv.selling_price) FROM book_variants bv WHERE bv.book_id = b.id AND bv.is_active = TRUE AND bv.deleted_at IS NULL) AS min_selling_price,
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

-- ------------------------------------------------------------------------------
-- 4. MASTER ENHANCED PLACE_ORDER_FROM_CART FUNCTION
--    (Coupon, Loyalty Points, Pre-order Bypass & Freebies Support)
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
    v_delivery_fee NUMERIC(10, 2) := 40.00; -- Standard delivery
    v_packaging_fee NUMERIC(10, 2) := 0.00;
    v_total_payable NUMERIC(10, 2) := 0.00;
    v_order_id UUID;
    v_order_number VARCHAR;
    v_cart_count INT := 0;
    v_cart_item RECORD;
    v_coupon_row RECORD;
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

    -- 5. Validate & Apply Coupon if provided
    IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) <> '' THEN
        BEGIN
            SELECT discount_amount INTO v_coupon_discount
            FROM validate_and_apply_coupon(TRIM(p_coupon_code), v_total_items_price, p_user_id);
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'Coupon Error: %', SQLERRM;
        END;
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

    -- 8. Insert Order Items Snapshot (Preserving is_freebie flag)
    FOR v_cart_item IN
        SELECT 
            ci.variant_id,
            ci.quantity,
            ci.is_freebie,
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
            -p_redeem_points,
            'redeemed_checkout',
            'Redeemed ' || p_redeem_points || ' points on Order #' || v_order_number
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
