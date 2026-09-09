-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Part 9 (Tasks 41 to 45): Sample Seed Data for Recommendations, Syllabi & Series
-- Database Engine: Supabase (PostgreSQL 16)
-- Seed File: 10_recommendations_syllabi_series_seed.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEED FREQUENTLY BOUGHT TOGETHER ASSOCIATIONS (Task 41)
-- ------------------------------------------------------------------------------
INSERT INTO product_associations (
    id, book_id, associated_book_id, co_occurrence_count, confidence_score, association_type
)
VALUES
    -- Bharater Itihas -> Chhaya WBCS Manual
    (
        '31313131-3131-3131-3131-313131313101',
        '44444444-4444-4444-4444-444444444401',
        '44444444-4444-4444-4444-444444444402',
        18,
        0.8750,
        'bought_together'
    ),
    -- Chhaya WBCS Manual -> Bharater Itihas
    (
        '31313131-3131-3131-3131-313131313102',
        '44444444-4444-4444-4444-444444444402',
        '44444444-4444-4444-4444-444444444401',
        18,
        0.8750,
        'bought_together'
    )
ON CONFLICT (book_id, associated_book_id, association_type) DO UPDATE SET
    co_occurrence_count = EXCLUDED.co_occurrence_count,
    confidence_score = EXCLUDED.confidence_score;

-- ------------------------------------------------------------------------------
-- 2. SEED VECTOR EMBEDDINGS (Task 42)
-- ------------------------------------------------------------------------------
-- Seed sample 1536-dimensional vector embeddings for semantic search test
UPDATE books
SET embedding = ('[' || array_to_string(ARRAY_FILL(0.025, ARRAY[1536]), ',') || ']')::vector(1536)
WHERE id = '44444444-4444-4444-4444-444444444401';

UPDATE books
SET embedding = ('[' || array_to_string(ARRAY_FILL(0.015, ARRAY[1536]), ',') || ']')::vector(1536)
WHERE id = '44444444-4444-4444-4444-444444444402';

UPDATE books
SET embedding = ('[' || array_to_string(ARRAY_FILL(0.035, ARRAY[1536]), ',') || ']')::vector(1536)
WHERE id = '44444444-4444-4444-4444-444444444403';

-- ------------------------------------------------------------------------------
-- 3. SEED EXAM SYLLABI & TOPICS (Task 43)
-- ------------------------------------------------------------------------------
INSERT INTO exam_syllabi (
    id, name, name_bn, slug, exam_category, conducting_body, syllabus_year, description, is_active
)
VALUES
    (
        '30303030-3030-3030-3030-303030303001',
        'West Bengal Civil Service (Executive) Examination',
        'ওয়েস্ট বেঙ্গল সিভিল সার্ভিস (WBCS)',
        'wbcs-executive-exam',
        'civil_services',
        'Public Service Commission, West Bengal (WBPSC)',
        2026,
        'Complete syllabus covering Prelims and Mains (Paper-I to Paper-VI) for Group A, B, C, D posts.',
        true
    ),
    (
        '30303030-3030-3030-3030-303030303002',
        'West Bengal Primary Teacher Eligibility Test (TET)',
        'প্রাথমিক শিক্ষক যোগ্যতা নির্ণায়ক পরীক্ষা (Primary TET)',
        'wb-primary-tet-exam',
        'teaching',
        'West Bengal Board of Primary Education (WBBPE)',
        2026,
        'Syllabus for Primary Teacher Eligibility Test covering Child Development, Language I & II, Mathematics & EVS.',
        true
    )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO syllabus_topics (
    id, syllabus_id, paper_name, paper_code, topic_name, topic_name_bn, weightage_percentage, display_order
)
VALUES
    (
        '40404040-4040-4040-4040-404040404001',
        '30303030-3030-3030-3030-303030303001',
        'Prelims General Studies',
        'PRE-GS',
        'History of India & Indian National Movement',
        'ভারতের ইতিহাস ও ভারতের জাতীয়তাবাদী আন্দোলন',
        25.00,
        1
    ),
    (
        '40404040-4040-4040-4040-404040404002',
        '30303030-3030-3030-3030-303030303001',
        'Mains Paper-III',
        'MAIN-P3',
        'Indian National Movement (1857-1947) & Modern History',
        'ভারতের স্বাধীনতা সংগ্রাম ও আধুনিক ভারতের ইতিহাস',
        50.00,
        2
    )
