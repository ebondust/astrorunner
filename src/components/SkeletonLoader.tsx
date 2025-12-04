import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface SkeletonLoaderProps {
  count?: number;
}

/**
 * Loading skeleton placeholder for activity cards
 */
export function SkeletonLoader({ count = 3 }: SkeletonLoaderProps) {
  return (
    <div data-testid="skeleton-loader" className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-2">
          {/* Date header skeleton */}
          {index === 0 && <Skeleton className="h-8 w-48" />}

          {/* Activity card skeleton */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Badge and time */}
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>

                  {/* Duration and distance */}
                  <div className="flex gap-4">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-9" />
                  <Skeleton className="h-9 w-9" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
