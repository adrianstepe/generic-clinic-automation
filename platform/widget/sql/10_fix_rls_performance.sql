-- ===========================================
-- RLS PERFORMANCE OPTIMIZATION MIGRATION
-- ===========================================
-- Run this in Supabase SQL Editor
-- Date: 2025-12-23
-- Purpose: Fixes auth_rls_initplan and multiple_permissive_policies warnings
-- 
-- This migration:
-- 1. Wraps auth.email() and auth.uid() calls in (SELECT ...) subqueries
--    to prevent re-evaluation for each row
-- 2. Consolidates multiple permissive policies into single, efficient policies
-- 3. Removes duplicate indexes

-- ===========================================
-- PART 1: FIX DUPLICATE INDEX ON clinic_translations
-- ===========================================

-- Drop one of the duplicate constraints (this will also drop the backing index)
-- The constraint backs the index, so we must drop the constraint, not the index directly
ALTER TABLE public.clinic_translations DROP CONSTRAINT IF EXISTS clinic_translations_clinic_id_key_key;

-- ===========================================
-- PART 2: FIX profiles TABLE RLS POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = id);

-- ===========================================
-- PART 3: FIX bookings TABLE RLS POLICIES
-- ===========================================
-- Issue: Multiple permissive SELECT policies and auth function re-evaluation

-- Drop all existing SELECT policies on bookings
DROP POLICY IF EXISTS "Admins and Doctors can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins and Doctors can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Doctors can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Super admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Tenant Isolation for Bookings" ON public.bookings;
DROP POLICY IF EXISTS "Tenant Isolation for Bookings (Update)" ON public.bookings;

-- Create SINGLE consolidated SELECT policy for bookings
-- Combines: super admin access, clinic admin access, and doctor-specific access
CREATE POLICY "Bookings read access"
ON public.bookings FOR SELECT
TO authenticated
USING (
    -- Super admins can view all
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    -- Clinic staff can view their clinic's bookings
    (
        clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = (SELECT auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'doctor', 'receptionist'))
    )
    OR
    -- Doctors can view their assigned bookings
    doctor_id = (SELECT auth.uid())
);

-- Create SINGLE consolidated UPDATE policy for bookings
CREATE POLICY "Bookings update access"
ON public.bookings FOR UPDATE
TO authenticated
USING (
    -- Super admins can update all (implicitly through their clinic access)
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    -- Clinic staff can update their clinic's bookings
    (
        clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = (SELECT auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'doctor', 'receptionist'))
    )
);

-- ===========================================
-- PART 4: FIX workflow_logs TABLE RLS POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Admins can view logs" ON public.workflow_logs;

CREATE POLICY "Admins can view logs"
ON public.workflow_logs FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

-- ===========================================
-- PART 5: FIX clinics TABLE RLS POLICIES  
-- ===========================================
-- Issue: Multiple permissive SELECT policies

DROP POLICY IF EXISTS "Public can view clinics" ON public.clinics;
DROP POLICY IF EXISTS "Super admins can view all clinics" ON public.clinics;
DROP POLICY IF EXISTS "Super admins can manage clinics" ON public.clinics;

-- Single SELECT policy (public read is always allowed, so super admin check is redundant)
CREATE POLICY "Public can view clinics"
ON public.clinics FOR SELECT
USING (true);

-- Management policy for super admins (INSERT, UPDATE, DELETE)
CREATE POLICY "Super admins can manage clinics"
ON public.clinics FOR ALL
TO authenticated
USING (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
)
WITH CHECK (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
);

-- ===========================================
-- PART 6: FIX services TABLE RLS POLICIES
-- ===========================================
-- Issue: Multiple permissive policies for SELECT and management

DROP POLICY IF EXISTS "Public can view active services" ON public.services;
DROP POLICY IF EXISTS "Admin can manage services" ON public.services;
DROP POLICY IF EXISTS "Super admins can view all services" ON public.services;
DROP POLICY IF EXISTS "Super admins can manage services" ON public.services;
DROP POLICY IF EXISTS "Tenant Isolation for Services (Insert)" ON public.services;
DROP POLICY IF EXISTS "Tenant Isolation for Services (Update)" ON public.services;
DROP POLICY IF EXISTS "Public services are viewable by everyone" ON public.services;

-- Single SELECT policy (public read for active services)
CREATE POLICY "Public can view services"
ON public.services FOR SELECT
USING (is_active = true OR is_active IS NULL);

-- Single management policy combining tenant isolation and super admin access
CREATE POLICY "Authorized users can manage services"
ON public.services FOR ALL
TO authenticated
USING (
    -- Super admins can manage all
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    -- Clinic admins can manage their own clinic's services
    (
        clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = (SELECT auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'doctor'))
    )
)
WITH CHECK (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    (
        clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = (SELECT auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'doctor'))
    )
);

