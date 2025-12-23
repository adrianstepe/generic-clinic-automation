-- ===========================================
-- FIX PHONE NUMBER SAVING
-- ===========================================
-- Run this in Supabase SQL Editor
-- Updates reserve_slot to capture customer_phone

CREATE OR REPLACE FUNCTION reserve_slot(
    p_clinic_id TEXT, -- Required for Multi-Tenancy
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_customer_email TEXT,
    p_customer_name TEXT DEFAULT NULL,
    p_service_id TEXT DEFAULT NULL,
    p_service_name TEXT DEFAULT NULL,
    p_lock_minutes INTEGER DEFAULT 5,
    p_customer_phone TEXT DEFAULT NULL -- NEW: Capture phone number
)
RETURNS TABLE (
    success BOOLEAN,
    booking_id UUID,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking_id UUID;
    v_conflict_count INTEGER;
BEGIN
    -- Check for existing confirmed/pending bookings or active locks specific to this clinic
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.bookings
    WHERE clinic_id = p_clinic_id -- Filter by Clinic!
    AND (
        -- Time overlap check
        start_time < p_end_time AND end_time > p_start_time
    )
    AND (
        -- Either confirmed/completed status
        status IN ('confirmed', 'completed', 'pending')
        -- Or an active lock that hasn't expired
        OR (slot_lock_expires_at IS NOT NULL AND slot_lock_expires_at > NOW())
    );

    IF v_conflict_count > 0 THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'SLOT_ALREADY_BOOKED'::TEXT;
        RETURN;
    END IF;

    -- Insert pending booking with lock AND clinic_id AND phone
    INSERT INTO public.bookings (
        clinic_id,
        start_time,
        end_time,
        customer_email,
        customer_name,
        customer_phone, -- Insert it
        service_id,
        service_name,
        status,
        slot_lock_expires_at,
        created_at
    ) VALUES (
        p_clinic_id,
        p_start_time,
        p_end_time,
        p_customer_email,
        p_customer_name,
        p_customer_phone, -- Insert it
        p_service_id,
        p_service_name,
        'pending',
        NOW() + (p_lock_minutes || ' minutes')::INTERVAL,
        NOW()
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
