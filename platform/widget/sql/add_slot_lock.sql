-- ===========================================
-- SLOT LOCKING: PREVENT DOUBLE BOOKINGS
-- ===========================================
-- Run this in Supabase SQL Editor
-- Adds slot locking mechanism to prevent race conditions during checkout

-- 1. Add slot_lock_expires_at column for temporary slot reservation
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS slot_lock_expires_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create index for efficient lock queries
-- This makes checking for active locks fast
CREATE INDEX IF NOT EXISTS idx_bookings_slot_lock 
ON public.bookings(slot_lock_expires_at) 
WHERE slot_lock_expires_at IS NOT NULL;

-- 3. Create composite index for availability queries
-- Speeds up the common query: "find all bookings for date X that block availability"
CREATE INDEX IF NOT EXISTS idx_bookings_availability_check
ON public.bookings(start_time, status, slot_lock_expires_at);

-- 4. Add RPC function for atomic slot reservation
-- This prevents race conditions at the database level
CREATE OR REPLACE FUNCTION reserve_slot(
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
    -- Check for existing confirmed/pending bookings or active locks
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.bookings
    WHERE (
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

    -- Insert pending booking with lock
    INSERT INTO public.bookings (
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

-- 5. Grant execute permission to service_role and anon (for widget)
GRANT EXECUTE ON FUNCTION reserve_slot TO anon;
GRANT EXECUTE ON FUNCTION reserve_slot TO service_role;

-- 6. Create function to clean up expired pending bookings
-- Can be called by a cron job or before availability checks
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete pending bookings with expired locks
    -- (Bookings where user started checkout but never completed payment)
    DELETE FROM public.bookings
    WHERE status = 'pending'
    AND slot_lock_expires_at IS NOT NULL
    AND slot_lock_expires_at < NOW()
    RETURNING * INTO v_deleted_count;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_expired_locks TO service_role;

-- 7. Create function to confirm a booking (promote pending or create new)
-- Called by n8n after Stripe payment completes
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
    p_language TEXT DEFAULT 'lv'
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
                slot_lock_expires_at = NULL  -- Clear the lock
            WHERE id = p_pending_booking_id;
            
            RETURN QUERY SELECT TRUE, p_pending_booking_id, 'PROMOTED'::TEXT, NULL::TEXT;
            RETURN;
        END IF;
        -- If pending booking not found, fall through to insert
    END IF;
    
    -- Case 2: Create new booking (no pending_booking_id or pending not found)
    INSERT INTO public.bookings (
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

GRANT EXECUTE ON FUNCTION confirm_booking TO service_role;

-- 8. Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name = 'slot_lock_expires_at';

-- Show the new functions
SELECT proname 
FROM pg_proc 
WHERE proname IN ('reserve_slot', 'confirm_booking', 'cleanup_expired_locks');
