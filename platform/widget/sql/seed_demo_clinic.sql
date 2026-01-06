-- ===========================================
-- FIX RLS: Enable public read access for widget
-- ===========================================
-- This is required for the widget to fetch services without authentication

-- Enable RLS (idempotent)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;

-- Drop and recreate public read policies (clean slate)
DROP POLICY IF EXISTS "Public can view services" ON public.services;
DROP POLICY IF EXISTS "Anon can view services" ON public.services;
CREATE POLICY "Anon can view services" ON public.services FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public can view specialists" ON public.specialists;
DROP POLICY IF EXISTS "Anon can view specialists" ON public.specialists;
CREATE POLICY "Anon can view specialists" ON public.specialists FOR SELECT TO anon USING (true);

-- ===========================================
-- SEED DEMO CLINIC DATA
-- ===========================================

-- Seed 'demo-clinic'
INSERT INTO clinics (id, name, domain, theme, settings)
VALUES
  ('demo-clinic',
   'Rīgas Dental Demo',
   'demo-clinic.com',
   '{"primaryColor": "#2563eb", "logoUrl": ""}',
   '{"currency": "EUR", "timezone": "Europe/Riga"}')
ON CONFLICT (id) DO NOTHING;

-- Seed Services (proper Latvian dental terminology)
INSERT INTO services (id, clinic_id, name, description, price_cents, duration_minutes, category, icon)
VALUES
  ('demo_s1', 'demo-clinic',
   '{"en": "Initial Consultation", "lv": "Sākotnējā konsultācija"}',
   '{"en": "Complete oral examination and treatment planning.", "lv": "Pilna mutes dobuma izmeklēšana un ārstēšanas plāna izstrāde."}',
   3500, 30, 'preventive', ''),
  ('demo_s2', 'demo-clinic',
   '{"en": "Professional Oral Hygiene", "lv": "Profesionālā mutes dobuma higiēna"}',
   '{"en": "Ultrasonic scaling, airflow polishing, fluoride application.", "lv": "Ultraskaņas zobu tīrīšana, pulēšana ar sodas strūklu, fluorēšana."}',
   6500, 60, 'preventive', ''),
  ('demo_s3', 'demo-clinic',
   '{"en": "Teeth Whitening", "lv": "Zobu profesionālā balināšana"}',
   '{"en": "In-office LED whitening treatment.", "lv": "Kabineta balināšana ar LED lampu."}',
   15000, 90, 'cosmetic', ''),
  ('demo_s4', 'demo-clinic',
   '{"en": "Composite Filling", "lv": "Kompozīta plomba"}',
   '{"en": "Tooth-colored composite restoration.", "lv": "Zobu krāsas kompozīta restaurācija."}',
   8500, 45, 'restorative', ''),
  ('demo_s5', 'demo-clinic',
   '{"en": "Endodontic Treatment", "lv": "Endodontiskā ārstēšana"}',
   '{"en": "Root canal therapy with modern rotary instruments.", "lv": "Sakņu kanālu ārstēšana ar mūsdienu rotējošiem instrumentiem."}',
   25000, 90, 'restorative', ''),
  ('demo_s6', 'demo-clinic',
   '{"en": "Ceramic Crown", "lv": "Keramikas vainags"}',
   '{"en": "Full ceramic crown restoration.", "lv": "Pilnkeramikas vainaga restaurācija."}',
   45000, 60, 'restorative', ''),
  ('demo_s7', 'demo-clinic',
   '{"en": "Tooth Extraction", "lv": "Zoba ekstrakcija"}',
   '{"en": "Simple extraction procedure.", "lv": "Vienkārša zoba izraušana."}',
   7500, 30, 'surgical', ''),
  ('demo_s8', 'demo-clinic',
   '{"en": "Dental Implant Consultation", "lv": "Zobu implantācijas konsultācija"}',
   '{"en": "Implant treatment planning with 3D imaging.", "lv": "Implantācijas plānošana ar 3D attēlveidošanu."}',
   0, 45, 'surgical', '')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  duration_minutes = EXCLUDED.duration_minutes,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  is_active = true;

