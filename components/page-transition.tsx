"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function PageTransition() {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [pathname])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-fade-in pointer-events-none">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <div className="h-3 w-3 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <div className="h-3 w-3 rounded-full bg-primary animate-bounce" />
        </div>
      </div>
    </div>
  )
}
