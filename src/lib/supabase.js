import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials missing! Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env or Vercel Settings.');
}

// Fallback to empty strings to prevent createClient from throwing if vars are missing during build/boot
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);
