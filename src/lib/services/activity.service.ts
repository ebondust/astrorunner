import type { SupabaseClient } from "../../db/supabase.client.ts";
import type { ActivityEntity, CreateActivityCommand, ReplaceActivityCommand } from "../../types.ts";
import { mapCommandToEntity } from "../mappers/activity.mapper.ts";

/**
 * Creates a new activity in the database
 * @param supabase - Authenticated Supabase client
 * @param userId - ID of the authenticated user (from session, never from client input)
 * @param command - Validated create activity command
 * @returns Created activity entity
 * @throws Error if database operation fails
 */
export async function createActivity(
  supabase: SupabaseClient,
  userId: string,
  command: CreateActivityCommand
): Promise<ActivityEntity> {
  if (!userId || userId.trim().length === 0) {
    throw new Error("User ID is required");
  }

  // Transform command to insert entity using mapper
  const insertEntity = mapCommandToEntity(command, userId);

  // Insert into database
  const { data, error } = await supabase.from("activities").insert(insertEntity).select().single();

  if (error) {
    throw new Error(`Failed to create activity: ${error.message}`);
  }

  if (!data) {
    throw new Error("Activity was not created. No data returned from database.");
  }

  return data;
}

/**
 * Replaces (updates) an activity in the database
 * @param supabase - Authenticated Supabase client
 * @param userId - ID of the authenticated user (from session, never from client input)
 * @param activityId - ID of the activity to update
 * @param command - Validated replace activity command
 * @returns Updated activity entity
 * @throws Error if database operation fails or activity not found
 */
export async function replaceActivity(
  supabase: SupabaseClient,
  userId: string,
  activityId: string,
  command: ReplaceActivityCommand
): Promise<ActivityEntity> {
  if (!userId || userId.trim().length === 0) {
    throw new Error("User ID is required");
  }

  if (!activityId || activityId.trim().length === 0) {
    throw new Error("Activity ID is required");
  }

  // Transform command to update entity using mapper
  const updateEntity = mapCommandToEntity(command, userId);

  // Update in database (RLS ensures user can only update their own activities)
  const { data, error } = await supabase
    .from("activities")
    .update(updateEntity)
    .eq("activity_id", activityId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update activity: ${error.message}`);
  }

  if (!data) {
    throw new Error("Activity was not updated. No data returned from database.");
  }

  return data;
}

/**
 * Deletes an activity from the database
 * @param supabase - Authenticated Supabase client
 * @param userId - ID of the authenticated user (from session, never from client input)
 * @param activityId - ID of the activity to delete
 * @throws Error if database operation fails or activity not found
 */
export async function deleteActivity(supabase: SupabaseClient, userId: string, activityId: string): Promise<void> {
  if (!userId || userId.trim().length === 0) {
    throw new Error("User ID is required");
  }

  if (!activityId || activityId.trim().length === 0) {
    throw new Error("Activity ID is required");
  }

  // Delete from database (RLS ensures user can only delete their own activities)
  const { error } = await supabase.from("activities").delete().eq("activity_id", activityId).eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete activity: ${error.message}`);
  }
}
