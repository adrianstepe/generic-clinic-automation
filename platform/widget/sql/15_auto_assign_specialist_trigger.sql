-- ===========================================
-- AUTO-ASSIGN SPECIALIST - DATABASE TRIGGER
-- ===========================================
-- Run this in Supabase SQL Editor
-- Date: 2025-12-24
-- Purpose: Automatically assign a random specialist when booking is confirmed
--          This is a RELIABLE solution that works regardless of n8n workflow

-- ===========================================
-- STEP 1: Create the auto-assign function
-- ===========================================
CREATE OR REPLACE FUNCTION public.auto_assign_specialist()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_specialist_id TEXT;
    v_specialist_name TEXT;
BEGIN
    -- Only run when status changes to 'confirmed' and specialist_id is NULL
    IF NEW.status = 'confirmed' AND NEW.specialist_id IS NULL THEN
        -- Find a random qualified specialist who is NOT already booked at this time
        SELECT s.id, s.name INTO v_specialist_id, v_specialist_name
        FROM public.specialists s
        WHERE s.clinic_id = NEW.clinic_id
          AND s.is_active = true
          AND (
              -- Match by service_id in specialties array
              (NEW.service_id IS NOT NULL AND s.specialties @> ARRAY[NEW.service_id])
              -- Or if no service_id, pick any active specialist
              OR NEW.service_id IS NULL
          )
          -- Exclude specialists who already have a booking at this time
          AND NOT EXISTS (
              SELECT 1 FROM public.bookings b
              WHERE b.specialist_id = s.id
                AND b.clinic_id = NEW.clinic_id
                AND b.id != NEW.id
                AND b.status IN ('confirmed', 'completed')
                AND b.start_time < NEW.end_time
                AND b.end_time > NEW.start_time
          )
        ORDER BY RANDOM()
        LIMIT 1;
        
        -- Assign the specialist if found
        IF v_specialist_id IS NOT NULL THEN
            NEW.specialist_id := v_specialist_id;
            -- Log the assignment
            RAISE NOTICE 'Auto-assigned specialist % (%) to booking %', 
                v_specialist_name, v_specialist_id, NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- ===========================================
-- STEP 2: Create the trigger
-- ===========================================
DROP TRIGGER IF EXISTS trigger_auto_assign_specialist ON public.bookings;

CREATE TRIGGER trigger_auto_assign_specialist
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_specialist();

-- Also trigger on INSERT for new bookings that are already confirmed
CREATE OR REPLACE FUNCTION public.auto_assign_specialist_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_specialist_id TEXT;
BEGIN
    -- Only run for confirmed bookings without specialist
    IF NEW.status = 'confirmed' AND NEW.specialist_id IS NULL THEN
        SELECT s.id INTO v_specialist_id
        FROM public.specialists s
        WHERE s.clinic_id = NEW.clinic_id
          AND s.is_active = true
          AND (
              (NEW.service_id IS NOT NULL AND s.specialties @> ARRAY[NEW.service_id])
              OR NEW.service_id IS NULL
          )
          -- Exclude specialists who already have a booking at this time
          AND NOT EXISTS (
              SELECT 1 FROM public.bookings b
              WHERE b.specialist_id = s.id
                AND b.clinic_id = NEW.clinic_id
                AND b.id != NEW.id
                AND b.status IN ('confirmed', 'completed')
                AND b.start_time < NEW.end_time
                AND b.end_time > NEW.start_time
          )
        ORDER BY RANDOM()
        LIMIT 1;
        
        IF v_specialist_id IS NOT NULL THEN
            NEW.specialist_id := v_specialist_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_assign_specialist_insert ON public.bookings;

CREATE TRIGGER trigger_auto_assign_specialist_insert
    BEFORE INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_specialist_on_insert();

-- ===========================================
-- STEP 3: Fix existing unassigned bookings
-- ===========================================
-- This will assign specialists to all confirmed bookings that don't have one
UPDATE public.bookings b
SET specialist_id = (
    SELECT s.id
    FROM public.specialists s
    WHERE s.clinic_id = b.clinic_id
      AND s.is_active = true
      AND (
          (b.service_id IS NOT NULL AND s.specialties @> ARRAY[b.service_id])
          OR b.service_id IS NULL
      )
    ORDER BY RANDOM()
    LIMIT 1
)
WHERE b.status = 'confirmed' 
  AND b.specialist_id IS NULL;

-- ===========================================
-- STEP 4: Verify the fix
-- ===========================================
SELECT 
    id,
    customer_name,
    service_id,
    specialist_id,
    status,
    created_at::date as booking_date
FROM public.bookings
WHERE status = 'confirmed'
ORDER BY created_at DESC
LIMIT 10;

-- ===========================================
-- EXPECTED: All confirmed bookings should now have specialist_id filled
-- ===========================================
