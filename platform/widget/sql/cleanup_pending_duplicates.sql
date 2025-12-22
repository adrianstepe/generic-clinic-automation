-- ===========================================
-- CLEANUP PENDING DUPLICATE BOOKINGS
-- ===========================================
-- This script removes pending slot reservations that have a matching
-- confirmed booking (same email and overlapping time).
-- 
-- This situation occurs because:
-- 1. reserve-slot API creates a pending booking when user selects a time
-- 2. n8n creates a NEW confirmed booking instead of updating the pending one
-- 
-- Run this in Supabase SQL Editor to clean up duplicates.

-- First, let's see what will be deleted (dry run)
SELECT 
    p.id AS pending_id,
    p.customer_email,
    p.start_time AS pending_start,
    p.status AS pending_status,
    c.id AS confirmed_id,
    c.start_time AS confirmed_start,
    c.status AS confirmed_status
FROM public.bookings p
JOIN public.bookings c ON 
    p.customer_email = c.customer_email 
    AND p.start_time = c.start_time
    AND p.id != c.id
WHERE p.status = 'pending'
AND c.status = 'confirmed';

-- Delete pending bookings that have a matching confirmed booking
DELETE FROM public.bookings 
WHERE id IN (
    SELECT p.id
    FROM public.bookings p
    JOIN public.bookings c ON 
        p.customer_email = c.customer_email 
        AND p.start_time = c.start_time
        AND p.id != c.id
    WHERE p.status = 'pending'
    AND c.status = 'confirmed'
);

-- Also cleanup any expired pending bookings (slot lock expired)
DELETE FROM public.bookings
WHERE status = 'pending'
AND slot_lock_expires_at IS NOT NULL
AND slot_lock_expires_at < NOW();

-- Verify cleanup
SELECT COUNT(*) AS remaining_pending_with_expired_locks
FROM public.bookings
WHERE status = 'pending'
AND slot_lock_expires_at IS NOT NULL
AND slot_lock_expires_at < NOW();
