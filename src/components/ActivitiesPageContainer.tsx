import { useState, useCallback } from "react";
import type { AuthUserBasicDto, DistanceUnit, ActivityDto, CreateActivityCommand } from "@/types";
import { MonthNavigation } from "./MonthNavigation";
import { MonthYearPickerModal } from "./MonthYearPickerModal";
import { AddActivityButton } from "./AddActivityButton";
import { ActivityList } from "./ActivityList";
import { ActivityFormModal } from "./ActivityFormModal";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { MotivationBanner } from "./MotivationBanner";
import { useMonthNavigation } from "./hooks/useMonthNavigation";
import { useActivities } from "./hooks/useActivities";
import { getCurrentMonthStart } from "@/lib/utils/date";
import type { MotivationalMessage } from "@/lib/services";

interface ActivitiesPageContainerProps {
  user: AuthUserBasicDto;
  distanceUnit: DistanceUnit;
  currentMonth: number;
  currentYear: number;
  initialMotivation: MotivationalMessage | null;
  initialMotivationError: string | null;
  aiMotivationEnabled: boolean;
}

/**
 * Main container component for the activities page
 * Manages all state and coordinates between components
 */
export function ActivitiesPageContainer({
  user,
  distanceUnit,
  currentMonth,
  currentYear,
  initialMotivation,
  initialMotivationError,
  aiMotivationEnabled,
}: ActivitiesPageContainerProps) {
  // Month navigation state
  const {
    selectedMonth,
    currentMonth: currentMonthDate,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    goToMonth,
    isCurrentMonth,
    canGoNext,
    canGoPrevious,
  } = useMonthNavigation({
    maxDate: getCurrentMonthStart(), // Can't navigate to future months
  });

  // Activities data and CRUD operations
  const { activities, loading, error, createActivity, updateActivity, deleteActivity } = useActivities({
    selectedMonth,
  });

  // Modal states
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [activityFormOpen, setActivityFormOpen] = useState(false);
  const [activityFormMode, setActivityFormMode] = useState<"create" | "edit">("create");
  const [editingActivity, setEditingActivity] = useState<ActivityDto | undefined>();
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [deletingActivity, setDeletingActivity] = useState<ActivityDto | undefined>();

  // Motivation state
  const [motivation, setMotivation] = useState<MotivationalMessage | null>(initialMotivation);
  const [isRegeneratingMotivation, setIsRegeneratingMotivation] = useState(false);
  const [motivationError, setMotivationError] = useState<string | null>(initialMotivationError);

  // Handler: Open month picker
  const handleOpenMonthPicker = useCallback(() => {
    setMonthPickerOpen(true);
  }, []);

  // Handler: Confirm month selection
  const handleMonthPickerConfirm = useCallback(
    (month: Date) => {
      goToMonth(month);
      setMonthPickerOpen(false);
    },
    [goToMonth]
  );

  // Handler: Cancel month picker
  const handleMonthPickerCancel = useCallback(() => {
    setMonthPickerOpen(false);
  }, []);

  // Handler: Open add activity form
  const handleAddActivity = useCallback(() => {
    setActivityFormMode("create");
    setEditingActivity(undefined);
    setActivityFormOpen(true);
  }, []);

  // Handler: Open edit activity form
  const handleEditActivity = useCallback((activity: ActivityDto) => {
    setActivityFormMode("edit");
    setEditingActivity(activity);
    setActivityFormOpen(true);
  }, []);

  // Handler: Submit activity form
  const handleActivityFormSubmit = useCallback(
    async (command: CreateActivityCommand) => {
      try {
        if (activityFormMode === "create") {
          await createActivity(command);
        } else if (editingActivity) {
          await updateActivity(editingActivity.activityId, command);
        }
        setActivityFormOpen(false);
        setEditingActivity(undefined);
      } catch (error) {
        console.error("Error submitting activity form:", error);
        // Error is already handled in the hook with optimistic updates
      }
    },
    [activityFormMode, editingActivity, createActivity, updateActivity]
  );

  // Handler: Cancel activity form
  const handleActivityFormCancel = useCallback(() => {
    setActivityFormOpen(false);
    setEditingActivity(undefined);
  }, []);

  // Handler: Open delete confirmation
  const handleDeleteActivity = useCallback(
    (activityId: string) => {
      const activity = activities.find((a) => a.activityId === activityId);
      if (activity) {
        setDeletingActivity(activity);
        setDeleteConfirmationOpen(true);
      }
    },
    [activities]
  );

  // Handler: Confirm delete
  const handleDeleteConfirm = useCallback(async () => {
    if (deletingActivity) {
      try {
        await deleteActivity(deletingActivity.activityId);
        setDeleteConfirmationOpen(false);
        setDeletingActivity(undefined);
      } catch (error) {
        console.error("Error deleting activity:", error);
        // Error is already handled in the hook with optimistic updates
      }
    }
  }, [deletingActivity, deleteActivity]);

  // Handler: Cancel delete
  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmationOpen(false);
    setDeletingActivity(undefined);
  }, []);

  // Handler: Regenerate motivation
  const handleRegenerateMotivation = useCallback(async () => {
    if (!aiMotivationEnabled || isRegeneratingMotivation) return;

    setIsRegeneratingMotivation(true);
    setMotivationError(null); // Clear previous error

    try {
      // Call API endpoint to regenerate motivation
      const response = await fetch("/api/motivation/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.userId,
          distanceUnit,
          bypassCache: true, // Force regeneration
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to regenerate motivation");
      }

      const responseData = await response.json();

      // Response now includes both motivation and error
      if (responseData.motivation) {
        setMotivation(responseData.motivation);
      }

      // Set error if present (even if we got a fallback motivation)
      if (responseData.error) {
        setMotivationError(responseData.error);
      } else {
        setMotivationError(null); // Clear error on success
      }
    } catch (error) {
      console.error("Failed to regenerate motivation:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to regenerate motivation";
      setMotivationError(errorMessage);
      // Keep existing motivation on error
    } finally {
      setIsRegeneratingMotivation(false);
    }
  }, [aiMotivationEnabled, isRegeneratingMotivation, user.userId, distanceUnit]);

  // Check if we should show motivation (only for current month)
  const showMotivation =
    aiMotivationEnabled && selectedMonth.getMonth() + 1 === currentMonth && selectedMonth.getFullYear() === currentYear;

  return (
    <>
      {/* Month Navigation */}
      <MonthNavigation
        selectedMonth={selectedMonth}
        onMonthChange={goToMonth}
        onOpenMonthPicker={handleOpenMonthPicker}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        isCurrentMonth={isCurrentMonth}
        onGoToToday={goToToday}
      />

      {/* Motivation Banner - only shown for current month */}
      {showMotivation && motivation && (
        <MotivationBanner
          motivation={motivation}
          onRegenerate={handleRegenerateMotivation}
          isRegenerating={isRegeneratingMotivation}
          error={motivationError}
        />
      )}

      {/* Add Activity Button */}
      <AddActivityButton onClick={handleAddActivity} />

      {/* Activity List */}
      <ActivityList
        activities={activities}
        loading={loading}
        error={error}
        selectedMonth={selectedMonth}
        distanceUnit={distanceUnit}
        onActivityEdit={handleEditActivity}
        onActivityDelete={handleDeleteActivity}
        onAddActivity={handleAddActivity}
      />

      {/* Month Picker Modal */}
      <MonthYearPickerModal
        open={monthPickerOpen}
        selectedMonth={selectedMonth}
        onConfirm={handleMonthPickerConfirm}
        onCancel={handleMonthPickerCancel}
        maxDate={currentMonthDate}
      />

      {/* Activity Form Modal */}
      <ActivityFormModal
        open={activityFormOpen}
        mode={activityFormMode}
        activity={editingActivity}
        onSubmit={handleActivityFormSubmit}
        onCancel={handleActivityFormCancel}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteConfirmationOpen}
        activity={deletingActivity}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}
