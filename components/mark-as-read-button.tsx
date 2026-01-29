"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { markNotificationAsRead } from "@/app/actions/task-actions"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

interface MarkAsReadButtonProps {
  notificationId: string
}

export function MarkAsReadButton({ notificationId }: MarkAsReadButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleMarkAsRead = async () => {
    setLoading(true)
    const result = await markNotificationAsRead(notificationId)
    
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleMarkAsRead}
      disabled={loading}
      className="h-7 px-2"
    >
      <Check className="h-3.5 w-3.5" />
    </Button>
  )
}
