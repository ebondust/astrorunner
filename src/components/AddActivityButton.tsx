import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddActivityButtonProps {
  onClick: () => void;
}

/**
 * Primary action button to add a new activity
 */
export function AddActivityButton({ onClick }: AddActivityButtonProps) {
  return (
    <div className="container mx-auto px-4 py-4">
      <Button
        data-testid="add-activity-button"
        onClick={onClick}
        size="lg"
        className="w-full sm:w-auto"
        aria-label="Add new activity"
      >
        <Plus className="mr-2 h-5 w-5" />
        Add Activity
      </Button>
    </div>
  );
}
