-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Part 6 (Tasks 26 to 30): Omnichannel POS, Shelf Tracking, Stock Ledger & Pre-orders
-- Database Engine: Supabase (PostgreSQL 16)
-- Migration: 20260907000008_omnichannel_pos_inventory_ledger.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TASK 26: OMNICHANNEL POS & SALES CHANNELS
-- ------------------------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS channel VARCHAR(50) NOT NULL DEFAULT 'web' 
    CHECK (channel IN ('web', 'store_counter', 'whatsapp', 'phone'));

CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel);

-- In-Store POS counter sale processing function
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
        v_variant.binding, v_variant.condition, COALESCE(v_book.preview_images->>0, ''),
        v_variant.mrp, v_variant.selling_price, p_quantity
    );

    -- 6. Insert payment record
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

COMMENT ON FUNCTION process_pos_counter_sale IS 'Executes offline in-store counter sale, deducting central inventory immediately';

-- ------------------------------------------------------------------------------
-- TASK 27: WAREHOUSE & STORE PICKING SLIP HELPER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_order_picking_slip(p_order_id UUID)
RETURNS TABLE (
    order_number VARCHAR,
    sku VARCHAR,
    book_title VARCHAR,
    binding VARCHAR,
    condition VARCHAR,
    shelf_location VARCHAR,
    bin_number VARCHAR,
    quantity INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.order_number,
        oi.sku,
        oi.book_title,
        oi.binding,
        oi.condition,
        COALESCE(bv.shelf_location, 'Unassigned') AS shelf_location,
        COALESCE(bv.bin_number, 'Unassigned') AS bin_number,
        oi.quantity
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    LEFT JOIN book_variants bv ON oi.variant_id = bv.id
    WHERE oi.order_id = p_order_id
    ORDER BY bv.shelf_location ASC, bv.bin_number ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_order_picking_slip IS 'Generates ordered picking path by shelf and rack for warehouse staff';

-- ------------------------------------------------------------------------------
-- TASK 28: LOW STOCK ALERTS & PG_NOTIFY TRIGGER
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES book_variants(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL DEFAULT 'low_stock',
    message TEXT NOT NULL,
    current_stock INT NOT NULL,
    threshold INT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE inventory_alerts IS 'Alert notifications when physical stock crosses low-stock thresholds';

CREATE INDEX IF NOT EXISTS idx_inventory_alerts_variant ON inventory_alerts(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_unresolved ON inventory_alerts(is_resolved) WHERE is_resolved = FALSE;

-- Trigger to notify on low stock
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_sku VARCHAR;
BEGIN
    IF NEW.stock_quantity <= NEW.low_stock_threshold AND (OLD.stock_quantity > OLD.low_stock_threshold OR OLD.stock_quantity IS NULL) THEN
        SELECT sku INTO v_sku FROM book_variants WHERE id = NEW.variant_id;

        INSERT INTO inventory_alerts (variant_id, message, current_stock, threshold)
        VALUES (
            NEW.variant_id,
            'Low stock warning: SKU ' || COALESCE(v_sku, '') || ' has reached ' || NEW.stock_quantity || ' units (Threshold: ' || NEW.low_stock_threshold || ')',
            NEW.stock_quantity,
            NEW.low_stock_threshold
        );

        -- Send real-time postgres notification
        PERFORM pg_notify(
            'low_stock_channel',
            jsonb_build_object(
                'variant_id', NEW.variant_id,
                'sku', v_sku,
                'current_stock', NEW.stock_quantity,
                'threshold', NEW.low_stock_threshold,
                'timestamp', NOW()
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_low_stock ON inventory;
CREATE TRIGGER trigger_notify_low_stock
    AFTER UPDATE OF stock_quantity ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION notify_low_stock();

-- ------------------------------------------------------------------------------
-- TASK 29: DOUBLE-ENTRY STOCK ADJUSTMENT AUDIT LEDGER
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES book_variants(id) ON DELETE CASCADE,
    change_quantity INT NOT NULL,
    reason VARCHAR(50) NOT NULL CHECK (reason IN (
        'damaged', 'defective', 'lost', 'audit_correction', 
        'return_restock', 'new_stock_arrival', 'supplier_consignment'
    )),
    notes TEXT,
    adjusted_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE stock_adjustments IS 'Double-entry stock ledger for physical corrections, damage, and supplier arrivals';

CREATE INDEX IF NOT EXISTS idx_stock_adjustments_variant ON stock_adjustments(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_created_at ON stock_adjustments(created_at DESC);

-- Automatic stock adjustment application
CREATE OR REPLACE FUNCTION apply_stock_adjustment()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventory
    SET stock_quantity = stock_quantity + NEW.change_quantity,
        updated_at = NOW()
    WHERE variant_id = NEW.variant_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_apply_stock_adjustment ON stock_adjustments;
CREATE TRIGGER trigger_apply_stock_adjustment
    AFTER INSERT ON stock_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION apply_stock_adjustment();

-- ------------------------------------------------------------------------------
-- TASK 30: PRE-ORDER & BACK-ORDER MANAGEMENT ENGINE
-- ------------------------------------------------------------------------------
ALTER TABLE book_variants ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE book_variants ADD COLUMN IF NOT EXISTS expected_release_date DATE;
ALTER TABLE book_variants ADD COLUMN IF NOT EXISTS max_preorder_limit INT DEFAULT 100;
ALTER TABLE book_variants ADD COLUMN IF NOT EXISTS current_preorders_count INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS preorder_waitlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES book_variants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'allocated', 'dispatched', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_preorder_user_variant UNIQUE (variant_id, user_id)
);

COMMENT ON TABLE preorder_waitlists IS 'Tracks preorder queues for books releasing soon from press';

CREATE INDEX IF NOT EXISTS idx_preorder_waitlists_variant ON preorder_waitlists(variant_id, status);

-- FIFO Pre-order allocation function when new press stock arrives
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

    -- 2. Update physical inventory with leftover stock
    UPDATE inventory
    SET stock_quantity = stock_quantity + (p_new_stock - v_allocated_count),
        updated_at = NOW()
    WHERE variant_id = p_variant_id;

    -- 3. Turn off preorder mode if all queue served and general stock is live
    UPDATE book_variants
    SET is_preorder = FALSE,
        current_preorders_count = GREATEST(0, current_preorders_count - v_allocated_count)
    WHERE id = p_variant_id;

    RETURN jsonb_build_object(
        'success', true,
        'allocated_to_preorders', v_allocated_count,
        'general_stock_added', (p_new_stock - v_allocated_count),
        'message', 'Preorder FIFO allocation completed successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION release_preorder_to_stock IS 'Allocates press stock FIFO to waiting preorder customers';

-- ------------------------------------------------------------------------------
-- RLS POLICIES FOR PART 6 TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alerts viewable and modifiable by admin/staff only" ON inventory_alerts;
CREATE POLICY "Alerts viewable and modifiable by admin/staff only" 
    ON inventory_alerts FOR ALL 
    USING (public.is_admin_or_staff());

ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Stock adjustments viewable and modifiable by admin/staff only" ON stock_adjustments;
CREATE POLICY "Stock adjustments viewable and modifiable by admin/staff only" 
    ON stock_adjustments FOR ALL 
    USING (public.is_admin_or_staff());

ALTER TABLE preorder_waitlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preorders or admin can view all" ON preorder_waitlists;
CREATE POLICY "Users can view own preorders or admin can view all" 
    ON preorder_waitlists FOR SELECT 
    USING (auth.uid() = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Users can insert own preorders" ON preorder_waitlists;
CREATE POLICY "Users can insert own preorders" 
    ON preorder_waitlists FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Preorders modifiable by admin/staff only" ON preorder_waitlists;
CREATE POLICY "Preorders modifiable by admin/staff only" 
    ON preorder_waitlists FOR UPDATE 
    USING (public.is_admin_or_staff());
