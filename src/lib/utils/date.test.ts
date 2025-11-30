import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ActivityDto } from "@/types";
import {
  formatActivityDate,
  formatMonthYear,
  formatDuration,
  formatDistance,
  getMonthRange,
  isToday,
  isSameDay,
  getCurrentMonthStart,
  groupActivitiesByDate,
  toISODate,
  toISODateTime,
  parseISODate,
  durationInputToISO8601,
  iso8601ToDurationInput,
  kmToMeters,
  metersToKm,
} from "./date";

describe("date.ts - Date Formatting Functions", () => {
  describe("formatActivityDate", () => {
    it("should format a date to 'Weekday, Mon Day' format", () => {
      // Arrange
      const date = new Date("2025-11-04T10:00:00Z");

      // Act
      const result = formatActivityDate(date);

      // Assert
      expect(result).toMatch(/^[A-Za-z]+, [A-Za-z]+ \d{1,2}$/);
    });

    it("should handle dates at year boundaries", () => {
      // Arrange
      const newYear = new Date("2025-01-01T12:00:00Z");
      const yearEnd = new Date("2025-12-31T12:00:00Z");

      // Act
      const newYearResult = formatActivityDate(newYear);
      const yearEndResult = formatActivityDate(yearEnd);

      // Assert
      expect(newYearResult).toContain("Jan");
      expect(yearEndResult).toContain("Dec");
    });

    it("should handle leap year dates", () => {
      // Arrange
      const leapDay = new Date("2024-02-29T12:00:00Z");

      // Act
      const result = formatActivityDate(leapDay);

      // Assert
      expect(result).toContain("Feb");
      expect(result).toContain("29");
    });
  });

  describe("formatMonthYear", () => {
    it("should format a date to 'Month Year' format", () => {
      // Arrange
      const date = new Date("2025-11-04T10:00:00Z");

      // Act
      const result = formatMonthYear(date);

      // Assert
      expect(result).toMatch(/^[A-Za-z]+ \d{4}$/);
    });

    it("should handle year boundaries correctly", () => {
      // Arrange
      const january = new Date("2025-01-15T10:00:00Z");
      const december = new Date("2025-12-15T10:00:00Z");

      // Act
      const janResult = formatMonthYear(january);
      const decResult = formatMonthYear(december);

      // Assert
      expect(janResult).toContain("January");
      expect(janResult).toContain("2025");
      expect(decResult).toContain("December");
      expect(decResult).toContain("2025");
    });
  });

  describe("formatDuration", () => {
    it("should format ISO-8601 duration with hours and minutes", () => {
      // Arrange
      const duration = "PT1H30M";

      // Act
      const result = formatDuration(duration);

      // Assert
      expect(result).toBe("1h 30m");
    });

    it("should format ISO-8601 duration with only hours", () => {
      // Arrange
      const duration = "PT2H";

      // Act
      const result = formatDuration(duration);

      // Assert
      expect(result).toBe("2h");
    });

    it("should format ISO-8601 duration with only minutes", () => {
      // Arrange
      const duration = "PT45M";

      // Act
      const result = formatDuration(duration);

      // Assert
      expect(result).toBe("45m");
    });

    it("should format ISO-8601 duration with hours, minutes, and seconds", () => {
      // Arrange
      const duration = "PT1H30M45S";

      // Act
      const result = formatDuration(duration);

      // Assert
      expect(result).toBe("1h 30m");
    });

    it("should show seconds only when no hours are present", () => {
      // Arrange
      const duration = "PT5M30S";

      // Act
      const result = formatDuration(duration);

      // Assert
      expect(result).toBe("5m 30s");
    });

    it("should format HH:MM:SS format with hours and minutes", () => {
      // Arrange
      const duration = "01:30:00";

      // Act
      const result = formatDuration(duration);

      // Assert
      expect(result).toBe("1h 30m");
    });

    it("should format HH:MM:SS format with only hours", () => {
      // Arrange
      const duration = "02:00:00";

      // Act
      const result = formatDuration(duration);

      // Assert
      expect(result).toBe("2h");
    });

    it("should format HH:MM:SS format with only minutes", () => {
      // Arrange
      const duration = "00:45:00";

      // Act
      const result = formatDuration(duration);

      // Assert
      expect(result).toBe("45m");
    });

    it("should return '0m' for zero duration in HH:MM:SS format", () => {
      // Arrange
      const duration = "00:00:00";

      // Act
      const result = formatDuration(duration);

      // Assert
      expect(result).toBe("0m");
    });

    it("should return '0m' for zero duration in ISO format", () => {
      // Arrange
      const duration = "PT0M";

      // Act
      const result = formatDuration(duration);

      // Assert
      expect(result).toBe("0m");
    });

    it("should return input as-is for invalid ISO-8601 format", () => {
      // Arrange
      const duration = "INVALID";

      // Act
      const result = formatDuration(duration);

      // Assert
      expect(result).toBe("INVALID");
    });

    it("should handle edge case of PT format with no time components", () => {
      // Arrange
      const duration = "PT";

      // Act
      const result = formatDuration(duration);

      // Assert
      expect(result).toBe("0m");
    });
  });

  describe("formatDistance", () => {
    it("should format distance in kilometers with 2 decimals", () => {
      // Arrange
      const meters = 5000;
      const unit = "km" as const;

      // Act
      const result = formatDistance(meters, unit);

      // Assert
      expect(result).toBe("5.00 km");
    });

    it("should format distance in miles with 2 decimals", () => {
      // Arrange
      const meters = 5000;
      const unit = "mi" as const;

      // Act
      const result = formatDistance(meters, unit);

      // Assert
      expect(result).toBe("3.11 mi");
    });

    it("should handle zero distance", () => {
      // Arrange
      const meters = 0;

      // Act
      const kmResult = formatDistance(meters, "km");
      const miResult = formatDistance(meters, "mi");

      // Assert
      expect(kmResult).toBe("0.00 km");
      expect(miResult).toBe("0.00 mi");
    });

    it("should handle very small distances", () => {
      // Arrange
      const meters = 1;

      // Act
      const kmResult = formatDistance(meters, "km");
      const miResult = formatDistance(meters, "mi");

      // Assert
      expect(kmResult).toBe("0.00 km");
      expect(miResult).toBe("0.00 mi");
    });

    it("should handle very large distances", () => {
      // Arrange
      const meters = 1000000; // 1000 km

      // Act
      const kmResult = formatDistance(meters, "km");
      const miResult = formatDistance(meters, "mi");

      // Assert
      expect(kmResult).toBe("1000.00 km");
      expect(miResult).toBe("621.37 mi");
    });
  });
});

