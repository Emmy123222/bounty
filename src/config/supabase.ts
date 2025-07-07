import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'your-supabase-url-here' && 
  supabaseAnonKey !== 'your-supabase-anon-key-here');

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase not configured. Using demo mode with sample data.');
}

// Create client with fallback for demo mode
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;