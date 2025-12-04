import type { APIRoute } from "astro";

import { createSupabaseServerInstance } from "@/db/supabase.client";
import { badRequest, unauthorized } from "@/lib/api/errors";
import { loginCommandSchema } from "@/lib/validators";

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
  console.log("[Login API] POST /api/auth/login - Request received");

  // Validate Content-Type
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    console.log("[Login API] Invalid Content-Type:", contentType);
    return badRequest("Content-Type must be application/json");
  }

  // Parse request body
  let requestBody: unknown;
  try {
    requestBody = await request.json();
    console.log("[Login API] Request body parsed successfully");
  } catch {
    console.log("[Login API] Failed to parse JSON body");
    return badRequest("Invalid JSON in request body");
  }

  // Validate input with Zod
  const validationResult = loginCommandSchema.safeParse(requestBody);
  if (!validationResult.success) {
    console.log("[Login API] Validation failed:", validationResult.error.errors);
    return badRequest("Invalid input", {
      validationErrors: validationResult.error.errors,
    });
  }

  const { email, password } = validationResult.data;
  console.log("[Login API] Attempting login for email:", email);

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
    console.log("[Login API] Authentication failed:", error?.message || "No user returned");
    return unauthorized("Invalid credentials");
  }

  console.log("[Login API] Login successful for user:", data.user.id);

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
