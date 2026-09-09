-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Part 3 (Tasks 11 to 15): Customer Address, Order Snapshot, Payments & Cart
-- Database Engine: Supabase (PostgreSQL 16)
-- Migration: 20260907000004_address_order_payment_cart.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TASK 11: CUSTOMER ADDRESSES TABLE (Multiple Delivery Addresses)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    address_type VARCHAR(20) NOT NULL DEFAULT 'home' CHECK (address_type IN ('home', 'work', 'hostel', 'other')),
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    street_address TEXT NOT NULL,
    landmark VARCHAR(255),
    city VARCHAR(100) NOT NULL DEFAULT 'Malda',
    district VARCHAR(100) NOT NULL DEFAULT 'Malda',
    state VARCHAR(100) NOT NULL DEFAULT 'West Bengal',
    pincode VARCHAR(10) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE customer_addresses IS 'Customer address book supporting multiple delivery locations and default selection';

CREATE TRIGGER trigger_customer_addresses_updated_at
    BEFORE UPDATE ON customer_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function & Trigger: Ensure only one default address per customer
CREATE OR REPLACE FUNCTION handle_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE customer_addresses
        SET is_default = FALSE, updated_at = NOW()
        WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_handle_single_default_address ON customer_addresses;
CREATE TRIGGER trigger_handle_single_default_address
    BEFORE INSERT OR UPDATE OF is_default ON customer_addresses
    FOR EACH ROW
    WHEN (NEW.is_default = TRUE)
    EXECUTE FUNCTION handle_single_default_address();

CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_pincode ON customer_addresses(pincode);

-- ------------------------------------------------------------------------------
-- TASK 13 & 12: ORDERS TABLE & IMMUTABLE ADDRESS SNAPSHOT
-- ------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1001;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR AS $$
BEGIN
    RETURN 'MMB-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL DEFAULT generate_order_number(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'processing', 'packed', 
        'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'
    )),
    total_items_price NUMERIC(10, 2) NOT NULL CHECK (total_items_price >= 0),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    coupon_code VARCHAR(50),
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_fee >= 0),
    packaging_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (packaging_fee >= 0),
    total_payable_amount NUMERIC(10, 2) NOT NULL CHECK (total_payable_amount >= 0),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('upi', 'card', 'netbanking', 'cod', 'wallet')),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'authorized', 'captured', 'failed', 'refunded')),
    shipping_address_snapshot JSONB NOT NULL,
    billing_address_snapshot JSONB,
    customer_notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE orders IS 'Orders master header containing financial breakdown, statuses, and immutable address snapshot';
COMMENT ON COLUMN orders.shipping_address_snapshot IS 'Immutable JSONB snapshot of recipient name, phone, address, and pincode at the moment of order placement';

CREATE TRIGGER trigger_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- ------------------------------------------------------------------------------
-- TASK 13: ORDER ITEMS TABLE (Immutable Book and Price Snapshots)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES book_variants(id) ON DELETE SET NULL,
    book_title VARCHAR(255) NOT NULL,
    book_title_bn VARCHAR(255),
    sku VARCHAR(100) NOT NULL,
    binding VARCHAR(50) NOT NULL,
    condition VARCHAR(50) NOT NULL,
    unit_mrp NUMERIC(10, 2) NOT NULL CHECK (unit_mrp >= 0),
    unit_selling_price NUMERIC(10, 2) NOT NULL CHECK (unit_selling_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(10, 2) GENERATED ALWAYS AS (unit_selling_price * quantity) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE order_items IS 'Line items for each order preserving immutable title, binding, and pricing snapshots';

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);

-- ------------------------------------------------------------------------------
-- TASK 14: PAYMENTS AUDIT LEDGER TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    gateway VARCHAR(50) NOT NULL CHECK (gateway IN ('razorpay', 'cashfree', 'phonepe', 'cod')),
    gateway_order_id VARCHAR(255),
    gateway_payment_id VARCHAR(255),
    gateway_signature VARCHAR(255),
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(50) NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'success', 'failed', 'refunded', 'disputed')),
    error_code VARCHAR(100),
    error_description TEXT,
    gateway_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE payments IS 'Double-entry payment transaction ledger with idempotency protection and raw webhook audit trail';

CREATE TRIGGER trigger_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_payment_id ON payments(gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_idempotency_key ON payments(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ------------------------------------------------------------------------------
-- TASK 15: DATABASE-BACKED PERSISTENT CART & WISHLIST
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES book_variants(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 20),
    is_saved_for_later BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_variant_cart UNIQUE (user_id, variant_id)
);

COMMENT ON TABLE cart_items IS 'Omnichannel persistent shopping cart with Save for Later capability';

CREATE TRIGGER trigger_cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON cart_items(variant_id);

CREATE TABLE IF NOT EXISTS wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    priority INT NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_book_wishlist UNIQUE (user_id, book_id)
);

COMMENT ON TABLE wishlist_items IS 'Customer wishlist tracking desired books across devices';

CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_book_id ON wishlist_items(book_id);

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES FOR PART 3 TABLES
-- ------------------------------------------------------------------------------

-- 1. customer_addresses RLS
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own addresses" ON customer_addresses;
CREATE POLICY "Users can manage own addresses" 
    ON customer_addresses FOR ALL 
    USING (auth.uid() = user_id OR public.is_admin_or_staff())
    WITH CHECK (auth.uid() = user_id OR public.is_admin_or_staff());

-- 2. orders RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders or admin can view all" ON orders;
CREATE POLICY "Users can view own orders or admin can view all" 
    ON orders FOR SELECT 
    USING (auth.uid() = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can insert own orders" 
    ON orders FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Orders modifiable by admin/staff only" ON orders;
CREATE POLICY "Orders modifiable by admin/staff only" 
    ON orders FOR UPDATE 
    USING (public.is_admin_or_staff());

-- 3. order_items RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items" 
    ON order_items FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
              AND (orders.user_id = auth.uid() OR public.is_admin_or_staff())
        )
    );

DROP POLICY IF EXISTS "Order items insertable with order" ON order_items;
CREATE POLICY "Order items insertable with order" 
    ON order_items FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
              AND (orders.user_id = auth.uid() OR public.is_admin_or_staff())
        )
    );

-- 4. payments RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own order payments" ON payments;
CREATE POLICY "Users can view own order payments" 
    ON payments FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = payments.order_id 
              AND (orders.user_id = auth.uid() OR public.is_admin_or_staff())
        )
    );

DROP POLICY IF EXISTS "Payments modifiable by admin/staff only" ON payments;
CREATE POLICY "Payments modifiable by admin/staff only" 
    ON payments FOR ALL 
    USING (public.is_admin_or_staff());

-- 5. cart_items RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own cart items" ON cart_items;
CREATE POLICY "Users can manage own cart items" 
    ON cart_items FOR ALL 
    USING (auth.uid() = user_id OR public.is_admin_or_staff())
    WITH CHECK (auth.uid() = user_id OR public.is_admin_or_staff());

-- 6. wishlist_items RLS
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own wishlist" ON wishlist_items;
CREATE POLICY "Users can manage own wishlist" 
    ON wishlist_items FOR ALL 
    USING (auth.uid() = user_id OR public.is_admin_or_staff())
    WITH CHECK (auth.uid() = user_id OR public.is_admin_or_staff());
