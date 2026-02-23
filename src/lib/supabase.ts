import { createClient } from '@supabase/supabase-js';

// Default to dummy values for local dev bypass so it doesn't crash if keys aren't set yet.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dummy-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
