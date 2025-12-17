-- Enable UUID extension if not already
create extension if not exists "uuid-ossp";

-- 1. Clinics Table
create table if not exists clinics (
  id text primary key, -- e.g. 'butkevica'
  name text not null,
  domain text, -- for CORS/Access control
  theme jsonb default '{}'::jsonb, -- colors, logo, etc
  settings jsonb default '{}'::jsonb, -- timezone, locale defaults
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Services Table
create table if not exists services (
  id text primary key,
  clinic_id text references clinics(id) on delete cascade not null,
  name jsonb not null, -- { "en": "...", "lv": "..." }
  description jsonb,
  price numeric not null,
  duration_minutes integer not null,
  category text,
  icon text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Specialists Table
create table if not exists specialists (
  id text primary key,
  clinic_id text references clinics(id) on delete cascade not null,
  name text not null,
  role jsonb, -- { "en": "Surgeon" }
  photo_url text,
  specialties text[], -- Array of service IDs or category strings
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Clinic Translations (Overrides)
create table if not exists clinic_translations (
  id uuid default uuid_generate_v4() primary key,
  clinic_id text references clinics(id) on delete cascade not null,
  key text not null, -- e.g. 'headerTitle'
  value jsonb not null, -- { "en": "Book Now" }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(clinic_id, key)
);

-- Enable RLS
alter table clinics enable row level security;
alter table services enable row level security;
alter table specialists enable row level security;
alter table clinic_translations enable row level security;

-- Public Read Policies (Widget needs to read these)
create policy "Allow public read access to clinics" on clinics for select using (true);
create policy "Allow public read access to services" on services for select using (true);
create policy "Allow public read access to specialists" on specialists for select using (true);
create policy "Allow public read access to clinic_translations" on clinic_translations for select using (true);
