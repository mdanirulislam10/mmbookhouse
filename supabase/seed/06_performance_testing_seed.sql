-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Part 5: Seed Data for Performance, Trending & Popularity Testing
-- Database Engine: Supabase (PostgreSQL 16)
-- Seed File: 06_performance_testing_seed.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEED REALISTIC VIEW COUNTS & TEST RECENT SALES
-- ------------------------------------------------------------------------------
UPDATE books 
SET views_count = 15420, monthly_sales_count = 34
WHERE id = '44444444-4444-4444-4444-444444444401'; -- Bharater Itihas (Atul Roy)

UPDATE books 
SET views_count = 28950, monthly_sales_count = 78
WHERE id = '44444444-4444-4444-4444-444444444402'; -- Chhaya WBCS Manual

UPDATE books 
SET views_count = 8320, monthly_sales_count = 12
WHERE id = '44444444-4444-4444-4444-444444444403'; -- Sei Somoy

-- Set distributed realistic views on bulk books
UPDATE books
SET views_count = FLOOR(RANDOM() * 5000 + 50)::BIGINT
WHERE id NOT IN (
    '44444444-4444-4444-4444-444444444401',
    '44444444-4444-4444-4444-444444444402',
    '44444444-4444-4444-4444-444444444403'
);

-- ------------------------------------------------------------------------------
-- 2. RUN POPULARITY SCORE RECALCULATION
-- ------------------------------------------------------------------------------
SELECT recalculate_popularity_scores();
