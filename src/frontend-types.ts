import type { ActivityDto, ActivityType } from "./types";

// ------------------------------
// ViewModel Types (Frontend-specific)
// ------------------------------

// Activity list state
export interface ActivityListState {
  status: "loading" | "empty" | "loaded" | "error";
  activities: ActivityDto[];
  error?: string;
  totalCount?: number;
}

// Grouped activities by date
export interface GroupedActivities {
  date: Date;
  activities: ActivityDto[];
  isToday: boolean;
}

// Activity form state
export interface ActivityFormState {
  activityDate: string; // ISO-8601 UTC
  duration: string; // ISO-8601 or HH:MM:SS
  activityType: ActivityType;
  distanceMeters?: number;
}

// Activity form validation errors
export interface ActivityFormErrors {
  activityDate?: string;
  duration?: string;
  activityType?: string;
  distanceMeters?: string;
  form?: string; // General form error
}

// Month navigation state
export interface MonthNavigationState {
  selectedMonth: Date; // First day of selected month
  currentMonth: Date; // First day of current month
}

// Modal states
export interface ModalStates {
  activityForm: {
    open: boolean;
    mode: "create" | "edit";
    activity?: ActivityDto;
  };
  deleteConfirmation: {
    open: boolean;
    activityId?: string;
    activity?: ActivityDto;
  };
  monthPicker: {
    open: boolean;
  };
}
