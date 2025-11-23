import type { APIContext } from "astro";
import { randomUUID } from "node:crypto";

import { badRequest, internalServerError, unprocessableEntity, unauthorized } from "../../lib/api/errors.ts";
import { mapEntityToDto } from "../../lib/mappers/activity.mapper.ts";
import { createActivity } from "../../lib/services/activity.service.ts";
import { createActivityCommandSchema } from "../../lib/validators.ts";
import type { CreateActivityResponseDto, ActivitiesListDto } from "../../types.ts";

// Disable prerendering for this API route (SSR required)
export const prerender = false;

/**
 * GET /api/activities
 * Fetches activities for the authenticated user with optional filtering
 */
export async function GET(context: APIContext): Promise<Response> {
  const correlationId = randomUUID();

  try {
    // Get Supabase client from context.locals
    const supabase = context.locals.supabase;
    if (!supabase) {
      console.error(`[${correlationId}] Supabase client not found in context.locals`);
      return internalServerError(correlationId);
    }

    // Get authenticated user from middleware
    const user = context.locals.user;
    if (!user) {
      return unauthorized("Authentication required");
    }

    const userId = user.id;

    // Parse query parameters from URL
    const url = new URL(context.request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const type = url.searchParams.get("type");
    const sort = url.searchParams.get("sort") || "activityDate";
    const order = url.searchParams.get("order") || "desc";
    const limit = parseInt(url.searchParams.get("limit") || "100", 10);

    // Build base query
    let query = supabase
      .from("activities")
      .select("*", { count: "exact" })
      .eq("user_id", userId);

    // Apply date range filters
    if (from) {
      query = query.gte("activity_date", from);
    }
    if (to) {
      // Add one day to include the entire 'to' date
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1);
      query = query.lt("activity_date", toDate.toISOString().split('T')[0]);
    }

    // Apply activity type filter
    if (type && (type === "Run" || type === "Walk" || type === "Mixed")) {
      query = query.eq("activity_type", type);
    }

    // Apply sorting
    const sortColumn = sort === "activityDate" ? "activity_date"
                     : sort === "duration" ? "duration"
                     : sort === "distance" ? "distance"
                     : "activity_date";
    query = query.order(sortColumn, { ascending: order === "asc" });

    // Apply limit
    query = query.limit(Math.min(limit, 100)); // Max 100 items

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error(`[${correlationId}] Database error:`, error.message);
      return internalServerError(correlationId);
    }

    // Map database entities to DTOs
    const items = (data || []).map(mapEntityToDto);

    // Build response
    const response: ActivitiesListDto = {
      items,
      nextCursor: null, // Cursor pagination not implemented yet
      totalCount: count || 0,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(`[${correlationId}] Unexpected error in GET /api/activities:`, error);
    return internalServerError(correlationId);
  }
}

/**
 * POST /api/activities
 * Creates a new activity entry
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

    // Step 2: Get authenticated user from middleware
    const user = context.locals.user;
    if (!user) {
      return unauthorized("Authentication required");
    }

    const userId = user.id;

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
