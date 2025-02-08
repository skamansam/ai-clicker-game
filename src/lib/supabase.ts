import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public"
import type { Database } from './types';

// Your app's Supabase configuration
const supabaseUrl = PUBLIC_SUPABASE_URL;
const supabaseAnonKey = PUBLIC_SUPABASE_ANON_KEY;

// Initialize Supabase with types
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Auth helper
export const auth = supabase.auth;

// Database helper
export const db = supabase;