-- ===========================================
-- PART 7: FIX specialists TABLE RLS POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Public can view active specialists" ON public.specialists;
DROP POLICY IF EXISTS "Admin can manage specialists" ON public.specialists;
DROP POLICY IF EXISTS "Super admins can view all specialists" ON public.specialists;
DROP POLICY IF EXISTS "Super admins can manage specialists" ON public.specialists;

-- Single SELECT policy (public read for active specialists)
CREATE POLICY "Public can view specialists"
ON public.specialists FOR SELECT
USING (is_active = true OR is_active IS NULL);

-- Single management policy 
CREATE POLICY "Authorized users can manage specialists"
ON public.specialists FOR ALL
TO authenticated
USING (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    (
        clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = (SELECT auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'doctor'))
    )
)
WITH CHECK (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    (
        clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = (SELECT auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'doctor'))
    )
);

-- ===========================================
-- PART 8: FIX clinic_translations TABLE RLS POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Public can view translations" ON public.clinic_translations;
DROP POLICY IF EXISTS "Admin can manage translations" ON public.clinic_translations;

-- Single SELECT policy
CREATE POLICY "Public can view translations"
ON public.clinic_translations FOR SELECT
USING (true);

-- Single management policy
CREATE POLICY "Authorized users can manage translations"
ON public.clinic_translations FOR ALL
TO authenticated
USING (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    (
        clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = (SELECT auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    )
)
WITH CHECK (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    (
        clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = (SELECT auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    )
);

-- ===========================================
-- PART 9: FIX super_admin_whitelist TABLE RLS POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Super admins can view whitelist" ON public.super_admin_whitelist;
DROP POLICY IF EXISTS "Super admins can manage whitelist" ON public.super_admin_whitelist;
DROP POLICY IF EXISTS "Authenticated users can view whitelist" ON public.super_admin_whitelist;

-- Single SELECT policy
CREATE POLICY "Super admins can view whitelist"
ON public.super_admin_whitelist FOR SELECT
TO authenticated
USING (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
);

-- Single management policy (super admins can manage)
CREATE POLICY "Super admins can manage whitelist"
ON public.super_admin_whitelist FOR ALL
TO authenticated
USING (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
)
WITH CHECK (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
);

-- ===========================================
-- PART 10: FIX clinic_working_hours TABLE RLS POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Allow public read access to clinic_working_hours" ON public.clinic_working_hours;
DROP POLICY IF EXISTS "Super admins can manage clinic_working_hours" ON public.clinic_working_hours;
DROP POLICY IF EXISTS "Clinic admins can manage own clinic_working_hours" ON public.clinic_working_hours;

-- Single public read policy (for widget)
CREATE POLICY "Public can view clinic working hours"
ON public.clinic_working_hours FOR SELECT
USING (true);

-- Single management policy (combines super admin + clinic admin)
CREATE POLICY "Authorized users can manage clinic working hours"
ON public.clinic_working_hours FOR ALL
TO authenticated
USING (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    clinic_id IN (
        SELECT clinic_id FROM public.profiles 
        WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
)
WITH CHECK (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    clinic_id IN (
        SELECT clinic_id FROM public.profiles 
        WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
);

-- ===========================================
-- PART 11: FIX specialist_working_hours TABLE RLS POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Allow public read access to specialist_working_hours" ON public.specialist_working_hours;
DROP POLICY IF EXISTS "Super admins can manage specialist_working_hours" ON public.specialist_working_hours;
DROP POLICY IF EXISTS "Clinic admins can manage own clinic specialist_working_hours" ON public.specialist_working_hours;

-- Single public read policy (for widget)
CREATE POLICY "Public can view specialist working hours"
ON public.specialist_working_hours FOR SELECT
USING (true);

-- Single management policy (combines super admin + clinic admin)
CREATE POLICY "Authorized users can manage specialist working hours"
ON public.specialist_working_hours FOR ALL
TO authenticated
USING (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    specialist_id IN (
        SELECT s.id FROM public.specialists s
        JOIN public.profiles p ON s.clinic_id = p.clinic_id
        WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
)
WITH CHECK (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    specialist_id IN (
        SELECT s.id FROM public.specialists s
        JOIN public.profiles p ON s.clinic_id = p.clinic_id
        WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
);

-- ===========================================
-- PART 12: UPDATE is_super_admin() FUNCTION
-- ===========================================
-- Also wrap auth.email() in subquery for consistency

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.super_admin_whitelist 
        WHERE email = (SELECT auth.email())
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- VERIFICATION
-- ===========================================

-- Check policies were created successfully
SELECT 
    schemaname,
    tablename, 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Confirm no duplicate indexes remain
SELECT 
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'clinic_translations';
