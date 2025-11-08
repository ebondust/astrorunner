import type { APIContext } from "astro";
import { randomUUID } from "node:crypto";

import { DEFAULT_USER_ID } from "../../db/supabase.client.ts";
import { badRequest, internalServerError, unprocessableEntity } from "../../lib/api/errors.ts";
import { mapEntityToDto } from "../../lib/mappers/activity.mapper.ts";
import { createActivity } from "../../lib/services/activity.service.ts";
import { createActivityCommandSchema } from "../../lib/validators.ts";
import type { CreateActivityResponseDto } from "../../types.ts";

// Disable prerendering for this API route (SSR required)
export const prerender = false;

/**
 * POST /api/activities
 * Creates a new activity entry
 * Note: Authentication is not yet implemented - using DEFAULT_USER_ID for now
 */
export async function POST(context: APIContext): Promise<Response> {
  const correlationId = randomUUID();

  try {
    // Step 1: Get Supabase client from context.locals
    const supabase = context.locals.supabase;
    if (!supabase) {
      console.error(`[${correlationId}] Supabase client not found in context.locals`);
      return internalServerError(correlationId);
    }

    // Step 2: Use default user ID (authentication will be implemented later)
    const userId = DEFAULT_USER_ID;

    // Step 3: Validate Content-Type header
    const contentType = context.request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return badRequest("Content-Type must be application/json");
    }

    // Step 4: Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch (error) {
      return badRequest("Invalid JSON in request body", {
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Validate request body with Zod schema
    const validationResult = createActivityCommandSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return badRequest("Invalid input data", {
        validationErrors: errors,
      });
    }

    const validatedCommand = validationResult.data;

    // Step 5: Create activity via service
    let activityEntity;
    try {
      activityEntity = await createActivity(supabase, userId, validatedCommand);
    } catch (error) {
      // Handle specific validation errors from service/mapper
      if (error instanceof Error) {
        // Check if it's a validation/parsing error
        if (
          error.message.includes("Duration") ||
          error.message.includes("distance") ||
          error.message.includes("Invalid")
        ) {
          return unprocessableEntity(error.message, {
            field: error.message.includes("Duration")
              ? "duration"
              : error.message.includes("distance")
                ? "distanceMeters"
                : "unknown",
          });
        }

        // Database errors
        console.error(`[${correlationId}] Database error:`, error.message);
        return internalServerError(correlationId);
      }

      console.error(`[${correlationId}] Unexpected error:`, error);
      return internalServerError(correlationId);
    }

    // Step 6: Map entity to DTO
    const responseDto: CreateActivityResponseDto = mapEntityToDto(activityEntity);

    // Step 7: Return 201 Created response
    return new Response(JSON.stringify(responseDto), {
      status: 201,
      statusText: "Created",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error(`[${correlationId}] Unexpected error in POST /api/activities:`, error);
    return internalServerError(correlationId);
  }
}
