-- ===========================================
-- MIGRATION: ADD BRANDING COLUMNS
-- ===========================================
-- Adds logo_url and clinic_email to clinics table
-- Backfills data for existing 'butkevica' clinic

DO $$
BEGIN
    -- Add logo_url if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinics' AND column_name = 'logo_url') THEN
        ALTER TABLE public.clinics ADD COLUMN logo_url TEXT;
        RAISE NOTICE 'Added logo_url to clinics';
    END IF;

    -- Add clinic_email if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinics' AND column_name = 'clinic_email') THEN
        ALTER TABLE public.clinics ADD COLUMN clinic_email TEXT;
        RAISE NOTICE 'Added clinic_email to clinics';
    END IF;
END $$;

-- Backfill 'butkevica' data
UPDATE public.clinics
SET 
    -- Using a placeholder or the actual URL if known. For now, we'll leave logo_url null (uses default 'B' circle) 
    -- or set it if user provided one. The user didn't provide a specific URL, so we keep it NULL to use the fallback logic initially 
    -- OR we can set a placeholder.
    -- Let's set the email as it's critical for workflows.
    clinic_email = 'info@drbutkevicadentalpractice.com'
WHERE id = 'butkevica';

-- Verify
SELECT id, name, clinic_email, logo_url FROM public.clinics WHERE id = 'butkevica';
