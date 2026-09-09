-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Part 4: Seed Data for Reviews & Promotional Coupons
-- Database Engine: Supabase (PostgreSQL 16)
-- Seed File: 04_reviews_and_coupons_seed.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEED PROMOTIONAL COUPONS
-- ------------------------------------------------------------------------------
INSERT INTO coupons (
    id, code, discount_type, discount_value, max_discount_amount,
    min_order_amount, valid_from, valid_until, usage_limit_total,
    usage_limit_per_user, times_used, is_active
)
VALUES
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
        'WELCOME50',
        'flat',
        50.00,
        NULL,
        299.00,
        NOW() - INTERVAL '10 days',
        NOW() + INTERVAL '90 days',
        1000,
        1,
        12,
        true
    ),
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',
        'WBCS2026',
        'percentage',
        15.00,
        150.00,
        499.00,
        NOW() - INTERVAL '5 days',
        NOW() + INTERVAL '60 days',
        500,
        2,
        45,
        true
    ),
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03',
        'MALDAFREE',
        'flat',
        40.00,
        NULL,
        249.00,
        NOW() - INTERVAL '2 days',
        NOW() + INTERVAL '120 days',
        2000,
        1,
        28,
        true
    ),
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04',
        'PUJA2026',
        'percentage',
        20.00,
        250.00,
        599.00,
        NOW(),
        NOW() + INTERVAL '45 days',
        250,
        1,
        0,
        true
    )
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. SEED CUSTOMER REVIEWS (Verified Buyer)
-- ------------------------------------------------------------------------------
INSERT INTO reviews (
    id, book_id, user_id, order_id, rating, title, comment,
    is_verified_purchase, is_approved, helpful_votes_count, review_images
)
VALUES
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01',
        '44444444-4444-4444-4444-444444444401',
        '99999999-9999-9999-9999-999999999903',
        '88888888-8888-8888-8888-888888888801',
        5,
        'WBCS প্রস্তুতির জন্য অতুল চন্দ্র রায়ের সেরা বই',
        'বইটির পেপার কোয়ালিটি ও বাঁধাই খুব ভালো। প্রিলিমস এবং মেইনস উভয়ের জন্যই ইতিহাস অংশটি খুব পরিষ্কারভাবে সাজানো রয়েছে। মালদা শহরে মাত্র ১ দিনে ডেলিভারি পেয়েছি। এম.এম বুক হাউসকে ধন্যবাদ!',
        true,
        true,
        8,
        '["https://cdn.mmbookhouse.com/reviews/atul_roy_user_photo1.webp"]'::jsonb
    )
ON CONFLICT (book_id, user_id) DO NOTHING;

-- Trigger stats sync manually for initial seed in case trigger didn't fire during migration
UPDATE books
SET average_rating = 5.00, reviews_count = 1
WHERE id = '44444444-4444-4444-4444-444444444401';
