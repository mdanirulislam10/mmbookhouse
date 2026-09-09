-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Part 1 (Tasks 1 to 5): Sample Seed Data for Core Catalog
-- Database Engine: Supabase (PostgreSQL 16)
-- Seed File: 01_core_catalog_seed.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEED PUBLISHERS
-- ------------------------------------------------------------------------------
INSERT INTO publishers (id, name, name_bn, slug, description, website, contact_phone, is_active)
VALUES 
    ('11111111-1111-1111-1111-111111111101', 'Ananda Publishers', 'আনন্দ পাবলিশার্স', 'ananda-publishers', 'Leading publisher of Bengali literature and academic books in Kolkata.', 'https://www.anandapub.in', '+91 33 2212 1234', true),
    ('11111111-1111-1111-1111-111111111102', 'Chhaya Prakashani', 'ছায়া প্রকাশনী', 'chhaya-prakashani', 'Premier educational and competitive examination textbook publisher in West Bengal.', 'https://www.chhaya.co.in', '+91 33 4024 1111', true),
    ('11111111-1111-1111-1111-111111111103', 'Deys Publishing', 'দে’জ পাবলিশিং', 'deys-publishing', 'Distinguished publisher of history, novels, and scholarly research works.', 'https://www.deyspublishing.com', '+91 33 2241 2330', true),
    ('11111111-1111-1111-1111-111111111104', 'Moulana Azad Academy', 'মওলানা আজাদ অ্যাকাডেমি', 'moulana-azad-academy', 'Specialized publisher of regional history, competitive guides, and Islamic scholarship.', 'https://www.mmbookhouse.com', '+91 97330 00000', true)
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. SEED AUTHORS
-- ------------------------------------------------------------------------------
INSERT INTO authors (id, name, name_bn, slug, bio, bio_bn, is_active)
VALUES
    ('22222222-2222-2222-2222-222222222201', 'Dr. Atul Chandra Roy', 'ড. অতুল চন্দ্র রায়', 'dr-atul-chandra-roy', 'Renowned historian and academic author known for comprehensive works on Mughal and Indian history.', 'প্রখ্যাত ঐতিহাসিক ও শিক্ষাবিদ, মুঘল যুগ এবং আধুনিক ভারতের ইতিহাসের প্রামাণ্য লেখক।', true),
    ('22222222-2222-2222-2222-222222222202', 'Sunil Gangopadhyay', 'সুনীল গঙ্গোপাধ্যায়', 'sunil-gangopadhyay', 'Legendary Bengali novelist and poet, winner of the Sahitya Akademi Award.', 'বাংলা সাহিত্যের প্রবাদপ্রতিম কথাসাহিত্যিক ও কবি, সাহিত্য অকাদেমি ও আনন্দ পুরস্কার বিজয়ী।', true),
    ('22222222-2222-2222-2222-222222222203', 'Dr. Nitish Sengupta', 'ড. নীতীশ সেনগুপ্ত', 'dr-nitish-sengupta', 'Distinguished civil servant, historian and author of the history of Bengali-speaking people.', 'প্রাক্তন আইএএস অফিসার, সাংসদ ও বিশিষ্ট ঐতিহাসিক।', true),
    ('22222222-2222-2222-2222-222222222204', 'Chhaya Editorial Board', 'ছায়া সম্পাদকীয় মণ্ডলী', 'chhaya-editorial-board', 'Expert panel of WBCS officers and subject-matter specialists.', 'ডাব্লুবিসিএস আধিকারিক এবং বিষয় বিশেষজ্ঞ গবেষক দল।', true)
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. SEED CATEGORIES (Hierarchical: Parent-Child Structure)
-- ------------------------------------------------------------------------------
-- Level 1: Root Categories
INSERT INTO categories (id, parent_id, name, name_bn, slug, description, display_order, is_active)
VALUES
    ('33333333-3333-3333-3333-333333333301', NULL, 'Competitive Examinations', 'সরকারি চাকরির পরীক্ষা', 'competitive-exams', 'All competitive and government job examination books (WBCS, TET, Rail, Police, SSC).', 1, true),
    ('33333333-3333-3333-3333-333333333302', NULL, 'College & University Textbooks', 'কলেজ ও বিশ্ববিদ্যালয়', 'college-university', 'Academic textbooks for UG / PG semester courses across West Bengal universities.', 2, true),
    ('33333333-3333-3333-3333-333333333303', NULL, 'Bengali Literature & Fiction', 'বাংলা উপন্যাস ও সাহিত্য', 'bengali-literature', 'Classics, modern novels, poetry, and historical fiction.', 3, true)
