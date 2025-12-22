-- ===========================================
-- SaaS RPC UPDATES: Tenant Isolation
-- ===========================================

-- 1. Update reserve_slot to accept and check clinic_id
CREATE OR REPLACE FUNCTION reserve_slot(
    p_clinic_id TEXT, -- NEW: Required for Multi-Tenancy
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_customer_email TEXT,
    p_customer_name TEXT DEFAULT NULL,
    p_service_id TEXT DEFAULT NULL,
    p_service_name TEXT DEFAULT NULL,
    p_lock_minutes INTEGER DEFAULT 5
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

    -- Insert pending booking with lock AND clinic_id
    INSERT INTO public.bookings (
        clinic_id, -- Store Clinic ID
        start_time,
        end_time,
        customer_email,
        customer_name,
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

-- 2. Update confirm_booking to accept clinic_id (optional but good for data integrity)
CREATE OR REPLACE FUNCTION confirm_booking(
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
    p_clinic_id TEXT DEFAULT NULL -- NEW
)
RETURNS TABLE (
    success BOOLEAN,
    booking_id UUID,
    operation TEXT,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking_id UUID;
    v_existing_id UUID;
BEGIN
    -- Case 1: Promote pending booking to confirmed
    IF p_pending_booking_id IS NOT NULL THEN
        -- Check if pending booking exists
        SELECT id INTO v_existing_id 
        FROM public.bookings 
        WHERE id = p_pending_booking_id AND status = 'pending';
        
        IF v_existing_id IS NOT NULL THEN
            -- Promote pending to confirmed
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
                clinic_id = COALESCE(p_clinic_id, clinic_id) -- Update clinic_id if provided
            WHERE id = p_pending_booking_id;
            
            RETURN QUERY SELECT TRUE, p_pending_booking_id, 'PROMOTED'::TEXT, NULL::TEXT;
            RETURN;
        END IF;
    END IF;
    
    -- Case 2: Create new booking
    INSERT INTO public.bookings (
        clinic_id, -- NEW
        customer_name,
        customer_email,
        customer_phone,
        service_id,
        service_name,
        start_time,
        end_time,
        amount_paid,
        stripe_session_id,
        payment_intent_id,
        amount_cents,
        currency,
        client_reference,
        cancellation_token,
        language,
        status,
        created_at
    ) VALUES (
        p_clinic_id, -- Insert it
        p_customer_name,
        p_customer_email,
        p_customer_phone,
        p_service_id,
        p_service_name,
        p_start_time,
        p_end_time,
        p_amount_paid,
        p_stripe_session_id,
        p_payment_intent_id,
        p_amount_cents,
        p_currency,
        p_client_reference,
        p_cancellation_token,
        p_language,
        'confirmed',
        NOW()
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
