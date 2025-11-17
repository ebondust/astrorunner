import { useState, useCallback, useMemo } from 'react';
import { getCurrentMonthStart } from '@/lib/utils/date';

interface UseMonthNavigationReturn {
  selectedMonth: Date;
  currentMonth: Date;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
  goToMonth: (month: Date) => void;
  isCurrentMonth: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

interface UseMonthNavigationOptions {
  minDate?: Date;
  maxDate?: Date;
  initialMonth?: Date;
}

/**
 * Custom hook for managing month navigation state
 */
export function useMonthNavigation(options: UseMonthNavigationOptions = {}): UseMonthNavigationReturn {
  const { minDate, maxDate, initialMonth } = options;

  // Get current month as reference
  const currentMonth = useMemo(() => getCurrentMonthStart(), []);

  // Initialize selected month (default to current month)
  const [selectedMonth, setSelectedMonth] = useState<Date>(
    initialMonth || currentMonth
  );

  // Check if selected month is current month
  const isCurrentMonth = useMemo(() => {
    return selectedMonth.getMonth() === currentMonth.getMonth() &&
           selectedMonth.getFullYear() === currentMonth.getFullYear();
  }, [selectedMonth, currentMonth]);

  // Check if can navigate to next month
  const canGoNext = useMemo(() => {
    if (!maxDate) return true;
    const nextMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
    return nextMonth <= maxDate;
  }, [selectedMonth, maxDate]);

  // Check if can navigate to previous month
  const canGoPrevious = useMemo(() => {
    if (!minDate) return true;
    const prevMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1);
    return prevMonth >= minDate;
  }, [selectedMonth, minDate]);

  // Navigate to previous month
  const goToPreviousMonth = useCallback(() => {
    if (!canGoPrevious) return;

    setSelectedMonth(prev => {
      const newMonth = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      return newMonth;
    });
  }, [canGoPrevious]);

  // Navigate to next month
  const goToNextMonth = useCallback(() => {
    if (!canGoNext) return;

    setSelectedMonth(prev => {
      const newMonth = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      return newMonth;
    });
  }, [canGoNext]);

  // Navigate to current month (today)
  const goToToday = useCallback(() => {
    setSelectedMonth(getCurrentMonthStart());
  }, []);

  // Navigate to specific month
  const goToMonth = useCallback((month: Date) => {
    // Validate month is within bounds
    if (minDate && month < minDate) return;
    if (maxDate && month > maxDate) return;

    // Ensure we use the first day of the month
    const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    setSelectedMonth(firstDayOfMonth);
  }, [minDate, maxDate]);

  return {
    selectedMonth,
    currentMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    goToMonth,
    isCurrentMonth,
    canGoNext,
    canGoPrevious,
  };
}
