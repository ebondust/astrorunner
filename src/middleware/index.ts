import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance, supabaseClient } from "@/db/supabase.client";

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

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Check if current path is public
  const isPublicPath = PUBLIC_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(path));

  // For public paths, set legacy client and skip auth check
  if (isPublicPath) {
    // Lazy load supabaseClient only when needed
    locals.supabase = supabaseClient;
    return next();
  }

  // Create SSR-compatible Supabase client for auth operations
  const supabaseSSR = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Get authenticated user from session
  const {
    data: { user },
  } = await supabaseSSR.auth.getUser();

  // If user is authenticated, add to locals and set legacy client
  if (user) {
    locals.user = {
      id: user.id,
      email: user.email ?? "",
    };
    // Set legacy client for backward compatibility
    locals.supabase = supabaseClient;
    return next();
  }

  // User is not authenticated and trying to access protected route
  // Redirect to login page
  return redirect("/auth/login");
});
