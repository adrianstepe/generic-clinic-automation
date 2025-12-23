-- ===========================================
-- SUPER ADMIN SCHEMA MIGRATION
-- ===========================================
-- Run this in Supabase SQL Editor
-- Date: 2025-12-22
-- Purpose: Adds super admin capabilities for platform owners

-- ===========================================
-- PART 1: SUPER ADMIN WHITELIST TABLE
-- ===========================================
-- Separate from clinic staff roles - these are platform owners

CREATE TABLE IF NOT EXISTS public.super_admin_whitelist (
    email TEXT PRIMARY KEY,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_by TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Enable RLS on whitelist table
ALTER TABLE public.super_admin_whitelist ENABLE ROW LEVEL SECURITY;

-- Only super admins can read the whitelist
CREATE POLICY "Super admins can view whitelist"
ON public.super_admin_whitelist FOR SELECT
TO authenticated
USING (
    auth.email() IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
);

-- ===========================================
-- PART 2: SEED INITIAL SUPER ADMIN
-- ===========================================
-- TODO: Replace with your actual email address

INSERT INTO public.super_admin_whitelist (email, added_by) VALUES
    ('adrians.stepe@gmail.com', 'system')  -- <-- CHANGE THIS TO YOUR EMAIL
ON CONFLICT (email) DO NOTHING;

-- ===========================================
-- PART 3: UPDATE CLINICS TABLE
-- ===========================================
-- Add status and tracking columns

ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS clinic_email TEXT;

-- ===========================================
-- PART 4: RLS POLICIES FOR SUPER ADMIN ACCESS
-- ===========================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Super admins can view all clinics" ON public.clinics;
DROP POLICY IF EXISTS "Super admins can manage clinics" ON public.clinics;
DROP POLICY IF EXISTS "Super admins can view all services" ON public.services;
DROP POLICY IF EXISTS "Super admins can manage services" ON public.services;
DROP POLICY IF EXISTS "Super admins can view all specialists" ON public.specialists;
DROP POLICY IF EXISTS "Super admins can manage specialists" ON public.specialists;
DROP POLICY IF EXISTS "Super admins can view all bookings" ON public.bookings;

-- Clinics: Super admins can read and write ALL clinics
CREATE POLICY "Super admins can view all clinics"
ON public.clinics FOR SELECT
TO authenticated
USING (
    auth.email() IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR true -- Keep existing public read policy
);

CREATE POLICY "Super admins can manage clinics"
ON public.clinics FOR ALL
TO authenticated
USING (
    auth.email() IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
)
WITH CHECK (
    auth.email() IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
);

-- Services: Super admins can manage ALL services (across clinics)
CREATE POLICY "Super admins can view all services"
ON public.services FOR SELECT
TO authenticated
USING (
    auth.email() IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR true -- Keep existing public read policy
);

CREATE POLICY "Super admins can manage services"
ON public.services FOR ALL
TO authenticated
USING (
    auth.email() IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
)
WITH CHECK (
    auth.email() IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
);

-- Specialists: Super admins can manage ALL specialists
CREATE POLICY "Super admins can view all specialists"
ON public.specialists FOR SELECT
TO authenticated
USING (
    auth.email() IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR true
);

CREATE POLICY "Super admins can manage specialists"
ON public.specialists FOR ALL
TO authenticated
USING (
    auth.email() IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
)
WITH CHECK (
    auth.email() IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
);

-- Bookings: Super admins can view ALL bookings (read-only for analytics)
CREATE POLICY "Super admins can view all bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (
    auth.email() IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
);

-- ===========================================
-- PART 5: HELPER FUNCTION TO CHECK SUPER ADMIN STATUS
-- ===========================================

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.super_admin_whitelist 
        WHERE email = auth.email() 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- PART 6: VERIFICATION
-- ===========================================

-- Check tables exist
SELECT 'super_admin_whitelist' as table_name, COUNT(*) as count FROM public.super_admin_whitelist;
SELECT 'clinics columns' as check_type, column_name FROM information_schema.columns WHERE table_name = 'clinics' AND column_name IN ('is_active', 'created_by', 'logo_url', 'clinic_email');

-- List current super admins
SELECT email, added_at, is_active FROM public.super_admin_whitelist;
