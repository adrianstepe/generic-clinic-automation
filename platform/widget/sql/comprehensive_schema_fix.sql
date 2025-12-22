-- ===========================================
-- COMPREHENSIVE DATABASE SCHEMA FIX
-- ===========================================
-- Fixes ALL identified issues in one idempotent script
-- Run this in Supabase SQL Editor
-- Date: 2025-12-17

-- ===========================================
-- FIX 1: Add clinic_id to profiles table
-- ===========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'clinic_id') THEN
        ALTER TABLE public.profiles ADD COLUMN clinic_id TEXT DEFAULT 'butkevica';
        RAISE NOTICE 'Added clinic_id to profiles';
    ELSE
        RAISE NOTICE 'clinic_id already exists in profiles';
    END IF;
END $$;

-- Update existing profiles to have clinic_id
UPDATE public.profiles SET clinic_id = 'butkevica' WHERE clinic_id IS NULL;

-- ===========================================
-- FIX 2: Add FK from bookings.service_id to services.id
-- ===========================================
-- First, clean up any orphaned service_id references
UPDATE public.bookings 
SET service_id = NULL 
WHERE service_id IS NOT NULL 
  AND service_id NOT IN (SELECT id FROM public.services);

-- Add the foreign key constraint (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bookings_service' AND table_name = 'bookings') THEN
        ALTER TABLE public.bookings 
        ADD CONSTRAINT fk_bookings_service 
        FOREIGN KEY (service_id) 
        REFERENCES public.services(id) 
        ON DELETE SET NULL;
        RAISE NOTICE 'Added FK constraint for bookings.service_id';
    ELSE
        RAISE NOTICE 'FK constraint fk_bookings_service already exists';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add FK constraint: %', SQLERRM;
END $$;

-- ===========================================
-- FIX 3: Add unique constraint to clinic_translations
-- ===========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'clinic_translations_clinic_id_key_unique' AND table_name = 'clinic_translations') THEN
        -- First delete any duplicates (keep newest)
        DELETE FROM public.clinic_translations a
        USING public.clinic_translations b
        WHERE a.clinic_id = b.clinic_id 
          AND a.key = b.key 
          AND a.created_at < b.created_at;
        
        ALTER TABLE public.clinic_translations 
        ADD CONSTRAINT clinic_translations_clinic_id_key_unique 
        UNIQUE (clinic_id, key);
        RAISE NOTICE 'Added unique constraint to clinic_translations';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on clinic_translations';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add unique constraint: %', SQLERRM;
END $$;

-- ===========================================
-- FIX 4: Add FK from bookings.clinic_id to clinics.id (optional but recommended)
-- ===========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bookings_clinic' AND table_name = 'bookings') THEN
        -- Make sure default clinic exists
        INSERT INTO public.clinics (id, name, domain, theme, settings)
        VALUES ('butkevica', 'Butkevica Dental Practice', 'drbutkevicadentalpractice.com', 
                '{"primaryColor": "#0d9488"}'::jsonb, '{"currency": "EUR", "timezone": "Europe/Riga"}'::jsonb)
        ON CONFLICT (id) DO NOTHING;
        
        ALTER TABLE public.bookings 
        ADD CONSTRAINT fk_bookings_clinic 
        FOREIGN KEY (clinic_id) 
        REFERENCES public.clinics(id) 
        ON DELETE SET DEFAULT;
        RAISE NOTICE 'Added FK constraint for bookings.clinic_id';
    ELSE
        RAISE NOTICE 'FK constraint fk_bookings_clinic already exists';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add clinic FK: %', SQLERRM;
END $$;

-- ===========================================
-- VERIFICATION
-- ===========================================
SELECT 'profiles.clinic_id' as check_item, 
       EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'clinic_id') as passed;

SELECT 'fk_bookings_service' as check_item,
       EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_bookings_service') as passed;

SELECT 'clinic_translations unique' as check_item,
       EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'clinic_translations_clinic_id_key_unique') as passed;
