-- ===========================================
-- ADD CANCELLATION COLUMNS TO BOOKINGS TABLE
-- ===========================================
-- Run this in Supabase SQL Editor
-- Adds columns needed for appointment cancellation system

-- 1. Add cancellation tracking columns
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cancellation_token TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'lv';

-- 2. Add constraint for valid refund_status values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_refund_status'
    ) THEN
        ALTER TABLE public.bookings 
        ADD CONSTRAINT valid_refund_status 
        CHECK (refund_status IS NULL OR refund_status IN ('pending', 'processed', 'failed', 'not_eligible'));
    END IF;
END $$;

-- 3. Create index on cancellation_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_bookings_cancellation_token 
ON public.bookings(cancellation_token) 
WHERE cancellation_token IS NOT NULL;

-- 4. Verify the new columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('cancelled_at', 'refund_status', 'cancellation_token');
