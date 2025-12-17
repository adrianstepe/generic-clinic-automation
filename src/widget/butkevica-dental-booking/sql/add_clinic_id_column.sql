-- ===========================================
-- FIX: ADD CLINIC_ID TO BOOKINGS
-- ===========================================
-- Solves the "clinic_id is not supported" error in n8n
-- by adding the missing column to the schema.

-- 1. Add column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'clinic_id') THEN
        ALTER TABLE public.bookings 
        ADD COLUMN clinic_id TEXT NOT NULL DEFAULT 'butkevica';
        
        -- Optional: Add Foreign Key if clinics table exists
        -- We check if clinics table exists first to avoid errors
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinics') THEN
            ALTER TABLE public.bookings 
            ADD CONSTRAINT fk_bookings_clinic 
            FOREIGN KEY (clinic_id) 
            REFERENCES public.clinics(id) 
            ON DELETE SET DEFAULT;
        END IF;

        RAISE NOTICE 'Added clinic_id column to bookings table';
    ELSE
        RAISE NOTICE 'Column clinic_id already exists in bookings table';
    END IF;
END $$;

-- 2. Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'clinic_id';
