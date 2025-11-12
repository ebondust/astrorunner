import { useEffect } from "react";
import type { ActivityDto, CreateActivityCommand, ReplaceActivityCommand } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActivityForm } from "./hooks/useActivityForm";

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
export function ActivityFormModal({
  open,
  mode,
  activity,
  onSubmit,
  onCancel,
}: ActivityFormModalProps) {
  const {
    formState,
    errors,
    setField,
    validate,
    reset,
    initializeFromActivity,
  } = useActivityForm();

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
        duration: formState.duration,
        activityType: formState.activityType,
        distanceMeters: formState.distanceMeters,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Activity" : "Edit Activity"}
          </DialogTitle>
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
                type="datetime-local"
                value={getDateInputValue()}
                onChange={(e) => handleDateChange(e.target.value)}
                aria-invalid={!!errors.activityDate}
                aria-describedby={errors.activityDate ? "activityDate-error" : undefined}
              />
              {errors.activityDate && (
                <p id="activityDate-error" className="text-sm text-destructive">
                  {errors.activityDate}
                </p>
              )}
            </div>

            {/* Activity Type */}
            <div className="grid gap-2">
              <Label htmlFor="activityType">
                Activity Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formState.activityType}
                onValueChange={(value) => setField("activityType", value as any)}
              >
                <SelectTrigger
                  id="activityType"
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
                <p id="activityType-error" className="text-sm text-destructive">
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
                type="text"
                placeholder="00:45:00 or PT45M"
                value={formState.duration}
                onChange={(e) => setField("duration", e.target.value)}
                aria-invalid={!!errors.duration}
                aria-describedby={errors.duration ? "duration-error" : undefined}
              />
              <p className="text-xs text-muted-foreground">
                Format: HH:MM:SS (e.g., 01:30:00) or ISO-8601 (e.g., PT1H30M)
              </p>
              {errors.duration && (
                <p id="duration-error" className="text-sm text-destructive">
                  {errors.duration}
                </p>
              )}
            </div>

            {/* Distance */}
            <div className="grid gap-2">
              <Label htmlFor="distanceMeters">Distance (meters)</Label>
              <Input
                id="distanceMeters"
                type="number"
                step="0.001"
                min="0"
                placeholder="Optional"
                value={formState.distanceMeters ?? ""}
                onChange={(e) =>
                  setField(
                    "distanceMeters",
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                aria-invalid={!!errors.distanceMeters}
                aria-describedby={errors.distanceMeters ? "distanceMeters-error" : undefined}
              />
              {errors.distanceMeters && (
                <p id="distanceMeters-error" className="text-sm text-destructive">
                  {errors.distanceMeters}
                </p>
              )}
            </div>

            {/* Form-level error */}
            {errors.form && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{errors.form}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === "create" ? "Add Activity" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
