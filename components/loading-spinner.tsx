"use client"

import { Skeleton } from "@/components/ui/skeleton"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  text?: string
  fullScreen?: boolean
}

export function LoadingSpinner({ 
  size = "md", 
  text, 
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full border-4 border-muted animate-spin border-t-primary`} />
      </div>
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
        {content}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-8">
      {content}
    </div>
  )
}

export function LoadingDots() {
  return (
    <div className="flex gap-1">
      <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
      <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
      <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
    </div>
  )
}

export function LoadingBar() {
  return (
    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
      <div className="h-full bg-primary animate-shimmer bg-gradient-to-r from-transparent via-primary to-transparent [background-size:200%_100%]" />
    </div>
  )
}
