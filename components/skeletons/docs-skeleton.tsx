import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DocsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-64 mt-2" />
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar Skeleton */}
        <aside className="lg:col-span-1">
          <Card>
            <CardContent className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-8 w-full rounded-lg" />
                  {i % 2 === 0 && (
                    <div className="ml-4 space-y-1">
                      <Skeleton className="h-6 w-full rounded-lg" />
                      <Skeleton className="h-6 w-full rounded-lg" />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>

        {/* Content Skeleton */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="pt-4 space-y-2">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
