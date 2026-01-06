
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixProfile() {
    console.log('--- Fixing Profile Clinic ID ---');

    // 1. Log in
    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@butkevica.com',
        password: 'password123'
    });

    if (authError) {
        console.error('Login failed');
        return;
    }

    // 2. Update Profile
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ clinic_id: 'demo-clinic' })
        .eq('id', session.user.id);

    if (updateError) {
        console.error('Update failed:', updateError.message);
    } else {
        console.log(`Success! Updated user ${session.user.email} trigger clinic_id to 'demo-clinic'.`);
    }
}

fixProfile();
