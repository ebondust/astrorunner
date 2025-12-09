import type { AstroCookies } from "astro";
import type { SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";

import type { Database } from "./database.types";
import type { RuntimeEnv } from "../env.d";

// Export SupabaseClient type for use throughout the application
export type SupabaseClient = SupabaseClientBase<Database>;

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
 * Get environment variables from Cloudflare runtime or import.meta.env
 * Cloudflare runtime env takes precedence when available
 */
export function getEnv(runtimeEnv?: RuntimeEnv): RuntimeEnv {
  // If runtime env is provided (Cloudflare), use it
  if (runtimeEnv?.SUPABASE_URL) {
    return runtimeEnv;
  }

  // Fallback to import.meta.env (Node.js / build time)
  return {
    SUPABASE_URL: import.meta.env.SUPABASE_URL,
    SUPABASE_KEY: import.meta.env.SUPABASE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENROUTER_API_KEY: import.meta.env.OPENROUTER_API_KEY,
    OPENROUTER_MODEL: import.meta.env.OPENROUTER_MODEL,
    OPENROUTER_CACHE_TTL: import.meta.env.OPENROUTER_CACHE_TTL,
    ENABLE_AI_MOTIVATION: import.meta.env.ENABLE_AI_MOTIVATION,
  };
}

/**
 * Create a Supabase server client for SSR with proper cookie handling
 * Use this for all authentication-related operations
 * @param context - Astro context with headers, cookies, and optional runtime env
 * @returns Supabase server client instance
 */
export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
  runtimeEnv?: RuntimeEnv;
}) => {
  const env = getEnv(context.runtimeEnv);

  if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
    throw new Error(
      `Supabase configuration missing. SUPABASE_URL: ${env.SUPABASE_URL ? "set" : "missing"}, SUPABASE_KEY: ${env.SUPABASE_KEY ? "set" : "missing"}`
    );
  }

  const supabase = createServerClient<Database>(env.SUPABASE_URL, env.SUPABASE_KEY, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

// Default test user ID for development (matches the user created in seed.sql)
// This user is created in local development to bypass authentication
// DO NOT use this in production - implement proper authentication instead
export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";
