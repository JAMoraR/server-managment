"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { requestAssignment } from "@/app/actions/task-actions"

interface RequestAssignmentButtonProps {
  taskId: string
  hasPendingRequest: boolean
}

export function RequestAssignmentButton({
  taskId,
  hasPendingRequest,
}: RequestAssignmentButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleRequest = async () => {
    setLoading(true)

    const result = await requestAssignment(taskId)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Assignment request sent successfully",
      })
      router.refresh()
    }

    setLoading(false)
  }

  if (hasPendingRequest) {
    return (
      <Button variant="outline" disabled className="w-full">
        Request Pending
      </Button>
    )
  }

  return (
    <Button onClick={handleRequest} disabled={loading} className="w-full">
      {loading ? "Requesting..." : "Request Assignment"}
    </Button>
  )
}
