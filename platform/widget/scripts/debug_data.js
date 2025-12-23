import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    console.log('--- Checking Clinics ---');
    const { data: clinics, error: clinicsError } = await supabase
        .from('clinics')
        .select('*');

    if (clinicsError) console.error('Error fetching clinics:', clinicsError);
    else console.table(clinics);

    console.log('\n--- Checking Clinic Working Hours ---');
    const { data: hours, error: hoursError } = await supabase
        .from('clinic_working_hours')
        .select('*')
        .order('clinic_id')
        .order('day_of_week');

    if (hoursError) console.error('Error fetching working hours:', hoursError);
    else {
        console.table(hours.map(h => ({
            clinic_id: h.clinic_id,
            day: h.day_of_week,
            open: h.is_open,
            time: `${h.open_time}-${h.close_time}`
        })));
    }
}

checkData();
