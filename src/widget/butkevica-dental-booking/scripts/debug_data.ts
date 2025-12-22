
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('--- Checking Clinic Services ---');
    const { data: services, error: servicesError } = await supabase
        .from('clinic_services')
        .select('id, name_lv, business_id, is_active')
        .limit(10);

    if (servicesError) console.error('Error fetching services:', servicesError);
    else console.table(services);

    console.log('\n--- Checking Profiles (Mock User) ---');
    // looking for a profile that might be the user (from previous conversation user email was 'adrians.stepe@gmail.com')
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, role, clinic_id')
        .eq('email', 'adrians.stepe@gmail.com');

    if (profilesError) console.error('Error fetching profile:', profilesError);
    else console.table(profiles);
}

checkData();
