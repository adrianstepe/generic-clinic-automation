/**
 * Reserve a time slot atomically before Stripe checkout.
 * This prevents race conditions where two users book the same slot.
 * 
 * POST /api/reserve-slot
 * Body: { start_time, end_time, customer_email, customer_name, service_id, service_name, cf_turnstile_token }
 * 
 * Returns:
 * - 200: { success: true, pending_booking_id: "uuid" }
 * - 409: { success: false, error: "SLOT_ALREADY_BOOKED" }
 * - 429: { success: false, error: "RATE_LIMIT_EXCEEDED" }
 * - 403: { success: false, error: "CAPTCHA_FAILED" }
 * - 500: { success: false, error: "message" }
 * 
 * BOT PROTECTION:
 * 1. Cloudflare Turnstile verification (CAPTCHA alternative)
 * 2. Rate limiting: Max 3 reservations per IP per minute
 * 3. Email format validation
 */

// Simple in-memory rate limiter (resets on function cold start)
// For production, consider using Cloudflare KV or D1 for persistence
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 3; // Max 3 slot reservations per minute per IP

function checkRateLimit(ip) {
    const now = Date.now();
    const key = `ratelimit:${ip}`;
    const record = rateLimitMap.get(key);

    if (!record || (now - record.windowStart) > RATE_LIMIT_WINDOW_MS) {
        // New window
        rateLimitMap.set(key, { windowStart: now, count: 1 });
        return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
    }

    if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
        return { allowed: false, remaining: 0 };
    }

    record.count++;
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

// Verify Cloudflare Turnstile token
async function verifyTurnstile(token, ip, secretKey) {
    if (!secretKey) {
        console.warn('[Turnstile] No secret key configured, skipping verification');
        return true; // Skip verification if not configured
    }

    if (!token) {
        console.log('[Turnstile] No token provided');
        return false;
    }

    try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: secretKey,
                response: token,
                remoteip: ip
            })
        });

        const result = await response.json();
        console.log('[Turnstile] Verification result:', result.success);
        return result.success === true;
    } catch (error) {
        console.error('[Turnstile] Verification error:', error);
        return false;
    }
}

// Basic email format validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

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
        // Get client IP for rate limiting
        const clientIP = request.headers.get('CF-Connecting-IP') ||
            request.headers.get('X-Forwarded-For')?.split(',')[0] ||
            'unknown';

        // Rate limiting check
        const rateLimit = checkRateLimit(clientIP);
        if (!rateLimit.allowed) {
            console.log('[ReserveSlot] Rate limit exceeded for IP:', clientIP);
            return new Response(JSON.stringify({
                success: false,
                error: 'RATE_LIMIT_EXCEEDED'
            }), {
                status: 429,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                    'X-RateLimit-Remaining': '0',
                    'Retry-After': '60'
                }
            });
        }

        const body = await request.json();
        const { start_time, end_time, customer_email, customer_name, service_id, service_name, cf_turnstile_token } = body;

        // Validate required fields
        if (!start_time || !end_time || !customer_email) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing required fields: start_time, end_time, customer_email'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Validate email format
        if (!isValidEmail(customer_email)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid email format'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Verify Turnstile CAPTCHA (if configured)
        const turnstileSecret = env.TURNSTILE_SECRET_KEY;
        if (turnstileSecret) {
            const isHuman = await verifyTurnstile(cf_turnstile_token, clientIP, turnstileSecret);
            if (!isHuman) {
                console.log('[ReserveSlot] Turnstile verification failed for IP:', clientIP);
                return new Response(JSON.stringify({
                    success: false,
                    error: 'CAPTCHA_FAILED'
                }), {
                    status: 403,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // Get Supabase credentials from environment
        const SUPABASE_URL = env.SUPABASE_URL || 'https://mugcvpwixdysmhgshobi.supabase.co';
        const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;

        if (!SUPABASE_SERVICE_KEY) {
            console.error('[ReserveSlot] Missing SUPABASE_SERVICE_KEY');
            return new Response(JSON.stringify({
                success: false,
                error: 'Server configuration error'
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Call the atomic reserve_slot RPC function
        const rpcResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/reserve_slot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                p_start_time: start_time,
                p_end_time: end_time,
                p_customer_email: customer_email,
                p_customer_name: customer_name || null,
                p_service_id: service_id || null,
                p_service_name: service_name || null,
                p_clinic_id: body.clinic_id, // SaaS: Pass clinic_id to scope the lock
                p_lock_minutes: 5
            })
        });

        if (!rpcResponse.ok) {
            const errorText = await rpcResponse.text();
            console.error('[ReserveSlot] Supabase RPC error:', errorText);
            return new Response(JSON.stringify({
                success: false,
                error: 'Database error'
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const result = await rpcResponse.json();

        // RPC returns array with single result
        const data = Array.isArray(result) ? result[0] : result;

        if (data.success) {
            console.log('[ReserveSlot] Slot reserved successfully:', data.booking_id);
            return new Response(JSON.stringify({
                success: true,
                pending_booking_id: data.booking_id
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        } else {
            // Slot is already taken
            console.log('[ReserveSlot] Slot conflict:', data.error_message);
            return new Response(JSON.stringify({
                success: false,
                error: data.error_message || 'SLOT_ALREADY_BOOKED'
            }), {
                status: 409, // Conflict
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

    } catch (err) {
        console.error('[ReserveSlot] Unexpected error:', err.message);
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
