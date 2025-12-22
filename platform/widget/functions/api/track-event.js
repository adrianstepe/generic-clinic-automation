/**
 * Cloudflare Pages Function: /api/track-event
 * Receives analytics events from the booking widget and stores them in Supabase
 * 
 * Uses direct REST API calls (not @supabase/supabase-js) because
 * Cloudflare Pages Functions don't have access to npm packages.
 */

// Valid event types to prevent abuse
const VALID_EVENT_TYPES = [
    'widget_open',
    'step_1_service',
    'step_2_specialist',
    'step_3_datetime',
    'step_4_details',
    'step_5_payment',
    'booking_complete',
    'booking_abandoned',
    'language_change'
];

export async function onRequestPost(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    try {
        const body = await request.json();

        // Validation
        if (!body.session_id || !body.event_type) {
            return new Response(
                JSON.stringify({ error: 'session_id and event_type are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Validate event type
        if (!VALID_EVENT_TYPES.includes(body.event_type)) {
            return new Response(
                JSON.stringify({ error: 'Invalid event_type' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Get Supabase credentials from environment
        const SUPABASE_URL = env.SUPABASE_URL || 'https://mugcvpwixdysmhgshobi.supabase.co';
        const SUPABASE_KEY = env.SUPABASE_KEY || env.SUPABASE_SERVICE_KEY;

        if (!SUPABASE_KEY) {
            console.error('[TrackEvent] Missing SUPABASE_KEY or SUPABASE_SERVICE_KEY');
            return new Response(
                JSON.stringify({ error: 'Server configuration error' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Insert event using REST API
        const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/booking_events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                session_id: body.session_id,
                event_type: body.event_type,
                event_data: body.event_data || {},
                booking_id: body.booking_id || null,
                business_id: 'BUTKEVICA_DENTAL'
            })
        });

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            console.error('[TrackEvent] Failed to insert:', errorText);
            return new Response(
                JSON.stringify({ error: 'Failed to track event' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (err) {
        console.error('[TrackEvent] Error:', err.message);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
