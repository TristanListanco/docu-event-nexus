
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function EventDetailsSkeleton() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="border-b border-border p-4 animate-slide-in-right">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-4 animate-fade-in-up">
        <Card className="animate-scale-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status and type badges */}
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>

            {/* Date and time */}
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>

            {/* Location */}
            <Skeleton className="h-4 w-48" />

            {/* Organizer */}
            <Skeleton className="h-4 w-40" />

            {/* Separator */}
            <div className="my-4 border-t" />

            {/* Staff section */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              
              {/* Videographers */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-2 bg-muted/50 rounded-md animate-fade-in-up stagger-animation" style={{ '--stagger': i } as React.CSSProperties}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Photographers */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-2 bg-muted/50 rounded-md animate-fade-in-up stagger-animation" style={{ '--stagger': i + 2 } as React.CSSProperties}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
