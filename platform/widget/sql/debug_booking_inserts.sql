-- ===========================================
-- DEBUG BOOKING INSERTS
-- ===========================================
-- Run this in Supabase SQL Editor to verify bookings are being inserted

-- 1. Check the most recent 10 bookings
SELECT 
    id,
    created_at,
    customer_name,
    customer_email,
    customer_phone,
    service_name,
    start_time,
    status,
    amount_paid,
    stripe_session_id
FROM public.bookings 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Count bookings created in the last 24 hours
SELECT COUNT(*) AS bookings_last_24h
FROM public.bookings 
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- 3. Check if there are any bookings with the new fields populated
SELECT 
    COUNT(*) AS total_bookings,
    COUNT(customer_phone) AS with_phone,
    COUNT(service_name) AS with_service_name,
    COUNT(amount_paid) AS with_amount_paid,
    COUNT(stripe_session_id) AS with_stripe_id
FROM public.bookings;

-- 4. Test INSERT manually (use this to verify your postgres connection works)
-- UNCOMMENT to run a test insert:
/*
INSERT INTO public.bookings (
    customer_name,
    customer_email,
    customer_phone,
    start_time,
    end_time,
    status,
    service_id,
    service_name,
    amount_paid,
    stripe_session_id
) VALUES (
    'Test Patient',
    'test@example.com',
    '+37120000000',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day' + INTERVAL '1 hour',
    'confirmed',
    's1',
    'Test Service',
    30.00,
    'test_stripe_session_123'
);
*/
