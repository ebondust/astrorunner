import type { APIRoute } from "astro";

import { createSupabaseServerInstance } from "@/db/supabase.client";
import { badRequest, internalServerError } from "@/lib/api/errors";
import { signupCommandSchema } from "@/lib/validators";
import { logger } from "@/lib/utils/logger";

/**
 * Disable prerendering for this API route (enable SSR)
 */
export const prerender = false;

/**
 * POST /api/auth/signup
 * Create new user account and profile
 *
 * Request Body:
 * {
 *   email: string;
 *   password: string;
 * }
 *
 * Response (201):
 * {
 *   userId: string;
 *   email: string;
 * }
 *
 * Error Codes: 400, 409 (email exists), 500
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  // Validate Content-Type
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return badRequest("Content-Type must be application/json");
  }

  // Parse request body
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return badRequest("Invalid JSON in request body");
  }

  // Validate input with Zod
  const validationResult = signupCommandSchema.safeParse(requestBody);
  if (!validationResult.success) {
    return badRequest("Invalid input", {
      validationErrors: validationResult.error.errors,
    });
  }

  const { email, password } = validationResult.data;

  // Create Supabase SSR client
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Attempt signup with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  // Handle signup errors
  if (error) {
    // Check for duplicate email
    if (error.message.includes("already registered") || error.message.includes("already exists")) {
      return new Response(
        JSON.stringify({
          error: "Conflict",
          message: "An account with this email already exists",
        }),
        {
          status: 409,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Log error for debugging
    const correlationId = crypto.randomUUID();
    logger.error("Signup error:", { correlationId, error });

    return internalServerError(correlationId);
  }

  if (!data.user) {
    const correlationId = crypto.randomUUID();
    logger.error("Signup succeeded but no user returned", { correlationId });
    return internalServerError(correlationId);
  }

  // Profile creation is handled by database trigger
  // Return user data on success
  return new Response(
    JSON.stringify({
      userId: data.user.id,
      email: data.user.email,
    }),
    {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
