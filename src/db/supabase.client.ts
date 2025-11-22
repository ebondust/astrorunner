import type { AstroCookies } from "astro";
import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";

import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Use service role key in development to bypass RLS for testing
// In production, this should use proper authentication
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Use service role key if available (development), otherwise use anon key (production)
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

// Legacy global client - kept for backward compatibility with non-auth operations
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseKey);

// Export SupabaseClient type for use throughout the application
export type SupabaseClient = typeof supabaseClient;

// Cookie options for SSR authentication
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

/**
 * Parse cookie header string into array of cookie objects
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Create a Supabase server client for SSR with proper cookie handling
 * Use this for all authentication-related operations
 * @param context - Astro context with headers and cookies
 * @returns Supabase server client instance
 */
export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
}) => {
  const supabase = createServerClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return parseCookieHeader(context.headers.get("Cookie") ?? "");
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            context.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  return supabase;
};

// Default test user ID for development (matches the user created in seed.sql)
// This user is created in local development to bypass authentication
// DO NOT use this in production - implement proper authentication instead
export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";
