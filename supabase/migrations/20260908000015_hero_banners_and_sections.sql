-- Migration: 20260908000015_hero_banners_and_sections.sql
-- Description: Dynamic Hero Banners and Homepage Sections Schema for M.M Book House Malda (Module 4)

-- 1. Create hero_banners table
CREATE TABLE IF NOT EXISTS hero_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    title_bn TEXT NOT NULL,
    subtitle TEXT,
    subtitle_bn TEXT,
    description TEXT,
    description_bn TEXT,
    image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    target_url TEXT NOT NULL DEFAULT '/',
    cta_text TEXT NOT NULL DEFAULT 'Shop Now',
    cta_text_bn TEXT NOT NULL DEFAULT 'এখনই কিনুন',
    badge_text TEXT,
    badge_text_bn TEXT,
    badge_color TEXT DEFAULT 'bg-amber-400 text-gray-950',
    bg_gradient TEXT NOT NULL DEFAULT 'from-gray-950 via-slate-900 to-indigo-950',
    display_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create homepage_sections table
CREATE TABLE IF NOT EXISTS homepage_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    title_bn TEXT NOT NULL,
    subtitle TEXT,
    subtitle_bn TEXT,
    display_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Automatic updated_at triggers
CREATE OR REPLACE FUNCTION update_hero_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hero_banners_updated_at ON hero_banners;
CREATE TRIGGER trg_hero_banners_updated_at
    BEFORE UPDATE ON hero_banners
    FOR EACH ROW
    EXECUTE FUNCTION update_hero_banners_updated_at();

DROP TRIGGER IF EXISTS trg_homepage_sections_updated_at ON homepage_sections;
CREATE TRIGGER trg_homepage_sections_updated_at
    BEFORE UPDATE ON homepage_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_hero_banners_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE hero_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for hero_banners
DROP POLICY IF EXISTS "Public can view active hero banners" ON hero_banners;
CREATE POLICY "Public can view active hero banners"
    ON hero_banners
    FOR SELECT
    USING (
        is_active = true 
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
    );

DROP POLICY IF EXISTS "Admin full access on hero_banners" ON hero_banners;
CREATE POLICY "Admin full access on hero_banners"
    ON hero_banners
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'staff')
        )
    );

-- 6. RLS Policies for homepage_sections
DROP POLICY IF EXISTS "Public can view active homepage sections" ON homepage_sections;
CREATE POLICY "Public can view active homepage sections"
    ON homepage_sections
    FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Admin full access on homepage_sections" ON homepage_sections;
CREATE POLICY "Admin full access on homepage_sections"
    ON homepage_sections
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'staff')
        )
    );

