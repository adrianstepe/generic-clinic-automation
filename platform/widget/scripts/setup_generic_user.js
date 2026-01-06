
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupGenericUser() {
    console.log('--- Setting up Generic Demo User ---');
    const email = 'admin@demo-clinic.com';
    const password = 'password123';

    // 1. Sign Up
    console.log(`Creating user: ${email}...`);
    let { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'Demo Admin',
                clinic_id: 'demo-clinic',
                role: 'admin'
            }
        }
    });

    if (error) {
        console.warn('Sign up notice:', error.message);
        // Try logging in if user exists
        const login = await supabase.auth.signInWithPassword({ email, password });
        if (login.error) {
            console.error('CRITICAL: Could not login or create user:', login.error.message);
            return;
        }
        data = login.data;
        console.log('Logged in successfully.');
    } else {
        console.log('User created.');
    }

    if (!data.session) {
        console.error('No session. User needs confirmation?');
        // If confirmation is needed in Dev, usually we can't surpass it without service key or email link.
        // But let's assume it works or user can confirm.
        // In previous logs "User created successfully" suggests confirmation might be off or auto.
        return;
    }

    // 2. Ensure Profile is correct
    // We update the profile to ensure clinic_id is 'demo-clinic' matchings the booking
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            clinic_id: 'demo-clinic', // Matches the seeded booking
            full_name: 'Demo Admin',
            role: 'admin'
        })
        .eq('id', data.user.id);

    if (updateError) {
        console.error('Profile update failed:', updateError.message);
    } else {
        console.log('Profile updated successfully.');
        console.log('v---------------------------------------v');
        console.log(` NEW LOGIN: ${email}`);
        console.log(` PASSWORD:  ${password}`);
        console.log('^---------------------------------------^');
    }
}

setupGenericUser();