ON CONFLICT (slug) DO NOTHING;

-- Level 2: Sub-categories
INSERT INTO categories (id, parent_id, name, name_bn, slug, description, display_order, is_active)
VALUES
    ('33333333-3333-3333-3333-333333333311', '33333333-3333-3333-3333-333333333301', 'WBCS Special', 'ডাব্লুবিসিএস স্পেশাল', 'wbcs-special', 'WBCS Prelims and Mains specialized preparation materials.', 1, true),
    ('33333333-3333-3333-3333-333333333312', '33333333-3333-3333-3333-333333333301', 'Primary TET & School Service', 'টেট ও স্কুল সার্ভিস', 'primary-tet-slst', 'Primary TET, Upper Primary, and WBSSC SLST examination guides.', 2, true),
    ('33333333-3333-3333-3333-333333333321', '33333333-3333-3333-3333-333333333302', 'History (Honours & General)', 'ইতিহাস (অনার্স ও জেনারেল)', 'history-honours-general', 'Undergraduate History Honours syllabus and semester textbooks.', 1, true)
ON CONFLICT (slug) DO NOTHING;

-- Level 3: Deep Sub-category
INSERT INTO categories (id, parent_id, name, name_bn, slug, description, display_order, is_active)
VALUES
    ('33333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333311', 'WBCS History & National Movement', 'WBCS ইতিহাস ও জাতীয় আন্দোলন', 'wbcs-history-national-movement', 'Complete history coverage for WBCS Paper-III and Prelims.', 1, true)
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. SEED BOOKS (Core Metadata)
-- ------------------------------------------------------------------------------
INSERT INTO books (
    id, title, title_bn, subtitle, subtitle_bn, slug, publisher_id,
    description, description_bn, syllabus_importance, language, edition,
    pages, isbn_13, published_year, preview_pdf_url, preview_images, is_active
)
VALUES
    (
        '44444444-4444-4444-4444-444444444401',
        'Bharater Itihas O Jatiyo Mukti Sangram',
        'ভারতের ইতিহাস ও জাতীয় মুক্তি সংগ্রাম',
        'Ancient, Medieval, and Modern India for College & Competitive Exams',
        'প্রাচীন, মধ্য ও আধুনিক ভারতের পূর্ণাঙ্গ ইতিহাস (WBCS ও ডিগ্রি স্তরের জন্য)',
        'bharater-itihas-o-jatiyo-mukti-sangram-atul-chandra-roy',
        '11111111-1111-1111-1111-111111111103',
        'A masterwork in Bengali on Indian History covering archaeological discoveries, Mughal era, British rule, and India freedom struggle.',
        'ড. অতুল চন্দ্র রায়ের লেখা ভারতের ইতিহাসের এক প্রামাণ্য গ্রন্থ। প্রাচীন ও মধ্যযুগ থেকে শুরু করে স্বাধীনতা সংগ্রামের প্রতিটি পর্যায় প্রাঞ্জল ভাষায় ব্যাখ্যা করা হয়েছে।',
        'WBCS প্রিলিমস এবং মেইনসের পেপার-৩ এর ২৫ নম্বর ভারতীয় জাতীয় আন্দোলন অংশের জন্য সর্বাধিক নির্ভরযোগ্য বই।',
        'bengali',
        'Revised 14th Edition',
        640,
        '9788176123456',
        2025,
        'https://cdn.mmbookhouse.com/previews/atul_roy_history_toc.pdf',
        '["https://cdn.mmbookhouse.com/previews/atul_roy_p1.webp", "https://cdn.mmbookhouse.com/previews/atul_roy_p2.webp"]'::jsonb,
        true
    ),
    (
        '44444444-4444-4444-4444-444444444402',
        'Chhaya WBCS General Studies Manual 2026',
        'ছায়া ডাব্লুবিসিএস জেনারেল স্টাডিজ ম্যানুয়াল ২০২৬',
        'Complete Prelims & Mains Compendium with Chapterwise MCQs',
        'প্রিলিমিনারি ও মেইনস পরীক্ষার পূর্ণাঙ্গ সিলেবাস গাইড ও অধ্যায়ভিত্তিক এমসিকিউ',
        'chhaya-wbcs-general-studies-manual-2026',
        '11111111-1111-1111-1111-111111111102',
        'The definitive all-in-one preparation manual for West Bengal Civil Services (Executive) aspirants.',
        'পশ্চিমবঙ্গ সিভিল সার্ভিস পরীক্ষার জন্য রাজ্যের সেরা শিক্ষক ও সফল আধিকারিকদের যৌথ উদ্যোগে প্রস্তুত একমাত্র নির্ভরযোগ্য ম্যানুয়াল।',
        'WBCS পরীক্ষার ৮টি বিষয়ের পূর্ণাঙ্গ ১০০% কভারেজ এবং বিগত ১৫ বছরের সলভড পেপার।',
        'bengali',
        '2026 Annual Edition',
        1380,
        '9789381234567',
        2026,
        'https://cdn.mmbookhouse.com/previews/chhaya_wbcs_toc.pdf',
        '["https://cdn.mmbookhouse.com/previews/chhaya_wbcs_p1.webp"]'::jsonb,
        true
    ),
    (
        '44444444-4444-4444-4444-444444444403',
        'Sei Somoy (Volumes 1 & 2 Combined)',
        'সেই সময় (অখণ্ড সংস্করণ)',
        'A Classic Historical Epic of 19th Century Bengal Renaissance',
        'ঊনবিংশ শতকের নবজাগরণের ঐতিহাসিক কালজয়ী মহাকাব্যিক উপন্যাস',
        'sei-somoy-sunil-gangopadhyay-ananda',
        '11111111-1111-1111-1111-111111111101',
        'Sahitya Akademi Award winning epic novel depicting the vibrant socio-cultural renaissance of 19th century Bengal.',
        'ঊনবিংশ শতকের কলকাতা ও বাংলার রূপান্তর নিয়ে রচিত সুনীল গঙ্গোপাধ্যায়ের অমর সৃষ্টি। নবকুমার, ঈশ্বরচন্দ্র বিদ্যাসাগর, মাইকেল মধুসূদন দত্তের জীবন্ত চিত্র।',
        'বাংলা সাহিত্যের পাঠক এবং ডাব্লুবিসিএস বাংলা অপশনাল পেপারের শিক্ষার্থীদের জন্য অপরিহার্য টেক্সট।',
        'bengali',
        'Collector Deluxe Edition',
        920,
        '9788172152431',
        2024,
        'https://cdn.mmbookhouse.com/previews/sei_somoy_sample.pdf',
        '["https://cdn.mmbookhouse.com/previews/sei_somoy_c1.webp"]'::jsonb,
        true
    )
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. SEED BOOK VARIANTS (Paperback / Hardcover, New / Used, Auto-calculated Discounts)
-- ------------------------------------------------------------------------------
INSERT INTO book_variants (
    id, book_id, sku, binding, condition, condition_note, mrp, selling_price,
    weight_grams, shelf_location, bin_number, is_active
)
VALUES
    -- Variants for "Bharater Itihas" by Dr. Atul Chandra Roy
    (
        '55555555-5555-5555-5555-555555555501',
        '44444444-4444-4444-4444-444444444401',
        'MMB-HIST-ATUL-PB-NEW',
        'paperback',
        'new',
        'Fresh publisher stock (2025 Edition)',
        480.00,
        360.00, -- 25% Auto Discount
        550,
        'Rack-H1',
        'Shelf-2',
        true
    ),
    (
        '55555555-5555-5555-5555-555555555502',
        '44444444-4444-4444-4444-444444444401',
        'MMB-HIST-ATUL-HC-NEW',
        'hardcover',
        'new',
        'Library binding with gold-embossed spine',
        650.00,
        520.00, -- 20% Auto Discount
        720,
        'Rack-H1',
        'Shelf-1',
        true
    ),
    (
        '55555555-5555-5555-5555-555555555503',
        '44444444-4444-4444-4444-444444444401',
        'MMB-HIST-ATUL-PB-USED',
        'paperback',
        'used',
        'Second-hand copy in very good condition. No missing pages or ink marks.',
        480.00,
        240.00, -- 50% Auto Discount (Budget option for students)
        530,
        'Rack-USED-HIST',
        'Bin-04',
        true
    ),
    -- Variant for "Chhaya WBCS Manual 2026"
    (
        '55555555-5555-5555-5555-555555555511',
        '44444444-4444-4444-4444-444444444402',
        'MMB-WBCS-CHHAYA-2026-PB',
        'paperback',
        'new',
        'Brand new sealed copy with free online mock test access code',
        1150.00,
        805.00, -- 30% Auto Discount (Best competitive exam price in Malda)
        1250,
        'Rack-WBCS-PROMO',
        'Front-Stack',
        true
    ),
    -- Variants for "Sei Somoy"
    (
        '55555555-5555-5555-5555-555555555521',
        '44444444-4444-4444-4444-444444444403',
        'MMB-LIT-SEISOMOY-HC',
        'hardcover',
        'new',
        'Collector Hardcover Deluxe Edition with bookmark',
        800.00,
        640.00, -- 20% Auto Discount
        890,
        'Rack-LIT-CLASSIC',
        'Shelf-3',
        true
    ),
    (
        '55555555-5555-5555-5555-555555555522',
        '44444444-4444-4444-4444-444444444403',
        'MMB-LIT-SEISOMOY-PB',
        'paperback',
        'new',
        'Standard student reading paperback edition',
        600.00,
        450.00, -- 25% Auto Discount
        710,
        'Rack-LIT-CLASSIC',
        'Shelf-4',
        true
    )