-- 7. High-Performance B-Tree Indexes
CREATE INDEX IF NOT EXISTS idx_hero_banners_display_order ON hero_banners (display_order ASC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_hero_banners_active_dates ON hero_banners (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_order ON homepage_sections (display_order ASC);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_key ON homepage_sections (section_key);

-- 8. Seed Realistic Data for Production
INSERT INTO hero_banners (
    title, title_bn, subtitle, subtitle_bn, description, description_bn,
    image_url, mobile_image_url, target_url, cta_text, cta_text_bn,
    badge_text, badge_text_bn, badge_color, bg_gradient, display_order, is_active
) VALUES
(
    'WBCS 2026 Mega Preparation Fair',
    'WBCS ২০২৬ মেগা প্রস্তুতি মেলা',
    'Up to 40% Off on Prelims & Mains Complete Sets',
    'প্রিলিমস ও মেইনসের সমস্ত প্রামাণ্য বইয়ে ৪০% পর্যন্ত বিশেষ ছাড়',
    'All standard manuals, previous years solved papers and reference books now available at M.M Book House Malda with doorstep delivery.',
    'ছায়া প্রকাশনী, ক্র্যাক ডাব্লুবিসিএস ও নিতিন সিংহানিয়ার সমস্ত নতুন সংস্করণের বই এখন মালদায় দ্রুত ডেলিভারিতে।',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    '/category/wbcs?deal=wbcs-special&discount=40',
    'Explore WBCS Books',
    'সংগ্রহ দেখুন',
    'MEGA DEAL',
    'মেগা অফার',
    'bg-amber-400 text-gray-950',
    'from-gray-950 via-slate-900 to-indigo-950',
    1,
    true
),
(
    'Semester 1-6 University & College Guides',
    'কলেজ ও বিশ্ববিদ্যালয় সেমিস্টার সহায়িকা',
    'Gour Banga University (UGB) & NEP 2020 Complete Syllabus Books',
    'গৌড়বঙ্গ বিশ্ববিদ্যালয় (UGB) ও নতুন ৪ বছরের অনার্স কোর্সের বই',
    'B.A, B.Sc, B.Com Honours & General guides, scanners and previous semester question papers.',
    'মালদা ও উত্তরবঙ্গের কলেজ শিক্ষার্থীদের জন্য সেমিস্টার অনুযায়ী সমস্ত বিষয়ভিত্তিক রেফারেন্স বই ও স্ক্যানার।',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
    '/category/college?sem=all&nep=2020',
    'View College Books',
    'কলেজ বই দেখুন',
    'MALDA CAMPUS',
    'মালদা স্পেশাল',
    'bg-sky-400 text-gray-950',
    'from-slate-950 via-cyan-950 to-blue-950',
    2,
    true
),
(
    'Malda Book Fair 2026 Special Dhamaka Deals',
    'মালদা বইমেলা ২০২৬ বিশেষ ছাড় উৎসব',
    'Flat 30% to 50% Off on Literature, Thrillers & Combos',
    'উপন্যাস, গল্প ও রেফারেন্স বইয়ে ৩০% থেকে ৫০% পর্যন্ত আকর্ষণীয় ছাড়',
    'Celebrate the joy of reading with exclusive bundle discounts and complimentary bookmarks on orders over Rs. 499.',
    'জনপ্রিয় বাংলা সাহিত্যের সংকলন ও কিশোর ক্লাসিকের বিশাল সম্ভার এখন অবিশ্বাস্য কম মূল্যে।',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80',
    '/deals?source=hero_banner&type=festive',
    'Shop Festival Deals',
    'উৎসবের অফার কিনুন',
    'LIMITED TIME',
    'সীমিত সময়',
    'bg-rose-500 text-white',
    'from-neutral-950 via-rose-950 to-purple-950',
    3,
    true
)
ON CONFLICT DO NOTHING;

-- Seed Homepage Sections
INSERT INTO homepage_sections (section_key, title, title_bn, subtitle, subtitle_bn, display_order, is_active, config)
VALUES
(
    'hero_slider',
    'Hero Banner Slider',
    'হিরো ব্যানার স্লাইডার',
    'Main promotional carousel at the top of homepage',
    'হোমপেজের শীর্ষে প্রধান প্রমোশনাল স্লাইডার',
    1,
    true,
    '{"autoRotateInterval": 5000, "pauseOnHover": true, "pauseOnTouch": true}'::jsonb
),
(
    'floating_quad_grid',
    'Floating Quad Category Grid',
    'ভাসমান ৪-ইন-১ ক্যাটাগরি গ্রিড',
    'Amazon signature 4-in-1 multi-tile overlapping card grid',
    'ব্যানার ফেডের ওপর ৪-ইন-১ ক্যাটাগরি কার্ড ওভারল্যাপ',
    2,
    true,
    '{"negativeMarginDesktop": "-mt-32", "columns": 4}'::jsonb
),
(
    'deals_of_the_day',
    'Deal of the Day & Flash Offers',
    'আজকের সেরা অফার ও ফ্ল্যাশ ডিলস',
    'Limited time countdown deal items with claimed meter',
    'কাউন্টডাউন টাইমার ও স্টক মিটার সহ সীমিত সময়ের ডিল',
    3,
    true,
    '{"countdownHours": 24, "showClaimBar": true}'::jsonb
)
ON CONFLICT (section_key) DO NOTHING;
