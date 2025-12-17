-- ===========================================
-- DEBUG BOOKINGS DISPLAY ISSUE
-- ===========================================
-- Run these queries one by one in Supabase SQL Editor

-- 1. Check if there are ANY bookings in the database
SELECT COUNT(*) AS total_bookings FROM public.bookings;

-- 2. Show all bookings (bypass RLS for admin)
SELECT 
    id,
    customer_name,
    customer_email,
    status,
    start_time,-- ===========================================
-- DEBUG BOOKINGS DISPLAY ISSUE
-- ===========================================
-- Run these queries one by one in Supabase SQL Editor

-- 1. Check if there are ANY bookings in the database
SELECT COUNT(*) AS total_bookings FROM public.bookings;

-- 2. Show all bookings (bypass RLS for admin)
SELECT 
    id,
    customer_name,
    customer_email,
    status,
    start_time,
    created_at
FROM public.bookings 
ORDER BY created_at DESC 
LIMIT 20;

-- 3. Check the current logged-in users and their roles
SELECT 
    p.id,
    p.full_name,
    p.role,
    u.email
FROM public.profiles p
JOIN auth.users u ON p.id = u.id;

-- 4. If no profiles exist, create admin profile for all users
INSERT INTO public.profiles (id, role, full_name)
SELECT id, 'admin', email
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 5. Insert a test booking if no bookings exist
INSERT INTO public.bookings (
    customer_name,
    customer_email,
    customer_phone,
    status,
    start_time,
    end_time,
    service_name,
    created_at
)
SELECT 
    'Jānis Bērziņš',
    'janis@example.lv',
    '+37120000001',
    'confirmed',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day' + INTERVAL '1 hour',
    'Zobu higiēna',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.bookings LIMIT 1);

-- 6. Verify RLS policies allow SELECT for authenticated users
SELECT 
    policyname, 
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE tablename = 'bookings' AND cmd = 'SELECT';

-- 7. Temporarily disable RLS for debugging (if you want to test without RLS)
-- WARNING: Only do this for debugging, re-enable after!
-- ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- To re-enable:
-- ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

    created_at
FROM public.bookings 
ORDER BY created_at DESC 
LIMIT 20;

-- 3. Check the current logged-in users and their roles
SELECT 
    p.id,
    p.full_name,
    p.role,
    u.email
FROM public.profiles p
JOIN auth.users u ON p.id = u.id;

-- 4. If no profiles exist, create admin profile for all users
INSERT INTO public.profiles (id, role, full_name)
SELECT id, 'admin', email
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 5. Insert a test booking if no bookings exist
INSERT INTO public.bookings (
    customer_name,
    customer_email,
    customer_phone,
    status,
    start_time,
    end_time,
    service_name,
    created_at
)
SELECT 
    'Jānis Bērziņš',
    'janis@example.lv',
    '+37120000001',
    'confirmed',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day' + INTERVAL '1 hour',
    'Zobu higiēna',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.bookings LIMIT 1);

-- 6. Verify RLS policies allow SELECT for authenticated users
SELECT 
    policyname, 
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE tablename = 'bookings' AND cmd = 'SELECT';

-- 7. Temporarily disable RLS for debugging (if you want to test without RLS)
-- WARNING: Only do this for debugging, re-enable after!
-- ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- To re-enable:
-- ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
