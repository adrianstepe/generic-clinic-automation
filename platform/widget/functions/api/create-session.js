export async function onRequestPost(context) {
    const { request, env } = context;

    // CORS Headers for local development or cross-origin calls (if needed)
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const body = await request.json();

        // API Key Strategy: Use env var from Pages Settings
        // Fallback key is for DEMO PURPOSES ONLY.
        const STRIPE_KEY = env.STRIPE_SECRET_KEY || 'sk_test_51SX3fTPj1OTNtDrGF3gdymNxmZKDuhiw2s6HP62JWi1YkhAqcbFN7TX8ryExaRE6IgOGLUkcBAdukKv8aELrJEFA00OqFXAHne';

        // Construct form-urlencoded body for Stripe API
        const formData = new URLSearchParams();
        formData.append('payment_method_types[]', 'card');
        formData.append('payment_method_types[]', 'link');  // Enable Stripe Link one-click checkout
        formData.append('line_items[0][price_data][currency]', 'eur');
        formData.append('line_items[0][price_data][product_data][name]', body.service || 'Dental Service');
        formData.append('line_items[0][price_data][unit_amount]', body.amount.toString());
        formData.append('line_items[0][quantity]', '1');
        formData.append('mode', 'payment');
        formData.append('success_url', body.success_url);
        formData.append('cancel_url', body.cancel_url);

        // Set locale for Stripe Checkout page
        // Use 'auto' to let Stripe determine locale from browser settings
        // This prevents module loading errors like "Cannot find module './en'"
        formData.append('locale', 'auto');

        // Pass Metadata so we get it back in the Webhook
        if (body.booking) {
            formData.append('metadata[booking_date]', body.booking.date);
            formData.append('metadata[booking_time]', body.booking.time);
            formData.append('metadata[service_id]', body.booking.serviceId);
            formData.append('metadata[serviceName]', body.booking.serviceName || 'Dental Service');
            formData.append('metadata[language]', body.booking.language || 'en');
            if (body.booking.duration) formData.append('metadata[duration]', body.booking.duration.toString());
            if (body.booking.doctor_id) formData.append('metadata[doctor_id]', body.booking.doctor_id);
            if (body.booking.doctor_name) formData.append('metadata[doctor_name]', body.booking.doctor_name);
            // Slot lock: Pass pending booking ID so n8n can promote to confirmed
            if (body.booking.pending_booking_id) {
                formData.append('metadata[pending_booking_id]', body.booking.pending_booking_id);
            }
            if (body.booking.clinic_id) {
                formData.append('metadata[clinic_id]', body.booking.clinic_id);
            }
            if (body.booking.clinic_email) {
                formData.append('metadata[clinic_email]', body.booking.clinic_email);
            }
        }
        if (body.customer) {
            formData.append('metadata[customer_name]', body.customer.name);
            formData.append('metadata[customer_email]', body.customer.email);
            if (body.customer.phone) {
                formData.append('metadata[customer_phone]', body.customer.phone);
            }
            formData.append('customer_email', body.customer.email);
        }

        // Call Stripe API directly
        const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${STRIPE_KEY}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });

        const stripeData = await stripeResponse.json();

        if (!stripeResponse.ok) {
            throw new Error(stripeData.error?.message || 'Failed to create Stripe session');
        }

        return new Response(JSON.stringify({ id: stripeData.id, url: stripeData.url }), {
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
            'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
        },
    });
}
