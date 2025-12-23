-- ===========================================
-- FIX: super_admin_whitelist INFINITE RECURSION
-- ===========================================
-- Problem: RLS policy on super_admin_whitelist queries itself to check if user is super admin
-- Solution: Use a SECURITY DEFINER function that bypasses RLS to check the whitelist
-- Date: 2025-12-24

-- ===========================================
-- STEP 1: Create helper function (bypasses RLS)
-- ===========================================
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.super_admin_whitelist 
        WHERE email = (SELECT auth.email()) 
        AND is_active = true
    );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- ===========================================
-- STEP 2: Drop existing recursive policies
-- ===========================================
DROP POLICY IF EXISTS "Super admins can view whitelist" ON public.super_admin_whitelist;
DROP POLICY IF EXISTS "Super admins can manage whitelist" ON public.super_admin_whitelist;
DROP POLICY IF EXISTS "Super admins can insert whitelist" ON public.super_admin_whitelist;
DROP POLICY IF EXISTS "Super admins can update whitelist" ON public.super_admin_whitelist;
DROP POLICY IF EXISTS "Super admins can delete whitelist" ON public.super_admin_whitelist;
DROP POLICY IF EXISTS "super_admin_whitelist_select" ON public.super_admin_whitelist;
DROP POLICY IF EXISTS "super_admin_whitelist_insert" ON public.super_admin_whitelist;
DROP POLICY IF EXISTS "super_admin_whitelist_update" ON public.super_admin_whitelist;
DROP POLICY IF EXISTS "super_admin_whitelist_delete" ON public.super_admin_whitelist;

-- ===========================================
-- STEP 3: Create new policies using the function
-- ===========================================
-- The function bypasses RLS, so no recursion

CREATE POLICY "super_admin_whitelist_select"
ON public.super_admin_whitelist FOR SELECT
TO authenticated
USING (public.is_super_admin());

CREATE POLICY "super_admin_whitelist_insert"
ON public.super_admin_whitelist FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin());

CREATE POLICY "super_admin_whitelist_update"
ON public.super_admin_whitelist FOR UPDATE
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "super_admin_whitelist_delete"
ON public.super_admin_whitelist FOR DELETE
TO authenticated
USING (public.is_super_admin());

-- ===========================================
-- VERIFICATION
-- ===========================================
SELECT 'is_super_admin function created' as status WHERE EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_super_admin'
);
