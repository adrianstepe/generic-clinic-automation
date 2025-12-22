-- ===========================================
-- UPDATE SERVICE CATEGORIES
-- ===========================================
-- Populates the 'category' column in clinic_services table
-- Categories: preventive, children, treatment, surgery, prosthetics
-- Run this in Supabase SQL Editor

-- PREVENTIVE CARE
UPDATE clinic_services 
SET category = 'preventive'
WHERE name_en ILIKE '%Integrated Teeth%'
   OR name_en ILIKE '%Check-Up%'
   OR name_en ILIKE '%Hygiene%'
   OR name_en ILIKE '%Oral Cavity Test%';

-- CHILDREN
UPDATE clinic_services 
SET category = 'children'
WHERE name_en ILIKE '%Children%'
   OR name_en ILIKE '%Pediatric%'
   OR name_en ILIKE '%Kid%';

-- TREATMENT (general dental work)
UPDATE clinic_services 
SET category = 'treatment'
WHERE name_en ILIKE '%Dental Treatment%'
   OR name_en ILIKE '%Sedative%'
   OR name_en ILIKE '%Sedation%'
   OR name_en ILIKE '%Whitening%'
   OR name_en ILIKE '%Filling%'
   OR name_en ILIKE '%Root Canal%';

-- SURGERY & IMPLANTS
UPDATE clinic_services 
SET category = 'surgery'
WHERE name_en ILIKE '%Surgery%'
   OR name_en ILIKE '%Surgical%'
   OR name_en ILIKE '%Implant%'
   OR name_en ILIKE '%Extraction%'
   OR name_en ILIKE '%Jaw Bone%'
   OR name_en ILIKE '%Bone Tissue%';

-- PROSTHETICS
UPDATE clinic_services 
SET category = 'prosthetics'
WHERE name_en ILIKE '%Prosthetic%'
   OR name_en ILIKE '%Crown%'
   OR name_en ILIKE '%Bridge%'
   OR name_en ILIKE '%Denture%'
   OR name_en ILIKE '%Veneer%';

-- Verify the updates
SELECT id, name_en, category FROM clinic_services ORDER BY category, display_order;
