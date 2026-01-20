"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { updateTaskStatus } from "@/app/actions/task-actions"

interface TaskStatusSelectorProps {
  taskId: string
  currentStatus: string
}

export function TaskStatusSelector({ taskId, currentStatus }: TaskStatusSelectorProps) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    setStatus(newStatus)

    const result = await updateTaskStatus(taskId, newStatus)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      setStatus(currentStatus) // Revert on error
    } else {
      toast({
        title: "Success",
        description: "Status updated successfully",
      })
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <Select value={status} onValueChange={handleStatusChange} disabled={loading}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="in_progress">In Progress</SelectItem>
        <SelectItem value="completed">Completed</SelectItem>
      </SelectContent>
    </Select>
  )
}