ON CONFLICT (id) DO NOTHING;

-- Seed Book Syllabus Mappings
INSERT INTO book_syllabus_mappings (
    id, book_id, syllabus_id, topic_id, relevance_score, notes
)
VALUES
    (
        '41414141-4141-4141-4141-414141414101',
        '44444444-4444-4444-4444-444444444401',
        '30303030-3030-3030-3030-303030303001',
        '40404040-4040-4040-4040-404040404001',
        'core_text',
        'Highly recommended by WBCS toppers for modern Indian history and national movement.'
    ),
    (
        '41414141-4141-4141-4141-414141414102',
        '44444444-4444-4444-4444-444444444402',
        '30303030-3030-3030-3030-303030303001',
        '40404040-4040-4040-4040-404040404001',
        'practice_mcq',
        'Contains 10,000+ chapter-wise solved MCQs for Prelims General Studies.'
    )
ON CONFLICT (book_id, syllabus_id, topic_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. SEED EXTENDED AUTHOR PROFILES & FOLLOWERS (Task 44)
-- ------------------------------------------------------------------------------
UPDATE authors
SET 
    photo_url = 'https://cdn.mmbookhouse.com/authors/atul_roy.webp',
    birth_year = 1918,
    death_year = 1995,
    awards = ARRAY['Historian Award of Bengal', 'Asiatic Society Research Fellowship'],
    notable_works = ARRAY['ভারতের ইতিহাস', 'মুঘল সাম্রাজ্যের ইতিহাস', 'বাংলার সামাজিক ইতিহাস']
WHERE id = '22222222-2222-2222-2222-222222222201';

UPDATE authors
SET 
    photo_url = 'https://cdn.mmbookhouse.com/authors/sunil_gangopadhyay.webp',
    birth_year = 1934,
    death_year = 2012,
    awards = ARRAY['Sahitya Akademi Award (1985)', 'Ananda Purashkar (1972, 1989)', 'Saraswati Samman (2004)'],
    notable_works = ARRAY['সেই সময়', 'প্রথম আলো', 'পূর্ব-পশ্চিম', 'অরণ্যের দিনরাত্রি']
WHERE id = '22222222-2222-2222-2222-222222222202';

-- Customer Anirban Sen follows Sunil Gangopadhyay & Dr. Atul Chandra Roy
INSERT INTO author_followers (
    id, user_id, author_id, notify_on_new_book
)
VALUES
    (
        '51515151-5151-5151-5151-515151515101',
        '99999999-9999-9999-9999-999999999903',
        '22222222-2222-2222-2222-222222222201',
        true
    ),
    (
        '51515151-5151-5151-5151-515151515102',
        '99999999-9999-9999-9999-999999999903',
        '22222222-2222-2222-2222-222222222202',
        true
    )
ON CONFLICT (user_id, author_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. SEED BOOK SERIES & BUNDLE DISCOUNT (Task 45)
-- ------------------------------------------------------------------------------
INSERT INTO book_series (
    id, title, title_bn, slug, description, total_volumes, is_completed
)
VALUES
    (
        '50505050-5050-5050-5050-505050505001',
        'Sei Somoy (Those Days) Trilogy',
        'সেই সময় সমগ্র',
        'sei-somoy-trilogy',
        'Sunil Gangopadhyay epic masterpiece detailing the mid-19th-century Bengal Renaissance.',
        2,
        true
    )
ON CONFLICT (slug) DO NOTHING;

-- Map Sei Somoy book to the series
UPDATE books
SET 
    series_id = '50505050-5050-5050-5050-505050505001',
    volume_number = 1.0,
    box_set_discount_percentage = 15.00
WHERE id = '44444444-4444-4444-4444-444444444403';
