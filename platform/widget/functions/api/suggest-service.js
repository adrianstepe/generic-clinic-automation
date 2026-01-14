/**
 * Server-side Gemini AI service suggestion endpoint.
 * This keeps the Gemini API key secure on the server.
 * 
 * POST /api/suggest-service
 * Body: {
 *   symptoms: string,
 *   services: Array<{ id: string, name: string, description: string }>
 * }
 * 
 * Returns:
 * - 200: { success: true, service_id: "s1" }
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
        // Get Gemini API key from environment (NEVER exposed to client)
        const GEMINI_API_KEY = env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            console.warn('[SuggestService] No Gemini API key configured, returning default');
            return new Response(JSON.stringify({
                success: true,
                service_id: 's1' // Default to consultation
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const body = await request.json();
        const { symptoms, services } = body;

        // Validate required fields
        if (!symptoms) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing required field: symptoms'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Build service list for prompt
        const serviceList = (services || [])
            .map(s => `${s.id}: ${s.name} (${s.description})`)
            .join('\n');

        const prompt = `
            You are a dental receptionist assistant.
            Here are the available services:
            ${serviceList}
            
            The patient describes their symptoms as: "${symptoms}".
            
            Based on this description, return ONLY the ID of the most appropriate service (e.g., "s1"). 
            If unsure or if it's general pain, return "s1" (Consultation).
            Do not return any other text.
        `;

        // Call Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            console.error('[SuggestService] Gemini API error:', errText);
            // Fall back to default service
            return new Response(JSON.stringify({
                success: true,
                service_id: 's1'
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        // Validate that the returned ID exists in services
        const validIds = (services || []).map(s => s.id);
        const serviceId = (text && validIds.includes(text)) ? text : 's1';

        console.log('[SuggestService] Suggested service:', serviceId);

        return new Response(JSON.stringify({
            success: true,
            service_id: serviceId
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('[SuggestService] Unexpected error:', err.message);
        // Fall back to default service on error
        return new Response(JSON.stringify({
            success: true,
            service_id: 's1'
        }), {
            status: 200,
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
