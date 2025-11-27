import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMonthNavigation } from "./useMonthNavigation";

describe("useMonthNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Date to a known value for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-11-26T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Initialization", () => {
    it("should initialize with current month by default", () => {
      // Act
      const { result } = renderHook(() => useMonthNavigation());

      // Assert - getCurrentMonthStart returns local timezone dates
      expect(result.current.selectedMonth).toEqual(new Date(2025, 10, 1)); // Month 10 = November (0-indexed)
      expect(result.current.currentMonth).toEqual(new Date(2025, 10, 1));
      expect(result.current.isCurrentMonth).toBe(true);
    });

    it("should initialize with provided initial month", () => {
      // Arrange
      const initialMonth = new Date(2025, 9, 1); // October

      // Act
      const { result } = renderHook(() => useMonthNavigation({ initialMonth }));

      // Assert
      expect(result.current.selectedMonth).toEqual(initialMonth);
      expect(result.current.isCurrentMonth).toBe(false);
    });

    it("should allow navigation without min/max constraints by default", () => {
      // Act
      const { result } = renderHook(() => useMonthNavigation());

      // Assert
      expect(result.current.canGoNext).toBe(true);
      expect(result.current.canGoPrevious).toBe(true);
    });
  });

  describe("Navigation functions", () => {
    describe("goToPreviousMonth", () => {
      it("should navigate to previous month", () => {
        // Arrange
        const { result } = renderHook(() => useMonthNavigation());

        // Act
        act(() => {
          result.current.goToPreviousMonth();
        });

        // Assert
        expect(result.current.selectedMonth).toEqual(new Date(2025, 9, 1)); // October
        expect(result.current.isCurrentMonth).toBe(false);
      });

      it("should navigate across year boundary (Dec to Nov)", () => {
        // Arrange
        const initialMonth = new Date(2026, 0, 1); // January 2026
        const { result } = renderHook(() => useMonthNavigation({ initialMonth }));

        // Act
        act(() => {
          result.current.goToPreviousMonth();
        });

        // Assert
        expect(result.current.selectedMonth).toEqual(new Date(2025, 11, 1)); // December 2025
      });

      it("should not navigate if canGoPrevious is false", () => {
        // Arrange
        const minDate = new Date(2025, 10, 1); // November
        const { result } = renderHook(() => useMonthNavigation({ minDate }));

        // Act
        act(() => {
          result.current.goToPreviousMonth();
        });

        // Assert - Should stay on current month
        expect(result.current.selectedMonth).toEqual(new Date(2025, 10, 1));
      });
    });

    describe("goToNextMonth", () => {
      it("should navigate to next month", () => {
        // Arrange
        const { result } = renderHook(() => useMonthNavigation());

        // Act
        act(() => {
          result.current.goToNextMonth();
        });

        // Assert
        expect(result.current.selectedMonth).toEqual(new Date(2025, 11, 1));
        expect(result.current.isCurrentMonth).toBe(false);
      });

      it("should navigate across year boundary (Nov to Dec to Jan)", () => {
        // Arrange
        const initialMonth = new Date(2025, 11, 1);
        const { result } = renderHook(() => useMonthNavigation({ initialMonth }));

        // Act
        act(() => {
          result.current.goToNextMonth();
        });

        // Assert
        expect(result.current.selectedMonth).toEqual(new Date(2026, 0, 1));
      });

      it("should not navigate if canGoNext is false", () => {
        // Arrange
        const maxDate = new Date(2025, 10, 1);
        const { result } = renderHook(() => useMonthNavigation({ maxDate }));

        // Act
        act(() => {
          result.current.goToNextMonth();
        });

        // Assert - Should stay on current month
        expect(result.current.selectedMonth).toEqual(new Date(2025, 10, 1));
      });
    });

    describe("goToToday", () => {
      it("should navigate to current month", () => {
        // Arrange
        const initialMonth = new Date(2025, 0, 1);
        const { result } = renderHook(() => useMonthNavigation({ initialMonth }));

        // Act
        act(() => {
          result.current.goToToday();
        });

        // Assert
        expect(result.current.selectedMonth).toEqual(new Date(2025, 10, 1));
        expect(result.current.isCurrentMonth).toBe(true);
      });

      it("should update currentMonth reference", () => {
        // Arrange
        const { result } = renderHook(() => useMonthNavigation());

        // Act
        act(() => {
          result.current.goToToday();
        });

        // Assert
        expect(result.current.currentMonth).toEqual(new Date(2025, 10, 1));
      });
    });

    describe("goToMonth", () => {
      it("should navigate to specific month", () => {
        // Arrange
        const { result } = renderHook(() => useMonthNavigation());
        const targetMonth = new Date(2025, 5, 15, 10, 0, 0); // Mid-month date

        // Act
        act(() => {
          result.current.goToMonth(targetMonth);
        });

        // Assert - Should normalize to first day of month
        expect(result.current.selectedMonth).toEqual(new Date(2025, 5, 1));
      });

      it("should not navigate if month is before minDate", () => {
        // Arrange
        const minDate = new Date(2025, 9, 1);
        const { result } = renderHook(() => useMonthNavigation({ minDate }));
        const targetMonth = new Date(2025, 8, 1);

        // Act
        act(() => {
          result.current.goToMonth(targetMonth);
        });

        // Assert - Should stay on current month
        expect(result.current.selectedMonth).toEqual(new Date(2025, 10, 1));
      });

      it("should not navigate if month is after maxDate", () => {
        // Arrange
        const maxDate = new Date(2025, 11, 1);
        const { result } = renderHook(() => useMonthNavigation({ maxDate }));
        const targetMonth = new Date(2026, 0, 1);

        // Act
        act(() => {
          result.current.goToMonth(targetMonth);
        });

        // Assert - Should stay on current month
        expect(result.current.selectedMonth).toEqual(new Date(2025, 10, 1));
      });

      it("should normalize date to first day of month", () => {
        // Arrange
        const { result } = renderHook(() => useMonthNavigation());
        const targetMonth = new Date(2025, 5, 25, 15, 30, 45);

        // Act
        act(() => {
          result.current.goToMonth(targetMonth);
        });

        // Assert
        expect(result.current.selectedMonth).toEqual(new Date(2025, 5, 1));
      });
    });
  });

  describe("Computed properties", () => {
    describe("isCurrentMonth", () => {
      it("should be true when selected month is current month", () => {
        // Arrange
        const { result } = renderHook(() => useMonthNavigation());

        // Assert
        expect(result.current.isCurrentMonth).toBe(true);
      });

      it("should be false when selected month is not current month", () => {
        // Arrange
        const { result } = renderHook(() => useMonthNavigation());

        // Act
        act(() => {
          result.current.goToPreviousMonth();
        });

        // Assert
        expect(result.current.isCurrentMonth).toBe(false);
      });

      it("should update when navigating back to current month", () => {
        // Arrange
        const { result } = renderHook(() => useMonthNavigation());

        // Act - Go away and come back
        act(() => {
          result.current.goToPreviousMonth();
        });
        expect(result.current.isCurrentMonth).toBe(false);

        act(() => {
          result.current.goToNextMonth();
        });

        // Assert
        expect(result.current.isCurrentMonth).toBe(true);
      });
    });

    describe("canGoNext", () => {
      it("should be true when no maxDate constraint", () => {
        // Arrange
        const { result } = renderHook(() => useMonthNavigation());

        // Assert
        expect(result.current.canGoNext).toBe(true);
      });

      it("should be false when next month exceeds maxDate", () => {
        // Arrange
        const maxDate = new Date(2025, 10, 1);
        const { result } = renderHook(() => useMonthNavigation({ maxDate }));

        // Assert
        expect(result.current.canGoNext).toBe(false);
      });

      it("should be true when next month is within maxDate", () => {
        // Arrange
        const maxDate = new Date(2025, 11, 1);
        const { result } = renderHook(() => useMonthNavigation({ maxDate }));

        // Assert
        expect(result.current.canGoNext).toBe(true);
      });

      it("should update after navigation", () => {
        // Arrange
        const maxDate = new Date(2025, 11, 1);
        const { result } = renderHook(() => useMonthNavigation({ maxDate }));

        // Act
        act(() => {
          result.current.goToNextMonth();
        });

        // Assert - Now at maxDate, can't go further
        expect(result.current.canGoNext).toBe(false);
      });
    });

    describe("canGoPrevious", () => {
      it("should be true when no minDate constraint", () => {
        // Arrange
        const { result } = renderHook(() => useMonthNavigation());

        // Assert
        expect(result.current.canGoPrevious).toBe(true);
      });

      it("should be false when previous month is before minDate", () => {
        // Arrange
        const minDate = new Date(2025, 10, 1);
        const { result } = renderHook(() => useMonthNavigation({ minDate }));

        // Assert
        expect(result.current.canGoPrevious).toBe(false);
      });

      it("should be true when previous month is within minDate", () => {
        // Arrange
        const minDate = new Date(2025, 9, 1);
        const { result } = renderHook(() => useMonthNavigation({ minDate }));

        // Assert
        expect(result.current.canGoPrevious).toBe(true);
      });

      it("should update after navigation", () => {
        // Arrange
        const minDate = new Date(2025, 9, 1);
        const { result } = renderHook(() => useMonthNavigation({ minDate }));

        // Act
        act(() => {
          result.current.goToPreviousMonth();
        });

        // Assert - Now at minDate, can't go further back
        expect(result.current.canGoPrevious).toBe(false);
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle leap year February correctly", () => {
      // Arrange
      vi.setSystemTime(new Date(2024, 1, 15, 12, 0, 0)); // Leap year
      const { result } = renderHook(() => useMonthNavigation());

      // Assert
      expect(result.current.selectedMonth).toEqual(new Date(2024, 1, 1));
      expect(result.current.currentMonth).toEqual(new Date(2024, 1, 1));
    });

    it("should handle multiple rapid navigations", () => {
      // Arrange
      const { result } = renderHook(() => useMonthNavigation());

      // Act - Navigate forward and backward multiple times
      act(() => {
        result.current.goToNextMonth();
        result.current.goToNextMonth();
        result.current.goToNextMonth();
        result.current.goToPreviousMonth();
      });

      // Assert - Should be 2 months ahead
      expect(result.current.selectedMonth).toEqual(new Date(2026, 0, 1));
    });

    it("should respect both minDate and maxDate constraints", () => {
      // Arrange
      const minDate = new Date(2025, 9, 1);
      const maxDate = new Date(2025, 11, 1);
      const { result } = renderHook(() => useMonthNavigation({ minDate, maxDate }));

      // Assert - Can navigate in both directions
      expect(result.current.canGoNext).toBe(true);
      expect(result.current.canGoPrevious).toBe(true);

      // Act - Navigate to maxDate
      act(() => {
        result.current.goToNextMonth();
      });

      // Assert - Can't go further
      expect(result.current.canGoNext).toBe(false);
      expect(result.current.canGoPrevious).toBe(true);

      // Act - Navigate to minDate
      act(() => {
        result.current.goToPreviousMonth();
        result.current.goToPreviousMonth();
      });

      // Assert - Can't go further back
      expect(result.current.canGoPrevious).toBe(false);
      expect(result.current.canGoNext).toBe(true);
    });
  });
});
