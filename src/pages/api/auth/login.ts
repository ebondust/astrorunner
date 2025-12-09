import type { APIRoute } from "astro";

import { badRequest, unauthorized } from "@/lib/api/errors";
import { loginCommandSchema } from "@/lib/validators";
import { logger } from "@/lib/utils/logger";

/**
 * Disable prerendering for this API route (enable SSR)
 */
export const prerender = false;

/**
 * POST /api/auth/login
 * Authenticate user and establish session
 *
 * Request Body:
 * {
 *   email: string;
 *   password: string;
 * }
 *
 * Response (200):
 * {
 *   userId: string;
 *   email: string;
 * }
 *
 * Error Codes: 400, 401, 500
 */
export const POST: APIRoute = async ({ request, locals }) => {
  logger.debug("POST /api/auth/login - Request received");

  // Validate Content-Type
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    logger.debug("Invalid Content-Type:", { contentType });
    return badRequest("Content-Type must be application/json");
  }

  // Parse request body
  let requestBody: unknown;
  try {
    requestBody = await request.json();
    logger.debug("Request body parsed successfully");
  } catch {
    logger.debug("Failed to parse JSON body");
    return badRequest("Invalid JSON in request body");
  }

  // Validate input with Zod
  const validationResult = loginCommandSchema.safeParse(requestBody);
  if (!validationResult.success) {
    logger.debug("Validation failed:", { errors: validationResult.error.errors });
    return badRequest("Invalid input", {
      validationErrors: validationResult.error.errors,
    });
  }

  const { email, password } = validationResult.data;
  logger.debug("Attempting login for email:", { email });

  // Use Supabase client from middleware (properly configured with runtime env)
  const supabase = locals.supabase;

  // Attempt login with Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Handle authentication errors with generic message for security
  if (error || !data.user) {
    logger.debug("Authentication failed:", { error: error?.message || "No user returned" });
    return unauthorized("Invalid credentials");
  }

  logger.debug("Login successful for user:", { userId: data.user.id });

  // Return user data on success
  return new Response(
    JSON.stringify({
      userId: data.user.id,
      email: data.user.email,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
