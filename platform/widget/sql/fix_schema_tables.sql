-- ===========================================
-- FIX SCHEMA: SERVICES & SPECIALISTS
-- ===========================================
-- Align DB schema with Frontend (JSONB columns, price_cents)
-- Dropping incorrect 'clinic_' prefixed tables and recreating views

-- 1. DROP ALL OLD/INCORRECT TABLES (CASCADE to remove dependent views)
DROP TABLE IF EXISTS public.clinic_services CASCADE;
DROP TABLE IF EXISTS public.clinic_specialists CASCADE;
-- Also drop current services/specialists to recreate with correct JSONB types
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.specialists CASCADE;
DROP TABLE IF EXISTS public.clinic_translations CASCADE;

-- 2. ENSURE CORRECT TABLES EXIST

-- Clinics (Master table for SaaS)
CREATE TABLE IF NOT EXISTS public.clinics (
    id TEXT PRIMARY KEY, -- e.g. 'butkevica'
    name TEXT NOT NULL,
    domain TEXT, -- for CORS/Access control
    theme JSONB DEFAULT '{}'::jsonb, -- colors, logo, etc
    settings JSONB DEFAULT '{}'::jsonb, -- timezone, locale defaults
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for clinics
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- Public read for clinics
DROP POLICY IF EXISTS "Public can view clinics" ON public.clinics;
CREATE POLICY "Public can view clinics" ON public.clinics FOR SELECT USING (true);

-- Services

CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL DEFAULT 'butkevica',
    name JSONB NOT NULL, -- { "en": "...", "lv": "..." }
    description JSONB,
    price_cents INTEGER NOT NULL DEFAULT 0, -- Fix: Use price_cents to match frontend
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    category TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Specialists
CREATE TABLE IF NOT EXISTS public.specialists (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL DEFAULT 'butkevica',
    name TEXT NOT NULL,
    role JSONB, -- { "en": "Surgeon" }
    photo_url TEXT,
    specialties TEXT[], -- Array of strings
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Translations
CREATE TABLE IF NOT EXISTS public.clinic_translations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    clinic_id TEXT NOT NULL DEFAULT 'butkevica',
    key TEXT NOT NULL, -- e.g. 'headerTitle'
    value JSONB NOT NULL, -- { "en": "Book Now" }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clinic_id, key)
);

-- 3. ENABLE RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_translations ENABLE ROW LEVEL SECURITY;

-- 4. PUBLIC READ POLICIES
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services" ON public.services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view active specialists" ON public.specialists;
CREATE POLICY "Public can view active specialists" ON public.specialists FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view translations" ON public.clinic_translations;
CREATE POLICY "Public can view translations" ON public.clinic_translations FOR SELECT USING (true);

-- 5. ADMIN WRITE POLICIES (Authenticated)
DROP POLICY IF EXISTS "Admin can manage services" ON public.services;
CREATE POLICY "Admin can manage services" ON services FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can manage specialists" ON public.specialists;
CREATE POLICY "Admin can manage specialists" ON specialists FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can manage translations" ON public.clinic_translations;
CREATE POLICY "Admin can manage translations" ON clinic_translations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. RECREATE ANALYTICS VIEWS (Pointing to new 'services' table)

-- Monthly summary view
DROP VIEW IF EXISTS public.analytics_monthly_summary;
CREATE VIEW public.analytics_monthly_summary AS
SELECT 
    date_trunc('month', b.created_at) AS month,
    b.business_id,
    COUNT(*) AS total_bookings,
    COUNT(DISTINCT b.customer_email) AS unique_patients,
    COUNT(*) FILTER (WHERE b.actual_status = 'completed') AS completed,
    COUNT(*) FILTER (WHERE b.actual_status = 'no_show') AS no_shows,
    COUNT(*) FILTER (WHERE b.status = 'cancelled') AS cancellations,
    COUNT(*) FILTER (WHERE b.review_requested_at IS NOT NULL) AS reviews_requested,
    COUNT(*) FILTER (WHERE b.review_completed_at IS NOT NULL) AS reviews_completed,
    SUM(s.price_cents) / 100.0 AS revenue_eur,
    AVG(EXTRACT(EPOCH FROM (b.start_time - b.created_at)) / 86400)::numeric(10,1) AS avg_lead_time_days
FROM public.bookings b
LEFT JOIN public.services s ON b.service_id = s.id
WHERE b.status NOT IN ('pending', 'expired')
GROUP BY date_trunc('month', b.created_at), b.business_id;

-- Top services view
DROP VIEW IF EXISTS public.analytics_top_services;
CREATE VIEW public.analytics_top_services AS
SELECT 
    date_trunc('month', b.created_at) AS month,
    b.business_id,
    b.service_id,
    s.name->>'en' AS service_name,
    COUNT(*) AS booking_count,
    SUM(s.price_cents) / 100.0 AS revenue_eur
FROM public.bookings b
LEFT JOIN public.services s ON b.service_id = s.id
WHERE b.status = 'confirmed'
GROUP BY date_trunc('month', b.created_at), b.business_id, b.service_id, s.name->>'en'
ORDER BY revenue_eur DESC;
