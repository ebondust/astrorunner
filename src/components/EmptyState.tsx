import { Button } from "@/components/ui/button";
import { Activity, Plus } from "lucide-react";
import { formatMonthYear } from "@/lib/utils/date";

interface EmptyStateProps {
  selectedMonth: Date;
  onAddActivity: () => void;
}

/**
 * Empty state component displayed when no activities exist for selected month
 */
export function EmptyState({ selectedMonth, onAddActivity }: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center"
    >
      {/* Icon */}
      <div className="rounded-full bg-muted p-4">
        <Activity className="h-12 w-12 text-muted-foreground" />
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h2 data-testid="empty-state-message" className="text-2xl font-semibold tracking-tight">
          No activities in {formatMonthYear(selectedMonth)}
        </h2>
        <p className="text-muted-foreground">Start tracking your activities</p>
      </div>

      {/* Call to action */}
      <Button data-testid="empty-state-cta" onClick={onAddActivity} size="lg" className="mt-4">
        <Plus className="mr-2 h-5 w-5" />
        Add Activity
      </Button>
    </div>
  );
}
