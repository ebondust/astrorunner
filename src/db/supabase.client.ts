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

// Default test user ID for development (matches the user created in seed.sql)
// This user is created in local development to bypass authentication
// DO NOT use this in production - implement proper authentication instead
export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";
