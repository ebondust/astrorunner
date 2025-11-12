import type { ActivityDto, DistanceUnit } from "@/types";
import { ActivityCard } from "./ActivityCard";
import { DateHeader } from "./DateHeader";
import { EmptyState } from "./EmptyState";
import { SkeletonLoader } from "./SkeletonLoader";
import { groupActivitiesByDate } from "@/lib/utils/date";

interface ActivityListProps {
  activities: ActivityDto[];
  loading: boolean;
  error: string | null;
  selectedMonth: Date;
  distanceUnit: DistanceUnit;
  onActivityEdit: (activity: ActivityDto) => void;
  onActivityDelete: (activityId: string) => void;
  onAddActivity: () => void;
}

/**
 * Activity list component managing activity display with loading and empty states
 */
export function ActivityList({
  activities,
  loading,
  error,
  selectedMonth,
  distanceUnit,
  onActivityEdit,
  onActivityDelete,
  onAddActivity,
}: ActivityListProps) {
  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <SkeletonLoader count={5} />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <h3 className="font-semibold text-destructive">Error loading activities</h3>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (activities.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <EmptyState selectedMonth={selectedMonth} onAddActivity={onAddActivity} />
      </div>
    );
  }

  // Group activities by date
  const groupedActivities = groupActivitiesByDate(activities);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        {groupedActivities.map((group) => (
          <div key={group.date.toISOString()} className="space-y-3">
            {/* Date Header */}
            <DateHeader date={group.date} isToday={group.isToday} isSticky />

            {/* Activity Cards */}
            <div className="space-y-3">
              {group.activities.map((activity) => (
                <ActivityCard
                  key={activity.activityId}
                  activity={activity}
                  distanceUnit={distanceUnit}
                  onEdit={onActivityEdit}
                  onDelete={onActivityDelete}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
