import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

const fallbackUrl = 'https://example.supabase.co';
const fallbackKey = 'public-anon-key-placeholder';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables are missing. Using fallback client configuration for build-time execution.');
}

export const supabase = createClient(supabaseUrl || fallbackUrl, supabaseKey || fallbackKey);
