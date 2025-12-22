
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkServices() {
    const { data: services, error } = await supabase.from('services').select('*').limit(1);
    if (services && services.length > 0) {
        console.log('Services columns:', Object.keys(services[0]));
        console.log('Sample service:', services[0]);
    } else {
        console.log('Error or empty services:', error);
    }
}

checkServices();
