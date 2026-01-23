import { CardSkeletonGrid } from "@/components/skeletons/card-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function MyTasksLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-64 mt-2" />
      </div>
      <CardSkeletonGrid count={6} />
    </div>
  )
}
