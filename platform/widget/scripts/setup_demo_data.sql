-- ============================================
-- DEMO DATA SETUP SCRIPT FOR RĪGAS DENTAL DEMO
-- Run this in your Supabase SQL Editor
-- ============================================

-- Step 1: Find any valid service_id from this project
-- (We'll use the first one we find)
DO $$
DECLARE
    v_service_id TEXT;
BEGIN
    SELECT id INTO v_service_id FROM services LIMIT 1;
    
    IF v_service_id IS NULL THEN
        -- If no services exist, we'll insert without a service_id
        INSERT INTO bookings (
            created_at, start_time, end_time, service_name,
            customer_name, customer_email, customer_phone, amount_paid,
            status, clinic_id, language, source
        ) VALUES (
            NOW(), 
            '2026-01-06 16:00:00+02', 
            '2026-01-06 17:00:00+02',
            'Zobu balināšana',
            'Adrians Stepe', 
            'adrians.stepe@example.com', 
            '20000000', 
            30.00,
            'pending',
            'demo-clinic', 
            'lv', 
            'demo_seed'
        );
    ELSE
        -- Use the found service_id
        INSERT INTO bookings (
            created_at, start_time, end_time, service_id, service_name,
            customer_name, customer_email, customer_phone, amount_paid,
            status, clinic_id, language, source
        ) VALUES (
            NOW(), 
            '2026-01-06 16:00:00+02', 
            '2026-01-06 17:00:00+02',
            v_service_id,
            'Zobu balināšana',
            'Adrians Stepe', 
            'adrians.stepe@example.com', 
            '20000000', 
            30.00,
            'pending',
            'demo-clinic', 
            'lv', 
            'demo_seed'
        );
    END IF;
    
    RAISE NOTICE 'Booking inserted successfully with service_id: %', COALESCE(v_service_id, 'NULL');
END $$;

-- Step 2: Verify the booking was inserted
SELECT id, customer_name, clinic_id, status, start_time, service_name
FROM bookings 
WHERE customer_name = 'Adrians Stepe'
ORDER BY created_at DESC
LIMIT 1;

-- Step 3: Ensure the admin user profile has the correct clinic_id
UPDATE profiles
SET clinic_id = 'demo-clinic', role = 'admin'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'admin@demo-clinic.com'
);

-- Step 4: Confirm the profile update
SELECT p.id, p.full_name, p.clinic_id, p.role, u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'admin@demo-clinic.com';

-- ============================================
-- EXPECTED OUTPUT:
-- 1. "Booking inserted successfully" message
-- 2. Booking row with clinic_id = 'demo-clinic'
-- 3. Profile row with clinic_id = 'demo-clinic'
-- 
-- After running this:
-- 1. Log out of the dashboard
-- 2. Log in with: admin@demo-clinic.com / password123
-- 3. You should see the "Adrians Stepe" booking
-- ============================================
