import type { Tables, TablesInsert, TablesUpdate, Enums } from "./db/database.types";

// Base entity types derived from the database schema (kept for strict coupling)
export type ActivityEntity = Tables<"activities">;
export type ProfileEntity = Tables<"profiles">;
export type ActivityInsertEntity = TablesInsert<"activities">;
export type ActivityUpdateEntity = TablesUpdate<"activities">;
export type ProfileInsertEntity = TablesInsert<"profiles">;
export type ProfileUpdateEntity = TablesUpdate<"profiles">;

// Database-backed enums
export type ActivityType = Enums<"activity_type">; // "Run" | "Walk" | "Mixed"

// ------------------------------
// Auth DTOs and Commands
// ------------------------------

export interface AuthSignupCommand {
  email: string;
  password: string;
}

export interface AuthLoginCommand {
  email: string;
  password: string;
}

export interface AuthPasswordResetCommand {
  email: string;
}

export interface AuthUserBasicDto {
  userId: string;
  email: string;
}

export type AuthSignupResponseDto = AuthUserBasicDto;
export type AuthLoginResponseDto = AuthUserBasicDto;

// ------------------------------
// Profile DTOs and Commands
// ------------------------------

// NOTE: DB stores `distance_unit` as string; API restricts to a known union
export type DistanceUnit = "km" | "mi";

export interface ProfileDto {
  userId: ProfileEntity["user_id"];
  distanceUnit: DistanceUnit;
}

export interface ProfileUpsertCommand {
  distanceUnit: DistanceUnit;
}

export type ProfilePatchCommand = Partial<ProfileUpsertCommand>;

// ------------------------------
// Activity DTOs, Commands, and Query Models
// ------------------------------

// API-facing Activity representation, mapped from DB entity naming/types
export interface ActivityDto {
  activityId: ActivityEntity["activity_id"];
  userId: ActivityEntity["user_id"];
  activityDate: ActivityEntity["activity_date"]; // ISO-8601 UTC string in API
  // DB uses `unknown` for duration; API normalizes to string (ISO-8601 duration or HH:MM:SS)
  duration: string;
  activityType: ActivityType;
  // DB uses `distance` (number | null). API exposes `distanceMeters?` (omitted when null)
  distanceMeters?: number;
}

// Create/Replace activity payload (PUT uses replace semantics, POST creates)
export interface CreateActivityCommand {
  activityDate: string; // ISO-8601 UTC
  duration: string; // ISO-8601 duration or HH:MM:SS
  activityType: ActivityType;
  distanceMeters?: number; // >= 0, up to 3 decimals
}

export type ReplaceActivityCommand = CreateActivityCommand;

// Partial update (PATCH)
export type PatchActivityCommand = Partial<CreateActivityCommand>;

// List query model (page-based or cursor-based)
export interface ActivitiesListQuery {
  limit?: number; // default 20, max 100
  cursor?: string; // opaque cursor (mutually exclusive with page/pageSize)
  page?: number; // default 1
  pageSize?: number; // default 20, max 100
  from?: string; // ISO date (inclusive)
  to?: string; // ISO date (inclusive)
  type?: ActivityType; // filter by activity type
  hasDistance?: boolean; // true|false
  sort?: "activityDate" | "duration" | "distance"; // default activityDate
  order?: "asc" | "desc"; // default desc
}

export interface ActivitiesListDto {
  items: ActivityDto[];
  nextCursor: string | null;
  totalCount: number;
}

// Single-entity responses
export type GetActivityResponseDto = ActivityDto;
export type CreateActivityResponseDto = ActivityDto;
export type ReplaceActivityResponseDto = ActivityDto;
