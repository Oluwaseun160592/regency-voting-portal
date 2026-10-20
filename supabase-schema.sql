-- =========================================================================
-- REGENCY ASSETS MANAGEMENT LIMITED (RAML)
-- Corporate Excellence Awards - Supabase Database Schema
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- =========================================================================

-- 1. Create table for authentic votes
CREATE TABLE IF NOT EXISTS public.raml_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voter_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    nominee_id TEXT NOT NULL,
    nominee_name TEXT NOT NULL,
    category_name TEXT,
    ballot_hash TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Enforce rule: One vote per person per category at the database level
    CONSTRAINT unique_voter_category UNIQUE (voter_id, category_id)
);

-- Index for speedy queries by category and nominee
CREATE INDEX IF NOT EXISTS idx_raml_votes_category_nominee ON public.raml_votes (category_id, nominee_id);
CREATE INDEX IF NOT EXISTS idx_raml_votes_voter ON public.raml_votes (voter_id);

-- 2. Create table for immutable audit ledger
CREATE TABLE IF NOT EXISTS public.raml_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ballot_hash TEXT NOT NULL,
    voter_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    category_name TEXT,
    candidate_id TEXT NOT NULL,
    candidate_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_raml_audit_created ON public.raml_audit_logs (created_at DESC);

-- 3. Create view for aggregated live results
CREATE OR REPLACE VIEW public.raml_tallies AS
SELECT 
    category_id,
    nominee_id,
    COUNT(*)::INTEGER AS total_votes
FROM public.raml_votes
GROUP BY category_id, nominee_id;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.raml_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raml_audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies for Anon Public access
-- Permitting portal users to view results and cast their official ballots
DROP POLICY IF EXISTS "Public can view votes" ON public.raml_votes;
CREATE POLICY "Public can view votes" 
    ON public.raml_votes 
    FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Public can cast votes" ON public.raml_votes;
CREATE POLICY "Public can cast votes" 
    ON public.raml_votes 
    FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view audit logs" ON public.raml_audit_logs;
CREATE POLICY "Public can view audit logs" 
    ON public.raml_audit_logs 
    FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Public can insert audit logs" ON public.raml_audit_logs;
CREATE POLICY "Public can insert audit logs" 
    ON public.raml_audit_logs 
    FOR INSERT 
    WITH CHECK (true);

-- 6. Enable Supabase Realtime for instant multi-device synchronization
-- This broadcasts whenever a new vote is submitted so all screens update live!
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'raml_votes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.raml_votes;
    END IF;
END $$;
