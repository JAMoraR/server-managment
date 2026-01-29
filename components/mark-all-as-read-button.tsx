"use client"

import { Button } from "@/components/ui/button"
import { CheckCheck } from "lucide-react"
import { markAllNotificationsAsRead } from "@/app/actions/task-actions"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export function MarkAllAsReadButton() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleMarkAllAsRead = async () => {
    setLoading(true)
    const result = await markAllNotificationsAsRead()
    
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Éxito",
        description: "Todas las notificaciones marcadas como leídas",
      })
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMarkAllAsRead}
      disabled={loading}
    >
      <CheckCheck className="h-4 w-4 mr-2" />
      Marcar todas como leídas
    </Button>
  )
}
