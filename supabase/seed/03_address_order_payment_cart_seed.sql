-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Part 3 (Tasks 11 to 15): Sample Seed Data for Addresses, Cart, Wishlist & Orders
-- Database Engine: Supabase (PostgreSQL 16)
-- Seed File: 03_address_order_payment_cart_seed.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEED CUSTOMER ADDRESSES
-- ------------------------------------------------------------------------------
INSERT INTO customer_addresses (
    id, user_id, address_type, recipient_name, recipient_phone,
    alternate_phone, street_address, landmark, city, district, state, pincode, is_default
)
VALUES
    (
        '77777777-7777-7777-7777-777777777701',
        '99999999-9999-9999-9999-999999999903',
        'home',
        'Anirban Sen',
        '+919832000003',
        '+919832000099',
        'Holding 45/A, Rathbari More, Near Netaji Statue',
        'Opposite Malda Town Railway High School',
        'English Bazar',
        'Malda',
        'West Bengal',
        '732101',
        true
    ),
    (
        '77777777-7777-7777-7777-777777777702',
        '99999999-9999-9999-9999-999999999903',
        'hostel',
        'Anirban Sen (Study Room)',
        '+919832000003',
        NULL,
        'Youth Study Hostel, 2nd Floor, Mahananda Pally',
        'Near Mahananda River Bridge',
        'English Bazar',
        'Malda',
        'West Bengal',
        '732101',
        false
    )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. SEED PERSISTENT CART ITEMS & SAVE FOR LATER
-- ------------------------------------------------------------------------------
INSERT INTO cart_items (id, user_id, variant_id, quantity, is_saved_for_later)
VALUES
    -- Active in cart: Chhaya WBCS Manual 2026
    (
        '66666666-6666-6666-6666-666666666601',
        '99999999-9999-9999-9999-999999999903',
        '55555555-5555-5555-5555-555555555511',
        1,
        false
    ),
    -- Saved for later: Bharater Itihas (Used Paperback - budget option)
    (
        '66666666-6666-6666-6666-666666666602',
        '99999999-9999-9999-9999-999999999903',
        '55555555-5555-5555-5555-555555555503',
        1,
        true
    )
ON CONFLICT (user_id, variant_id) DO UPDATE SET
    quantity = EXCLUDED.quantity,
    is_saved_for_later = EXCLUDED.is_saved_for_later;

-- ------------------------------------------------------------------------------
-- 3. SEED WISHLIST ITEMS
-- ------------------------------------------------------------------------------
INSERT INTO wishlist_items (id, user_id, book_id, priority)
VALUES
    -- Desired book: Sei Somoy by Sunil Gangopadhyay
    (
        '66666666-6666-6666-6666-666666666611',
        '99999999-9999-9999-9999-999999999903',
        '44444444-4444-4444-4444-444444444403',
        1
    )
ON CONFLICT (user_id, book_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. SEED SAMPLE COMPLETED ORDER WITH IMMUTABLE ADDRESS SNAPSHOT
-- ------------------------------------------------------------------------------
INSERT INTO orders (
    id, order_number, user_id, status, total_items_price, discount_amount,
    coupon_code, delivery_fee, packaging_fee, total_payable_amount,
    payment_method, payment_status, shipping_address_snapshot, customer_notes
)
VALUES
    (
        '88888888-8888-8888-8888-888888888801',
        'MMB-202609-01001',
        '99999999-9999-9999-9999-999999999903',
        'delivered',
        360.00,
        0.00,
        NULL,
        40.00,
        0.00,
        400.00,
        'upi',
        'captured',
        '{
            "recipient_name": "Anirban Sen",
            "recipient_phone": "+919832000003",
            "street_address": "Holding 45/A, Rathbari More, Near Netaji Statue",
            "landmark": "Opposite Malda Town Railway High School",
            "city": "English Bazar",
            "district": "Malda",
            "state": "West Bengal",
            "pincode": "732101",
            "snapshot_timestamp": "2026-09-05T10:30:00Z"
        }'::jsonb,
        'Please deliver during daytime between 10 AM to 4 PM.'
    )
ON CONFLICT (order_number) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. SEED ORDER ITEMS (Immutable Item Snapshot)
-- ------------------------------------------------------------------------------
INSERT INTO order_items (
    id, order_id, variant_id, book_title, book_title_bn, sku,
    binding, condition, unit_mrp, unit_selling_price, quantity
)
VALUES
    (
        '88888888-8888-8888-8888-888888888811',
        '88888888-8888-8888-8888-888888888801',
        '55555555-5555-5555-5555-555555555501',
        'Bharater Itihas O Jatiyo Mukti Sangram',
        'ভারতের ইতিহাস ও জাতীয় মুক্তি সংগ্রাম',
        'MMB-HIST-ATUL-PB-NEW',
        'paperback',
        'new',
        480.00,
        360.00,
        1
    )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. SEED PAYMENT AUDIT RECORD (Razorpay Idempotent Payload)
-- ------------------------------------------------------------------------------
INSERT INTO payments (
    id, order_id, gateway, gateway_order_id, gateway_payment_id,
    gateway_signature, idempotency_key, amount, currency, status, gateway_payload
)
VALUES
    (
        '88888888-8888-8888-8888-888888888821',
        '88888888-8888-8888-8888-888888888801',
        'razorpay',
        'order_N871a9xZkl921a',
        'pay_N872b0cDef9102',
        'f8791c2b5d43e8a10f92b451239845abcdef789123456789abcdef1234567890',
        'idemp_mmb_ord_01001_pay_01',
        400.00,
        'INR',
        'success',
        '{
            "event": "payment.captured",
            "gateway": "razorpay",
            "method": "upi",
            "vpa": "anirban@okhdfcbank",
            "bank": null,
            "wallet": null,
            "captured_at": "2026-09-05T10:32:15Z",
            "acquirer_data": {
                "rrn": "624819201928",
                "upi_transaction_id": "UPI-IND-MALDA-09281"
            }
        }'::jsonb
    )
ON CONFLICT (idempotency_key) DO NOTHING;
