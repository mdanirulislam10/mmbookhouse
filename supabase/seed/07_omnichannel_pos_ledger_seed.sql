-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Part 6: Seed Data for Omnichannel POS, Stock Adjustments & Preorders
-- Database Engine: Supabase (PostgreSQL 16)
-- Seed File: 07_omnichannel_pos_ledger_seed.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEED PHYSICAL STOCK ADJUSTMENT (Audit Ledger Entry)
-- ------------------------------------------------------------------------------
INSERT INTO stock_adjustments (
    id, variant_id, change_quantity, reason, notes, adjusted_by
)
VALUES
    (
        'cccccccc-cccc-cccc-cccc-cccccccccc01',
        '55555555-5555-5555-5555-555555555501',
        -1,
        'damaged',
        'Rain water damage near warehouse window in Malda shop',
        '99999999-9999-9999-9999-999999999902' -- Rahul Karmakar (Staff)
    ),
    (
        'cccccccc-cccc-cccc-cccc-cccccccccc02',
        '55555555-5555-5555-5555-555555555511',
        20,
        'new_stock_arrival',
        'Direct consignment shipment from Chhaya Prakashani Kolkata Depot',
        '99999999-9999-9999-9999-999999999901' -- Admin
    )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. SEED SAMPLE PRE-ORDER BOOK VARIANT & WAITLIST
-- ------------------------------------------------------------------------------
-- Set Sei Somoy Hardcover as Preorder for upcoming deluxe edition
UPDATE book_variants
SET 
    is_preorder = true,
    expected_release_date = CURRENT_DATE + INTERVAL '15 days',
    max_preorder_limit = 50,
    current_preorders_count = 1
WHERE id = '55555555-5555-5555-5555-555555555521';

INSERT INTO preorder_waitlists (
    id, variant_id, user_id, status
)
VALUES
    (
        'dddddddd-dddd-dddd-dddd-dddddddddd01',
        '55555555-5555-5555-5555-555555555521',
        '99999999-9999-9999-9999-999999999903',
        'waiting'
    )
ON CONFLICT (variant_id, user_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. SEED SAMPLE LOW STOCK ALERT
-- ------------------------------------------------------------------------------
INSERT INTO inventory_alerts (
    id, variant_id, alert_type, message, current_stock, threshold, is_resolved
)
VALUES
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01',
        '55555555-5555-5555-5555-555555555503',
        'low_stock',
        'Used paperback copy of Bharater Itihas is low in stock (3 units left)',
        3,
        5,
        false
    )
ON CONFLICT (id) DO NOTHING;
