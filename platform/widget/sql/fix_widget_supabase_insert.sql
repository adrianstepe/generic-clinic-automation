-- ===========================================
-- FIX WIDGET TO SUPABASE BOOKING INSERT
-- ===========================================
-- Run this in Supabase SQL Editor

-- 1. FIRST: Check the actual bookings table schema
SELECT 
    column_name, 
    data_type,
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. SECURITY FIX: Remove permissive anonymous INSERT policy
-- Bookings are now ONLY created via Stripe webhook -> n8n -> Supabase flow.
-- The n8n workflow uses service_role credentials, which bypass RLS.

DROP POLICY IF EXISTS "Anyone can create a booking" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can view recent bookings" ON public.bookings;

-- NOTE: No INSERT policy is created intentionally.
-- service_role (used by n8n) bypasses RLS, so legitimate bookings still work.
-- Anonymous clients cannot insert bookings directly - this prevents spam abuse.
-- To book an appointment, users MUST complete a Stripe payment first.

-- 4. Check current bookings count
SELECT COUNT(*) AS total_bookings FROM public.bookings;

-- 5. Check the most recent bookings (only existing columns)
SELECT 
    id,
    created_at,
    customer_name,
    customer_email,
    start_time,
    status
FROM public.bookings 
ORDER BY created_at DESC 
LIMIT 10;

-- 6. Make business_id optional if it exists and is NOT NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'business_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.bookings ALTER COLUMN business_id DROP NOT NULL;
        RAISE NOTICE 'Made business_id nullable';
    END IF;
END $$;

-- 7. Add service_name column if it doesn't exist (optional, for better tracking)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'service_name'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN service_name TEXT;
        RAISE NOTICE 'Added service_name column';
    END IF;
END $$;

-- 8. Verify RLS policies on bookings
SELECT 
    policyname, 
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'bookings';
