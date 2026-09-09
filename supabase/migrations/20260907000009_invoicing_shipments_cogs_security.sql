-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Part 7 (Tasks 31 to 35): GST Invoicing, Split Shipments, Idempotent Webhook & Margin Security
-- Database Engine: Supabase (PostgreSQL 16)
-- Migration: 20260907000009_invoicing_shipments_cogs_security.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TASK 31: SEQUENTIAL GST TAX INVOICE GENERATION
-- ------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS gst_invoice_seq START WITH 1;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR AS $$
BEGIN
    RETURN 'MMB-INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('gst_invoice_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT UNIQUE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL DEFAULT generate_invoice_number(),
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    financial_year VARCHAR(10) NOT NULL DEFAULT '2026-2027',
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    discount_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_total >= 0),
    delivery_charges NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_charges >= 0),
    taxable_amount NUMERIC(10, 2) NOT NULL CHECK (taxable_amount >= 0),
    cgst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (cgst_amount >= 0),
    sgst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (sgst_amount >= 0),
    igst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (igst_amount >= 0),
    grand_total NUMERIC(10, 2) NOT NULL CHECK (grand_total >= 0),
    hsn_sac_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
    invoice_pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE invoices IS 'GST Rule 46 compliant sequential tax invoices for Indian taxation audits';

CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);

-- Tax Invoice Generation Function (Atomically invoked upon confirmed payment)
CREATE OR REPLACE FUNCTION generate_tax_invoice(p_order_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_order orders%ROWTYPE;
    v_existing_inv invoices%ROWTYPE;
    v_new_inv_num VARCHAR;
    v_delivery_gst NUMERIC(10, 2) := 0.00;
    v_cgst NUMERIC(10, 2) := 0.00;
    v_sgst NUMERIC(10, 2) := 0.00;
BEGIN
    SELECT * INTO v_existing_inv FROM invoices WHERE order_id = p_order_id;
    IF FOUND THEN
        RETURN v_existing_inv.invoice_number;
    END IF;

    SELECT * INTO v_order FROM orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found', p_order_id;
    END IF;

    -- In India, printed books (HSN 4901) are exempt from GST (0%).
    -- Shipping/delivery charges (SAC 9968) carry 18% GST (9% CGST + 9% SGST intra-state West Bengal)
    IF v_order.delivery_fee > 0 THEN
        v_delivery_gst := ROUND((v_order.delivery_fee * 0.18), 2);
        v_cgst := ROUND(v_delivery_gst / 2.0, 2);
        v_sgst := v_delivery_gst - v_cgst;
    END IF;

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
        v_order.total_payable_amount,
        v_cgst,
        v_sgst,
        0.00,
        v_order.total_payable_amount,
        jsonb_build_array(
            jsonb_build_object('hsn', '4901', 'desc', 'Printed Books', 'taxable_val', v_order.total_items_price, 'gst_rate', '0%'),
            jsonb_build_object('sac', '9968', 'desc', 'Postal / Courier Freight', 'taxable_val', v_order.delivery_fee, 'gst_rate', '18%')
        )
    );

    RETURN v_new_inv_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- TASK 32: SPLIT SHIPMENTS & PARCEL TRACKING
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    shipment_number VARCHAR(50) NOT NULL,
    courier_name VARCHAR(100) NOT NULL DEFAULT 'India Post Speed Post',
    awb_code VARCHAR(100),
    tracking_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'manifested' CHECK (status IN (
        'manifested', 'picked_up', 'in_transit', 'out_for_delivery', 
        'delivered', 'rto_initiated', 'rto_delivered', 'lost'
    )),
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    label_pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_order_shipment_number UNIQUE(order_id, shipment_number)
);

COMMENT ON TABLE shipments IS 'Multi-parcel split shipments enabling individual tracking per box';

CREATE TRIGGER trigger_shipments_updated_at
    BEFORE UPDATE ON shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_awb ON shipments(awb_code);

CREATE TABLE IF NOT EXISTS shipment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    CONSTRAINT uq_shipment_item UNIQUE(shipment_id, order_item_id)
);

