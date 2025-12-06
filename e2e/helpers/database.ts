import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";

/**
 * Database helpers for E2E tests
 *
 * These helpers interact with the remote E2E test database
 * configured in .env.test
 */

// Get E2E test user credentials from environment
export const E2E_USER_ID = process.env.E2E_USERNAME_ID ?? "";
export const E2E_USERNAME = process.env.E2E_USERNAME ?? "";
export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "";

/**
 * Create Supabase client for E2E tests
 * Uses environment variables from .env.test
 */
export function createE2ESupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials in environment");
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Create authenticated Supabase client for E2E tests
 * Authenticates with the test user credentials for database operations
 */
async function createAuthenticatedE2EClient() {
  const supabase = createE2ESupabaseClient();

  // Sign in as the test user to bypass RLS
  const { error } = await supabase.auth.signInWithPassword({
    email: E2E_USERNAME,
    password: E2E_PASSWORD,
  });

  if (error) {
    throw new Error(`Failed to authenticate test user: ${error.message}`);
  }

  return supabase;
}

/**
 * Get the test user ID from environment
 * This user should already exist in the test database
 */
export function getTestUserId(): string {
  if (!E2E_USER_ID) {
    throw new Error("E2E_USERNAME_ID not configured in .env.test");
  }
  return E2E_USER_ID;
}

/**
 * Clean up all activities for the test user
 * Should be called before and after each test
 * Authenticates as the test user to bypass RLS policies
 */
export async function cleanupTestData(userId: string = E2E_USER_ID) {
  const supabase = await createAuthenticatedE2EClient();

  // Delete all activities for the test user
  const { error } = await supabase.from("activities").delete().eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to cleanup test data: ${error.message}`);
  }

  // Sign out after cleanup
  await supabase.auth.signOut();
}

/**
 * Seed a single activity into the database
 * Authenticates as the test user to bypass RLS policies
 */
export async function seedActivity(
  userId: string,
  activityData: {
    date: string; // ISO-8601 format
    type: "Run" | "Walk" | "Mixed";
    duration: string; // PostgreSQL interval format (e.g., 'PT45M')
    distance?: number; // Distance in meters
  }
) {
  const supabase = await createAuthenticatedE2EClient();

  const { data, error } = await supabase
    .from("activities")
    .insert({
      user_id: userId,
      activity_date: activityData.date,
      activity_type: activityData.type,
      duration: activityData.duration,
      distance: activityData.distance || null,
    })
    .select()
    .single();

  if (error) {
    await supabase.auth.signOut();
    throw new Error(`Failed to seed activity: ${error.message}`);
  }

  await supabase.auth.signOut();
  return data;
}

/**
 * Seed multiple activities into the database
 * Authenticates as the test user to bypass RLS policies
 */
export async function seedActivities(
  userId: string,
  activities: {
    date: string;
    type: "Run" | "Walk" | "Mixed";
    duration: string;
    distance?: number;
  }[]
) {
  const supabase = await createAuthenticatedE2EClient();

  const insertData = activities.map((activity) => ({
    user_id: userId,
    activity_date: activity.date,
    activity_type: activity.type,
    duration: activity.duration,
    distance: activity.distance || null,
  }));

  const { data, error } = await supabase.from("activities").insert(insertData).select();

  if (error) {
    await supabase.auth.signOut();
    throw new Error(`Failed to seed activities: ${error.message}`);
  }

  await supabase.auth.signOut();
  return data;
}

/**
 * Get all activities for a user (useful for verification)
 * Authenticates as the test user to bypass RLS policies
 */
export async function getActivitiesForUser(userId: string) {
  const supabase = await createAuthenticatedE2EClient();

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .order("activity_date", { ascending: false });

  if (error) {
    await supabase.auth.signOut();
    throw new Error(`Failed to get activities: ${error.message}`);
  }

  await supabase.auth.signOut();
  return data;
}
