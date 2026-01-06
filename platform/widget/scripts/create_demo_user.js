
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createDemoUser() {
    console.log('--- Creating/Updating Demo User ---');
    const email = 'demo@butkevica.com';
    const password = 'password123';

    // 1. Sign Up / Sign In
    let { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'Demo Admin',
                role: 'admin',
                clinic_id: 'demo-clinic' // Trying to set metadata directly
            }
        }
    });

    if (error) {
        // If user already exists, try signing in
        console.log('User might confirm existing, trying login...');
        const login = await supabase.auth.signInWithPassword({ email, password });
        if (login.error) {
            console.error('Could not login or create user:', login.error.message);
            return;
        }
        data = login.data;
    }

    if (!data.session) {
        console.error('No session established. User might need email confirmation.');
        return;
    }

    console.log('Logged in as:', data.user.email);

    // 2. Force Update Profile
    // Now that we are logged in as this user, we can update our own profile
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            clinic_id: 'demo-clinic',
            role: 'admin',
            specialist_id: null // Ensure we are not restricted as a doctor
        })
        .eq('id', data.user.id);

    if (updateError) {
        console.error('Failed to update profile:', updateError.message);
    } else {
        console.log('Success! Profile updated to clinic_id: demo-clinic');
        console.log('Please LOG OUT and LOG IN with:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    }
}

createDemoUser();
