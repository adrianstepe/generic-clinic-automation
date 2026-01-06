
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const clinicId = process.env.VITE_CLINIC_ID;

console.log('='.repeat(60));
console.log('LOCALHOST SUPABASE DIAGNOSTIC');
console.log('='.repeat(60));
console.log(`Connecting to: ${supabaseUrl}`);
console.log(`Project Ref: ${supabaseUrl?.split('//')[1]?.split('.')[0]}`);
console.log(`Configured Clinic ID: ${clinicId}`);
console.log('='.repeat(60));

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnose() {
    // 1. Check all bookings (no filter)
    console.log('\n[1] ALL BOOKINGS IN DATABASE:');
    const { data: allBookings, error: bookErr } = await supabase
        .from('bookings')
        .select('id, customer_name, clinic_id, status, start_time')
        .order('created_at', { ascending: false })
        .limit(10);

    if (bookErr) {
        console.log('   ERROR:', bookErr.message);
    } else if (!allBookings || allBookings.length === 0) {
        console.log('   >> NO BOOKINGS FOUND IN THIS DATABASE <<');
    } else {
        console.log(`   Found ${allBookings.length} booking(s):`);
        allBookings.forEach(b => {
            console.log(`   - ${b.customer_name} | clinic_id: ${b.clinic_id} | status: ${b.status}`);
        });
    }

    // 2. Check bookings for the configured clinic_id
    console.log(`\n[2] BOOKINGS FOR clinic_id='${clinicId}':`);
    const { data: clinicBookings, error: clinicErr } = await supabase
        .from('bookings')
        .select('id, customer_name, status')
        .eq('clinic_id', clinicId);

    if (clinicErr) {
        console.log('   ERROR:', clinicErr.message);
    } else if (!clinicBookings || clinicBookings.length === 0) {
        console.log(`   >> NO BOOKINGS FOUND FOR clinic_id='${clinicId}' <<`);
    } else {
        console.log(`   Found ${clinicBookings.length} booking(s)`);
    }

    // 3. Check all clinic_ids in use
    console.log('\n[3] ALL UNIQUE clinic_ids IN BOOKINGS:');
    const { data: uniqueIds } = await supabase
        .from('bookings')
        .select('clinic_id');

    if (uniqueIds && uniqueIds.length > 0) {
        const unique = [...new Set(uniqueIds.map(b => b.clinic_id))];
        console.log('   ', unique.join(', ') || '(none)');
    } else {
        console.log('   (no bookings exist)');
    }

    // 4. Check all users/profiles
    console.log('\n[4] ALL USER PROFILES:');
    const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, full_name, clinic_id, role');

    if (profErr) {
        console.log('   ERROR:', profErr.message);
    } else if (!profiles || profiles.length === 0) {
        console.log('   >> NO PROFILES FOUND <<');
    } else {
        console.log(`   Found ${profiles.length} profile(s):`);
        profiles.forEach(p => {
            console.log(`   - ${p.full_name || '(no name)'} | clinic_id: ${p.clinic_id} | role: ${p.role}`);
        });
    }

    // 5. Check available services
    console.log('\n[5] AVAILABLE SERVICES:');
    const { data: services, error: svcErr } = await supabase
        .from('services')
        .select('id, name, clinic_id')
        .limit(5);

    if (svcErr) {
        console.log('   ERROR:', svcErr.message);
    } else if (!services || services.length === 0) {
        console.log('   >> NO SERVICES FOUND <<');
    } else {
        console.log(`   Found ${services.length} service(s):`);
        services.forEach(s => {
            const name = typeof s.name === 'object' ? JSON.stringify(s.name) : s.name;
            console.log(`   - ${s.id} | ${name} | clinic: ${s.clinic_id}`);
        });
    }

    console.log('\n' + '='.repeat(60));
    console.log('DIAGNOSIS COMPLETE');
    console.log('='.repeat(60));
}

diagnose();