describe("date.ts - Date Calculation Functions", () => {
  describe("getMonthRange", () => {
    it("should return correct start and end dates for a regular month", () => {
      // Arrange
      const month = new Date("2025-11-15T10:00:00Z");

      // Act
      const result = getMonthRange(month);

      // Assert
      expect(result.start.getDate()).toBe(1);
      expect(result.start.getMonth()).toBe(10); // November (0-indexed)
      expect(result.end.getDate()).toBe(30); // November has 30 days
      expect(result.end.getMonth()).toBe(10);
    });

    it("should handle February in non-leap year", () => {
      // Arrange
      const month = new Date("2025-02-15T10:00:00Z");

      // Act
      const result = getMonthRange(month);

      // Assert
      expect(result.start.getDate()).toBe(1);
      expect(result.end.getDate()).toBe(28);
      expect(result.end.getMonth()).toBe(1); // February
    });

    it("should handle February in leap year", () => {
      // Arrange
      const month = new Date("2024-02-15T10:00:00Z");

      // Act
      const result = getMonthRange(month);

      // Assert
      expect(result.start.getDate()).toBe(1);
      expect(result.end.getDate()).toBe(29);
      expect(result.end.getMonth()).toBe(1); // February
    });

    it("should handle month at year boundary (January)", () => {
      // Arrange
      const month = new Date("2025-01-15T10:00:00Z");

      // Act
      const result = getMonthRange(month);

      // Assert
      expect(result.start.getDate()).toBe(1);
      expect(result.start.getMonth()).toBe(0);
      expect(result.end.getDate()).toBe(31);
      expect(result.end.getMonth()).toBe(0);
    });

    it("should handle month at year boundary (December)", () => {
      // Arrange
      const month = new Date("2025-12-15T10:00:00Z");

      // Act
      const result = getMonthRange(month);

      // Assert
      expect(result.start.getDate()).toBe(1);
      expect(result.start.getMonth()).toBe(11);
      expect(result.end.getDate()).toBe(31);
      expect(result.end.getMonth()).toBe(11);
    });

    it("should set end date time to 23:59:59.999", () => {
      // Arrange
      const month = new Date("2025-11-15T10:00:00Z");

      // Act
      const result = getMonthRange(month);

      // Assert
      expect(result.end.getHours()).toBe(23);
      expect(result.end.getMinutes()).toBe(59);
      expect(result.end.getSeconds()).toBe(59);
      expect(result.end.getMilliseconds()).toBe(999);
    });
  });

  describe("isToday", () => {
    beforeEach(() => {
      // Mock current date to 2025-11-25
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-11-25T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return true for today's date", () => {
      // Arrange
      const today = new Date("2025-11-25T10:00:00Z");

      // Act
      const result = isToday(today);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for yesterday", () => {
      // Arrange
      const yesterday = new Date("2025-11-24T10:00:00Z");

      // Act
      const result = isToday(yesterday);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for tomorrow", () => {
      // Arrange
      const tomorrow = new Date("2025-11-26T10:00:00Z");

      // Act
      const result = isToday(tomorrow);

      // Assert
      expect(result).toBe(false);
    });

    it("should return true for today at different times", () => {
      // Arrange
      const morning = new Date("2025-11-25T08:00:00Z");
      const evening = new Date("2025-11-25T20:00:00Z");

      // Act
      const morningResult = isToday(morning);
      const eveningResult = isToday(evening);

      // Assert
      expect(morningResult).toBe(true);
      expect(eveningResult).toBe(true);
    });
  });

  describe("isSameDay", () => {
    it("should return true for same day at different times", () => {
      // Arrange
      const date1 = new Date("2025-11-25T08:00:00Z");
      const date2 = new Date("2025-11-25T20:00:00Z");

      // Act
      const result = isSameDay(date1, date2);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for different days", () => {
      // Arrange
      const date1 = new Date("2025-11-25T10:00:00Z");
      const date2 = new Date("2025-11-26T10:00:00Z");

      // Act
      const result = isSameDay(date1, date2);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for same day in different months", () => {
      // Arrange
      const date1 = new Date("2025-11-15T10:00:00Z");
      const date2 = new Date("2025-12-15T10:00:00Z");

      // Act
      const result = isSameDay(date1, date2);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for same day and month in different years", () => {
      // Arrange
      const date1 = new Date("2024-11-25T10:00:00Z");
      const date2 = new Date("2025-11-25T10:00:00Z");

      // Act
      const result = isSameDay(date1, date2);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("getCurrentMonthStart", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-11-25T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return first day of current month", () => {
      // Act
      const result = getCurrentMonthStart();

      // Assert
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(10); // November (0-indexed)
      expect(result.getFullYear()).toBe(2025);
    });

    it("should handle year boundary (January)", () => {
      // Arrange
      vi.setSystemTime(new Date("2025-01-15T12:00:00Z"));

      // Act
      const result = getCurrentMonthStart();

      // Assert
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2025);
    });

    it("should handle year boundary (December)", () => {
      // Arrange
      vi.setSystemTime(new Date("2025-12-15T12:00:00Z"));

      // Act
      const result = getCurrentMonthStart();

      // Assert
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(11);
      expect(result.getFullYear()).toBe(2025);
    });
  });
});

