-- Seed 'demo-clinic'
INSERT INTO clinics (id, name, domain, theme, settings)
VALUES
  ('demo-clinic',
   'Rīgas Dental Demo',
   'demo-clinic.com',
   '{"primaryColor": "#2563eb", "logoUrl": ""}',
   '{"currency": "EUR", "timezone": "Europe/Riga"}')
ON CONFLICT (id) DO NOTHING;

-- Seed Services
INSERT INTO services (id, clinic_id, name, description, price_cents, duration_minutes, category, icon)
VALUES
  ('demo_s1', 'demo-clinic',
   '{"en": "First Visit & Consultation", "lv": "Pirmā vizīte un konsultācija"}',
   '{"en": "Complete oral health checkup and treatment plan.", "lv": "Pilna mutes dobuma pārbaude un ārstēšanas plāna sastādīšana."}',
   3500, 30, 'preventive', ''),
  ('demo_s2', 'demo-clinic',
   '{"en": "Dental Hygiene", "lv": "Zobu higiēna"}',
   '{"en": "Professional cleaning with airflow and ultrasound.", "lv": "Profesionāla tīrīšana ar sodas strūklu un ultraskaņu."}',
   6500, 60, 'preventive', ''),
  ('demo_s3', 'demo-clinic',
   '{"en": "Teeth Whitening", "lv": "Zobu balināšana"}',
   '{"en": "Safe and effective whitening for a bright smile.", "lv": "Droša un efektīva balināšana mirdzošam smaidam."}',
   15000, 90, 'cosmetic', '')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  duration_minutes = EXCLUDED.duration_minutes,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon;

-- Seed Specialists
INSERT INTO specialists (id, clinic_id, name, role, photo_url, specialties)
VALUES
  ('demo_d1', 'demo-clinic', 'Dr. Ieva Bērziņa',
   '{"en": "Lead Dentist", "lv": "Galvenā zobārste"}',
   '',
   ARRAY['demo_s1', 'demo_s2', 'demo_s3']),
  ('demo_d2', 'demo-clinic', 'Dr. Kārlis Ozols',
   '{"en": "Hygienist", "lv": "Higiēnists"}',
   '',
   ARRAY['demo_s2'])
ON CONFLICT (id) DO NOTHING;

-- Seed Translations
INSERT INTO clinic_translations (clinic_id, key, value)
VALUES
  ('demo-clinic', 'headerTitle', '{"en": "Book Online", "lv": "Pieteikties Online"}'),
  ('demo-clinic', 'dentalClinic', '{"en": "Rīgas Dental Demo", "lv": "Rīgas Dental Demo"}')
ON CONFLICT (clinic_id, key) DO NOTHING;
