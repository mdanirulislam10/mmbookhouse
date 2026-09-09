-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Part 8 (Tasks 36 to 40): Sample Seed Data for Loyalty, Rules, Q&A & Alerts
-- Database Engine: Supabase (PostgreSQL 16)
-- Seed File: 09_loyalty_qa_alerts_seed.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEED LOYALTY REWARDS LEDGER (Tasks 36)
-- ------------------------------------------------------------------------------
INSERT INTO loyalty_ledger (
    id, user_id, order_id, points, transaction_type, notes
)
VALUES
    -- Welcome bonus points on signup
    (
        'cccccccc-cccc-cccc-cccc-cccccccccc01',
        '99999999-9999-9999-9999-999999999903',
        NULL,
        50,
        'bonus_signup',
        'Welcome bonus points credited for joining M.M Book House Malda'
    ),
    -- Earned points from completed order #MMB-202609-01001 (400 INR spent -> 20 points)
    (
        'cccccccc-cccc-cccc-cccc-cccccccccc02',
        '99999999-9999-9999-9999-999999999903',
        '88888888-8888-8888-8888-888888888801',
        20,
        'earned_purchase',
        'Earned 20 points for Order #MMB-202609-01001'
    )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. SEED PROMOTIONAL FREEBIE RULES (Task 37)
-- ------------------------------------------------------------------------------
INSERT INTO promotional_rules (
    id, rule_name, rule_type, trigger_book_id, trigger_min_amount, gift_variant_id, is_active, valid_from, valid_until
)
VALUES
    -- Free promotional study guide with WBCS Manual
    (
        'dddddddd-dddd-dddd-dddd-dddddddddd01',
        'WBCS Special: Free Study Guide with Chhaya WBCS Manual 2026',
        'freebie_with_product',
        '44444444-4444-4444-4444-444444444402',
        NULL,
        '55555555-5555-5555-5555-555555555503',
        true,
        NOW() - INTERVAL '5 days',
        NOW() + INTERVAL '60 days'
    ),
    -- Free classic book with cart order above 999 INR
    (
        'dddddddd-dddd-dddd-dddd-dddddddddd02',
        'Grand Book Fair: Free Classic Novel on orders above Rs. 999',
        'freebie_above_amount',
        NULL,
        999.00,
        '55555555-5555-5555-5555-555555555501',
        true,
        NOW() - INTERVAL '1 day',
        NOW() + INTERVAL '90 days'
    )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. SEED REVIEW HELPFUL VOTES (Task 38)
-- ------------------------------------------------------------------------------
INSERT INTO review_votes (
    id, review_id, user_id, vote_type
)
VALUES
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01',
        '99999999-9999-9999-9999-999999999902',
        'helpful'
    )
ON CONFLICT (review_id, user_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. SEED PRODUCT QUESTIONS & ANSWERS (Task 39)
-- ------------------------------------------------------------------------------
INSERT INTO product_questions (
    id, book_id, user_id, question_text, is_approved
)
VALUES
    (
        'ffffffff-ffff-ffff-ffff-ffffffffff01',
        '44444444-4444-4444-4444-444444444402',
        '99999999-9999-9999-9999-999999999903',
        'এই ২০২৬ সংস্করণে কি ২০২৩ ও ২০২৪ সালের WBCS প্রিলিমস ও মেইনস পরীক্ষার প্রশ্নপত্র সম্পূর্ণ সমাধান সহ অন্তর্ভুক্ত রয়েছে?',
        true
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_answers (
    id, question_id, user_id, answer_text, is_staff_answer, is_verified_buyer, is_approved, helpful_votes
)
VALUES
    (
        '10101010-1010-1010-1010-101010101001',
        'ffffffff-ffff-ffff-ffff-ffffffffff01',
        '99999999-9999-9999-9999-999999999902',
        'হ্যাঁ, এই ২০২৬ সালের একদম নতুন সংস্করণে ২০২৩ ও ২০২৪ সালের সমস্ত বিষয়ের প্রিলিমিনারি এবং মেইনস প্রশ্নোত্তরের পুঙ্খানুপুঙ্খ অধ্যায়ভিত্তিক বিশ্লেষণ ও সমাধান সংযোজন করা হয়েছে।',
        true,
        false,
        true,
        4
    )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. SEED CUSTOMER ALERTS (Task 40)
-- ------------------------------------------------------------------------------
INSERT INTO user_alerts (
    id, user_id, book_id, variant_id, alert_type, target_price, is_triggered, notification_sent
)
VALUES
    -- Price drop alert: Notify Anirban if Bharater Itihas (Hardcover) drops to or below 500 INR
    (
        '20202020-2020-2020-2020-202020202001',
        '99999999-9999-9999-9999-999999999903',
        '44444444-4444-4444-4444-444444444401',
        '55555555-5555-5555-5555-555555555502',
        'price_drop',
        500.00,
        false,
        false
    ),
    -- Back in stock alert: Notify when out of stock variant restocks
    (
        '20202020-2020-2020-2020-202020202002',
        '99999999-9999-9999-9999-999999999903',
        '44444444-4444-4444-4444-444444444401',
        '55555555-5555-5555-5555-555555555503',
        'back_in_stock',
        NULL,
        false,
        false
    )
ON CONFLICT (id) DO NOTHING;
