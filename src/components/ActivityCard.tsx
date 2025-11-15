import type { ActivityDto, DistanceUnit } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Clock, MapPin } from "lucide-react";
import { formatDuration, formatDistance } from "@/lib/utils/date";

interface ActivityCardProps {
  activity: ActivityDto;
  distanceUnit: DistanceUnit;
  onEdit: (activity: ActivityDto) => void;
  onDelete: (activityId: string) => void;
}

// Activity type badge color variants
const ACTIVITY_TYPE_COLORS = {
  Run: "bg-blue-500 text-white hover:bg-blue-600",
  Walk: "bg-green-500 text-white hover:bg-green-600",
  Mixed: "bg-orange-500 text-white hover:bg-orange-600",
} as const;

/**
 * Activity card component displaying individual activity entry
 */
export function ActivityCard({
  activity,
  distanceUnit,
  onEdit,
  onDelete,
}: ActivityCardProps) {
  const handleEdit = () => {
    onEdit(activity);
  };

  const handleDelete = () => {
    onDelete(activity.activityId);
  };

  // Format date and time (24-hour format)
  const activityDate = new Date(activity.activityDate);
  const timeString = activityDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-1.5">
        <div className="flex items-start justify-between gap-4">
          {/* Activity Info */}
          <div className="flex-1 space-y-2">
            {/* Badge and Time */}
            <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-md">
              <Badge
                className={ACTIVITY_TYPE_COLORS[activity.activityType]}
                variant="default"
              >
                {activity.activityType}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {timeString}
              </span>
            </div>

            {/* Duration and Distance */}
            <div className="flex flex-wrap gap-4 text-sm px-3 py-1">
              {/* Duration */}
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {formatDuration(activity.duration)}
                </span>
              </div>

              {/* Distance */}
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {activity.distanceMeters
                    ? formatDistance(activity.distanceMeters, distanceUnit)
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              aria-label="Edit activity"
              className="h-9 w-9"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              aria-label="Delete activity"
              className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
