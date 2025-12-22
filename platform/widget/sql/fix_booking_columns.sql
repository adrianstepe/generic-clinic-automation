-- ===========================================
-- FIX BOOKING INSERT - ENSURE REQUIRED COLUMNS EXIST
-- ===========================================
-- Run this in Supabase SQL Editor BEFORE testing the booking flow

-- 1. First, check current schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Ensure stripe_session_id column exists (for payment tracking)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'stripe_session_id'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN stripe_session_id TEXT;
        RAISE NOTICE 'Added stripe_session_id column';
    END IF;
END $$;

-- 3. Ensure service_name column exists (denormalized for quick display)
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

-- 4. Ensure amount_paid column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'amount_paid'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN amount_paid DECIMAL(10,2);
        RAISE NOTICE 'Added amount_paid column';
    END IF;
END $$;

-- 5. Verify the fix - check final schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND table_schema = 'public'
  AND column_name IN ('customer_name', 'customer_email', 'customer_phone', 
                       'service_id', 'service_name', 'start_time', 'end_time',
                       'amount_paid', 'status', 'stripe_session_id')
ORDER BY column_name;

-- 6. Check recent bookings to verify data is being inserted
SELECT 
    id,
    created_at,
    customer_name,
    customer_email,
    customer_phone,
    service_name,
    start_time,
    status,
    stripe_session_id
FROM public.bookings 
ORDER BY created_at DESC 
LIMIT 5;
