import { useEffect } from "react";
import type { ActivityDto, CreateActivityCommand, ReplaceActivityCommand } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActivityForm } from "./hooks/useActivityForm";
import { durationInputToISO8601, kmToMeters } from "@/lib/utils/date";

interface ActivityFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  activity?: ActivityDto;
  onSubmit: (command: CreateActivityCommand | ReplaceActivityCommand) => Promise<void>;
  onCancel: () => void;
}

/**
 * Modal form for creating and editing activities
 */
export function ActivityFormModal({ open, mode, activity, onSubmit, onCancel }: ActivityFormModalProps) {
  const { formState, errors, setField, validate, reset, initializeFromActivity } = useActivityForm();

  // Initialize form when modal opens
  useEffect(() => {
    if (open) {
      if (mode === "edit" && activity) {
        initializeFromActivity(activity);
      } else {
        reset();
      }
    }
  }, [open, mode, activity, initializeFromActivity, reset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validate()) {
      return;
    }

    // Submit form
    try {
      const command: CreateActivityCommand = {
        activityDate: formState.activityDate,
        duration: durationInputToISO8601(formState.duration), // Convert 1.30 to PT1H30M
        activityType: formState.activityType,
        distanceMeters: formState.distanceMeters ? kmToMeters(formState.distanceMeters) : undefined, // Convert km to meters
      };

      await onSubmit(command);
      reset();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  // Format date for input (YYYY-MM-DDTHH:mm)
  const getDateInputValue = () => {
    if (!formState.activityDate) return "";
    const date = new Date(formState.activityDate);
    // Convert to local timezone for display
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Handle date input change
  const handleDateChange = (value: string) => {
    if (!value) return;
    // Convert from local datetime-local to ISO-8601 UTC
    const date = new Date(value);
    setField("activityDate", date.toISOString());
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent data-testid="activity-form-modal" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Activity" : "Edit Activity"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Date Picker */}
            <div className="grid gap-2">
              <Label htmlFor="activityDate">
                Date and Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="activityDate"
                data-testid="activity-date-input"
                type="datetime-local"
                value={getDateInputValue()}
                onChange={(e) => handleDateChange(e.target.value)}
                aria-invalid={!!errors.activityDate}
                aria-describedby={errors.activityDate ? "activityDate-error" : undefined}
              />
              {errors.activityDate && (
                <p id="activityDate-error" data-testid="date-error-message" className="text-sm text-destructive">
                  {errors.activityDate}
                </p>
              )}
            </div>

            {/* Activity Type */}
            <div className="grid gap-2">
              <Label htmlFor="activityType">
                Activity Type <span className="text-destructive">*</span>
              </Label>
              <Select value={formState.activityType} onValueChange={(value) => setField("activityType", value as any)}>
                <SelectTrigger
                  id="activityType"
                  data-testid="activity-type-select"
                  aria-invalid={!!errors.activityType}
                  aria-describedby={errors.activityType ? "activityType-error" : undefined}
                >
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Run">Run</SelectItem>
                  <SelectItem value="Walk">Walk</SelectItem>
                  <SelectItem value="Mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
              {errors.activityType && (
                <p id="activityType-error" data-testid="type-error-message" className="text-sm text-destructive">
                  {errors.activityType}
                </p>
              )}
            </div>

            {/* Duration */}
            <div className="grid gap-2">
              <Label htmlFor="duration">
                Duration <span className="text-destructive">*</span>
              </Label>
              <Input
                id="duration"
                data-testid="duration-input"
                type="text"
                placeholder="1.30 or 90"
                value={formState.duration}
                onChange={(e) => setField("duration", e.target.value)}
                aria-invalid={!!errors.duration}
                aria-describedby={errors.duration ? "duration-error" : undefined}
              />
              <p className="text-xs text-muted-foreground">
                Format: HH.MM (e.g., 1.30), HH:MM (e.g., 1:30), or minutes (e.g., 90)
              </p>
              {errors.duration && (
                <p id="duration-error" data-testid="duration-error-message" className="text-sm text-destructive">
                  {errors.duration}
                </p>
              )}
            </div>

            {/* Distance */}
            <div className="grid gap-2">
              <Label htmlFor="distanceKm">Distance (km)</Label>
              <Input
                id="distanceKm"
                data-testid="distance-input"
                type="number"
                step="0.01"
                min="0"
                placeholder="Optional"
                value={formState.distanceMeters ?? ""}
                onChange={(e) => setField("distanceMeters", e.target.value ? parseFloat(e.target.value) : undefined)}
                aria-invalid={!!errors.distanceMeters}
                aria-describedby={errors.distanceMeters ? "distanceMeters-error" : undefined}
              />
              <p className="text-xs text-muted-foreground">Max 2 decimal places (e.g., 5.25 km)</p>
              {errors.distanceMeters && (
                <p id="distanceMeters-error" data-testid="distance-error-message" className="text-sm text-destructive">
                  {errors.distanceMeters}
                </p>
              )}
            </div>

            {/* Form-level error */}
            {errors.form && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                <p data-testid="form-error-message" className="text-sm text-destructive">
                  {errors.form}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button data-testid="cancel-button" type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button data-testid="submit-activity-button" type="submit">
              {mode === "create" ? "Add Activity" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
