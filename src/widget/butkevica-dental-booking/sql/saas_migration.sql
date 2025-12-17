-- ===========================================
-- SAAS MIGRATION: Dynamic Configuration + Idempotency
-- ===========================================
-- Run this in Supabase SQL Editor
-- Date: 2025-12-09

-- ===========================================
-- PART 1: IDEMPOTENCY PROTECTION
-- ===========================================
-- Stripe sends "at-least-once" delivery. This constraint
-- forces the database to reject duplicate session IDs,
-- protecting against double-booking if n8n receives
-- the same webhook twice.

-- First, check if constraint already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'bookings_stripe_session_unique'
    ) THEN
        -- Handle any existing duplicates first (keep the earliest)
        DELETE FROM public.bookings a
        USING public.bookings b
        WHERE a.stripe_session_id = b.stripe_session_id
          AND a.stripe_session_id IS NOT NULL
          AND a.created_at > b.created_at;
        
        -- Now add the constraint
        ALTER TABLE public.bookings 
            ADD CONSTRAINT bookings_stripe_session_unique 
            UNIQUE (stripe_session_id);
        
        RAISE NOTICE 'Added UNIQUE constraint on stripe_session_id';
    ELSE
        RAISE NOTICE 'Constraint bookings_stripe_session_unique already exists';
    END IF;
END $$;

-- ===========================================
-- PART 2: CLINIC SERVICES TABLE
-- ===========================================
-- Replaces hardcoded SERVICES array from constants.ts
-- Supports multi-language and per-clinic configuration

