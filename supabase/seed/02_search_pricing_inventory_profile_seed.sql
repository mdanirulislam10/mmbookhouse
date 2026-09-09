-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Part 2 (Tasks 6 to 10): Sample Seed Data for Search, Inventory & Profiles
-- Database Engine: Supabase (PostgreSQL 16)
-- Seed File: 02_search_pricing_inventory_profile_seed.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. UPDATE BOOKS WITH BILINGUAL SEARCH KEYWORDS & TABLE OF CONTENTS
-- ------------------------------------------------------------------------------
UPDATE books 
SET 
    keywords = ARRAY['history', 'wbcs history', 'atul roy', 'itihaas', 'ইতিহাস', 'জাতীয় আন্দোলন', 'স্বাধীনতা সংগ্রাম', 'মুঘল যুগ', 'অতুল রায়'],
    table_of_contents = '[
        {"chapter": 1, "title": "প্রাগৈতিহাসিক ভারত ও সিন্ধু সভ্যতা", "page": 1, "syllabus_tag": "WBCS Prelims"},
        {"chapter": 2, "title": "বৈদিক সভ্যতা ও মহাজনপদ", "page": 45, "syllabus_tag": "WBCS Prelims"},
        {"chapter": 3, "title": "মৌর্য ও গুপ্ত সাম্রাজ্য", "page": 98, "syllabus_tag": "WBCS Prelims & Mains"},
        {"chapter": 4, "title": "দিল্লি সালতানাত ও মুঘল শাসন", "page": 210, "syllabus_tag": "WBCS Mains Paper-III"},
        {"chapter": 5, "title": "মহাবিদ্রোহ ও ভারতের জাতীয়তাবাদী আন্দোলন (১৮৫৭-১৯৪৭)", "page": 415, "syllabus_tag": "WBCS Mains INM"}
    ]'::jsonb
WHERE id = '44444444-4444-4444-4444-444444444401';

UPDATE books 
SET 
    keywords = ARRAY['wbcs manual', 'chhaya prakashani', 'general studies', 'civil service', 'প্রিলি ও মেইনস', 'জিকে ম্যানুয়াল', 'ছায়া ডাব্লুবিসিএস'],
    table_of_contents = '[
        {"chapter": 1, "title": "English Composition & Grammar", "page": 1, "syllabus_tag": "General English"},
        {"chapter": 2, "title": "General Science & Technology", "page": 180, "syllabus_tag": "Science"},
        {"chapter": 3, "title": "Indian Polity & Constitution", "page": 350, "syllabus_tag": "Polity"},
        {"chapter": 4, "title": "Indian Economy & Current Affairs", "page": 590, "syllabus_tag": "Economy"},
        {"chapter": 5, "title": "Geography of India & West Bengal", "page": 820, "syllabus_tag": "Geography"}
    ]'::jsonb
WHERE id = '44444444-4444-4444-4444-444444444402';

UPDATE books 
SET 
    keywords = ARRAY['novel', 'bengali classic', 'sunil gangopadhyay', 'ananda', 'উপন্যাস', 'সেই সময়', 'নবজাগরণ', 'বিদ্যাসাগর'],
    table_of_contents = '[
        {"chapter": 1, "title": "প্রথম পর্ব: নবকুমার ও কলকাতার বাবু কালচার", "page": 1},
        {"chapter": 2, "title": "দ্বিতীয় পর্ব: ডিরোজিও ও ইয়ং বেঙ্গল আন্দোলন", "page": 280},
        {"chapter": 3, "title": "তৃতীয় পর্ব: বিদ্যাসাগর ও বিধবা বিবাহ আন্দোলন", "page": 560},
        {"chapter": 4, "title": "চতুর্থ পর্ব: সূর্যাস্তের কোলকাতা", "page": 790}
    ]'::jsonb
WHERE id = '44444444-4444-4444-4444-444444444403';

-- ------------------------------------------------------------------------------
-- 2. SEED INVENTORY (Stock Quantity, Low-Stock Thresholds)
-- ------------------------------------------------------------------------------
INSERT INTO inventory (variant_id, stock_quantity, reserved_quantity, low_stock_threshold)
VALUES
    -- Bharater Itihas (Paperback New) - Popular item, high stock
    ('55555555-5555-5555-5555-555555555501', 45, 0, 5),

    -- Bharater Itihas (Hardcover New) - Library edition
    ('55555555-5555-5555-5555-555555555502', 15, 0, 3),

    -- Bharater Itihas (Used Paperback) - Budget single copies
    ('55555555-5555-5555-5555-555555555503', 4, 0, 2),

    -- Chhaya WBCS Manual 2026 - Highest selling guide
    ('55555555-5555-5555-5555-555555555511', 120, 0, 10),

    -- Sei Somoy (Hardcover)
    ('55555555-5555-5555-5555-555555555521', 25, 0, 5),

    -- Sei Somoy (Paperback)
    ('55555555-5555-5555-5555-555555555522', 38, 0, 5)
ON CONFLICT (variant_id) DO UPDATE SET
    stock_quantity = EXCLUDED.stock_quantity,
    low_stock_threshold = EXCLUDED.low_stock_threshold;

-- ------------------------------------------------------------------------------
-- 3. SEED USER PROFILES (Admin, Staff & Customer)
-- ------------------------------------------------------------------------------
INSERT INTO profiles (id, email, full_name, full_name_bn, phone_number, avatar_url, role, preferred_language, is_verified)
VALUES
    (
        '99999999-9999-9999-9999-999999999901',
        'admin@mmbookhouse.com',
        'M.M Book House Admin',
        'মালিক / সুপার অ্যাডমিন',
        '+919832000001',
        'https://cdn.mmbookhouse.com/avatars/admin.webp',
        'admin',
        'bn',
        true
    ),
    (
        '99999999-9999-9999-9999-999999999902',
        'staff.rahul@mmbookhouse.com',
        'Rahul Karmakar (Billing Staff)',
        'রাহুল কর্মকার (কাউন্টার সেলস)',
        '+919832000002',
        'https://cdn.mmbookhouse.com/avatars/staff_rahul.webp',
        'staff',
        'bn',
        true
    ),
    (
        '99999999-9999-9999-9999-999999999903',
        'anirban.sen@gmail.com',
        'Anirban Sen (WBCS Aspirant)',
        'অনির্বাণ সেন',
        '+919832000003',
        'https://cdn.mmbookhouse.com/avatars/customer_anirban.webp',
        'customer',
        'bn',
        true
    )
ON CONFLICT (id) DO NOTHING;
