-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Part 3 Hardening & Financial Security Audit Remediation
-- Migration: 20260907000005_part3_order_payment_hardening.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. [CRITICAL 1] ORDERS CLIENT-SIDE INSERT HARDENING & FINANCIAL MATH CHECK
-- ------------------------------------------------------------------------------
-- Restrict direct client-side orders to strictly pending state
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can insert own orders" 
    ON orders FOR INSERT 
    WITH CHECK (
        (auth.uid() = user_id OR public.is_admin_or_staff())
        AND status = 'pending'
        AND payment_status = 'pending'
    );

-- Enforce mathematical consistency of total payable amount
ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_total_payable_math;
ALTER TABLE orders ADD CONSTRAINT chk_orders_total_payable_math
    CHECK (total_payable_amount = GREATEST(0, (total_items_price - discount_amount + delivery_fee + packaging_fee)));

-- ------------------------------------------------------------------------------
-- 2. [CRITICAL 2] FINANCIAL AUDIT PROTECTION: PAYMENTS ON DELETE RESTRICT
-- ------------------------------------------------------------------------------
-- Prevent cascading deletion of payment records if an order is ever touched
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_order_id_fkey;
ALTER TABLE payments ADD CONSTRAINT payments_order_id_fkey 
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;

-- ------------------------------------------------------------------------------
-- 3. [HIGH 3] GATEWAY PAYMENT ID PARTIAL UNIQUE INDEX
-- ------------------------------------------------------------------------------
-- Prevent duplicate payments / multiple webhooks for the same payment transaction
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_gateway_payment_id 
    ON payments (gateway_payment_id) 
    WHERE gateway_payment_id IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 4. [HIGH 4] LOGISTICS & COURIER TRACKING FIELDS ON ORDERS
-- ------------------------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;

CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number) WHERE tracking_number IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 5. [HIGH 5] ORDER ITEMS COVER IMAGE SNAPSHOT
-- ------------------------------------------------------------------------------
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- ------------------------------------------------------------------------------
-- 6. [DATA INTEGRITY 6] SINGLE DEFAULT ADDRESS & 6-DIGIT INDIAN PINCODE CHECK
-- ------------------------------------------------------------------------------
-- Concurrent-safe unique partial index for default address per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_single_default_address 
    ON customer_addresses (user_id) 
    WHERE is_default = TRUE;

-- Standard Indian 6-digit postal PIN code format validation
ALTER TABLE customer_addresses DROP CONSTRAINT IF EXISTS chk_valid_indian_pincode;
ALTER TABLE customer_addresses ADD CONSTRAINT chk_valid_indian_pincode 
    CHECK (pincode ~ '^[1-9][0-9]{5}$');

-- ------------------------------------------------------------------------------
-- 7. [AUTOMATION 7] ATOMIC TRANSACTION: PLACE_ORDER_FROM_CART()
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION place_order_from_cart(
    p_user_id UUID,
    p_address_id UUID,
    p_payment_method VARCHAR,
    p_coupon_code VARCHAR DEFAULT NULL,
    p_customer_notes TEXT DEFAULT NULL
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
    v_discount_amount NUMERIC(10, 2) := 0.00;
    v_delivery_fee NUMERIC(10, 2) := 40.00; -- Standard delivery
    v_packaging_fee NUMERIC(10, 2) := 0.00;
    v_total_payable NUMERIC(10, 2) := 0.00;
    v_order_id UUID;
    v_order_number VARCHAR;
    v_cart_count INT := 0;
    v_cart_item RECORD;
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

    -- 3. Calculate total items price
    SELECT COALESCE(SUM(bv.selling_price * ci.quantity), 0.00)
    INTO v_total_items_price
    FROM cart_items ci
    JOIN book_variants bv ON ci.variant_id = bv.id
    WHERE ci.user_id = p_user_id AND ci.is_saved_for_later = FALSE;

    -- Free delivery over ₹500
    IF v_total_items_price >= 500.00 THEN
        v_delivery_fee := 0.00;
    END IF;

    v_total_payable := GREATEST(0.00, (v_total_items_price - v_discount_amount + v_delivery_fee + v_packaging_fee));
    v_order_id := gen_random_uuid();
    v_order_number := generate_order_number();

    -- 4. Insert Order Header
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
        v_discount_amount,
        p_coupon_code,
        v_delivery_fee,
        v_packaging_fee,
        v_total_payable,
        p_payment_method,
        'pending',
        v_address_snapshot,
        p_customer_notes
    );

    -- 5. Insert Order Items Snapshot
    FOR v_cart_item IN
        SELECT 
            ci.variant_id,
            ci.quantity,
            b.title AS book_title,
            b.title_bn AS book_title_bn,
            COALESCE(b.preview_images->>0, '') AS cover_image_url,
            bv.sku,
            bv.binding,
            bv.condition,
            bv.mrp AS unit_mrp,
            bv.selling_price AS unit_selling_price
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
            quantity
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
            v_cart_item.quantity
        );
    END LOOP;

    -- 6. Clear active items from cart (keep Saved for Later items intact)
    DELETE FROM cart_items
    WHERE user_id = p_user_id AND is_saved_for_later = FALSE;

    -- Return created order info
    RETURN QUERY
    SELECT v_order_id, v_order_number, v_total_payable;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION place_order_from_cart IS 'Atomically converts customer cart to order with immutable address & item snapshots';
