import { TimeSlot } from '../types';

// Supabase Edge Function URL (primary - fast, serverless)
const getEdgeFunctionUrl = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) return null;
    return `${supabaseUrl}/functions/v1/check-availability`;
};

// n8n Webhook URL (fallback)
const getN8nUrl = () => import.meta.env.VITE_N8N_AVAILABILITY_URL;

/**
 * Check availability for a given date.
 * 
 * Architecture (Resilient):
 * 1. Primary: Supabase Edge Function (serverless, auto-scaling, no VPS dependency)
 * 2. Fallback: n8n webhook (for backward compatibility during migration)
 * 
 * Benefits:
 * - If Supabase Edge Function is down: Falls back to n8n
 * - If n8n is down: Edge Function still works
 * - Lower latency: Edge Function has direct DB access (no HTTP hop)
 */
/**
 * Check availability for a given date.
 */
export const checkAvailability = async (date: string, clinicId: string, serviceId?: string): Promise<{ slots: TimeSlot[] }> => {
    const edgeFunctionUrl = getEdgeFunctionUrl();
    const n8nUrl = getN8nUrl();

    // Try Supabase Edge Function first (primary)
    if (edgeFunctionUrl) {
        try {
            const url = new URL(edgeFunctionUrl);
            url.searchParams.set('date', date);
            url.searchParams.set('clinic_id', clinicId);
            if (serviceId) url.searchParams.set('service_id', serviceId);

            console.log('[Availability] Trying Supabase Edge Function...');
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Include anon key for Supabase auth
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('[Availability] Edge Function success:', data.slots?.length, 'slots');
                return data;
            }

            console.warn('[Availability] Edge Function failed:', response.status, response.statusText);
        } catch (error) {
            console.warn('[Availability] Edge Function error, falling back to n8n:', error);
        }
    }

    // Fallback to n8n webhook
    if (n8nUrl) {
        try {
            console.log('[Availability] Falling back to n8n...');
            const url = new URL(n8nUrl);
            url.searchParams.set('date', date);
            url.searchParams.set('clinic_id', clinicId);
            if (serviceId) url.searchParams.set('service_id', serviceId);

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('[Availability] n8n fallback success:', data.slots?.length, 'slots');
                return data;
            }

            throw new Error(`n8n Availability Check Failed: ${response.statusText}`);
        } catch (error) {
            console.error('[Availability] n8n fallback also failed:', error);
        }
    }

    // Both failed - return empty slots so UI handles gracefully
    console.error('[Availability] CRITICAL: All availability sources failed');
    return { slots: [] };
};

/**
 * Get availability counts for a range of dates.
 */
export const getWeekAvailability = async (startDate: string, endDate: string, clinicId: string, serviceId?: string): Promise<Record<string, number>> => {
    const result: Record<string, number> = {};

    // Parse dates and iterate through range
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Fetch availability for each date in parallel
    const datePromises: Promise<void>[] = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
        const dateStr = currentDate.toLocaleDateString('en-CA');
        const fetchDate = new Date(currentDate);

        datePromises.push(
            checkAvailability(dateStr, clinicId, serviceId).then(data => {
                const availableCount = data.slots?.filter(s => s.available).length || 0;
                result[fetchDate.toLocaleDateString('en-CA')] = availableCount;
            }).catch(() => {
                result[fetchDate.toLocaleDateString('en-CA')] = 0;
            })
        );

        currentDate.setDate(currentDate.getDate() + 1);
    }

    await Promise.all(datePromises);
    return result;
};

/**
 * Find the first date with at least one available slot.
 */
export const getFirstAvailableDate = async (maxDaysAhead: number = 60, clinicId: string, serviceId?: string): Promise<{ date: string; time: string } | null> => {
    const today = new Date();

    for (let i = 1; i <= maxDaysAhead; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        const dateStr = checkDate.toLocaleDateString('en-CA');

        try {
            const data = await checkAvailability(dateStr, clinicId, serviceId);
            const availableSlot = data.slots?.find(s => s.available);

            if (availableSlot) {
                return { date: dateStr, time: availableSlot.time };
            }
        } catch (error) {
            console.warn(`[FirstAvailable] Failed to check ${dateStr}:`, error);
            continue;
        }
    }

    return null;
};
