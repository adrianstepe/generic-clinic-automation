-- ===========================================
-- ADD specialist_id TO PROFILES TABLE
-- ===========================================
-- Links admin user accounts to their specialist records
-- This allows doctors to see only their appointments
-- Run this in your Supabase SQL Editor
-- Date: 2025-12-18

-- Add specialist_id column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS specialist_id text REFERENCES specialists(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_specialist_id ON public.profiles(specialist_id);

-- Verify
SELECT id, email, role, specialist_id FROM public.profiles LIMIT 5;
