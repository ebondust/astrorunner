import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "@/db/supabase.client";
import type { RuntimeEnv } from "../env";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  // Auth pages
  "/auth/login",
  "/auth/register",
  "/auth/signup",
  "/auth/reset-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/reset-password",
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, cookies, url, request, redirect } = context;

  // Check if current path is public
  const isPublicPath = PUBLIC_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(path));

  // Get runtime environment from Cloudflare (if available)
  // The Cloudflare adapter injects runtime into locals
  const runtimeEnv = (locals as { runtime?: { env: RuntimeEnv } }).runtime?.env;

  // Create SSR-compatible Supabase client for all requests
  // Pass runtime env for Cloudflare compatibility
  const supabaseSSR = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
    runtimeEnv,
  });

  // For public paths, set client and skip auth check
  if (isPublicPath) {
    locals.supabase = supabaseSSR;
    return next();
  }

  // Get authenticated user from session
  const {
    data: { user },
  } = await supabaseSSR.auth.getUser();

  // If user is authenticated, add to locals
  if (user) {
    locals.user = {
      id: user.id,
      email: user.email ?? "",
    };
    // Use the SSR client instead of legacy client
    locals.supabase = supabaseSSR;
    return next();
  }

  // User is not authenticated and trying to access protected route
  // Redirect to login page
  return redirect("/auth/login");
});
