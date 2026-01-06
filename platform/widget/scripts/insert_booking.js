
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function insertBooking() {
    console.log('Inserting demo booking with clinic_id=butkevica...');

    // First login as an existing admin user to have INSERT permissions
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'admin@demo-clinic.com',
        password: 'password123'
    });

    if (authErr) {
        console.log('Could not login, trying direct insert (may fail due to RLS)...');
    } else {
        console.log('Logged in as:', authData.user.email);

        // Update profile to match the database's clinic_id
        await supabase
            .from('profiles')
            .update({ clinic_id: 'butkevica', role: 'admin' })
            .eq('id', authData.user.id);
        console.log('Profile updated to clinic_id=butkevica');
    }

    const { data, error } = await supabase
        .from('bookings')
        .insert({
            created_at: new Date().toISOString(),
            start_time: '2026-01-06T16:00:00+02:00',
            end_time: '2026-01-06T17:00:00+02:00',
            service_id: 'butkevica_s6',
            service_name: 'Zobu balināšana',
            customer_name: 'Adrians Stepe',
            customer_email: 'adrians.stepe@example.com',
            customer_phone: '20000000',
            amount_paid: 30.00,
            status: 'pending',
            clinic_id: 'butkevica',  // CORRECT clinic_id
            language: 'lv',
            source: 'demo_seed'
        })
        .select();

    if (error) {
        console.log('Insert failed:', error.message);
        console.log('\nPLEASE RUN THIS SQL IN SUPABASE SQL EDITOR:');
        console.log(`
INSERT INTO bookings (
    created_at, start_time, end_time, service_id, service_name,
    customer_name, customer_email, customer_phone, amount_paid,
    status, clinic_id, language, source
) VALUES (
    NOW(), 
    '2026-01-06 16:00:00+02', 
    '2026-01-06 17:00:00+02',
    'butkevica_s6',
    'Zobu balināšana',
    'Adrians Stepe', 
    'adrians.stepe@example.com', 
    '20000000', 
    30.00,
    'pending',
    'butkevica', 
    'lv', 
    'demo_seed'
);

-- Also update admin profile:
UPDATE profiles
SET clinic_id = 'butkevica', role = 'admin'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'admin@demo-clinic.com');
        `);
    } else {
        console.log('SUCCESS! Booking inserted:', data[0].id);
    }
}

insertBooking();