-- Seed Specialists
INSERT INTO specialists (id, clinic_id, name, role, photo_url, specialties)
VALUES
  ('demo_d1', 'demo-clinic', 'Dr. Ieva Bērziņa',
   '{"en": "Lead Dentist", "lv": "Galvenā zobārste"}',
   '',
   ARRAY['demo_s1', 'demo_s2', 'demo_s3', 'demo_s4', 'demo_s5', 'demo_s6']),
  ('demo_d2', 'demo-clinic', 'Dr. Kārlis Ozols',
   '{"en": "Dental Hygienist", "lv": "Zobārstniecības higiēnists"}',
   '',
   ARRAY['demo_s2', 'demo_s3']),
  ('demo_d3', 'demo-clinic', 'Dr. Anna Liepiņa',
   '{"en": "Oral Surgeon", "lv": "Mutes, sejas un žokļu ķirurģe"}',
   '',
   ARRAY['demo_s5', 'demo_s6', 'demo_s7', 'demo_s8'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  specialties = EXCLUDED.specialties;



-- Seed Translations
INSERT INTO clinic_translations (clinic_id, key, value)
VALUES
  ('demo-clinic', 'headerTitle', '{"en": "Book Online", "lv": "Pieteikties Online"}'),
  ('demo-clinic', 'dentalClinic', '{"en": "Rīgas Dental Demo", "lv": "Rīgas Dental Demo"}')
ON CONFLICT (clinic_id, key) DO NOTHING;

-- ===========================================
-- WORKING HOURS FOR DEMO CLINIC
-- ===========================================
-- Mon-Sat: 09:00-18:00, Sunday closed

INSERT INTO clinic_working_hours (clinic_id, day_of_week, is_open, open_time, close_time)
VALUES
  ('demo-clinic', 0, false, '09:00', '18:00'), -- Sunday (closed)
  ('demo-clinic', 1, true, '09:00', '18:00'),  -- Monday
  ('demo-clinic', 2, true, '09:00', '18:00'),  -- Tuesday
  ('demo-clinic', 3, true, '09:00', '18:00'),  -- Wednesday
  ('demo-clinic', 4, true, '09:00', '18:00'),  -- Thursday
  ('demo-clinic', 5, true, '09:00', '18:00'),  -- Friday
  ('demo-clinic', 6, true, '09:00', '14:00')   -- Saturday (half day)
ON CONFLICT (clinic_id, day_of_week) DO UPDATE SET
  is_open = EXCLUDED.is_open,
  open_time = EXCLUDED.open_time,
  close_time = EXCLUDED.close_time;

-- ===========================================
-- SPECIALIST WORKING HOURS
-- ===========================================
-- Dr. Ieva Bērziņa works Mon-Fri
-- Dr. Kārlis Ozols works Mon-Sat

INSERT INTO specialist_working_hours (specialist_id, day_of_week, is_available, start_time, end_time)
VALUES
  -- Dr. Ieva Bērziņa (demo_d1) - Mon-Fri
  ('demo_d1', 0, false, '09:00', '18:00'),
  ('demo_d1', 1, true, '09:00', '18:00'),
  ('demo_d1', 2, true, '09:00', '18:00'),
  ('demo_d1', 3, true, '09:00', '18:00'),
  ('demo_d1', 4, true, '09:00', '18:00'),
  ('demo_d1', 5, true, '09:00', '18:00'),
  ('demo_d1', 6, false, '09:00', '18:00'),
  -- Dr. Kārlis Ozols (demo_d2) - Mon-Sat
  ('demo_d2', 0, false, '09:00', '18:00'),
  ('demo_d2', 1, true, '09:00', '18:00'),
  ('demo_d2', 2, true, '09:00', '18:00'),
  ('demo_d2', 3, true, '09:00', '18:00'),
  ('demo_d2', 4, true, '09:00', '18:00'),
  ('demo_d2', 5, true, '09:00', '18:00'),
  ('demo_d2', 6, true, '09:00', '14:00'),
  -- Dr. Anna Liepiņa (demo_d3) - Mon-Fri
  ('demo_d3', 0, false, '09:00', '18:00'),
  ('demo_d3', 1, true, '10:00', '18:00'),
  ('demo_d3', 2, true, '10:00', '18:00'),
  ('demo_d3', 3, true, '10:00', '18:00'),
  ('demo_d3', 4, true, '10:00', '18:00'),
  ('demo_d3', 5, true, '10:00', '16:00'),
  ('demo_d3', 6, false, '09:00', '18:00')
ON CONFLICT (specialist_id, day_of_week) DO UPDATE SET
  is_available = EXCLUDED.is_available,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time;

-- Mark all demo-clinic records as active
UPDATE specialists SET is_active = true WHERE clinic_id = 'demo-clinic';
UPDATE services SET is_active = true WHERE clinic_id = 'demo-clinic';
