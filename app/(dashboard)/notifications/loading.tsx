import { CardSkeleton } from "@/components/skeletons"

export default function NotificationsLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-in-down">
        <div className="h-9 w-64 bg-muted rounded animate-pulse" />
        <div className="h-5 w-96 bg-muted rounded mt-2 animate-pulse" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
