-- ===========================================
-- ADD specialist_id TO BOOKINGS TABLE
-- ===========================================
-- This column stores the assigned specialist for each booking
-- Required for the auto-assignment feature
-- Date: 2025-12-18

-- Add specialist_id column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS specialist_id text REFERENCES specialists(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_specialist_id ON public.bookings(specialist_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name = 'specialist_id';
