-- ===========================================
-- FIX FUNCTION SEARCH PATH MUTABLE WARNINGS
-- ===========================================
-- Run this in Supabase SQL Editor
-- Date: 2025-12-23
-- Purpose: Set search_path to empty for SECURITY DEFINER functions
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- ===========================================
-- DROP OLD OVERLOADED FUNCTION SIGNATURES
-- ===========================================
-- These old versions don't have clinic_id and cause duplicate warnings

-- Old reserve_slot without clinic_id (from add_slot_lock.sql)
DROP FUNCTION IF EXISTS public.reserve_slot(
    TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, INTEGER
);

-- Old reserve_slot with clinic_id but without customer_phone (from 03_update_rpc_saas.sql)
DROP FUNCTION IF EXISTS public.reserve_slot(
    TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, INTEGER
);

-- Old confirm_booking without clinic_id (from add_slot_lock.sql)
DROP FUNCTION IF EXISTS public.confirm_booking(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, 
    DECIMAL, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT
);

-- ===========================================
-- 1. reserve_slot (latest version with clinic_id)
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
    v_conflict_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.bookings
    WHERE clinic_id = p_clinic_id
    AND (start_time < p_end_time AND end_time > p_start_time)
    AND (
        status IN ('confirmed', 'completed', 'pending')
        OR (slot_lock_expires_at IS NOT NULL AND slot_lock_expires_at > NOW())
    );

    IF v_conflict_count > 0 THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'SLOT_ALREADY_BOOKED'::TEXT;
        RETURN;
    END IF;

    INSERT INTO public.bookings (
        clinic_id, start_time, end_time, customer_email, customer_name,
        customer_phone, service_id, service_name, status, slot_lock_expires_at, created_at
    ) VALUES (
        p_clinic_id, p_start_time, p_end_time, p_customer_email, p_customer_name,
        p_customer_phone, p_service_id, p_service_name, 'pending',
        NOW() + (p_lock_minutes || ' minutes')::INTERVAL, NOW()
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

-- ===========================================
-- 2. confirm_booking
-- ===========================================
CREATE OR REPLACE FUNCTION public.confirm_booking(
    p_pending_booking_id UUID DEFAULT NULL,
    p_customer_name TEXT DEFAULT NULL,
    p_customer_email TEXT DEFAULT NULL,
    p_customer_phone TEXT DEFAULT NULL,
    p_service_id TEXT DEFAULT NULL,
    p_service_name TEXT DEFAULT NULL,
    p_start_time TIMESTAMPTZ DEFAULT NULL,
    p_end_time TIMESTAMPTZ DEFAULT NULL,
    p_amount_paid DECIMAL DEFAULT NULL,
    p_stripe_session_id TEXT DEFAULT NULL,
    p_payment_intent_id TEXT DEFAULT NULL,
    p_amount_cents INTEGER DEFAULT NULL,
    p_currency TEXT DEFAULT 'EUR',
    p_client_reference TEXT DEFAULT NULL,
    p_cancellation_token TEXT DEFAULT NULL,
    p_language TEXT DEFAULT 'lv',
    p_clinic_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    booking_id UUID,
    operation TEXT,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_booking_id UUID;
    v_existing_id UUID;
BEGIN
    IF p_pending_booking_id IS NOT NULL THEN
        SELECT id INTO v_existing_id 
        FROM public.bookings 
        WHERE id = p_pending_booking_id AND status = 'pending';
        
        IF v_existing_id IS NOT NULL THEN
            UPDATE public.bookings SET
                customer_name = COALESCE(p_customer_name, customer_name),
                customer_email = COALESCE(p_customer_email, customer_email),
                customer_phone = COALESCE(p_customer_phone, customer_phone),
                service_id = COALESCE(p_service_id, service_id),
                service_name = COALESCE(p_service_name, service_name),
                start_time = COALESCE(p_start_time, start_time),
                end_time = COALESCE(p_end_time, end_time),
                amount_paid = COALESCE(p_amount_paid, amount_paid),
                stripe_session_id = COALESCE(p_stripe_session_id, stripe_session_id),
                payment_intent_id = COALESCE(p_payment_intent_id, payment_intent_id),
                amount_cents = COALESCE(p_amount_cents, amount_cents),
                currency = COALESCE(p_currency, currency),
                client_reference = COALESCE(p_client_reference, client_reference),
                cancellation_token = COALESCE(p_cancellation_token, cancellation_token),
                language = COALESCE(p_language, language),
                status = 'confirmed',
                slot_lock_expires_at = NULL,
                clinic_id = COALESCE(p_clinic_id, clinic_id)
            WHERE id = p_pending_booking_id;
            
            RETURN QUERY SELECT TRUE, p_pending_booking_id, 'PROMOTED'::TEXT, NULL::TEXT;
            RETURN;
        END IF;
    END IF;
    
    INSERT INTO public.bookings (
        clinic_id, customer_name, customer_email, customer_phone,
        service_id, service_name, start_time, end_time, amount_paid,
        stripe_session_id, payment_intent_id, amount_cents, currency,
        client_reference, cancellation_token, language, status, created_at
    ) VALUES (
        p_clinic_id, p_customer_name, p_customer_email, p_customer_phone,
        p_service_id, p_service_name, p_start_time, p_end_time, p_amount_paid,
        p_stripe_session_id, p_payment_intent_id, p_amount_cents, p_currency,
        p_client_reference, p_cancellation_token, p_language, 'confirmed', NOW()
    )
    RETURNING id INTO v_booking_id;
    
    RETURN QUERY SELECT TRUE, v_booking_id, 'INSERTED'::TEXT, NULL::TEXT;
    RETURN;
EXCEPTION
    WHEN unique_violation THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'ERROR'::TEXT, 'DUPLICATE_BOOKING'::TEXT;
        RETURN;
    WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'ERROR'::TEXT, SQLERRM::TEXT;
        RETURN;
END;
$$;

-- ===========================================
-- 3. is_super_admin
-- ===========================================
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.super_admin_whitelist 
        WHERE email = auth.email() 
        AND is_active = true
    );
END;
$$;

-- ===========================================
-- 4. get_clinic_working_hours
-- ===========================================
CREATE OR REPLACE FUNCTION public.get_clinic_working_hours(
    p_clinic_id TEXT,
    p_day_of_week INTEGER DEFAULT NULL
)
RETURNS TABLE (
    day_of_week INTEGER,
    is_open BOOLEAN,
    open_time TIME,
    close_time TIME
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cwh.day_of_week,
        cwh.is_open,
        cwh.open_time,
        cwh.close_time
    FROM public.clinic_working_hours cwh
    WHERE cwh.clinic_id = p_clinic_id
    AND (p_day_of_week IS NULL OR cwh.day_of_week = p_day_of_week)
    ORDER BY cwh.day_of_week;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_clinic_working_hours TO anon;
GRANT EXECUTE ON FUNCTION public.get_clinic_working_hours TO service_role;

-- ===========================================
-- 5. initialize_clinic_working_hours
-- ===========================================
CREATE OR REPLACE FUNCTION public.initialize_clinic_working_hours(p_clinic_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.clinic_working_hours (clinic_id, day_of_week, is_open, open_time, close_time)
    VALUES
        (p_clinic_id, 0, false, '09:00', '18:00'),
        (p_clinic_id, 1, true, '09:00', '18:00'),
        (p_clinic_id, 2, true, '09:00', '18:00'),
        (p_clinic_id, 3, true, '09:00', '18:00'),
        (p_clinic_id, 4, true, '09:00', '18:00'),
        (p_clinic_id, 5, true, '09:00', '18:00'),
        (p_clinic_id, 6, false, '09:00', '18:00')
    ON CONFLICT (clinic_id, day_of_week) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.initialize_clinic_working_hours TO service_role;
