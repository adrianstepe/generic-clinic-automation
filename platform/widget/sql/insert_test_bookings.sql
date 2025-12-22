-- ===========================================
-- INSERT TEST BOOKINGS FOR DASHBOARD
-- ===========================================
-- Run this in Supabase SQL Editor to add test bookings

-- Insert 5 test bookings with realistic Latvian data
INSERT INTO public.bookings (
    customer_name,
    customer_email,
    customer_phone,
    status,
    start_time,
    end_time,
    service_name,
    created_at
) VALUES 
    -- Today's appointment
    (
        'Līga Kalniņa',
        'liga.kalnina@inbox.lv',
        '+37120001001',
        'confirmed',
        (CURRENT_DATE + INTERVAL '10 hours'),
        (CURRENT_DATE + INTERVAL '11 hours'),
        'Zobu higiēna',
        NOW()
    ),
    -- Tomorrow's appointment
    (
        'Andris Ozols',
        'andris.ozols@gmail.com',
        '+37126543210',
        'pending',
        (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '14 hours'),
        (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '15 hours'),
        'Sakņu kanālu ārstēšana',
        NOW() - INTERVAL '1 hour'
    ),
    -- This week
    (
        'Maija Bērziņa',
        'maija.b@inbox.lv',
        '+37129876543',
        'confirmed',
        (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '9 hours'),
        (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '10 hours'),
        'Zobu pārbaude',
        NOW() - INTERVAL '2 hours'
    ),
    -- Completed appointment
    (
        'Jānis Liepiņš',
        'janis.liepins@apollo.lv',
        '+37128001234',
        'completed',
        (CURRENT_DATE - INTERVAL '1 day' + INTERVAL '11 hours'),
        (CURRENT_DATE - INTERVAL '1 day' + INTERVAL '12 hours'),
        'Zobu balināšana',
        NOW() - INTERVAL '1 day'
    ),
    -- Another pending
    (
        'Anna Krūmiņa',
        'anna.k@gmail.com',
        '+37127654321',
        'pending',
        (CURRENT_DATE + INTERVAL '3 days' + INTERVAL '15 hours'),
        (CURRENT_DATE + INTERVAL '3 days' + INTERVAL '16 hours'),
        'Zobu plombēšana',
        NOW() - INTERVAL '30 minutes'
    );

-- Verify the inserted bookings
SELECT 
    id,
    customer_name,
    customer_email,
    status,
    start_time,
    service_name,
    created_at
FROM public.bookings 
ORDER BY created_at DESC;