describe("date.ts - Activity Grouping Functions", () => {
  describe("groupActivitiesByDate", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-11-25T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should group activities by date", () => {
      // Arrange
      const activities: ActivityDto[] = [
        {
          activityId: "1",
          userId: "user1",
          activityDate: "2025-11-25T10:00:00Z",
          duration: "PT1H",
          activityType: "Run",
        },
        {
          activityId: "2",
          userId: "user1",
          activityDate: "2025-11-25T16:00:00Z",
          duration: "PT30M",
          activityType: "Walk",
        },
        {
          activityId: "3",
          userId: "user1",
          activityDate: "2025-11-24T10:00:00Z",
          duration: "PT45M",
          activityType: "Run",
        },
      ];

      // Act
      const result = groupActivitiesByDate(activities);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].activities).toHaveLength(2); // 2 activities on Nov 25
      expect(result[1].activities).toHaveLength(1); // 1 activity on Nov 24
    });

    it("should sort groups by date descending", () => {
      // Arrange
      const activities: ActivityDto[] = [
        {
          activityId: "1",
          userId: "user1",
          activityDate: "2025-11-23T10:00:00Z",
          duration: "PT1H",
          activityType: "Run",
        },
        {
          activityId: "2",
          userId: "user1",
          activityDate: "2025-11-25T10:00:00Z",
          duration: "PT30M",
          activityType: "Walk",
        },
        {
          activityId: "3",
          userId: "user1",
          activityDate: "2025-11-24T10:00:00Z",
          duration: "PT45M",
          activityType: "Run",
        },
      ];

      // Act
      const result = groupActivitiesByDate(activities);

      // Assert
      expect(result[0].date.getDate()).toBe(25);
      expect(result[1].date.getDate()).toBe(24);
      expect(result[2].date.getDate()).toBe(23);
    });

    it("should mark today's group correctly", () => {
      // Arrange
      const activities: ActivityDto[] = [
        {
          activityId: "1",
          userId: "user1",
          activityDate: "2025-11-25T10:00:00Z",
          duration: "PT1H",
          activityType: "Run",
        },
        {
          activityId: "2",
          userId: "user1",
          activityDate: "2025-11-24T10:00:00Z",
          duration: "PT30M",
          activityType: "Walk",
        },
      ];

      // Act
      const result = groupActivitiesByDate(activities);

      // Assert
      expect(result[0].isToday).toBe(true); // Nov 25 is today
      expect(result[1].isToday).toBe(false); // Nov 24 is not today
    });

    it("should handle empty activity list", () => {
      // Arrange
      const activities: ActivityDto[] = [];

      // Act
      const result = groupActivitiesByDate(activities);

      // Assert
      expect(result).toHaveLength(0);
    });

    it("should handle single activity", () => {
      // Arrange
      const activities: ActivityDto[] = [
        {
          activityId: "1",
          userId: "user1",
          activityDate: "2025-11-25T10:00:00Z",
          duration: "PT1H",
          activityType: "Run",
        },
      ];

      // Act
      const result = groupActivitiesByDate(activities);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].activities).toHaveLength(1);
    });
  });
});

