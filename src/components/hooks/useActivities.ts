import { useState, useCallback, useEffect } from 'react';
import type { ActivityDto, CreateActivityCommand, ReplaceActivityCommand, ActivitiesListQuery } from '@/types';
import * as activitiesApi from '@/lib/api/activities.client';
import { getMonthRange, toISODate } from '@/lib/utils/date';

interface UseActivitiesReturn {
  activities: ActivityDto[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => Promise<void>;
  createActivity: (command: CreateActivityCommand) => Promise<ActivityDto>;
  updateActivity: (id: string, command: ReplaceActivityCommand) => Promise<ActivityDto>;
  deleteActivity: (id: string) => Promise<void>;
}

interface UseActivitiesOptions {
  selectedMonth: Date;
  autoFetch?: boolean;
}

/**
 * Custom hook for managing activities data fetching and CRUD operations with optimistic updates
 */
export function useActivities(options: UseActivitiesOptions): UseActivitiesReturn {
  const { selectedMonth, autoFetch = true } = options;

  const [activities, setActivities] = useState<ActivityDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Fetch activities for the selected month
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { start, end } = getMonthRange(selectedMonth);

      const query: ActivitiesListQuery = {
        from: toISODate(start),
        to: toISODate(end),
        sort: 'activityDate',
        order: 'desc',
        limit: 100, // Get all activities for the month
      };

      const result = await activitiesApi.fetchActivities(query);
      setActivities(result.items);
      setTotalCount(result.totalCount);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activities';
      setError(errorMessage);
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  // Refetch activities
  const refetch = useCallback(async () => {
    await fetchActivities();
  }, [fetchActivities]);

  // Create activity with optimistic update
  const createActivity = useCallback(async (command: CreateActivityCommand): Promise<ActivityDto> => {
    // Create temporary activity for optimistic update
    const tempActivity: ActivityDto = {
      activityId: `temp-${Date.now()}`,
      userId: 'temp-user',
      activityDate: command.activityDate,
      duration: command.duration,
      activityType: command.activityType,
      distanceMeters: command.distanceMeters,
    };

    // Optimistic update: add to list immediately
    setActivities(prev => [tempActivity, ...prev]);

    try {
      const newActivity = await activitiesApi.createActivity(command);

      // Replace temp activity with real one
      setActivities(prev =>
        prev.map(a => a.activityId === tempActivity.activityId ? newActivity : a)
      );
      setTotalCount(prev => prev + 1);

      return newActivity;
    } catch (err) {
      // Revert optimistic update on error
      setActivities(prev => prev.filter(a => a.activityId !== tempActivity.activityId));

      const errorMessage = err instanceof Error ? err.message : 'Failed to create activity';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Update activity with optimistic update
  const updateActivity = useCallback(async (
    activityId: string,
    command: ReplaceActivityCommand
  ): Promise<ActivityDto> => {
    // Store original activity for rollback
    const originalActivity = activities.find(a => a.activityId === activityId);
    if (!originalActivity) {
      throw new Error('Activity not found');
    }

    // Optimistic update: update in list immediately
    const optimisticActivity: ActivityDto = {
      ...originalActivity,
      activityDate: command.activityDate,
      duration: command.duration,
      activityType: command.activityType,
      distanceMeters: command.distanceMeters,
    };

    setActivities(prev =>
      prev.map(a => a.activityId === activityId ? optimisticActivity : a)
    );

    try {
      const updatedActivity = await activitiesApi.replaceActivity(activityId, command);

      // Replace optimistic update with real data
      setActivities(prev =>
        prev.map(a => a.activityId === activityId ? updatedActivity : a)
      );

      return updatedActivity;
    } catch (err) {
      // Revert optimistic update on error
      setActivities(prev =>
        prev.map(a => a.activityId === activityId ? originalActivity : a)
      );

      const errorMessage = err instanceof Error ? err.message : 'Failed to update activity';
      setError(errorMessage);
      throw err;
    }
  }, [activities]);

  // Delete activity with optimistic update
  const deleteActivity = useCallback(async (activityId: string): Promise<void> => {
    // Store original activity for rollback
    const originalActivity = activities.find(a => a.activityId === activityId);
    if (!originalActivity) {
      throw new Error('Activity not found');
    }

    // Optimistic update: remove from list immediately
    setActivities(prev => prev.filter(a => a.activityId !== activityId));
    setTotalCount(prev => prev - 1);

    try {
      await activitiesApi.deleteActivity(activityId);
    } catch (err) {
      // Revert optimistic update on error
      setActivities(prev => {
        // Re-insert the activity in the correct position (by date)
        const newList = [...prev, originalActivity];
        newList.sort((a, b) =>
          new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime()
        );
        return newList;
      });
      setTotalCount(prev => prev + 1);

      const errorMessage = err instanceof Error ? err.message : 'Failed to delete activity';
      setError(errorMessage);
      throw err;
    }
  }, [activities]);

  // Fetch activities when selected month changes
  useEffect(() => {
    if (autoFetch) {
      fetchActivities();
    }
  }, [selectedMonth, autoFetch, fetchActivities]);

  return {
    activities,
    loading,
    error,
    totalCount,
    refetch,
    createActivity,
    updateActivity,
    deleteActivity,
  };
}
