/**
 * Stripe Webhook Handler with Signature Verification
 * 
 * POST /api/webhook
 * 
 * SECURITY: Verifies Stripe-Signature header to prevent fake payment events.
 * Set STRIPE_WEBHOOK_SECRET env var in Cloudflare Pages settings.
 */

// Timing-safe string comparison to prevent timing attacks
function timingSafeEqual(a, b) {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

// Verify Stripe webhook signature
async function verifyStripeSignature(payload, header, secret) {
    if (!header || !secret) return false;

    try {
        const parts = header.split(',');
        let timestamp = null;
        let signature = null;

        for (const part of parts) {
            const [key, value] = part.split('=');
            if (key === 't') timestamp = value;
            if (key === 'v1') signature = value;
        }

        if (!timestamp || !signature) return false;

        // Check timestamp to prevent replay attacks (5 min tolerance)
        const tolerance = 300; // 5 minutes
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - parseInt(timestamp)) > tolerance) {
            console.error('[Webhook] Timestamp outside tolerance');
            return false;
        }

        // Compute expected signature
        const signedPayload = `${timestamp}.${payload}`;
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const messageData = encoder.encode(signedPayload);

        const cryptoKey = await crypto.subtle.importKey(
            'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
        );
        const signatureBytes = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
        const expectedSignature = Array.from(new Uint8Array(signatureBytes))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        return timingSafeEqual(signature, expectedSignature);
    } catch (err) {
        console.error('[Webhook] Signature verification error:', err.message);
        return false;
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;

    // CORS Headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    try {
        const payload = await request.text();

        // SECURITY: Verify Stripe signature if secret is configured
        const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;
        const signature = request.headers.get('Stripe-Signature');

        if (STRIPE_WEBHOOK_SECRET) {
            const isValid = await verifyStripeSignature(payload, signature, STRIPE_WEBHOOK_SECRET);
            if (!isValid) {
                console.error('[Webhook] Invalid Stripe signature');
                return new Response(JSON.stringify({ error: 'Invalid signature' }), {
                    status: 401,
                    headers: corsHeaders
                });
            }
            console.log('[Webhook] Signature verified successfully');
        } else {
            console.warn('[Webhook] STRIPE_WEBHOOK_SECRET not set - signature verification skipped');
        }

        const event = JSON.parse(payload);

        console.log('[Webhook] Received event type:', event.type);

        // Forward to n8n
        const N8N_WEBHOOK_URL = env.N8N_WEBHOOK_URL || 'https://n8n.srv1242088.hstgr.cloud/webhook/stripe-confirmation-webhook';

        if (event.type === 'checkout.session.completed') {
            console.log('[Webhook] Forwarding to n8n:', N8N_WEBHOOK_URL);

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
                    status: n8nResponse.status
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
        return new Response(JSON.stringify({ error: 'Invalid request' }), {
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

