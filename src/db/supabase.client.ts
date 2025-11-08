import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;
// Use service role key in development to bypass RLS for testing
// In production, this should use proper authentication
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Debug logging
console.log('Supabase Client Init:');
console.log('  URL:', supabaseUrl);
console.log('  Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET');
console.log('  Service Role Key:', supabaseServiceRoleKey ? `${supabaseServiceRoleKey.substring(0, 20)}...` : 'NOT SET');

// Use service role key if available (development), otherwise use anon key (production)
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;
console.log('  Using:', supabaseServiceRoleKey ? 'SERVICE ROLE KEY (bypasses RLS)' : 'ANON KEY (enforces RLS)');

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseKey);

// Export SupabaseClient type for use throughout the application
export type SupabaseClient = typeof supabaseClient;

// Default user ID for development (authentication will be implemented later)
export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";
