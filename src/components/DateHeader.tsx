import { formatActivityDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

interface DateHeaderProps {
  date: Date;
  isToday?: boolean;
  isSticky?: boolean;
}

/**
 * Date header component for grouping activities
 * Shows formatted date with optional "Today" indicator
 */
export function DateHeader({ date, isToday = false, isSticky = true }: DateHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 py-2",
        isSticky && "sticky top-32 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      )}
    >
      <h2 className="text-lg font-semibold">{formatActivityDate(date)}</h2>
      {isToday && (
        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">Today</span>
      )}
    </div>
  );
}
