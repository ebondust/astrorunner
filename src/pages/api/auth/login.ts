import type { APIRoute } from "astro";

import { createSupabaseServerInstance } from "@/db/supabase.client.ts";
import { badRequest, unauthorized } from "@/lib/api/errors.ts";
import { loginCommandSchema } from "@/lib/validators.ts";

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
  const validationResult = loginCommandSchema.safeParse(requestBody);
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

  // Attempt login with Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Handle authentication errors with generic message for security
  if (error || !data.user) {
    return unauthorized("Invalid credentials");
  }

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
