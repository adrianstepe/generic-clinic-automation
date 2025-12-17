export async function onRequestPost(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const body = await request.json();
        const { token, language } = body;

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

        // 1. Fetch booking by cancellation token
        const fetchResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/bookings?cancellation_token=eq.${encodeURIComponent(token)}&select=*`,
            {
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!fetchResponse.ok) {
            throw new Error('Failed to fetch booking');
        }

        const bookings = await fetchResponse.json();

        if (!bookings || bookings.length === 0) {
            return new Response(JSON.stringify({ error: 'Booking not found or invalid token' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const booking = bookings[0];

        // 2. Check if already cancelled
        if (booking.status === 'cancelled') {
            return new Response(JSON.stringify({ error: 'This appointment has already been cancelled' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 3. Calculate refund eligibility (>24h before appointment)
        const now = new Date();
        const startTime = new Date(booking.start_time);
        const hoursUntilAppointment = (startTime - now) / (1000 * 60 * 60);
        const isRefundEligible = hoursUntilAppointment > 24;

        // 4. Trigger n8n cancellation webhook
        const N8N_WEBHOOK_URL = env.N8N_CANCELLATION_WEBHOOK_URL || 'https://n8n.antigravity.lv/webhook/cancellation-webhook';

        const webhookPayload = {
            booking_id: booking.id,
            customer_name: booking.customer_name,
            customer_email: booking.customer_email,
            customer_phone: booking.customer_phone,
            service_name: booking.service_name,
            start_time: booking.start_time,
            amount_paid: booking.amount_paid,
            payment_intent_id: booking.payment_intent_id,
            stripe_session_id: booking.stripe_session_id,
            is_refund_eligible: isRefundEligible,
            language: language || 'en',
            cancelled_at: new Date().toISOString()
        };

        const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(webhookPayload)
        });

        if (!webhookResponse.ok) {
            // Log error but don't fail - we'll update Supabase directly as fallback
            console.error('n8n webhook failed:', await webhookResponse.text());
        }

        // 5. Update booking status in Supabase (as backup / immediate update)
        const updateResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/bookings?id=eq.${booking.id}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                    refund_status: isRefundEligible ? 'pending' : 'not_eligible'
                })
            }
        );

        if (!updateResponse.ok) {
            throw new Error('Failed to update booking status');
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Appointment cancelled successfully',
            refund_eligible: isRefundEligible
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
