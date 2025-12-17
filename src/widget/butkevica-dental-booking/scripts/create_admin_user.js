
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

const email = 'admin@butkevica.com';
const password = 'password123'; // Temporary password

async function createAdmin() {
    console.log(`Attempting to create user: ${email}`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'System Admin',
                role: 'admin',
            },
        },
    });

    if (error) {
        console.error('Error creating user:', error.message);
        return;
    }

    console.log('User created successfully:', data.user);
    console.log('Please check your email for confirmation or manually confirm the user in Supabase dashboard if email sending is not set up.');
}

createAdmin();
