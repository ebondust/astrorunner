import { useState, useCallback } from 'react';
import type { ActivityDto, ActivityType } from '@/types';
import type { ActivityFormState, ActivityFormErrors } from '@/frontend-types';
import { validateActivityForm, hasFormErrors } from '@/lib/utils/validation';

interface UseActivityFormReturn {
  formState: ActivityFormState;
  errors: ActivityFormErrors;
  setField: <K extends keyof ActivityFormState>(field: K, value: ActivityFormState[K]) => void;
  validate: () => boolean;
  reset: () => void;
  initializeFromActivity: (activity: ActivityDto) => void;
  isValid: boolean;
}

const getInitialFormState = (): ActivityFormState => ({
  activityDate: new Date().toISOString(), // Default to now
  duration: '',
  activityType: 'Run',
  distanceMeters: undefined,
});

/**
 * Custom hook for managing activity form state and validation
 */
export function useActivityForm(): UseActivityFormReturn {
  const [formState, setFormState] = useState<ActivityFormState>(getInitialFormState());
  const [errors, setErrors] = useState<ActivityFormErrors>({});

  // Set a single field value
  const setField = useCallback(<K extends keyof ActivityFormState>(
    field: K,
    value: ActivityFormState[K]
  ) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user makes changes
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Validate all fields
  const validate = useCallback((): boolean => {
    const validationErrors = validateActivityForm(formState);
    setErrors(validationErrors);
    return !hasFormErrors(validationErrors);
  }, [formState]);

  // Reset form to initial state
  const reset = useCallback(() => {
    setFormState(getInitialFormState());
    setErrors({});
  }, []);

  // Initialize form from existing activity (for edit mode)
  const initializeFromActivity = useCallback((activity: ActivityDto) => {
    setFormState({
      activityDate: activity.activityDate,
      duration: activity.duration,
      activityType: activity.activityType,
      distanceMeters: activity.distanceMeters,
    });
    setErrors({});
  }, []);

  // Check if form is valid (no errors)
  const isValid = !hasFormErrors(errors);

  return {
    formState,
    errors,
    setField,
    validate,
    reset,
    initializeFromActivity,
    isValid,
  };
}
