
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugData() {
    console.log('--- Debugging Data Visibility ---');

    // 1. Log in as Admin
    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@butkevica.com',
        password: 'password123'
    });

    if (authError || !session) {
        console.error('Login failed:', authError?.message);
        return;
    }
    console.log('Logged in as:', session.user.email);
    console.log('User ID:', session.user.id);

    // 2. Check Profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (profileError) {
        console.error('Error fetching profile:', profileError.message);
    } else {
        console.log('\nUser Profile:', profile);
    }

    // 3. Check Booking (Bypassing RLS not possible here without service key, but we are logged in as admin so RLS should allow if setup correctly)
    // We search specifically for the named customer
    const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_name', 'Adrians Stepe');

    if (bookingError) {
        console.error('Error fetching bookings:', bookingError.message);
    } else {
        console.log('\nBookings found for "Adrians Stepe":', bookings.length);
        bookings.forEach(b => {
            console.log(`- Booking ID: ${b.id}`);
            console.log(`  Clinic ID: ${b.clinic_id}`);
            console.log(`  Start Time: ${b.start_time}`);
            console.log(`  Status: ${b.status}`);
        });
    }

    // 4. Mismatch Analysis
    if (profile && bookings && bookings.length > 0) {
        const booking = bookings[0];
        if (profile.clinic_id !== booking.clinic_id) {
            console.error(`\nCRITICAL MISMATCH: Profile Clinic ID (${profile.clinic_id}) does not match Booking Clinic ID (${booking.clinic_id})`);
            console.log('To fix this, update the profile to match the booking (or vice versa).');
        } else {
            console.log('\nClinic IDs match. Problem might be date filtering or status.');
        }
    }
}

debugData();