CREATE TABLE IF NOT EXISTS public.clinic_services (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL DEFAULT 'BUTKEVICA_DENTAL',
    name_en TEXT NOT NULL,
    name_lv TEXT NOT NULL,
    name_ru TEXT,
    description_en TEXT,
    description_lv TEXT,
    description_ru TEXT,
    price_cents INTEGER NOT NULL DEFAULT 0,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data from current constants.ts
INSERT INTO public.clinic_services (id, name_en, name_lv, name_ru, description_en, description_lv, description_ru, price_cents, duration_minutes, display_order)
VALUES
    ('s1', 'Integrated Teeth and Oral Cavity Test', 'Integrēta zobu un mutes dobuma pārbaude', 'Комплексное обследование зубов и полости рта', 'Comprehensive diagnostic check-up and plan.', 'Visaptveroša diagnostika un plāns.', 'Комплексная диагностика и план.', 5000, 45, 1),
    ('s2', 'Check-Ups and Dental Hygiene', 'Pārbaudes un zobu higiēna', 'Осмотры и гигиена зубов', 'Professional cleaning and routine exam.', 'Profesionāla tīrīšana un kārtējā pārbaude.', 'Профессиональная чистка и осмотр.', 6500, 60, 2),
    ('s3', 'Children''s Dentistry', 'Bērnu zobārstniecība', 'Детская стоматология', 'Gentle care for young patients.', 'Maiga aprūpe mazajiem pacientiem.', 'Бережный уход за маленькими пациентами.', 4500, 30, 3),
    ('s4', 'Dental Treatment', 'Zobu ārstēšana', 'Лечение зубов', 'Caries treatment and fillings.', 'Kariesa ārstēšana un plombēšana.', 'Лечение кариеса и пломбирование.', 6000, 60, 4),
    ('s5', 'Sedative treatment', 'Ārstēšana sedācijā', 'Лечение под седацией', 'Anxiety-free treatment options.', 'Ārstēšana bez stresa un raizēm.', 'Лечение без стресса и тревоги.', 10000, 60, 5),
    ('s6', 'Teeth Whitening', 'Zobu balināšana', 'Отбеливание зубов', 'Professional whitening for a brighter smile.', 'Profesionāla balināšana mirdzošam smaidam.', 'Профессиональное отбеливание.', 25000, 90, 6),
    ('s7', 'Surgery', 'Ķirurģija', 'Хирургия', 'Extractions and surgical procedures.', 'Zobu raušana un ķirurģija.', 'Удаление и хирургические процедуры.', 12000, 60, 7),
    ('s8', 'Prosthetics', 'Protezēšana', 'Протезирование', 'Crowns, bridges, and dentures.', 'Kroņi, tilti un protēzes.', 'Коронки, мосты и протезы.', 40000, 60, 8),
    ('s9', 'Implantology', 'Implantoloģija', 'Имплантология', 'Restoring missing teeth with implants.', 'Zobu atjaunošana ar implantiem.', 'Восстановление зубов имплантами.', 75000, 90, 9),
    ('s10', 'Restoration of Jaw Bone Tissues', 'Žokļa kaula audu atjaunošana', 'Восстановление костной ткани челюсти', 'Bone augmentation and reconstruction.', 'Kaula audzēšana un rekonstrukcija.', 'Наращивание и реконструкция кости.', 50000, 90, 10)
ON CONFLICT (id) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_lv = EXCLUDED.name_lv,
    name_ru = EXCLUDED.name_ru,
    description_en = EXCLUDED.description_en,
    description_lv = EXCLUDED.description_lv,
    description_ru = EXCLUDED.description_ru,
    price_cents = EXCLUDED.price_cents,
    duration_minutes = EXCLUDED.duration_minutes,
    display_order = EXCLUDED.display_order;

-- ===========================================
-- PART 3: CLINIC SPECIALISTS TABLE
-- ===========================================
-- Replaces hardcoded SPECIALISTS array from constants.ts

CREATE TABLE IF NOT EXISTS public.clinic_specialists (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL DEFAULT 'BUTKEVICA_DENTAL',
    name TEXT NOT NULL,
    role_en TEXT,
    role_lv TEXT,
    role_ru TEXT,
    photo_url TEXT,
    specialty_ids TEXT[], -- Array of service IDs this specialist can perform
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data from current constants.ts
INSERT INTO public.clinic_specialists (id, name, role_en, role_lv, role_ru, photo_url, specialty_ids, display_order)
VALUES
    ('d1', 'Dr. Anna Bērziņa', 'Lead Surgeon', 'Galvenā ķirurģe', 'Главный хирург', 'https://picsum.photos/100/100?random=1', ARRAY['s7', 's9', 's10', 's8'], 1),
    ('d2', 'Dr. Jānis Liepiņš', 'General Dentist', 'Vispārējais zobārsts', 'Стоматолог общей практики', 'https://picsum.photos/100/100?random=2', ARRAY['s1', 's2', 's4', 's6', 's8'], 2),
    ('d3', 'Dr. Elena Petrova', 'Pediatric Dentist', 'Bērnu zobārste', 'Детский стоматолог', 'https://picsum.photos/100/100?random=3', ARRAY['s3', 's4', 's5'], 3)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role_en = EXCLUDED.role_en,
    role_lv = EXCLUDED.role_lv,
    role_ru = EXCLUDED.role_ru,
    photo_url = EXCLUDED.photo_url,
    specialty_ids = EXCLUDED.specialty_ids,
    display_order = EXCLUDED.display_order;

-- ===========================================
-- PART 4: RLS POLICIES FOR PUBLIC READ ACCESS
-- ===========================================
-- Widget needs public read access (no auth required)

-- Enable RLS
ALTER TABLE public.clinic_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_specialists ENABLE ROW LEVEL SECURITY;

-- Allow public read for active items
DROP POLICY IF EXISTS "Public can view active services" ON public.clinic_services;
CREATE POLICY "Public can view active services"
ON public.clinic_services FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Public can view active specialists" ON public.clinic_specialists;
CREATE POLICY "Public can view active specialists"
ON public.clinic_specialists FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Allow authenticated users (admins) to manage
DROP POLICY IF EXISTS "Authenticated can manage services" ON public.clinic_services;
CREATE POLICY "Authenticated can manage services"
ON public.clinic_services FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can manage specialists" ON public.clinic_specialists;
CREATE POLICY "Authenticated can manage specialists"
ON public.clinic_specialists FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ===========================================
-- PART 5: VERIFICATION QUERIES
-- ===========================================

-- Check constraint was added
SELECT conname FROM pg_constraint WHERE conname = 'bookings_stripe_session_unique';

-- Check services were seeded
SELECT id, name_en, price_cents/100.0 as price_eur FROM public.clinic_services ORDER BY display_order;

-- Check specialists were seeded  
SELECT id, name, specialty_ids FROM public.clinic_specialists ORDER BY display_order;

-- Test idempotency (should fail on second insert with same session id)
-- DO $$
-- BEGIN
--     INSERT INTO public.bookings (stripe_session_id, customer_name, customer_email, start_time, end_time, status)
--     VALUES ('cs_test_idempotency', 'Test', 'test@test.com', NOW(), NOW() + INTERVAL '1 hour', 'confirmed');
--     
--     -- This should raise unique violation
--     INSERT INTO public.bookings (stripe_session_id, customer_name, customer_email, start_time, end_time, status)
--     VALUES ('cs_test_idempotency', 'Test', 'test@test.com', NOW(), NOW() + INTERVAL '1 hour', 'confirmed');
-- EXCEPTION WHEN unique_violation THEN
--     RAISE NOTICE 'SUCCESS: Idempotency protection working - duplicate rejected';
--     -- Clean up test data
--     DELETE FROM public.bookings WHERE stripe_session_id = 'cs_test_idempotency';
-- END $$;
