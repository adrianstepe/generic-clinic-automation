// Supabase Edge Function: check-availability
// Multi-specialist capacity-aware version
//
// Deploy: supabase functions deploy check-availability
// Test: curl "https://<project>.supabase.co/functions/v1/check-availability?date=2025-12-07&service_id=s1"

// @ts-ignore - Deno types not available in local environment
declare const Deno: {
    env: { get(key: string): string | undefined };
    serve(handler: (req: Request) => Promise<Response>): void;
};
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for cross-origin requests from the widget
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default clinic configuration (used if no database config exists)
const DEFAULT_START_HOUR = 9;
const DEFAULT_END_HOUR = 18;
const SLOT_DURATION_MINUTES = 60;

// Default working days (Monday-Friday)
const DEFAULT_OPEN_DAYS = [1, 2, 3, 4, 5]; // Monday to Friday

interface WorkingHoursConfig {
    day_of_week: number;
    is_open: boolean;
    open_time: string;
    close_time: string;
}

interface TimeSlot {
    time: string;
    available: boolean;
    available_specialists?: number; // Optional: show how many specialists are free
}

interface Booking {
    start_time: string;
    end_time: string;
    status: string;
    slot_lock_expires_at: string | null;
    specialist_id: string | null;
}

interface Specialist {
    id: string;
    name: string;
    specialties: string[];
}

interface CalendarEvent {
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
}

// Check if two time ranges overlap
function isOverlapping(
    slotStart: number,
    slotEnd: number,
    busyStart: number,
    busyEnd: number
): boolean {
    return slotStart < busyEnd && slotEnd > busyStart;
}

// Parse time string (HH:MM) to hour number
function parseTimeToHour(timeStr: string): number {
    const [hours] = timeStr.split(':').map(Number);
    return hours;
}

// Generate all slots for a day based on working hours config
function generateSlots(date: string, startHour: number, endHour: number): { time: string; iso: string }[] {
    const slots: { time: string; iso: string }[] = [];

    for (let hour = startHour; hour < endHour; hour++) {
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        const slotIso = `${date}T${timeStr}:00`;
        slots.push({ time: timeStr, iso: slotIso });
    }

    return slots;
}

// Fetch working hours configuration from database
async function fetchWorkingHoursConfig(
    supabase: any,
    clinicId: string,
    dayOfWeek: number
): Promise<WorkingHoursConfig | null> {
    try {
        const { data, error } = await supabase
            .from('clinic_working_hours')
            .select('day_of_week, is_open, open_time, close_time')
            .eq('clinic_id', clinicId)
            .eq('day_of_week', dayOfWeek)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.warn('[WorkingHours] Error fetching config:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.warn('[WorkingHours] Exception fetching config:', error);
        return null;
    }
}

// Fetch specialists qualified for a specific service
async function fetchQualifiedSpecialists(
    supabase: any,
    clinicId: string,
    serviceId: string | null
): Promise<Specialist[]> {
    try {
        let query = supabase
            .from('specialists')
            .select('id, name, specialties')
            .eq('clinic_id', clinicId)
            .eq('is_active', true);

        // If service_id is provided, filter by specialists who can perform it
        // If not provided, return all active specialists
        const { data, error } = await query;

        if (error) {
            console.warn('[Specialists] Error fetching:', error);
            return [];
        }

        // Filter by service_id if provided
        if (serviceId && data) {
            return data.filter((s: Specialist) =>
                s.specialties && s.specialties.includes(serviceId)
            );
        }

        return data || [];
    } catch (error) {
        console.warn('[Specialists] Exception fetching:', error);
        return [];
    }
}

// Fetch Google Calendar events via service account
async function fetchGoogleCalendarEvents(date: string): Promise<CalendarEvent[]> {
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID') || 'primary';

    if (!serviceAccountJson) {
        console.warn('[GCal] No service account configured, skipping Google Calendar check');
        return [];
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        const jwt = await generateGoogleJWT(serviceAccount);

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwt,
            }),
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error('[GCal] Token exchange failed:', error);
            return [];
        }

        const { access_token } = await tokenResponse.json();

        const timeMin = `${date}T00:00:00Z`;
        const timeMax = `${date}T23:59:59Z`;

        const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
            `timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true`;

        const eventsResponse = await fetch(eventsUrl, {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        if (!eventsResponse.ok) {
            const error = await eventsResponse.text();
            console.error('[GCal] Events fetch failed:', error);
            return [];
        }

        const data = await eventsResponse.json();
        console.log(`[GCal] Found ${data.items?.length || 0} events for ${date}`);
        return data.items || [];

    } catch (error) {
        console.error('[GCal] Error fetching calendar events:', error);
        return [];
    }
}

