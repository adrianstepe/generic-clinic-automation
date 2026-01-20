-- Lead Capture Table for Pre-Payment Data
-- Captures patient contact info before they hit the payment step
-- Allows tracking of leads vs. converted bookings

CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  clinic_id TEXT REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  service_id TEXT,
  captured_at_step INTEGER DEFAULT 3,
  converted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint to enable upsert (one lead per email per clinic)
CREATE UNIQUE INDEX IF NOT EXISTS leads_clinic_email_idx ON leads(clinic_id, LOWER(email));

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous widget to insert leads (widget uses anon key)
CREATE POLICY "Allow anonymous lead inserts" ON leads 
  FOR INSERT TO anon 
  WITH CHECK (true);

-- Allow authenticated users (dashboard) to read leads
CREATE POLICY "Allow authenticated read" ON leads 
  FOR SELECT TO authenticated 
  USING (true);

-- Allow authenticated users to update leads (e.g., mark as converted)
CREATE POLICY "Allow authenticated update" ON leads 
  FOR UPDATE TO authenticated 
  USING (true);
