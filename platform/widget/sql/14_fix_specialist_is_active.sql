-- ===========================================
-- FIX SPECIALIST ASSIGNMENT - COMPREHENSIVE FIX
-- ===========================================
-- Run this in Supabase SQL Editor
-- Date: 2025-12-24
-- Purpose: Ensure specialists can be assigned to bookings
--          by fixing the is_active column and verifying data

-- ===========================================
-- STEP 1: Add is_active column if it doesn't exist
-- ===========================================
ALTER TABLE public.specialists 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ===========================================
-- STEP 2: Set all existing specialists to active
-- ===========================================
UPDATE public.specialists 
SET is_active = true 
WHERE is_active IS NULL OR is_active = false;

-- ===========================================
-- STEP 3: Verify the specialists data
-- ===========================================
-- This should show all specialists with their status
SELECT 
    id, 
    clinic_id, 
    name, 
    is_active, 
    specialties,
    array_length(specialties, 1) as specialty_count
FROM public.specialists 
WHERE clinic_id = 'butkevica'
ORDER BY id;

-- ===========================================
-- STEP 4: Test the n8n query simulation
-- ===========================================
-- This is the exact query n8n uses (for service butkevica_s2)
-- Should return Dr. Jānis Liepiņš who has s2 in specialties
SELECT id, name, specialties
FROM public.specialists
WHERE clinic_id = 'butkevica'
  AND is_active = true
  AND specialties @> ARRAY['butkevica_s2']::text[];

-- ===========================================
-- STEP 5: Verify services exist
-- ===========================================
SELECT id, name->>'lv' as name_lv 
FROM public.services 
WHERE clinic_id = 'butkevica' 
LIMIT 10;

-- ===========================================
-- EXPECTED RESULTS:
-- ===========================================
-- Step 3: Should show 3 specialists with is_active = true
-- Step 4: Should return "Dr. Jānis Liepiņš" (has s2 in specialties)
-- Step 5: Should show services like butkevica_s1, butkevica_s2, etc.
--
-- If Step 4 returns 0 rows, the specialists don't have the service_id
-- in their specialties array - check if the array format is correct.
