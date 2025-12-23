-- ===========================================
-- FIX SECURITY DEFINER VIEWS
-- ===========================================
-- Run this in Supabase SQL Editor
-- Date: 2025-12-23
-- Purpose: Fix security definer views by recreating with security_invoker = true
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view

-- ===========================================
-- analytics_monthly_summary
-- ===========================================
DROP VIEW IF EXISTS public.analytics_monthly_summary;
CREATE VIEW public.analytics_monthly_summary
WITH (security_invoker = on)
AS
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

-- ===========================================
-- analytics_top_services
-- ===========================================
DROP VIEW IF EXISTS public.analytics_top_services;
CREATE VIEW public.analytics_top_services
WITH (security_invoker = on)
AS
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

-- ===========================================
-- analytics_funnel (fixing proactively)
-- ===========================================
DROP VIEW IF EXISTS public.analytics_funnel;
CREATE VIEW public.analytics_funnel
WITH (security_invoker = on)
AS
SELECT 
    date_trunc('day', created_at) AS day,
    business_id,
    COUNT(*) FILTER (WHERE event_type = 'widget_open') AS widget_opens,
    COUNT(*) FILTER (WHERE event_type = 'step_1_service') AS step_1_service,
    COUNT(*) FILTER (WHERE event_type = 'step_2_specialist') AS step_2_specialist,
    COUNT(*) FILTER (WHERE event_type = 'step_3_datetime') AS step_3_datetime,
    COUNT(*) FILTER (WHERE event_type = 'step_4_details') AS step_4_details,
    COUNT(*) FILTER (WHERE event_type = 'step_5_payment') AS step_5_payment,
    COUNT(*) FILTER (WHERE event_type = 'booking_complete') AS bookings_completed
FROM public.booking_events
GROUP BY date_trunc('day', created_at), business_id;
