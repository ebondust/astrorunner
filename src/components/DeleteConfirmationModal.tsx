import type { ActivityDto } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatActivityDate, formatDuration } from "@/lib/utils/date";

interface DeleteConfirmationModalProps {
  open: boolean;
  activity?: ActivityDto;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

/**
 * Confirmation modal for deleting activities
 */
export function DeleteConfirmationModal({
  open,
  activity,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Activity</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this activity? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Activity Preview */}
        {activity && (
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="font-medium">{activity.activityType}</div>
            <div className="text-muted-foreground">
              {formatActivityDate(new Date(activity.activityDate))} •{" "}
              {formatDuration(activity.duration)}
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