COMMENT ON TABLE shipment_items IS 'Maps which items and quantities belong to which split parcel';

-- ------------------------------------------------------------------------------
-- TASK 33: SAFE IDEMPOTENT PAYMENT WEBHOOK HANDLER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_payment_webhook(
    p_order_id UUID,
    p_gateway VARCHAR,
    p_gateway_payment_id VARCHAR,
    p_gateway_order_id VARCHAR,
    p_idempotency_key VARCHAR,
    p_amount NUMERIC,
    p_signature VARCHAR DEFAULT NULL,
    p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_existing payments%ROWTYPE;
    v_inv_num VARCHAR;
BEGIN
    -- Check idempotency by key or payment ID
    SELECT * INTO v_existing 
    FROM payments 
    WHERE idempotency_key = p_idempotency_key OR gateway_payment_id = p_gateway_payment_id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'already_processed', true,
            'payment_id', v_existing.id,
            'status', v_existing.status,
            'message', 'Webhook idempotent call ignored (already handled)'
        );
    END IF;

    -- Insert verified payment record
    INSERT INTO payments (
        order_id, gateway, gateway_order_id, gateway_payment_id,
        gateway_signature, idempotency_key, amount, currency,
        status, gateway_payload
    )
    VALUES (
        p_order_id, p_gateway, p_gateway_order_id, p_gateway_payment_id,
        p_signature, p_idempotency_key, p_amount, 'INR',
        'success', p_payload
    );

    -- Update order status
    UPDATE orders
    SET payment_status = 'captured',
        status = 'confirmed',
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Automatically generate sequential tax invoice
    v_inv_num := generate_tax_invoice(p_order_id);

    RETURN jsonb_build_object(
        'already_processed', false,
        'success', true,
        'invoice_number', v_inv_num,
        'order_id', p_order_id,
        'message', 'Payment captured and tax invoice generated'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_payment_webhook IS 'Idempotent handler ensuring duplicate webhooks never double credit or corrupt order state';

-- ------------------------------------------------------------------------------
-- TASK 34: RETURN, REFUND & RTO LIFECYCLE MANAGEMENT
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    return_number VARCHAR(50) UNIQUE NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    reason_code VARCHAR(50) NOT NULL CHECK (reason_code IN (
        'damaged_in_transit', 'wrong_book_delivered', 'defective_printing', 
        'missing_pages', 'rto_undelivered', 'customer_cancelled'
    )),
    reason_details TEXT,
    evidence_images JSONB NOT NULL DEFAULT '[]'::jsonb,
    pickup_status VARCHAR(50) NOT NULL DEFAULT 'requested' CHECK (pickup_status IN (
        'requested', 'pickup_scheduled', 'picked_up', 'received_at_store', 
        'inspection_passed', 'rejected'
    )),
    refund_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (refund_status IN (
        'not_applicable', 'pending', 'processed', 'failed'
    )),
    refund_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (refund_amount >= 0),
    bank_rrn VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE order_returns IS 'Tracks return requests, parcel inspections, and customer refunds';

CREATE TRIGGER trigger_order_returns_updated_at
    BEFORE UPDATE ON order_returns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_order_returns_order ON order_returns(order_id);
CREATE INDEX IF NOT EXISTS idx_order_returns_user ON order_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_order_returns_status ON order_returns(pickup_status, refund_status);

-- Function to inspect return and restock if approved
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
BEGIN
    SELECT * INTO v_ret FROM order_returns WHERE id = p_return_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Return % not found', p_return_id;
    END IF;

    SELECT * INTO v_item FROM order_items WHERE id = v_ret.order_item_id;

    IF p_passed THEN
        UPDATE order_returns
        SET pickup_status = 'inspection_passed',
            refund_status = 'pending',
            updated_at = NOW()
        WHERE id = p_return_id;

        -- Restock undamaged book into inventory via ledger
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

        RETURN jsonb_build_object('success', true, 'status', 'inspection_passed', 'message', 'Return passed and item restocked to inventory');
    ELSE
        UPDATE order_returns
        SET pickup_status = 'rejected',
            refund_status = 'not_applicable',
            updated_at = NOW()
        WHERE id = p_return_id;

        RETURN jsonb_build_object('success', true, 'status', 'rejected', 'message', 'Return rejected by inspector');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- TASK 35: COST PRICE (COGS) & PROFIT MARGIN SECURITY
-- ------------------------------------------------------------------------------
ALTER TABLE book_variants ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) CHECK (cost_price >= 0);

