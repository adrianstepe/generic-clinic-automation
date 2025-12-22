export async function onRequestPost(context) {
    const { request, env } = context;

    // CORS Headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    try {
        const payload = await request.text();
        const event = JSON.parse(payload);

        console.log('[Webhook] Received event type:', event.type);

        // Forward to n8n
        const N8N_WEBHOOK_URL = env.N8N_WEBHOOK_URL || 'https://n8n.srv1152467.hstgr.cloud/webhook/stripe-confirmation-webhook';

        if (event.type === 'checkout.session.completed') {
            console.log('[Webhook] Forwarding to n8n:', N8N_WEBHOOK_URL);

            // n8n webhook node wraps POST body in "body", so we send the event directly
            // The n8n code expects: $json.body.type, $json.body.data.object
            // Since n8n wraps our POST body as "body", we send the raw event
            const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event)
            });

            console.log('[Webhook] n8n response status:', n8nResponse.status);

            if (!n8nResponse.ok) {
                const errorText = await n8nResponse.text();
                console.error('[Webhook] n8n Error:', errorText);
                return new Response(JSON.stringify({
                    error: 'n8n forwarding failed',
                    status: n8nResponse.status,
                    details: errorText
                }), { status: 502, headers: corsHeaders });
            }

            const n8nResult = await n8nResponse.text();
            console.log('[Webhook] n8n success response:', n8nResult);
        }

        return new Response(JSON.stringify({ received: true, forwarded: true, eventType: event.type }), {
            status: 200,
            headers: corsHeaders
        });

    } catch (err) {
        console.error('[Webhook] Error:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: corsHeaders
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
