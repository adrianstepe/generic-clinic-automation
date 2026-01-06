
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedBooking() {
    console.log('Starting seed process...');

    // 1. Try to sign in as admin to ensure permission
    // Trying the credentials from create_admin_user.js
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@butkevica.com',
        password: 'password123'
    });

    if (authError) {
        console.warn('Admin login failed, trying anonymous insert (might fail due to RLS):', authError.message);
    } else {
        console.log('Logged in as admin:', authData.user.email);
    }

    // 2. Find Service ID
    const { data: services, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .ilike('name->>lv', '%Zobu balināšana%'); // searching in JSONb name field for 'lv' key ideally, or just scanning

    // Fallback if structured json querying varies or if name is simple string
    let serviceId = null;
    let serviceDuration = 60;

    if (services && services.length > 0) {
        serviceId = services[0].id;
        serviceDuration = services[0].duration || 60;
        console.log(`Found Service: ${services[0].name['lv']} (ID: ${serviceId})`);
    } else {
        console.log('Service "Zobu balināšana" not found via specific query. Fetching all to check manually...');
        const { data: allServices } = await supabase.from('services').select('*');
        const found = allServices.find(s =>
            (s.name && typeof s.name === 'string' && s.name.includes('balināšana')) ||
            (s.name && s.name.lv && s.name.lv.includes('balināšana'))
        );

        if (found) {
            serviceId = found.id;
            serviceDuration = found.duration || 60;
            console.log(`Found Service: ${found.name.lv || found.name} (ID: ${serviceId})`);
        } else {
            console.error('Could not find service "Zobu balināšana". Aborting.');
            console.log('Available services:', allServices.map(s => s.name));
            return;
        }
    }

    // 3. Prepare Booking Data
    const bookingDate = '2026-01-06';
    const bookingTime = '16:00:00';
    // Construct ISO string for local time (assuming UTC+2 for Jan? No, Jan is UTC+2 in Riga)
    // Actually simpler to just store the string if that's how DB expects, but usually it wants timestamptz.
    // DashboardHome.tsx uses `new Date(booking.start_time)`.
    // Let's make an ISO string. 2026-01-06T16:00:00+02:00
    const startTime = `${bookingDate}T${bookingTime}+02:00`;

    // Calculate end time
    const [hours, minutes] = bookingTime.split(':').map(Number);
    const startDate = new Date(startTime);
    // Using simple approach since we just need the string for DB
    // 16:00 + 60m = 17:00
    const endTime = `${bookingDate}T17:00:00+02:00`;

    const bookingPayload = {
        created_at: new Date().toISOString(),
        start_time: startTime,
        end_time: endTime,
        service_id: serviceId,
        service_name: 'Zobu balināšana',
        customer_name: 'Adrians Stepe',
        customer_email: 'adrians.stepe@example.com', // Placeholder
        customer_phone: '20000000',
        amount_paid: 30.00,
        currency: 'EUR',
        status: 'confirmed',
        clinic_id: process.env.VITE_CLINIC_ID || 'demo-clinic',
        language: 'lv',
        source: 'manual_seed'
    };

    console.log('Inserting booking:', bookingPayload);

    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([bookingPayload])
        .select();

    if (bookingError) {
        console.error('Error inserting booking:', bookingError);
    } else {
        console.log('Booking inserted successfully:', booking);
    }
}

seedBooking();
