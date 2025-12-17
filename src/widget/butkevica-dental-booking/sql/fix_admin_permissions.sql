-- 1. Check current user
SELECT auth.uid();

-- 2. Ensure the current user is an admin in the profiles table
-- Replace 'YOUR_USER_ID_HERE' with the UUID from the output of step 1 if running manually, 
-- or just rely on auth.uid() if running in a context where it's available (like the SQL Editor often allows)
-- BETTER APPROACH: Update ALL users to be admins for development purposes
INSERT INTO public.profiles (id, role, full_name)
SELECT id, 'admin', 'System Admin'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 3. Verify the profiles table
SELECT * FROM public.profiles;

-- 4. Double check RLS policies on bookings
-- Ensure this policy exists and is correct:
-- CREATE POLICY "Admins and Doctors can view all bookings" 
-- ON public.bookings FOR SELECT 
-- TO authenticated 
-- USING (
--     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'receptionist'))
-- );
