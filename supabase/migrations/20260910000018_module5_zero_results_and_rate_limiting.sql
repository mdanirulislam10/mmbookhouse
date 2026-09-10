-- =============================================================================
-- Migration: 20260910000018_module5_zero_results_and_rate_limiting.sql
-- Module 5 - Division 9 (Task 45): Zero-Result Searches & Wanted Books Analytics Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.zero_result_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    category TEXT DEFAULT 'all',
    ip_hash TEXT,
    searched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for high-speed aggregation by search term
CREATE INDEX IF NOT EXISTS idx_zero_result_searches_query ON public.zero_result_searches (query);
CREATE INDEX IF NOT EXISTS idx_zero_result_searches_created_at ON public.zero_result_searches (created_at DESC);

-- Enable RLS
ALTER TABLE public.zero_result_searches ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts from client/edge search API
CREATE POLICY "Allow public insert for search analytics" 
    ON public.zero_result_searches 
    FOR INSERT 
    WITH CHECK (true);

-- Restrict select to staff/admin roles
CREATE POLICY "Allow staff and admins to view wanted books analytics"
    ON public.zero_result_searches
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('staff', 'admin')
        )
    );

COMMENT ON TABLE public.zero_result_searches IS 'Stores queries returning 0 results to guide seller stock procurement.';
