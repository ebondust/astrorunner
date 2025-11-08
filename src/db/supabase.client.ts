import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;
// Use service role key in development to bypass RLS for testing
// In production, this should use proper authentication
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Use service role key if available (development), otherwise use anon key (production)
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseKey);

// Export SupabaseClient type for use throughout the application
export type SupabaseClient = typeof supabaseClient;

// Default user ID for development (authentication will be implemented later)
export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";