// Generate JWT for Google service account authentication
async function generateGoogleJWT(serviceAccount: {
    client_email: string;
    private_key: string;
}): Promise<string> {
    const header = {
        alg: 'RS256',
        typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
    };

    const encoder = new TextEncoder();
    const base64url = (data: Uint8Array): string => {
        return btoa(String.fromCharCode(...data))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    };

    const headerB64 = base64url(encoder.encode(JSON.stringify(header)));
    const payloadB64 = base64url(encoder.encode(JSON.stringify(payload)));
    const message = `${headerB64}.${payloadB64}`;

    const pemHeader = '-----BEGIN PRIVATE KEY-----';
    const pemFooter = '-----END PRIVATE KEY-----';
    const pemContents = serviceAccount.private_key
        .replace(pemHeader, '')
        .replace(pemFooter, '')
        .replace(/\s/g, '');

    const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        binaryKey,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        encoder.encode(message)
    );

    const signatureB64 = base64url(new Uint8Array(signature));
    return `${message}.${signatureB64}`;
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Parse query params
        const url = new URL(req.url);
        const date = url.searchParams.get('date');
        const clinicId = url.searchParams.get('clinic_id') || 'demo';
        const serviceId = url.searchParams.get('service_id'); // Optional: filter by service

        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return new Response(
                JSON.stringify({ error: 'Invalid date format. Use YYYY-MM-DD' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log(`[Availability] Checking slots for ${date} (Clinic: ${clinicId}, Service: ${serviceId || 'any'})`);

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get day of week (0 = Sunday, 6 = Saturday)
        const dayOfWeek = new Date(date).getUTCDay();

        // Fetch working hours config from database
        const workingHoursConfig = await fetchWorkingHoursConfig(supabase, clinicId, dayOfWeek);

        let isOpen: boolean;
        let startHour: number;
        let endHour: number;

        if (workingHoursConfig) {
            isOpen = workingHoursConfig.is_open;
            startHour = parseTimeToHour(workingHoursConfig.open_time);
            endHour = parseTimeToHour(workingHoursConfig.close_time);
            console.log(`[Availability] Using DB config for day ${dayOfWeek}: open=${isOpen}, ${startHour}:00-${endHour}:00`);
        } else {
            isOpen = DEFAULT_OPEN_DAYS.includes(dayOfWeek);
            startHour = DEFAULT_START_HOUR;
            endHour = DEFAULT_END_HOUR;
            console.log(`[Availability] Using defaults for day ${dayOfWeek}: open=${isOpen}, ${startHour}:00-${endHour}:00`);
        }

        // If clinic is closed on this day, return empty slots
        if (!isOpen) {
            console.log(`[Availability] Date ${date} is closed (Day ${dayOfWeek}). Returning empty slots.`);
            return new Response(
                JSON.stringify({ slots: [] }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // ========================
        // MULTI-SPECIALIST LOGIC
        // ========================

        // 1. Fetch qualified specialists for this service
        const qualifiedSpecialists = await fetchQualifiedSpecialists(supabase, clinicId, serviceId);
        const specialistCount = qualifiedSpecialists.length;
        const specialistIds = qualifiedSpecialists.map(s => s.id);

        console.log(`[Availability] Found ${specialistCount} qualified specialists for service ${serviceId || 'any'}: ${specialistIds.join(', ')}`);

        // If no specialists can perform this service, all slots are unavailable
        if (specialistCount === 0) {
            console.log(`[Availability] No qualified specialists found. All slots unavailable.`);
            const allSlots = generateSlots(date, startHour, endHour);
            return new Response(
                JSON.stringify({ slots: allSlots.map(s => ({ time: s.time, available: false })) }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 2. Fetch bookings from database (only for qualified specialists OR unassigned)
        const { data: dbBookings, error: dbError } = await supabase
            .from('bookings')
            .select('start_time, end_time, status, slot_lock_expires_at, specialist_id')
            .eq('clinic_id', clinicId)
            .gte('start_time', `${date}T00:00:00`)
            .lte('start_time', `${date}T23:59:59`);

        if (dbError) {
            console.error('[Supabase] Query error:', dbError);
            return new Response(
                JSON.stringify({ error: 'Database query failed', details: dbError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 3. Filter to only bookings that block qualified specialists
        const now = new Date().getTime();
        const blockedBookings = (dbBookings || []).filter((booking: Booking) => {
            // Only consider confirmed/completed or pending with active locks
            const isBlocking =
                booking.status === 'confirmed' ||
                booking.status === 'completed' ||
                (booking.status === 'pending' && booking.slot_lock_expires_at &&
                    new Date(booking.slot_lock_expires_at).getTime() > now);

            if (!isBlocking) return false;

            // If booking has a specialist_id, only block if that specialist is in our qualified list
            // If booking has no specialist_id (unassigned), it blocks one slot from the general pool
            if (booking.specialist_id) {
                return specialistIds.includes(booking.specialist_id);
            }

            // Unassigned bookings count against the pool
            return true;
        });

        console.log(`[Supabase] Found ${dbBookings?.length || 0} bookings, ${blockedBookings.length} blocking qualified specialists`);

        // 4. Fetch Google Calendar events (these block globally for now)
        const gCalEvents = await fetchGoogleCalendarEvents(date);

        // 5. Generate all slots and check availability with capacity logic
        const allSlots = generateSlots(date, startHour, endHour);

        const availableSlots: TimeSlot[] = allSlots.map((slot) => {
            const slotStart = new Date(slot.iso).getTime();
            const slotEnd = slotStart + SLOT_DURATION_MINUTES * 60 * 1000;

            // Count how many qualified specialists are booked at this slot
            let bookedSpecialistCount = 0;
            const bookedSpecialistIds: Set<string> = new Set();

            for (const booking of blockedBookings) {
                if (booking.start_time && booking.end_time) {
                    const busyStart = new Date(booking.start_time).getTime();
                    const busyEnd = new Date(booking.end_time).getTime();

                    if (isOverlapping(slotStart, slotEnd, busyStart, busyEnd)) {
                        if (booking.specialist_id) {
                            // Specific specialist booked
                            if (!bookedSpecialistIds.has(booking.specialist_id)) {
                                bookedSpecialistIds.add(booking.specialist_id);
                                bookedSpecialistCount++;
                            }
                        } else {
                            // Unassigned booking - counts as one specialist slot taken
                            bookedSpecialistCount++;
                        }
                    }
                }
            }

            // Check Google Calendar - these block everyone (clinic-wide events)
            for (const event of gCalEvents) {
                const eventStart = event.start?.dateTime || event.start?.date;
                const eventEnd = event.end?.dateTime || event.end?.date;
                if (eventStart && eventEnd) {
                    const busyStart = new Date(eventStart).getTime();
                    const busyEnd = new Date(eventEnd).getTime();
                    if (isOverlapping(slotStart, slotEnd, busyStart, busyEnd)) {
                        // GCal event blocks ALL specialists
                        return { time: slot.time, available: false, available_specialists: 0 };
                    }
                }
            }

            // Slot is available if there are still free specialists
            const freeSpecialists = specialistCount - bookedSpecialistCount;
            const isAvailable = freeSpecialists > 0;

            return {
                time: slot.time,
                available: isAvailable,
                available_specialists: freeSpecialists
            };
        });

        const availableCount = availableSlots.filter(s => s.available).length;
        console.log(`[Availability] Returning ${availableCount}/${availableSlots.length} available slots`);

        return new Response(
            JSON.stringify({ slots: availableSlots }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('[Availability] Unexpected error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error', details: String(error) }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
