-- ===========================================
-- FIX REMAINING RLS PERFORMANCE ISSUES
-- ===========================================
-- Run this in Supabase SQL Editor
-- Date: 2025-12-23
-- Purpose: Fix remaining multiple_permissive_policies and search_path issues
--
-- The issue: FOR ALL policies include SELECT, causing overlap with public SELECT policies
-- Solution: Split management policies into separate INSERT/UPDATE/DELETE policies
--           and make public SELECT only for 'anon' role

-- ===========================================
-- PART 1: FIX is_super_admin() FUNCTION SEARCH PATH
-- ===========================================

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.super_admin_whitelist 
        WHERE email = (SELECT auth.email())
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===========================================
-- PART 2: FIX clinic_translations POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Public can view translations" ON public.clinic_translations;
DROP POLICY IF EXISTS "Authorized users can manage translations" ON public.clinic_translations;

-- Public read (anon only to avoid overlap)
CREATE POLICY "Anon can view translations"
ON public.clinic_translations FOR SELECT
TO anon
USING (true);

-- Authenticated read (combined with management logic)
CREATE POLICY "Authenticated can view translations"
ON public.clinic_translations FOR SELECT
TO authenticated
USING (true);

-- Separate INSERT policy
CREATE POLICY "Authorized users can insert translations"
ON public.clinic_translations FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    (
        clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = (SELECT auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    )
);

-- Separate UPDATE policy
CREATE POLICY "Authorized users can update translations"
ON public.clinic_translations FOR UPDATE
TO authenticated
USING (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    (
        clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = (SELECT auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    )
);

-- Separate DELETE policy
CREATE POLICY "Authorized users can delete translations"
ON public.clinic_translations FOR DELETE
TO authenticated
USING (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    (
        clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = (SELECT auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    )
);

-- ===========================================
-- PART 3: FIX clinic_working_hours POLICIES  
-- ===========================================

DROP POLICY IF EXISTS "Public can view clinic working hours" ON public.clinic_working_hours;
DROP POLICY IF EXISTS "Authorized users can manage clinic working hours" ON public.clinic_working_hours;

-- Anon read
CREATE POLICY "Anon can view clinic working hours"
ON public.clinic_working_hours FOR SELECT
TO anon
USING (true);

-- Authenticated read
CREATE POLICY "Authenticated can view clinic working hours"
ON public.clinic_working_hours FOR SELECT
TO authenticated
USING (true);

-- INSERT
CREATE POLICY "Authorized users can insert clinic working hours"
ON public.clinic_working_hours FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    clinic_id IN (
        SELECT clinic_id FROM public.profiles 
        WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
);

-- UPDATE
CREATE POLICY "Authorized users can update clinic working hours"
ON public.clinic_working_hours FOR UPDATE
TO authenticated
USING (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    clinic_id IN (
        SELECT clinic_id FROM public.profiles 
        WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
);

-- DELETE
CREATE POLICY "Authorized users can delete clinic working hours"
ON public.clinic_working_hours FOR DELETE
TO authenticated
USING (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    clinic_id IN (
        SELECT clinic_id FROM public.profiles 
        WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
);

-- ===========================================
-- PART 4: FIX clinics POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Public can view clinics" ON public.clinics;
DROP POLICY IF EXISTS "Super admins can manage clinics" ON public.clinics;

-- Anon read
CREATE POLICY "Anon can view clinics"
ON public.clinics FOR SELECT
TO anon
USING (true);

-- Authenticated read
CREATE POLICY "Authenticated can view clinics"
ON public.clinics FOR SELECT
TO authenticated
USING (true);

-- INSERT
CREATE POLICY "Super admins can insert clinics"
ON public.clinics FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
);

-- UPDATE
CREATE POLICY "Super admins can update clinics"
ON public.clinics FOR UPDATE
TO authenticated
USING (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
);

-- DELETE
CREATE POLICY "Super admins can delete clinics"
ON public.clinics FOR DELETE
TO authenticated
USING (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
);

-- ===========================================
-- PART 5: FIX services POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Public can view services" ON public.services;
DROP POLICY IF EXISTS "Authorized users can manage services" ON public.services;

-- Anon read
CREATE POLICY "Anon can view services"
ON public.services FOR SELECT
TO anon
USING (is_active = true OR is_active IS NULL);

-- Authenticated read
CREATE POLICY "Authenticated can view services"
ON public.services FOR SELECT
TO authenticated
USING (is_active = true OR is_active IS NULL);

-- INSERT
CREATE POLICY "Authorized users can insert services"
ON public.services FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    (
        clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = (SELECT auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'doctor'))
    )
);

-- UPDATE
CREATE POLICY "Authorized users can update services"
ON public.services FOR UPDATE
TO authenticated
USING (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    (
        clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = (SELECT auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'doctor'))
    )
);

