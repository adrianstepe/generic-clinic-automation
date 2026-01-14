/**
 * Create a Stripe Checkout session server-side.
 * This keeps the Stripe secret key secure on the server.
 * 
 * POST /api/create-stripe-session
 * Body: {
 *   amount_cents: number,
 *   service_name: string,
 *   success_url: string,
 *   cancel_url: string,
 *   metadata: object,
 *   customer_email: string,
 *   pending_booking_id?: string
 * }
 * 
 * Returns:
 * - 200: { success: true, url: "https://checkout.stripe.com/..." }
 * - 400: { success: false, error: "Missing required fields" }
 * - 500: { success: false, error: "message" }
 */

export async function onRequestPost(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    try {
        // Get Stripe secret key from environment (NEVER exposed to client)
        const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;

        if (!STRIPE_SECRET_KEY) {
            console.error('[CreateStripeSession] Missing STRIPE_SECRET_KEY');
            return new Response(JSON.stringify({
                success: false,
                error: 'Server configuration error: Stripe not configured'
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const body = await request.json();
        const {
            amount_cents,
            service_name,
            success_url,
            cancel_url,
            metadata,
            customer_email,
            currency = 'eur'
        } = body;

        // Validate required fields
        if (!amount_cents || !service_name || !success_url || !cancel_url || !customer_email) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing required fields: amount_cents, service_name, success_url, cancel_url, customer_email'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Build Stripe API request
        const formData = new URLSearchParams();
        formData.append('payment_method_types[]', 'card');
        formData.append('payment_method_types[]', 'link');
        formData.append('line_items[0][price_data][currency]', currency);
        formData.append('line_items[0][price_data][product_data][name]', service_name);
        formData.append('line_items[0][price_data][unit_amount]', String(amount_cents));
        formData.append('line_items[0][quantity]', '1');
        formData.append('mode', 'payment');
        formData.append('success_url', success_url);
        formData.append('cancel_url', cancel_url);
        formData.append('locale', 'auto');
        formData.append('customer_email', customer_email);

        // Add all metadata fields
        if (metadata && typeof metadata === 'object') {
            for (const [key, value] of Object.entries(metadata)) {
                if (value !== null && value !== undefined) {
                    formData.append(`metadata[${key}]`, String(value));
                }
            }
        }

        // Call Stripe API
        const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('[CreateStripeSession] Stripe API error:', errText);
            let errorMessage = 'Payment service error';
            try {
                const errJson = JSON.parse(errText);
                errorMessage = errJson.error?.message || errorMessage;
            } catch (e) {
                // Keep default error message
            }
            return new Response(JSON.stringify({
                success: false,
                error: errorMessage
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const data = await response.json();

        if (!data.url) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid response from payment server'
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log('[CreateStripeSession] Session created:', data.id);

        return new Response(JSON.stringify({
            success: true,
            url: data.url,
            session_id: data.id
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('[CreateStripeSession] Unexpected error:', err.message);
        return new Response(JSON.stringify({
            success: false,
            error: err.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Handle OPTIONS for CORS
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
