"use client"

import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface LazyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

export function LazyWrapper({ children, fallback, className }: LazyWrapperProps) {
  return (
    <Suspense
      fallback={
        fallback || (
          <div className={className}>
            <Skeleton className="h-full w-full min-h-[200px]" />
          </div>
        )
      }
    >
      {children}
    </Suspense>
  )
}
