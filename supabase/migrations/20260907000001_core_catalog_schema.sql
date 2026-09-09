-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Part 1 (Tasks 1 to 5): Core Catalog & Entity Hierarchy Architecture
-- Database Engine: Supabase (PostgreSQL 16)
-- Migration: 20260907000001_core_catalog_schema.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. EXTENSIONS & PREREQUISITES
-- ------------------------------------------------------------------------------
-- Ensure pgcrypto is available for UUID v4 (gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Common trigger function to automatically update 'updated_at' timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- TASK 4: PUBLISHERS MASTER TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS publishers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    name_bn VARCHAR(255),
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    description_bn TEXT,
    logo_url TEXT,
    website TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE publishers IS 'Master table storing book publishing houses (e.g., Ananda, Chhaya, Deys)';

CREATE TRIGGER trigger_publishers_updated_at
    BEFORE UPDATE ON publishers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- TASK 3: AUTHORS MASTER TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    name_bn VARCHAR(255),
    slug VARCHAR(255) UNIQUE NOT NULL,
    bio TEXT,
    bio_bn TEXT,
    photo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE authors IS 'Master table storing authors, editors, and translators with bilingual support';

CREATE TRIGGER trigger_authors_updated_at
    BEFORE UPDATE ON authors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- TASK 5: CATEGORIES HIERARCHY TABLE (Adjacency List Pattern)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    name_bn VARCHAR(255),
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    icon_url TEXT,
    banner_url TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE categories IS 'Hierarchical categories supporting unlimited nesting via parent_id (e.g., Competitive > WBCS > History)';

CREATE TRIGGER trigger_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- TASK 2: PARENT BOOKS TABLE (Catalog Metadata)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    title_bn VARCHAR(255),
    subtitle VARCHAR(255),
    subtitle_bn VARCHAR(255),
    slug VARCHAR(255) UNIQUE NOT NULL,
    publisher_id UUID REFERENCES publishers(id) ON DELETE SET NULL,
    description TEXT,
    description_bn TEXT,
    syllabus_importance TEXT,
    language VARCHAR(50) NOT NULL DEFAULT 'bengali',
    edition VARCHAR(50),
    pages INT CHECK (pages IS NULL OR pages > 0),
    isbn_10 VARCHAR(20),
    isbn_13 VARCHAR(20),
    published_year INT CHECK (published_year IS NULL OR (published_year >= 1800 AND published_year <= 2100)),
    preview_pdf_url TEXT,
    preview_images JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE books IS 'Core book master metadata (independent of specific physical edition/binding)';

CREATE TRIGGER trigger_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- TASK 2: BOOK VARIANTS TABLE (Paperback/Hardcover, New/Used, Pricing, Stock)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS book_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    binding VARCHAR(50) NOT NULL DEFAULT 'paperback' CHECK (binding IN ('paperback', 'hardcover', 'spiral', 'digital')),
    condition VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (condition IN ('new', 'used', 'refurbished')),
    condition_note TEXT,
    mrp NUMERIC(10, 2) NOT NULL CHECK (mrp >= 0),
    selling_price NUMERIC(10, 2) NOT NULL CHECK (selling_price >= 0 AND selling_price <= mrp),
    discount_percent NUMERIC(5, 2) GENERATED ALWAYS AS (
        ROUND(((mrp - selling_price) / NULLIF(mrp, 0)) * 100, 2)
    ) STORED,
    weight_grams INT NOT NULL DEFAULT 400 CHECK (weight_grams >= 0),
    dimensions_cm VARCHAR(50),
    shelf_location VARCHAR(100),
    bin_number VARCHAR(100),
    barcode VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE book_variants IS 'Physical and condition variants of a book with individual pricing, SKU and auto-calculated discount percent';

CREATE TRIGGER trigger_book_variants_updated_at
    BEFORE UPDATE ON book_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- TASK 3: BOOK AUTHORS JUNCTION TABLE (Many-to-Many Relationship)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS book_authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'author' CHECK (role IN ('author', 'editor', 'translator', 'illustrator', 'compiler')),
    display_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_book_author_role UNIQUE(book_id, author_id, role)
);

COMMENT ON TABLE book_authors IS 'Junction table linking books to multiple authors, editors, or translators';

-- ------------------------------------------------------------------------------
-- TASK 5: BOOK CATEGORIES JUNCTION TABLE (Many-to-Many Relationship)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS book_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_book_category UNIQUE(book_id, category_id)
);

COMMENT ON TABLE book_categories IS 'Junction table linking books to multiple categories and exam sections';

-- ------------------------------------------------------------------------------
-- HIGH-PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_publishers_slug ON publishers(slug);
CREATE INDEX IF NOT EXISTS idx_authors_slug ON authors(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_books_publisher_id ON books(publisher_id);
CREATE INDEX IF NOT EXISTS idx_books_slug ON books(slug);
CREATE INDEX IF NOT EXISTS idx_books_is_active ON books(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_book_variants_book_id ON book_variants(book_id);
CREATE INDEX IF NOT EXISTS idx_book_variants_sku ON book_variants(sku);
CREATE INDEX IF NOT EXISTS idx_book_variants_selling_price ON book_variants(selling_price);
CREATE INDEX IF NOT EXISTS idx_book_variants_discount ON book_variants(discount_percent);
CREATE INDEX IF NOT EXISTS idx_book_authors_book_id ON book_authors(book_id);
CREATE INDEX IF NOT EXISTS idx_book_authors_author_id ON book_authors(author_id);
CREATE INDEX IF NOT EXISTS idx_book_categories_book_id ON book_categories(book_id);
CREATE INDEX IF NOT EXISTS idx_book_categories_category_id ON book_categories(category_id);