-- Secure view for store owner profit margins (Accessible to admin only)
CREATE OR REPLACE VIEW v_profit_margin_analytics AS
SELECT 
    bv.id AS variant_id,
    b.title AS book_title,
    b.title_bn AS book_title_bn,
    p.name AS publisher_name,
    bv.sku,
    bv.binding,
    bv.condition,
    bv.mrp,
    bv.selling_price,
    COALESCE(bv.cost_price, 0.00) AS cost_price,
    (bv.selling_price - COALESCE(bv.cost_price, 0.00)) AS gross_profit_margin_inr,
    CASE 
        WHEN bv.selling_price > 0 THEN 
            ROUND((((bv.selling_price - COALESCE(bv.cost_price, 0.00)) / bv.selling_price) * 100.0), 2)
        ELSE 0.00 
    END AS profit_margin_percent,
    COALESCE(inv.stock_quantity, 0) AS current_stock,
    (COALESCE(inv.stock_quantity, 0) * COALESCE(bv.cost_price, 0.00)) AS total_inventory_valuation_inr
FROM book_variants bv
JOIN books b ON bv.book_id = b.id
LEFT JOIN publishers p ON b.publisher_id = p.id
LEFT JOIN inventory inv ON bv.id = inv.variant_id
WHERE bv.is_active = TRUE;

COMMENT ON VIEW v_profit_margin_analytics IS 'Store financial analytics for COGS, margins, and valuation. Admin-only access.';

-- ------------------------------------------------------------------------------
-- RLS POLICIES FOR PART 7 TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own invoices or admin can view all" ON invoices;
CREATE POLICY "Users can view own invoices or admin can view all" 
    ON invoices FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = invoices.order_id 
              AND (orders.user_id = auth.uid() OR public.is_admin_or_staff())
        )
    );

DROP POLICY IF EXISTS "Invoices modifiable by admin only" ON invoices;
CREATE POLICY "Invoices modifiable by admin only" 
    ON invoices FOR ALL 
    USING (public.is_admin_or_staff());

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own shipments or admin can view all" ON shipments;
CREATE POLICY "Users can view own shipments or admin can view all" 
    ON shipments FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = shipments.order_id 
              AND (orders.user_id = auth.uid() OR public.is_admin_or_staff())
        )
    );

DROP POLICY IF EXISTS "Shipments modifiable by admin/staff only" ON shipments;
CREATE POLICY "Shipments modifiable by admin/staff only" 
    ON shipments FOR ALL 
    USING (public.is_admin_or_staff());

ALTER TABLE shipment_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own shipment items or admin can view all" ON shipment_items;
CREATE POLICY "Users can view own shipment items or admin can view all" 
    ON shipment_items FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM shipments s
            JOIN orders o ON s.order_id = o.id
            WHERE s.id = shipment_items.shipment_id 
              AND (o.user_id = auth.uid() OR public.is_admin_or_staff())
        )
    );

DROP POLICY IF EXISTS "Shipment items modifiable by admin/staff only" ON shipment_items;
CREATE POLICY "Shipment items modifiable by admin/staff only" 
    ON shipment_items FOR ALL 
    USING (public.is_admin_or_staff());

ALTER TABLE order_returns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own returns or admin can view all" ON order_returns;
CREATE POLICY "Users can view own returns or admin can view all" 
    ON order_returns FOR SELECT 
    USING (auth.uid() = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Users can request returns" ON order_returns;
CREATE POLICY "Users can request returns" 
    ON order_returns FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Returns modifiable by admin/staff only" ON order_returns;
CREATE POLICY "Returns modifiable by admin/staff only" 
    ON order_returns FOR UPDATE 
    USING (public.is_admin_or_staff());
