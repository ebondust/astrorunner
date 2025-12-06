import type {
  ActivitiesListQuery,
  ActivitiesListDto,
  ActivityDto,
  CreateActivityCommand,
  ReplaceActivityCommand,
  PatchActivityCommand,
} from "@/types";

/**
 * Fetch activities with query parameters
 */
export async function fetchActivities(query: ActivitiesListQuery): Promise<ActivitiesListDto> {
  const params = new URLSearchParams();

  // Add query parameters
  if (query.limit) params.append("limit", query.limit.toString());
  if (query.cursor) params.append("cursor", query.cursor);
  if (query.page) params.append("page", query.page.toString());
  if (query.pageSize) params.append("pageSize", query.pageSize.toString());
  if (query.from) params.append("from", query.from);
  if (query.to) params.append("to", query.to);
  if (query.type) params.append("type", query.type);
  if (query.hasDistance !== undefined) params.append("hasDistance", query.hasDistance.toString());
  if (query.sort) params.append("sort", query.sort);
  if (query.order) params.append("order", query.order);

  const response = await fetch(`/api/activities?${params.toString()}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `Failed to fetch activities: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a single activity by ID
 */
export async function getActivity(activityId: string): Promise<ActivityDto> {
  const response = await fetch(`/api/activities/${activityId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Activity not found");
    }
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `Failed to get activity: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new activity
 */
export async function createActivity(command: CreateActivityCommand): Promise<ActivityDto> {
  const response = await fetch("/api/activities", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));

    // Handle validation errors (400)
    if (response.status === 400 && errorData.errors) {
      throw new Error(errorData.errors[0]?.message || "Validation error");
    }

    throw new Error(errorData.message || `Failed to create activity: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Replace an activity (full update with PUT)
 */
export async function replaceActivity(activityId: string, command: ReplaceActivityCommand): Promise<ActivityDto> {
  const response = await fetch(`/api/activities/${activityId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Activity not found");
    }
    if (response.status === 403) {
      throw new Error("You do not have permission to update this activity");
    }

    const errorData = await response.json().catch(() => ({ message: response.statusText }));

    // Handle validation errors (400)
    if (response.status === 400 && errorData.errors) {
      throw new Error(errorData.errors[0]?.message || "Validation error");
    }

    throw new Error(errorData.message || `Failed to update activity: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Partially update an activity (PATCH)
 */
export async function patchActivity(activityId: string, command: PatchActivityCommand): Promise<ActivityDto> {
  const response = await fetch(`/api/activities/${activityId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Activity not found");
    }
    if (response.status === 403) {
      throw new Error("You do not have permission to update this activity");
    }

    const errorData = await response.json().catch(() => ({ message: response.statusText }));

    // Handle validation errors (400)
    if (response.status === 400 && errorData.errors) {
      throw new Error(errorData.errors[0]?.message || "Validation error");
    }

    throw new Error(errorData.message || `Failed to update activity: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete an activity
 */
export async function deleteActivity(activityId: string): Promise<void> {
  const response = await fetch(`/api/activities/${activityId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    if (response.status === 404) {
      // Already deleted, consider this success
      return;
    }
    if (response.status === 403) {
      throw new Error("You do not have permission to delete this activity");
    }

    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `Failed to delete activity: ${response.statusText}`);
  }
}
