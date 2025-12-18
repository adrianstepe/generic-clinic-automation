-- ===========================================
-- CREATE STORAGE BUCKET FOR SPECIALIST PHOTOS
-- ===========================================
-- Run this in your Supabase SQL Editor
-- This creates a public bucket for storing specialist profile photos
-- Date: 2025-12-18

-- Create the storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('specialist-photos', 'specialist-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access (photos should be publicly viewable)
CREATE POLICY "Public read access for specialist photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'specialist-photos');

-- Allow authenticated users (admins) to upload/update
CREATE POLICY "Authenticated users can upload specialist photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'specialist-photos');

CREATE POLICY "Authenticated users can update specialist photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'specialist-photos');

CREATE POLICY "Authenticated users can delete specialist photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'specialist-photos');
