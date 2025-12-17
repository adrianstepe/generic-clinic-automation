-- ===========================================
-- ANALYTICS MIGRATION
-- ===========================================
-- Run this in Supabase SQL Editor
-- Date: 2025-12-14
-- Purpose: Add KPI tracking for dental clinic analytics

-- ===========================================
-- PART 1: BOOKING EVENTS TABLE (Funnel Tracking)
-- ===========================================
-- Track widget interactions and booking funnel progression

CREATE TABLE IF NOT EXISTS public.booking_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id TEXT NOT NULL DEFAULT 'BUTKEVICA_DENTAL',
    session_id TEXT NOT NULL,                -- Browser session UUID
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,                -- Event name
    event_data JSONB DEFAULT '{}',           -- Additional context
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event types:
-- 'widget_open'       - User opened the booking widget
-- 'step_1_service'    - Selected a service
-- 'step_2_specialist' - Selected a specialist  
-- 'step_3_datetime'   - Selected date and time
-- 'step_4_details'    - Entered patient details
-- 'step_5_payment'    - Initiated payment
-- 'booking_complete'  - Booking confirmed
-- 'booking_abandoned' - Left without completing

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_booking_events_session ON public.booking_events(session_id);
CREATE INDEX IF NOT EXISTS idx_booking_events_type ON public.booking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_booking_events_created ON public.booking_events(created_at);
CREATE INDEX IF NOT EXISTS idx_booking_events_business ON public.booking_events(business_id);

-- ===========================================
-- PART 2: ADD OUTCOME TRACKING TO BOOKINGS
-- ===========================================
-- Track what happened after the booking was made

DO $$
BEGIN
    -- Actual status after appointment (for no-show tracking)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'actual_status') THEN
        ALTER TABLE public.bookings ADD COLUMN actual_status TEXT;
        -- Values: 'completed', 'no_show', 'cancelled_late'
    END IF;

    -- Review tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'review_requested_at') THEN
        ALTER TABLE public.bookings ADD COLUMN review_requested_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'review_completed_at') THEN
        ALTER TABLE public.bookings ADD COLUMN review_completed_at TIMESTAMPTZ;
    END IF;

    -- Source tracking (widget, phone, walk-in, etc)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'source') THEN
        ALTER TABLE public.bookings ADD COLUMN source TEXT DEFAULT 'widget';
    END IF;
END $$;

-- ===========================================
-- PART 3: RLS POLICIES
-- ===========================================

ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;

-- Widget can insert events (anon)
DROP POLICY IF EXISTS "Anon can insert events" ON public.booking_events;
CREATE POLICY "Anon can insert events"
ON public.booking_events FOR INSERT
TO anon
WITH CHECK (true);

-- Authenticated users can read events
DROP POLICY IF EXISTS "Authenticated can read events" ON public.booking_events;
CREATE POLICY "Authenticated can read events"
ON public.booking_events FOR SELECT
TO authenticated
USING (true);

-- ===========================================
-- PART 4: ANALYTICS VIEWS
-- ===========================================
-- Pre-computed views for common analytics queries

-- Monthly summary view
DROP VIEW IF EXISTS public.analytics_monthly_summary;
CREATE VIEW public.analytics_monthly_summary AS
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
    SUM(cs.price_cents) / 100.0 AS revenue_eur,
    AVG(EXTRACT(EPOCH FROM (b.start_time - b.created_at)) / 86400)::numeric(10,1) AS avg_lead_time_days
FROM public.bookings b
LEFT JOIN public.clinic_services cs ON b.service_id = cs.id
WHERE b.status NOT IN ('pending', 'expired')
GROUP BY date_trunc('month', b.created_at), b.business_id;

-- Funnel conversion view
DROP VIEW IF EXISTS public.analytics_funnel;
CREATE VIEW public.analytics_funnel AS
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

-- Top services view
DROP VIEW IF EXISTS public.analytics_top_services;
CREATE VIEW public.analytics_top_services AS
SELECT 
    date_trunc('month', b.created_at) AS month,
    b.business_id,
    b.service_id,
    cs.name_en AS service_name,
    COUNT(*) AS booking_count,
    SUM(cs.price_cents) / 100.0 AS revenue_eur
FROM public.bookings b
LEFT JOIN public.clinic_services cs ON b.service_id = cs.id
WHERE b.status = 'confirmed'
GROUP BY date_trunc('month', b.created_at), b.business_id, b.service_id, cs.name_en
ORDER BY revenue_eur DESC;

-- ===========================================
-- PART 5: VERIFICATION
-- ===========================================

-- Verify table created
SELECT 'booking_events table' as check_item, 
       EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_events') as passed;

-- Verify columns added
SELECT 'actual_status column' as check_item,
       EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'actual_status') as passed;

SELECT 'review_requested_at column' as check_item,
       EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'review_requested_at') as passed;

SELECT 'source column' as check_item,
       EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'source') as passed;

-- Verify views created
SELECT 'analytics_monthly_summary view' as check_item,
       EXISTS(SELECT 1 FROM information_schema.views WHERE table_name = 'analytics_monthly_summary') as passed;

SELECT 'analytics_funnel view' as check_item,
       EXISTS(SELECT 1 FROM information_schema.views WHERE table_name = 'analytics_funnel') as passed;
