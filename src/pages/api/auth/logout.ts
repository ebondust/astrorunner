import type { APIRoute } from "astro";

import { createSupabaseServerInstance } from "@/db/supabase.client";
import { logger } from "@/lib/utils/logger";

/**
 * Disable prerendering for this API route (enable SSR)
 */
export const prerender = false;

/**
 * POST /api/auth/logout
 * Invalidate session and clear cookies
 *
 * Response: 204 No Content
 *
 * Note: Always returns success even if already logged out (idempotent)
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  // Create Supabase SSR client
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Attempt to sign out
  const { error } = await supabase.auth.signOut();

  // Log error but still return success (idempotent)
  if (error) {
    const correlationId = crypto.randomUUID();
    logger.warn("Logout error (continuing anyway):", { correlationId, error });
  }

  // Return 204 No Content on success
  return new Response(null, {
    status: 204,
  });
};
