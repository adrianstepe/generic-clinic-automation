export async function onRequestGet(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const url = new URL(request.url);
        const token = url.searchParams.get('token');

        if (!token) {
            return new Response(JSON.stringify({ error: 'Missing cancellation token' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Supabase configuration
        const SUPABASE_URL = env.SUPABASE_URL || 'https://mugcvpwixdysmhgshobi.supabase.co';
        const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;

        if (!SUPABASE_SERVICE_KEY) {
            throw new Error('Supabase service key not configured');
        }

        // Fetch booking by cancellation token
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/bookings?cancellation_token=eq.${encodeURIComponent(token)}&select=*`,
            {
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Supabase error: ${response.status} - ${errorBody}`);
        }

        const bookings = await response.json();

        if (!bookings || bookings.length === 0) {
            return new Response(JSON.stringify({ error: 'Booking not found or invalid token' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const booking = bookings[0];

        // Return booking details (sanitized - no sensitive data)
        return new Response(JSON.stringify({
            id: booking.id,
            start_time: booking.start_time,
            end_time: booking.end_time,
            service_name: booking.service_name,
            amount_paid: booking.amount_paid,
            status: booking.status,
            customer_name: booking.customer_name
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('[GetBooking] Error:', err.message, err.stack);
        return new Response(JSON.stringify({
            error: 'Internal server error'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
