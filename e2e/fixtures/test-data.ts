/**
 * Test fixtures for E2E tests
 *
 * Provides reusable test data for activities
 */

/**
 * Sample activity data for seeding the database
 */
export const sampleActivities = {
  runWithDistance: {
    date: '2025-11-30T14:30:00Z',
    type: 'Run' as const,
    duration: 'PT45M', // PostgreSQL interval: 45 minutes
    distance: 5000, // meters (5 km)
  },

  walkWithoutDistance: {
    date: '2025-11-30T09:00:00Z',
    type: 'Walk' as const,
    duration: 'PT30M', // 30 minutes
  },

  mixedActivity: {
    date: '2025-11-29T18:00:00Z',
    type: 'Mixed' as const,
    duration: 'PT1H30M', // 1 hour 30 minutes
    distance: 8000, // meters (8 km)
  },

  longRun: {
    date: '2025-11-28T06:00:00Z',
    type: 'Run' as const,
    duration: 'PT2H15M', // 2 hours 15 minutes
    distance: 21000, // meters (21 km - half marathon)
  },

  shortWalk: {
    date: '2025-11-27T12:00:00Z',
    type: 'Walk' as const,
    duration: 'PT15M', // 15 minutes
    distance: 1500, // meters (1.5 km)
  },
};

/**
 * Form input data for creating activities
 * Format matches what the UI expects (datetime-local, duration as HH.MM or minutes)
 */
export const formInputData = {
  runWithAllFields: {
    dateTime: '2025-11-30T14:30', // datetime-local format
    type: 'Run' as const,
    duration: '1.45', // 1 hour 45 minutes in HH.MM format
    distance: '12', // km
  },

  walkRequiredOnly: {
    dateTime: '2025-11-30T09:00',
    type: 'Walk' as const,
    duration: '30', // 30 minutes
    // no distance
  },

  mixedWithDistance: {
    dateTime: '2025-11-29T18:00',
    type: 'Mixed' as const,
    duration: '90', // 90 minutes
    distance: '8.5', // km
  },

  runInMinutes: {
    dateTime: '2025-11-28T06:00',
    type: 'Run' as const,
    duration: '45', // 45 minutes in minutes format
    distance: '5.5', // km
  },

  walkWithColonFormat: {
    dateTime: '2025-11-27T12:00',
    type: 'Walk' as const,
    duration: '1:30', // 1 hour 30 minutes in HH:MM format
    distance: '2.5', // km
  },
};

/**
 * Expected display values after creating activities
 * These are the values that should appear in the UI
 */
export const expectedDisplayValues = {
  duration: {
    '45min': '45m',
    '1h45min': '1h 45m',
    '30min': '30m',
    '90min': '1h 30m',
    '2h15min': '2h 15m',
  },

  distance: {
    '5km': '5.00 km',
    '12km': '12.00 km',
    '8.5km': '8.50 km',
    '21km': '21.00 km',
    '1.5km': '1.50 km',
    'noDistance': '—',
  },

  time: {
    '14:30': '14:30',
    '09:00': '09:00',
    '18:00': '18:00',
    '06:00': '06:00',
    '12:00': '12:00',
  },
};

/**
 * Invalid form data for validation testing
 */
export const invalidFormData = {
  zeroDuration: {
    dateTime: '2025-11-30T14:30',
    type: 'Run' as const,
    duration: '0',
    distance: '5',
  },

  negativeDuration: {
    dateTime: '2025-11-30T14:30',
    type: 'Run' as const,
    duration: '-30',
    distance: '5',
  },

  invalidDurationFormat: {
    dateTime: '2025-11-30T14:30',
    type: 'Run' as const,
    duration: 'abc',
    distance: '5',
  },

  negativeDistance: {
    dateTime: '2025-11-30T14:30',
    type: 'Run' as const,
    duration: '45',
    distance: '-5',
  },

  missingRequired: {
    dateTime: '',
    type: '' as any,
    duration: '',
  },
};
