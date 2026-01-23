import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLayoutLoading() {
  return (
    <div className="space-y-6 p-8">
      <Skeleton className="h-10 w-96" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  )
}