-- DELETE
CREATE POLICY "Authorized users can delete services"
ON public.services FOR DELETE
TO authenticated
USING (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    (
        clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = (SELECT auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'doctor'))
    )
);

-- ===========================================
-- PART 6: FIX specialist_working_hours POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Public can view specialist working hours" ON public.specialist_working_hours;
DROP POLICY IF EXISTS "Authorized users can manage specialist working hours" ON public.specialist_working_hours;

-- Anon read
CREATE POLICY "Anon can view specialist working hours"
ON public.specialist_working_hours FOR SELECT
TO anon
USING (true);

-- Authenticated read
CREATE POLICY "Authenticated can view specialist working hours"
ON public.specialist_working_hours FOR SELECT
TO authenticated
USING (true);

-- INSERT
CREATE POLICY "Authorized users can insert specialist working hours"
ON public.specialist_working_hours FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    specialist_id IN (
        SELECT s.id FROM public.specialists s
        JOIN public.profiles p ON s.clinic_id = p.clinic_id
        WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
);

-- UPDATE
CREATE POLICY "Authorized users can update specialist working hours"
ON public.specialist_working_hours FOR UPDATE
TO authenticated
USING (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    specialist_id IN (
        SELECT s.id FROM public.specialists s
        JOIN public.profiles p ON s.clinic_id = p.clinic_id
        WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
);

-- DELETE
CREATE POLICY "Authorized users can delete specialist working hours"
ON public.specialist_working_hours FOR DELETE
TO authenticated
USING (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    specialist_id IN (
        SELECT s.id FROM public.specialists s
        JOIN public.profiles p ON s.clinic_id = p.clinic_id
        WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
);

-- ===========================================
-- PART 7: FIX specialists POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Public can view specialists" ON public.specialists;
DROP POLICY IF EXISTS "Authorized users can manage specialists" ON public.specialists;

-- Anon read
CREATE POLICY "Anon can view specialists"
ON public.specialists FOR SELECT
TO anon
USING (is_active = true OR is_active IS NULL);

-- Authenticated read
CREATE POLICY "Authenticated can view specialists"
ON public.specialists FOR SELECT
TO authenticated
USING (is_active = true OR is_active IS NULL);

-- INSERT
CREATE POLICY "Authorized users can insert specialists"
ON public.specialists FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    (
        clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = (SELECT auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'doctor'))
    )
);

-- UPDATE
CREATE POLICY "Authorized users can update specialists"
ON public.specialists FOR UPDATE
TO authenticated
USING (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    (
        clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = (SELECT auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'doctor'))
    )
);

-- DELETE
CREATE POLICY "Authorized users can delete specialists"
ON public.specialists FOR DELETE
TO authenticated
USING (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
    OR
    (
        clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = (SELECT auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'doctor'))
    )
);

-- ===========================================
-- PART 8: FIX super_admin_whitelist POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Super admins can view whitelist" ON public.super_admin_whitelist;
DROP POLICY IF EXISTS "Super admins can manage whitelist" ON public.super_admin_whitelist;

-- Single SELECT policy
CREATE POLICY "Super admins can view whitelist"
ON public.super_admin_whitelist FOR SELECT
TO authenticated
USING (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
);

-- INSERT
CREATE POLICY "Super admins can insert whitelist"
ON public.super_admin_whitelist FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
);

-- UPDATE
CREATE POLICY "Super admins can update whitelist"
ON public.super_admin_whitelist FOR UPDATE
TO authenticated
USING (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
);

-- DELETE
CREATE POLICY "Super admins can delete whitelist"
ON public.super_admin_whitelist FOR DELETE
TO authenticated
USING (
    (SELECT auth.email()) IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
);

-- ===========================================
-- VERIFICATION
-- ===========================================

-- Check for any remaining multiple permissive policies
SELECT 
    tablename, 
    COUNT(*) as policy_count,
    array_agg(policyname) as policies
FROM pg_policies 
WHERE schemaname = 'public' 
AND permissive = 'PERMISSIVE'
GROUP BY tablename, roles, cmd
HAVING COUNT(*) > 1
ORDER BY tablename;
