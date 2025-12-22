-- ===========================================
-- ADD NOTES COLUMN TO BOOKINGS TABLE
-- ===========================================
-- Run this in Supabase SQL Editor
-- Adds notes column for admin/receptionist notes on bookings

-- 1. Add notes column if it doesn't exist
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name = 'notes';

-- 3. Optional: Add a comment to document the column
COMMENT ON COLUMN public.bookings.notes IS 'Admin/receptionist notes about the booking or patient';
