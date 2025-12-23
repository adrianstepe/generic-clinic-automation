-- Seed 'butkevica' clinic
INSERT INTO clinics (id, name, domain, theme, settings)
VALUES
  ('butkevica',
   'Butkevica Dental Practice',
   'drbutkevicadentalpractice.com',
   '{"primaryColor": "#0d9488", "logoUrl": "/logo.png"}',
   '{"currency": "EUR", "timezone": "Europe/Riga"}')
ON CONFLICT (id) DO NOTHING;

-- Seed Services (IDs prefixed with clinic_id to ensure global uniqueness)
-- Using price_cents (INTEGER)
INSERT INTO services (id, clinic_id, name, description, price_cents, duration_minutes, category, icon)
VALUES
  ('butkevica_s1', 'butkevica',
   '{"en": "Integrated Teeth and Oral Cavity Test", "lv": "Integrēta zobu un mutes dobuma pārbaude", "ru": "Комплексное обследование зубов и полости рта"}',
   '{"en": "Full mouth examination with X-rays and personalized treatment plan.", "lv": "Pilna mutes dobuma izmeklēšana ar rentgenu un individuāls ārstēšanas plāns.", "ru": "Полное обследование полости рта с рентгеном и индивидуальный план лечения."}',
   5000, 45, 'preventive', ''),
  ('butkevica_s2', 'butkevica',
   '{"en": "Check-Ups and Dental Hygiene", "lv": "Pārbaudes un zobu higiēna", "ru": "Осмотры и гигиена зубов"}',
   '{"en": "Routine examination, professional cleaning, and plaque removal.", "lv": "Kārtējā pārbaude, profesionālā tīrīšana un aplikuma noņemšana.", "ru": "Плановый осмотр, профессиональная чистка и удаление налёта."}',
   6500, 60, 'preventive', ''),
  ('butkevica_s3', 'butkevica',
   '{"en": "Children''s Dentistry (up to 14 years)", "lv": "Bērnu zobārstniecība (līdz 14 gadiem)", "ru": "Детская стоматология (до 14 лет)"}',
   '{"en": "Gentle, kid-friendly care with patience and fun.", "lv": "Maiga, bērniem draudzīga aprūpe ar pacietību un jautrību.", "ru": "Бережный, дружелюбный к детям уход с терпением и весельем."}',
   4500, 30, 'children', ''),
  ('butkevica_s4', 'butkevica',
   '{"en": "Dental Treatment", "lv": "Zobu ārstēšana", "ru": "Лечение зубов"}',
   '{"en": "For cavities, toothaches, or broken teeth. Fillings and repairs.", "lv": "Kariesa, zobu sāpju vai bojātu zobu ārstēšana. Plombēšana un remonts.", "ru": "При кариесе, зубной боли или сломанных зубах. Пломбы и ремонт."}',
   6000, 60, 'treatment', ''),
  ('butkevica_s5', 'butkevica',
   '{"en": "Sedative Treatment", "lv": "Ārstēšana sedācijā", "ru": "Лечение под седацией"}',
   '{"en": "Relaxed, anxiety-free dental care. Ideal for dental phobia.", "lv": "Relaksēta, bez stresa zobārstniecība. Ideāli zobārsta fobijai.", "ru": "Расслабленное лечение без тревоги. Идеально при страхе стоматолога."}',
   10000, 60, 'treatment', ''),
  ('butkevica_s6', 'butkevica',
   '{"en": "Teeth Whitening", "lv": "Zobu balināšana", "ru": "Отбеливание зубов"}',
   '{"en": "Professional whitening for a brighter, whiter smile.", "lv": "Profesionāla balināšana spožākam, baltākam smaidam.", "ru": "Профессиональное отбеливание для яркой белоснежной улыбки."}',
   25000, 90, 'treatment', ''),
  ('butkevica_s7', 'butkevica',
   '{"en": "Surgery", "lv": "Ķirurģija", "ru": "Хирургия"}',
   '{"en": "Tooth extractions and minor surgical procedures.", "lv": "Zobu izraušana un nelielas ķirurģiskas procedūras.", "ru": "Удаление зубов и небольшие хирургические процедуры."}',
   12000, 60, 'surgery', ''),
  ('butkevica_s8', 'butkevica',
   '{"en": "Prosthetics", "lv": "Protezēšana", "ru": "Протезирование"}',
   '{"en": "Crowns, bridges, and dentures to restore your smile.", "lv": "Kroņi, tilti un protēzes smaida atjaunošanai.", "ru": "Коронки, мосты и протезы для восстановления улыбки."}',
   40000, 60, 'prosthetics', ''),
  ('butkevica_s9', 'butkevica',
   '{"en": "Implantology", "lv": "Implantoloģija", "ru": "Имплантология"}',
   '{"en": "Permanent tooth replacement with dental implants.", "lv": "Pastāvīga zobu aizstāšana ar zobārstniecības implantiem.", "ru": "Постоянное замещение зубов с помощью имплантов."}',
   75000, 90, 'surgery', ''),
  ('butkevica_s10', 'butkevica',
   '{"en": "Restoration of Jaw Bone Tissues", "lv": "Žokļa kaula audu atjaunošana", "ru": "Восстановление костной ткани челюсти"}',
   '{"en": "Bone grafting to prepare for implants or restore structure.", "lv": "Kaula transplantācija implantu sagatavošanai vai struktūras atjaunošanai.", "ru": "Костная пластика для подготовки к имплантам или восстановления структуры."}',
   50000, 90, 'surgery', '')
ON CONFLICT (id) DO NOTHING;


-- Seed Specialists
INSERT INTO specialists (id, clinic_id, name, role, photo_url, specialties)
VALUES
  ('butkevica_d1', 'butkevica', 'Dr. Anna Bērziņa',
   '{"en": "Lead Surgeon", "lv": "Galvenā ķirurģe", "ru": "Главный хирург"}',
   '',
   ARRAY['butkevica_s7', 'butkevica_s9', 'butkevica_s10', 'butkevica_s8']),

  ('butkevica_d2', 'butkevica', 'Dr. Jānis Liepiņš',
   '{"en": "General Dentist", "lv": "Vispārējais zobārsts", "ru": "Стоматолог общей практики"}',
   '',
   ARRAY['butkevica_s1', 'butkevica_s2', 'butkevica_s4', 'butkevica_s6', 'butkevica_s8']),

  ('butkevica_d3', 'butkevica', 'Dr. Elena Petrova',
   '{"en": "Pediatric Dentist", "lv": "Bērnu zobārste", "ru": "Детский стоматолог"}',
   '',
   ARRAY['butkevica_s3', 'butkevica_s4', 'butkevica_s5'])
ON CONFLICT (id) DO NOTHING;

-- Seed Translations (Sample of key overriding translations)
INSERT INTO clinic_translations (clinic_id, key, value)
VALUES
  ('butkevica', 'headerTitle', '{"en": "Book Appointment", "lv": "Pieteikt Vizīti", "ru": "Записаться"}'),
  ('butkevica', 'dentalClinic', '{"en": "Dental Clinic", "lv": "Zobārstniecības Klīnika", "ru": "Стоматологическая Клиника"}'),
  ('butkevica', 'contactPhone', '{"en": "+371 20000000", "lv": "+371 20000000", "ru": "+371 20000000"}')
ON CONFLICT (clinic_id, key) DO NOTHING;
