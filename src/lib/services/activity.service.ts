import type { SupabaseClient } from "../../db/supabase.client.ts";
import type { ActivityEntity, CreateActivityCommand } from "../../types.ts";
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
