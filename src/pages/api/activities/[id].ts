import type { APIContext } from "astro";
import { randomUUID } from "node:crypto";

import {
  badRequest,
  internalServerError,
  notFound,
  forbidden,
  unauthorized,
  unprocessableEntity,
} from "../../../lib/api/errors.ts";
import { deleteActivity, replaceActivity } from "../../../lib/services/activity.service.ts";
import { mapEntityToDto } from "../../../lib/mappers/activity.mapper.ts";
import { createActivityCommandSchema } from "../../../lib/validators.ts";
import type { ActivityDto } from "../../../types.ts";
import { logger } from "@/lib/utils/logger";

// Disable prerendering for this API route (SSR required)
export const prerender = false;

/**
 * PUT /api/activities/[id]
 * Replaces (updates) a specific activity
 */
export async function PUT(context: APIContext): Promise<Response> {
  const correlationId = randomUUID();

  try {
    // Step 1: Get Supabase client from context.locals
    const supabase = context.locals.supabase;
    if (!supabase) {
      logger.error("Supabase client not found in context.locals", { correlationId });
      return internalServerError(correlationId);
    }

    // Step 2: Get authenticated user from middleware
    const user = context.locals.user;
    if (!user) {
      return unauthorized("Authentication required");
    }

    const userId = user.id;

    // Step 3: Get activity ID from URL params
    const activityId = context.params.id;
    if (!activityId) {
      return badRequest("Activity ID is required");
    }

    // Step 4: Validate Content-Type header
    const contentType = context.request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return badRequest("Content-Type must be application/json");
    }

    // Step 5: Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch (error) {
      return badRequest("Invalid JSON in request body", {
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Validate request body with Zod schema (reuse CreateActivityCommand schema for PUT)
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

    // Step 6: Verify the activity exists and belongs to the user
    const { data: existingActivity, error: fetchError } = await supabase
      .from("activities")
      .select("user_id")
      .eq("activity_id", activityId)
      .single();

    if (fetchError || !existingActivity) {
      return notFound("Activity not found");
    }

    if (existingActivity.user_id !== userId) {
      return forbidden("You do not have permission to update this activity");
    }

    // Step 7: Update activity via service
    let activityEntity;
    try {
      activityEntity = await replaceActivity(supabase, userId, activityId, validatedCommand);
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
        logger.error("Database error:", { correlationId, error: error.message });
        return internalServerError(correlationId);
      }

      logger.error("Unexpected error:", { correlationId, error });
      return internalServerError(correlationId);
    }

    // Step 8: Map entity to DTO
    const responseDto: ActivityDto = mapEntityToDto(activityEntity);

    // Step 9: Return 200 OK response
    return new Response(JSON.stringify(responseDto), {
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    logger.error("Unexpected error in PUT /api/activities/[id]:", { correlationId, error });
    return internalServerError(correlationId);
  }
}

/**
 * DELETE /api/activities/[id]
 * Deletes a specific activity
 */
export async function DELETE(context: APIContext): Promise<Response> {
  const correlationId = randomUUID();

  try {
    // Step 1: Get Supabase client from context.locals
    const supabase = context.locals.supabase;
    if (!supabase) {
      logger.error("Supabase client not found in context.locals", { correlationId });
      return internalServerError(correlationId);
    }

    // Step 2: Get authenticated user from middleware
    const user = context.locals.user;
    if (!user) {
      return unauthorized("Authentication required");
    }

    const userId = user.id;

    // Step 3: Get activity ID from URL params
    const activityId = context.params.id;
    if (!activityId) {
      return badRequest("Activity ID is required");
    }

    // Step 4: Verify the activity exists and belongs to the user
    const { data: existingActivity, error: fetchError } = await supabase
      .from("activities")
      .select("user_id")
      .eq("activity_id", activityId)
      .single();

    if (fetchError || !existingActivity) {
      return notFound("Activity not found");
    }

    if (existingActivity.user_id !== userId) {
      return forbidden("You do not have permission to delete this activity");
    }

    // Step 5: Delete activity via service
    try {
      await deleteActivity(supabase, userId, activityId);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("Service error:", { correlationId, error: error.message });
        return internalServerError(correlationId);
      }

      logger.error("Unexpected error:", { correlationId, error });
      return internalServerError(correlationId);
    }

    // Step 6: Return 200 OK with no content
    return new Response(null, {
      status: 200,
      statusText: "OK",
    });
  } catch (error) {
    // Catch-all for unexpected errors
    logger.error("Unexpected error in DELETE /api/activities/[id]:", { correlationId, error });
    return internalServerError(correlationId);
  }
}