describe("date.ts - ISO Date Conversion Functions", () => {
  describe("toISODate", () => {
    it("should convert Date to YYYY-MM-DD format", () => {
      // Arrange
      const date = new Date("2025-11-25T10:00:00Z");

      // Act
      const result = toISODate(date);

      // Assert
      expect(result).toBe("2025-11-25");
    });

    it("should handle dates at month boundaries", () => {
      // Arrange
      const firstDay = new Date("2025-11-01T00:00:00Z");
      const lastDay = new Date("2025-11-30T23:59:59Z");

      // Act
      const firstResult = toISODate(firstDay);
      const lastResult = toISODate(lastDay);

      // Assert
      expect(firstResult).toBe("2025-11-01");
      expect(lastResult).toBe("2025-11-30");
    });

    it("should handle leap year date", () => {
      // Arrange
      const leapDay = new Date("2024-02-29T12:00:00Z");

      // Act
      const result = toISODate(leapDay);

      // Assert
      expect(result).toBe("2024-02-29");
    });
  });

  describe("toISODateTime", () => {
    it("should convert Date to ISO-8601 UTC datetime string", () => {
      // Arrange
      const date = new Date("2025-11-25T10:30:45.123Z");

      // Act
      const result = toISODateTime(date);

      // Assert
      expect(result).toBe("2025-11-25T10:30:45.123Z");
    });

    it("should handle dates with no milliseconds", () => {
      // Arrange
      const date = new Date("2025-11-25T10:30:45Z");

      // Act
      const result = toISODateTime(date);

      // Assert
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe("parseISODate", () => {
    it("should parse ISO-8601 date string to Date", () => {
      // Arrange
      const isoDate = "2025-11-25T10:00:00Z";

      // Act
      const result = parseISODate(isoDate);

      // Assert
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(10); // November
      expect(result.getDate()).toBe(25);
    });

    it("should parse YYYY-MM-DD format", () => {
      // Arrange
      const isoDate = "2025-11-25";

      // Act
      const result = parseISODate(isoDate);

      // Assert
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(10);
      expect(result.getDate()).toBe(25);
    });

    it("should handle leap year dates", () => {
      // Arrange
      const leapDay = "2024-02-29T12:00:00Z";

      // Act
      const result = parseISODate(leapDay);

      // Assert
      expect(result).toBeInstanceOf(Date);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(29);
    });
  });
});

describe("date.ts - Duration Conversion Functions", () => {
  describe("durationInputToISO8601", () => {
    it("should convert HH.MM format to ISO-8601", () => {
      // Arrange
      const input = "1.30";

      // Act
      const result = durationInputToISO8601(input);

      // Assert
      expect(result).toBe("PT1H30M");
    });

    it("should convert HH:MM format to ISO-8601", () => {
      // Arrange
      const input = "1:30";

      // Act
      const result = durationInputToISO8601(input);

      // Assert
      expect(result).toBe("PT1H30M");
    });

    it("should convert single digit hours with colon", () => {
      // Arrange
      const input = "2:05";

      // Act
      const result = durationInputToISO8601(input);

      // Assert
      expect(result).toBe("PT2H5M");
    });

    it("should convert minutes only to ISO-8601", () => {
      // Arrange
      const input = "45";

      // Act
      const result = durationInputToISO8601(input);

      // Assert
      expect(result).toBe("PT45M");
    });

    it("should handle zero minutes in HH.MM format", () => {
      // Arrange
      const input = "2.00";

      // Act
      const result = durationInputToISO8601(input);

      // Assert
      expect(result).toBe("PT2H");
    });

    it("should handle zero hours in HH.MM format", () => {
      // Arrange
      const input = "0.30";

      // Act
      const result = durationInputToISO8601(input);

      // Assert
      expect(result).toBe("PT30M");
    });

    it("should return input as-is for invalid format", () => {
      // Arrange
      const input = "INVALID";

      // Act
      const result = durationInputToISO8601(input);

      // Assert
      expect(result).toBe("INVALID");
    });
  });

  describe("iso8601ToDurationInput", () => {
    it("should convert ISO-8601 with hours and minutes to HH.MM", () => {
      // Arrange
      const iso = "PT1H30M";

      // Act
      const result = iso8601ToDurationInput(iso);

      // Assert
      expect(result).toBe("1.30");
    });

    it("should convert ISO-8601 with only hours to HH.00", () => {
      // Arrange
      const iso = "PT2H";

      // Act
      const result = iso8601ToDurationInput(iso);

      // Assert
      expect(result).toBe("2.00");
    });

    it("should convert ISO-8601 with only minutes to minutes", () => {
      // Arrange
      const iso = "PT45M";

      // Act
      const result = iso8601ToDurationInput(iso);

      // Assert
      expect(result).toBe("45");
    });

    it("should pad single digit minutes with zero", () => {
      // Arrange
      const iso = "PT1H5M";

      // Act
      const result = iso8601ToDurationInput(iso);

      // Assert
      expect(result).toBe("1.05");
    });

    it("should handle seconds in ISO-8601 (ignore them)", () => {
      // Arrange
      const iso = "PT1H30M45S";

      // Act
      const result = iso8601ToDurationInput(iso);

      // Assert
      expect(result).toBe("1.30");
    });

    it("should return input as-is for invalid ISO-8601", () => {
      // Arrange
      const iso = "INVALID";

      // Act
      const result = iso8601ToDurationInput(iso);

      // Assert
      expect(result).toBe("INVALID");
    });
  });
});

describe("date.ts - Distance Conversion Functions", () => {
  describe("kmToMeters", () => {
    it("should convert kilometers to meters", () => {
      // Arrange
      const km = 5;

      // Act
      const result = kmToMeters(km);

      // Assert
      expect(result).toBe(5000);
    });

    it("should handle decimal kilometers", () => {
      // Arrange
      const km = 2.5;

      // Act
      const result = kmToMeters(km);

      // Assert
      expect(result).toBe(2500);
    });

    it("should handle zero kilometers", () => {
      // Arrange
      const km = 0;

      // Act
      const result = kmToMeters(km);

      // Assert
      expect(result).toBe(0);
    });

    it("should handle very small distances", () => {
      // Arrange
      const km = 0.001; // 1 meter

      // Act
      const result = kmToMeters(km);

      // Assert
      expect(result).toBe(1);
    });
  });

  describe("metersToKm", () => {
    it("should convert meters to kilometers", () => {
      // Arrange
      const meters = 5000;

      // Act
      const result = metersToKm(meters);

      // Assert
      expect(result).toBe(5);
    });

    it("should handle non-round kilometer values", () => {
      // Arrange
      const meters = 2500;

      // Act
      const result = metersToKm(meters);

      // Assert
      expect(result).toBe(2.5);
    });

    it("should handle zero meters", () => {
      // Arrange
      const meters = 0;

      // Act
      const result = metersToKm(meters);

      // Assert
      expect(result).toBe(0);
    });

    it("should handle very small distances", () => {
      // Arrange
      const meters = 1;

      // Act
      const result = metersToKm(meters);

      // Assert
      expect(result).toBe(0.001);
    });

    it("should maintain precision for decimal values", () => {
      // Arrange
      const meters = 1234;

      // Act
      const result = metersToKm(meters);

      // Assert
      expect(result).toBe(1.234);
    });
  });
});
