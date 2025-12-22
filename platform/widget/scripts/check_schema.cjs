
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('--- Tables ---');
    // We can't list tables easily via API without rpc, but we can try to select from likely tables

    // Check 'services'
    const { data: services, error: servicesError } = await supabase.from('services').select('*').limit(1);
    if (!servicesError) console.log("Table 'services' exists.");
    else console.log("Table 'services' error:", servicesError.message);

    // Check 'clinic_services'
    const { data: clinicServices, error: clinicError } = await supabase.from('clinic_services').select('*').limit(1);
    if (!clinicError) console.log("Table 'clinic_services' exists.");
    else console.log("Table 'clinic_services' error:", clinicError.message);

    console.log('\n--- Profiles Columns ---');
    const { data: profile, error: profileError } = await supabase.from('profiles').select('*').limit(1);
    if (profile && profile.length > 0) console.log('Profile columns:', Object.keys(profile[0]));
    else console.log('Profile error or empty:', profileError);
}

checkSchema();
