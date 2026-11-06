-- =========================================================================
-- REGENCY ASSETS MANAGEMENT LIMITED (RAML)
-- Corporate Excellence Awards - Confidential Voting Database Schema
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- =========================================================================
-- CONFIDENTIALITY DESIGN:
-- 1. Public/Anon users CAN submit/cast official ballots (INSERT permission).
-- 2. Public/Anon users CANNOT view individual votes or tallies (SELECT blocked via RLS).
-- 3. Only verified Election Administrators (via Admin Passcode RPC or Service Role)
--    can view live vote tallies, leaderboards, and audit logs.
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

-- 3. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.raml_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raml_audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Clean up any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view votes" ON public.raml_votes;
DROP POLICY IF EXISTS "Public can cast votes" ON public.raml_votes;
DROP POLICY IF EXISTS "Only admin can view votes" ON public.raml_votes;

DROP POLICY IF EXISTS "Public can view audit logs" ON public.raml_audit_logs;
DROP POLICY IF EXISTS "Public can insert audit logs" ON public.raml_audit_logs;
DROP POLICY IF EXISTS "Only admin can view audit logs" ON public.raml_audit_logs;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES FOR CONFIDENTIAL VOTING:

-- Policy 5.1: Public/Anon can cast ballots (INSERT), but CANNOT SELECT/READ votes
CREATE POLICY "Public can cast votes" 
    ON public.raml_votes 
    FOR INSERT 
    TO public, anon, authenticated
    WITH CHECK (true);

-- Policy 5.2: Only Authenticated Admins or Service Role can view raw votes
CREATE POLICY "Only admin can view votes" 
    ON public.raml_votes 
    FOR SELECT 
    TO authenticated, service_role
    USING (
        auth.role() = 'service_role' 
        OR (auth.jwt() ->> 'role') = 'admin' 
        OR (auth.jwt() ->> 'is_admin')::boolean = true
        OR current_user = 'service_role'
    );

-- Policy 5.3: Public/Anon can append to audit ledger upon voting
CREATE POLICY "Public can insert audit logs" 
    ON public.raml_audit_logs 
    FOR INSERT 
    TO public, anon, authenticated
    WITH CHECK (true);

-- Policy 5.4: Only Admins can view audit logs
CREATE POLICY "Only admin can view audit logs" 
    ON public.raml_audit_logs 
    FOR SELECT 
    TO authenticated, service_role
    USING (
        auth.role() = 'service_role' 
        OR (auth.jwt() ->> 'role') = 'admin' 
        OR (auth.jwt() ->> 'is_admin')::boolean = true
        OR current_user = 'service_role'
    );

-- 6. Secure Aggregation View with Security Invoker
-- (Ensures public users without SELECT on raml_votes cannot read tallies through this view)
CREATE OR REPLACE VIEW public.raml_tallies 
WITH (security_invoker = true) AS
SELECT 
    category_id,
    nominee_id,
    COUNT(*)::INTEGER AS total_votes
FROM public.raml_votes
GROUP BY category_id, nominee_id;

-- 7. SECURE RPC FUNCTIONS FOR AUTHORIZED ADMIN ACCESS
-- Passcode-protected Security Definer functions allow the verified Admin
-- to retrieve live totals and audit logs even when connecting with the client anon key.
--
-- SECURITY NOTICE:
-- Replace 'RAML-ADMIN-2026' with your confidential, organization-approved master admin passcode
-- prior to running this in your Supabase production SQL editor.
CREATE OR REPLACE FUNCTION public.get_admin_election_tallies(admin_passcode TEXT)
RETURNS TABLE (
    category_id TEXT,
    nominee_id TEXT,
    total_votes BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF admin_passcode IS NULL OR admin_passcode != 'RAML-ADMIN-2026' THEN
        RAISE EXCEPTION 'Access Denied: Invalid Election Administrator Passcode';
    END IF;

    RETURN QUERY
    SELECT 
        v.category_id,
        v.nominee_id,
        COUNT(*)::BIGINT AS total_votes
    FROM public.raml_votes v
    GROUP BY v.category_id, v.nominee_id;
END;
$$;

-- Secure RPC: Admin Audit Logs retrieval
CREATE OR REPLACE FUNCTION public.get_admin_audit_logs(admin_passcode TEXT)
RETURNS TABLE (
    id UUID,
    ballot_hash TEXT,
    voter_id TEXT,
    category_id TEXT,
    category_name TEXT,
    candidate_id TEXT,
    candidate_name TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF admin_passcode IS NULL OR admin_passcode != 'RAML-ADMIN-2026' THEN
        RAISE EXCEPTION 'Access Denied: Invalid Election Administrator Passcode';
    END IF;

    RETURN QUERY
    SELECT 
        a.id,
        a.ballot_hash,
        a.voter_id,
        a.category_id,
        a.category_name,
        a.candidate_id,
        a.candidate_name,
        a.created_at
    FROM public.raml_audit_logs a
    ORDER BY a.created_at DESC;
END;
$$;

-- Grant execution to API roles (access is enforced internally by the passcode check)
GRANT EXECUTE ON FUNCTION public.get_admin_election_tallies(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_audit_logs(TEXT) TO anon, authenticated, service_role;

-- 8. Enable Supabase Realtime
-- Note: Because Row Level Security is active, Supabase Realtime only delivers
-- raw change payloads to clients that have SELECT permission on raml_votes.
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
