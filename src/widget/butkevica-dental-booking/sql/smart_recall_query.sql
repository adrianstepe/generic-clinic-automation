-- Smart Recall System: Find patients needing 6-month recall
-- Run daily at 9:00 AM via n8n cron trigger

-- This query finds patients who:
-- 1. Had their last appointment exactly 6 months ago (within a day window)
-- 2. Do NOT have any future appointments scheduled
-- 3. Returns email, name, and language preference for email templating

WITH last_appointments AS (
  -- Get each patient's most recent completed appointment
  SELECT 
    b.customer_email,
    b.customer_name,
    b.customer_phone,
    -- Derive language from phone number: +371 or 8-digit local = Latvian, else English
    CASE 
      WHEN b.customer_phone IS NULL OR b.customer_phone = '' THEN 'lv'
      WHEN b.customer_phone LIKE '+371%' THEN 'lv'
      WHEN b.customer_phone LIKE '371%' THEN 'lv'
      WHEN LENGTH(REGEXP_REPLACE(b.customer_phone, '[^0-9]', '', 'g')) = 8 THEN 'lv'
      ELSE 'en'
    END AS language_preference,
    MAX(b.start_time) AS last_appointment_date
  FROM bookings b
  WHERE b.status IN ('completed', 'confirmed')
    AND b.start_time < NOW()
  GROUP BY b.customer_email, b.customer_name, b.customer_phone
),
patients_with_future_appointments AS (
  -- Find patients who already have future appointments
  SELECT DISTINCT customer_email
  FROM bookings
  WHERE status IN ('confirmed', 'pending')
    AND start_time > NOW()
)
SELECT 
  la.customer_email AS patient_email,
  la.customer_name AS patient_name,
  la.language_preference
FROM last_appointments la
WHERE 
  -- Last appointment was approximately 6 months ago (5-6 month window for flexibility)
  la.last_appointment_date >= NOW() - INTERVAL '6 months' - INTERVAL '7 days'
  AND la.last_appointment_date <= NOW() - INTERVAL '6 months' + INTERVAL '7 days'
  -- Exclude patients with future appointments
  AND la.customer_email NOT IN (SELECT customer_email FROM patients_with_future_appointments)
ORDER BY la.last_appointment_date ASC;