ON CONFLICT (sku) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. LINK BOOK AUTHORS (Many-to-Many Relationships with Roles)
-- ------------------------------------------------------------------------------
INSERT INTO book_authors (book_id, author_id, role, display_order)
VALUES
    -- Book 1: Atul Chandra Roy as Author
    ('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222201', 'author', 1),
    
    -- Book 2: Chhaya Editorial Board as Compiler and Nitish Sengupta as Guest Contributor
    ('44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222204', 'compiler', 1),
    ('44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222203', 'editor', 2),

    -- Book 3: Sunil Gangopadhyay as Author
    ('44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222202', 'author', 1)
ON CONFLICT (book_id, author_id, role) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 7. LINK BOOK CATEGORIES (Many-to-Many Relationships with Primary Category Tag)
-- ------------------------------------------------------------------------------
INSERT INTO book_categories (book_id, category_id, is_primary)
VALUES
    -- Book 1: Attached to both "WBCS History" and "College History Honours"
    ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333331', true), -- Primary: WBCS History
    ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333321', false), -- Secondary: College History

    -- Book 2: Attached to "WBCS Special"
    ('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333311', true),

    -- Book 3: Attached to "Bengali Literature & Fiction"
    ('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333303', true)
ON CONFLICT (book_id, category_id) DO NOTHING;
