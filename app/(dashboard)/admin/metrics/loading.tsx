import { TableSkeleton } from "@/components/skeletons/table-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function MetricsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>
      <TableSkeleton rows={8} columns={7} />
    </div>
  )
}
