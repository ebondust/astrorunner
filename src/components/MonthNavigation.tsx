import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { formatMonthYear } from "@/lib/utils/date";

interface MonthNavigationProps {
  selectedMonth: Date;
  onMonthChange: (month: Date) => void;
  onOpenMonthPicker: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isCurrentMonth: boolean;
  onGoToToday: () => void;
}

/**
 * Month navigation component with sticky positioning
 * Allows users to navigate between months and jump to today
 */
export function MonthNavigation({
  selectedMonth,
  onMonthChange,
  onOpenMonthPicker,
  canGoNext,
  canGoPrevious,
  isCurrentMonth,
  onGoToToday,
}: MonthNavigationProps) {
  const handlePreviousMonth = () => {
    if (!canGoPrevious) return;
    const prevMonth = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() - 1,
      1
    );
    onMonthChange(prevMonth);
  };

  const handleNextMonth = () => {
    if (!canGoNext) return;
    const nextMonth = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() + 1,
      1
    );
    onMonthChange(nextMonth);
  };

  return (
    <div className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Previous Month Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
            disabled={!canGoPrevious}
            aria-label="Previous month"
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Current Month/Year Display (clickable) */}
          <div className="flex flex-1 items-center justify-center gap-2">
            <Button
              variant="ghost"
              onClick={onOpenMonthPicker}
              className="text-lg font-semibold"
              aria-label="Select month and year"
            >
              <Calendar className="mr-2 h-5 w-5" />
              {formatMonthYear(selectedMonth)}
            </Button>

            {/* Today Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onGoToToday}
              disabled={isCurrentMonth}
              className="hidden sm:inline-flex"
            >
              Today
            </Button>
          </div>

          {/* Next Month Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            disabled={!canGoNext}
            aria-label="Next month"
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Today Button (mobile) */}
        <div className="mt-2 flex justify-center sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={onGoToToday}
            disabled={isCurrentMonth}
            className="w-full"
          >
            Go to Today
          </Button>
        </div>
      </div>
    </div>
  );
}
