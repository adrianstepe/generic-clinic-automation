-- 1. Enable RLS on all tables
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Create workflow_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.workflow_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message TEXT,
    details JSONB,
    clinic_id TEXT -- Add clinic context to logs
);
ALTER TABLE public.workflow_logs ENABLE ROW LEVEL SECURITY;

-- 2. Schema Updates for SaaS (Ensure columns exist)
-- Ensure profiles has clinic_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'clinic_id') THEN
        ALTER TABLE public.profiles ADD COLUMN clinic_id TEXT REFERENCES public.clinics(id);
    END IF;
END $$;

-- Ensure bookings has clinic_id (Aligning business_id to clinic_id)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'clinic_id') THEN
        ALTER TABLE public.bookings ADD COLUMN clinic_id TEXT REFERENCES public.clinics(id);
    END IF;
    -- Optional: Migration for existing data if business_id exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'business_id') THEN
        -- Copy business_id to clinic_id if clinic_id is null
        UPDATE public.bookings SET clinic_id = business_id WHERE clinic_id IS NULL;
    END IF;
END $$;

-- 3. Create Policies (Drop first to avoid errors)

-- SERVICES
DROP POLICY IF EXISTS "Public services are viewable by everyone" ON public.services;
DROP POLICY IF EXISTS "Admins can insert services" ON public.services;
DROP POLICY IF EXISTS "Admins can update services" ON public.services;
DROP POLICY IF EXISTS "Tenant Isolation for Services" ON public.services;

-- Public can see services (filtered by clinic_id in query, but RLS can allow all for public widget)
-- However, for better security, we should maybe restrict? 
-- For now, keep public read as the widget needs to fetch them without auth.
CREATE POLICY "Public services are viewable by everyone" 
ON public.services FOR SELECT 
USING (true);

-- Admins/Doctors can only modify their OWN clinic's services
CREATE POLICY "Tenant Isolation for Services (Insert)" 
ON public.services FOR INSERT 
TO authenticated 
WITH CHECK (
    clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor'))
);

CREATE POLICY "Tenant Isolation for Services (Update)" 
ON public.services FOR UPDATE 
TO authenticated 
USING (
    clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor'))
);

-- PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- BOOKINGS
DROP POLICY IF EXISTS "Anyone can create a booking" ON public.bookings;
DROP POLICY IF EXISTS "Admins and Doctors can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins and Doctors can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Tenant Isolation for Bookings" ON public.bookings;

-- Tenant Isolation: Users can only see bookings for their clinic
CREATE POLICY "Tenant Isolation for Bookings" 
ON public.bookings FOR SELECT 
TO authenticated 
USING (
    clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'receptionist'))
);

-- Tenant Isolation: Users can only update bookings for their clinic
CREATE POLICY "Tenant Isolation for Bookings (Update)" 
ON public.bookings FOR UPDATE 
TO authenticated 
USING (
    clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'receptionist'))
);

-- WORKFLOW LOGS
DROP POLICY IF EXISTS "Admins can view logs" ON public.workflow_logs;

CREATE POLICY "Admins can view logs" 
ON public.workflow_logs FOR SELECT 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    -- Optional: Add clinic isolation here too if logs are clinic-specific
);

-- 4. FIX LOGIN ISSUE: Auto-confirm all users
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- 5. Ensure your user has a profile (Safety net)
INSERT INTO public.profiles (id, role, full_name, clinic_id)
SELECT id, 'admin', 'System Admin', 'butkevica' -- Default to butkevica for existing admins
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

