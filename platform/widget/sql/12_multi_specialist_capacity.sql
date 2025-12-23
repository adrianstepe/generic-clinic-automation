-- ===========================================
-- MULTI-SPECIALIST CAPACITY-AWARE SLOT RESERVATION
-- ===========================================
-- Run this in Supabase SQL Editor
-- Date: 2025-12-24
-- Purpose: Fix reserve_slot to allow multiple bookings at same time
--          when multiple specialists are qualified for a service

-- Drop existing function to recreate with new signature
DROP FUNCTION IF EXISTS public.reserve_slot(
    TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT
);

-- ===========================================
-- UPDATED reserve_slot with capacity checking
-- ===========================================
CREATE OR REPLACE FUNCTION public.reserve_slot(
    p_clinic_id TEXT,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_customer_email TEXT,
    p_customer_name TEXT DEFAULT NULL,
    p_service_id TEXT DEFAULT NULL,
    p_service_name TEXT DEFAULT NULL,
    p_lock_minutes INTEGER DEFAULT 5,
    p_customer_phone TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    booking_id UUID,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_booking_id UUID;
    v_specialist_count INTEGER;
    v_conflict_count INTEGER;
BEGIN
    -- ========================
    -- 1. Count qualified specialists for this service
    -- ========================
    IF p_service_id IS NOT NULL THEN
        -- Count specialists whose specialties array contains this service_id
        SELECT COUNT(*) INTO v_specialist_count
        FROM public.specialists
        WHERE clinic_id = p_clinic_id
          AND is_active = true
          AND specialties @> ARRAY[p_service_id];
    ELSE
        -- No service specified, count all active specialists
        SELECT COUNT(*) INTO v_specialist_count
        FROM public.specialists
        WHERE clinic_id = p_clinic_id
          AND is_active = true;
    END IF;

    -- If no specialists available for this service, reject
    IF v_specialist_count = 0 THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'NO_SPECIALISTS_AVAILABLE'::TEXT;
        RETURN;
    END IF;

    -- ========================
    -- 2. Count conflicting bookings at this time
    -- ========================
    -- Count bookings that overlap with the requested time slot
    -- Only count bookings from qualified specialists or unassigned bookings
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.bookings b
    WHERE b.clinic_id = p_clinic_id
      AND (b.start_time < p_end_time AND b.end_time > p_start_time)
      AND (
          b.status IN ('confirmed', 'completed', 'pending')
          OR (b.slot_lock_expires_at IS NOT NULL AND b.slot_lock_expires_at > NOW())
      )
      AND (
          -- Either specialist is qualified for this service
          (p_service_id IS NOT NULL AND b.specialist_id IN (
              SELECT s.id FROM public.specialists s 
              WHERE s.clinic_id = p_clinic_id 
                AND s.is_active = true 
                AND s.specialties @> ARRAY[p_service_id]
          ))
          -- Or booking has no specialist assigned (counts against general pool)
          OR b.specialist_id IS NULL
          -- Or no service filter (count all)
          OR p_service_id IS NULL
      );

    -- ========================
    -- 3. Check capacity: allow if bookings < specialists
    -- ========================
    IF v_conflict_count >= v_specialist_count THEN
        -- All qualified specialists are already booked at this time
        RETURN QUERY SELECT FALSE, NULL::UUID, 'SLOT_ALREADY_BOOKED'::TEXT;
        RETURN;
    END IF;

    -- ========================
    -- 4. Create pending booking with lock
    -- ========================
    INSERT INTO public.bookings (
        clinic_id, start_time, end_time, customer_email, customer_name,
        customer_phone, service_id, service_name, status, slot_lock_expires_at, 
        created_at, source
    ) VALUES (
        p_clinic_id, p_start_time, p_end_time, p_customer_email, p_customer_name,
        p_customer_phone, p_service_id, p_service_name, 'pending',
        NOW() + (p_lock_minutes || ' minutes')::INTERVAL, NOW(), 'widget'
    )
    RETURNING id INTO v_booking_id;

    RETURN QUERY SELECT TRUE, v_booking_id, NULL::TEXT;
    RETURN;

EXCEPTION
    WHEN unique_violation THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'DUPLICATE_BOOKING'::TEXT;
        RETURN;
    WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, SQLERRM::TEXT;
        RETURN;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.reserve_slot TO anon;
GRANT EXECUTE ON FUNCTION public.reserve_slot TO service_role;

-- ========================
-- VERIFICATION
-- ========================
-- Test query: Check specialist capacity for a service
-- SELECT id, name, specialties 
-- FROM specialists 
-- WHERE clinic_id = 'butkevica' 
--   AND is_active = true 
--   AND specialties @> ARRAY['butkevica_s4'];
