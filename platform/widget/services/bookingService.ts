import { supabase } from '../supabaseClient';

export interface BookingData {
    customer_name: string;
    customer_email: string;
    phone: string;
    service_id: string;
    service_name: string;
    start_time: string;  // ISO datetime string
    end_time: string;    // ISO datetime string
    doctor_id?: string;
    doctor_name?: string;
    language: string;
    amount_paid?: number;
    status?: string;
    stripe_payment_id?: string;
}

/**
 * Save a booking directly to Supabase.
 * This serves as a primary/backup mechanism to ensure bookings are recorded.
 */
export const saveBookingToSupabase = async (booking: BookingData): Promise<{ success: boolean; error?: string; id?: string }> => {
    try {
        console.log('[Supabase] Attempting to save booking:', JSON.stringify(booking, null, 2));
        console.log('[Supabase] Using URL:', import.meta.env.VITE_SUPABASE_URL);

        // Build the insert object, only including non-null/undefined values
        const insertData: Record<string, unknown> = {
            customer_name: booking.customer_name,
            customer_email: booking.customer_email,
            start_time: booking.start_time,
            status: booking.status || 'confirmed',
        };

        // Conditionally add optional fields (only if column exists in DB)
        if (booking.phone) insertData.customer_phone = booking.phone; // Use correct column name
        if (booking.service_id) insertData.service_id = booking.service_id;
        if (booking.service_name) insertData.service_name = booking.service_name;
        if (booking.end_time) insertData.end_time = booking.end_time;
        if (booking.doctor_id) insertData.doctor_id = booking.doctor_id;
        // Note: amount_paid column doesn't exist in bookings table, using amount_cents instead
        if (booking.amount_paid !== undefined) insertData.amount_cents = booking.amount_paid * 100;
        if (booking.stripe_payment_id) insertData.stripe_session_id = booking.stripe_payment_id;

        console.log('[Supabase] Insert data:', JSON.stringify(insertData, null, 2));

        const { data, error } = await supabase
            .from('bookings')
            .insert(insertData)
            .select('id')
            .single();

        if (error) {
            console.error('[Supabase] Insert error:', JSON.stringify(error, null, 2));
            console.error('[Supabase] Error code:', error.code);
            console.error('[Supabase] Error message:', error.message);
            console.error('[Supabase] Error details:', error.details);
            console.error('[Supabase] Error hint:', error.hint);
            return { success: false, error: `${error.code}: ${error.message}` };
        }

        console.log('[Supabase] ✅ Booking saved successfully with ID:', data?.id);
        return { success: true, id: data?.id };

    } catch (err: any) {
        console.error('[Supabase] Unexpected error:', err);
        return { success: false, error: err.message };
    }
};

/**
 * Fetch all bookings from Supabase (for debugging)
 */
export const fetchAllBookings = async () => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('[Supabase] Fetch error:', error);
            return { success: false, error: error.message, data: [] };
        }

        console.log('[Supabase] Recent bookings:', data);
        return { success: true, data };

    } catch (err: any) {
        console.error('[Supabase] Unexpected error:', err);
        return { success: false, error: err.message, data: [] };
    }
};

/**
 * Test Supabase connection
 */
export const testSupabaseConnection = async () => {
    try {
        console.log('[Supabase] Testing connection...');

        const { data, error } = await supabase
            .from('bookings')
            .select('count')
            .limit(1);

        if (error) {
            console.error('[Supabase] Connection test failed:', error);
            return { connected: false, error: error.message };
        }

        console.log('[Supabase] Connection successful');
        return { connected: true };

    } catch (err: any) {
        console.error('[Supabase] Connection test error:', err);
        return { connected: false, error: err.message };
    }
};
