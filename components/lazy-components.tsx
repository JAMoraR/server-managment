"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

// Lazy load comments component (heavy with real-time features)
export const TaskCommentsLazy = dynamic(
  () => import("@/components/task-comments").then(mod => ({ default: mod.TaskComments })),
  {
    loading: () => (
      <Card className="animate-scale-in">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ),
    ssr: false
  }
)

// Lazy load documentation sections list (complex drag and drop)
export const DocumentationSectionsListLazy = dynamic(
  () => import("@/components/documentation-sections-list").then(mod => ({ default: mod.DocumentationSectionsList })),
  {
    loading: () => (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'backwards' }}>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    ),
    ssr: false
  }
)

// Lazy load task links display
export const TaskLinksDisplayLazy = dynamic(
  () => import("@/components/task-links-display").then(mod => ({ default: mod.TaskLinksDisplay })),
  {
    loading: () => (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    ),
    ssr: false
  }
)
