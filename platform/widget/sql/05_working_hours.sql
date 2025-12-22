-- ===========================================
-- WORKING HOURS CONFIGURATION MIGRATION
-- ===========================================
-- Run this in Supabase SQL Editor
-- Date: 2025-12-23
-- Purpose: Adds configurable working hours for clinics and specialists

-- ===========================================
-- PART 1: CLINIC WORKING HOURS TABLE
-- ===========================================
-- Stores the default working hours for each clinic (Super Admin configurable)

CREATE TABLE IF NOT EXISTS public.clinic_working_hours (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id TEXT REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    is_open BOOLEAN DEFAULT true,
    open_time TIME DEFAULT '09:00:00',
    close_time TIME DEFAULT '18:00:00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clinic_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.clinic_working_hours ENABLE ROW LEVEL SECURITY;

-- Public read access (widget needs this)
CREATE POLICY "Allow public read access to clinic_working_hours"
ON public.clinic_working_hours FOR SELECT
USING (true);

-- Super admins can manage clinic working hours
CREATE POLICY "Super admins can manage clinic_working_hours"
ON public.clinic_working_hours FOR ALL
TO authenticated
USING (
    auth.email() IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
)
WITH CHECK (
    auth.email() IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
);

-- Clinic admins can manage their own clinic's working hours
CREATE POLICY "Clinic admins can manage own clinic_working_hours"
ON public.clinic_working_hours FOR ALL
TO authenticated
USING (
    clinic_id IN (
        SELECT clinic_id FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    clinic_id IN (
        SELECT clinic_id FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ===========================================
-- PART 2: SPECIALIST WORKING HOURS TABLE
-- ===========================================
-- Stores per-specialist schedule overrides (Doctor Admin configurable)

CREATE TABLE IF NOT EXISTS public.specialist_working_hours (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    specialist_id TEXT REFERENCES public.specialists(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    is_available BOOLEAN DEFAULT true,
    start_time TIME DEFAULT '09:00:00',
    end_time TIME DEFAULT '18:00:00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(specialist_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.specialist_working_hours ENABLE ROW LEVEL SECURITY;

-- Public read access (widget needs this)
CREATE POLICY "Allow public read access to specialist_working_hours"
ON public.specialist_working_hours FOR SELECT
USING (true);

-- Super admins can manage all specialist working hours
CREATE POLICY "Super admins can manage specialist_working_hours"
ON public.specialist_working_hours FOR ALL
TO authenticated
USING (
    auth.email() IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
)
WITH CHECK (
    auth.email() IN (SELECT email FROM public.super_admin_whitelist WHERE is_active = true)
);

-- Clinic admins can manage specialists in their clinic
CREATE POLICY "Clinic admins can manage own clinic specialist_working_hours"
ON public.specialist_working_hours FOR ALL
TO authenticated
USING (
    specialist_id IN (
        SELECT s.id FROM public.specialists s
        JOIN public.profiles p ON s.clinic_id = p.clinic_id
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
)
WITH CHECK (
    specialist_id IN (
        SELECT s.id FROM public.specialists s
        JOIN public.profiles p ON s.clinic_id = p.clinic_id
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

-- ===========================================
-- PART 3: HELPER FUNCTION TO GET WORKING HOURS
-- ===========================================
-- Returns working hours for a clinic on a specific day

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
-- PART 4: SEED DEFAULT WORKING HOURS
-- ===========================================
-- Function to initialize default working hours for a clinic

CREATE OR REPLACE FUNCTION public.initialize_clinic_working_hours(p_clinic_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert default Mon-Fri 9:00-18:00, Sat-Sun closed
    INSERT INTO public.clinic_working_hours (clinic_id, day_of_week, is_open, open_time, close_time)
    VALUES
        (p_clinic_id, 0, false, '09:00', '18:00'), -- Sunday (closed)
        (p_clinic_id, 1, true, '09:00', '18:00'),  -- Monday
        (p_clinic_id, 2, true, '09:00', '18:00'),  -- Tuesday
        (p_clinic_id, 3, true, '09:00', '18:00'),  -- Wednesday
        (p_clinic_id, 4, true, '09:00', '18:00'),  -- Thursday
        (p_clinic_id, 5, true, '09:00', '18:00'),  -- Friday
        (p_clinic_id, 6, false, '09:00', '18:00')  -- Saturday (closed)
    ON CONFLICT (clinic_id, day_of_week) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.initialize_clinic_working_hours TO service_role;

-- ===========================================
-- PART 5: VERIFICATION
-- ===========================================

-- Check tables exist
SELECT 'clinic_working_hours' as table_name, COUNT(*) as count FROM public.clinic_working_hours;
SELECT 'specialist_working_hours' as table_name, COUNT(*) as count FROM public.specialist_working_hours;

-- List columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clinic_working_hours';

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'specialist_working_hours';
