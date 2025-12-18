-- ===========================================
-- ADD is_active COLUMN TO SERVICES TABLE
-- ===========================================
-- Enables admins to activate/deactivate services from dashboard
-- Run this in your Supabase SQL Editor
-- Date: 2025-12-18

-- Add is_active column (defaults to true so existing services remain visible)
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Update any NULL values to true (safety)
UPDATE public.services SET is_active = true WHERE is_active IS NULL;

-- Verify
SELECT id, name, is_active FROM public.services LIMIT 5;
