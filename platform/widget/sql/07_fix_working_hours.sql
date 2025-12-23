-- ============================================
-- DIAGNOSE AND FIX WORKING HOURS SYNC ISSUE
-- ============================================
-- Run this in Supabase SQL Editor
-- Date: 2025-12-23

-- STEP 1: Check for duplicate rows (same clinic_id + day_of_week)
SELECT 
    clinic_id, 
    day_of_week, 
    COUNT(*) as row_count
FROM public.clinic_working_hours
GROUP BY clinic_id, day_of_week
HAVING COUNT(*) > 1;

-- STEP 2: View all rows for butkevica to see what's there
SELECT 
    id, 
    clinic_id, 
    day_of_week, 
    is_open, 
    open_time, 
    close_time, 
    updated_at
FROM public.clinic_working_hours
WHERE clinic_id = 'butkevica'
ORDER BY day_of_week, updated_at DESC;

-- STEP 3: Check if unique constraint exists
SELECT 
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'public.clinic_working_hours'::regclass;

-- STEP 4: If there are duplicates, delete older rows keeping only the newest
-- (Run this only if Step 1 shows duplicates)
DELETE FROM public.clinic_working_hours a
USING public.clinic_working_hours b
WHERE a.clinic_id = b.clinic_id 
  AND a.day_of_week = b.day_of_week
  AND a.updated_at < b.updated_at;

-- STEP 5: Add unique constraint if missing
-- (This will fail if duplicates exist - run Step 4 first)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'clinic_working_hours_clinic_id_day_of_week_key'
    ) THEN
        ALTER TABLE public.clinic_working_hours
        ADD CONSTRAINT clinic_working_hours_clinic_id_day_of_week_key 
        UNIQUE (clinic_id, day_of_week);
    END IF;
END $$;

-- STEP 6: Verify the fix - this should show 7 rows per clinic
SELECT 
    clinic_id, 
    COUNT(*) as row_count
FROM public.clinic_working_hours
GROUP BY clinic_id
ORDER BY clinic_id;
