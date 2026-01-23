"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { UserPlus } from "lucide-react"
import { assignUsersToTask } from "@/app/actions/task-actions"

interface AssignTaskDialogProps {
  task: {
    id: string
    task_assignments?: Array<{ user_id: string }>
  }
  allUsers: Array<{
    id: string
    first_name: string
    last_name: string
    email: string
  }>
}

export function AssignTaskDialog({ task, allUsers }: AssignTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>(
    task.task_assignments?.map(a => a.user_id) || []
  )
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await assignUsersToTask(task.id, selectedUsers)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Éxito",
        description: "Asignaciones de tarea actualizadas correctamente",
      })
      setOpen(false)
      router.refresh()
    }

    setLoading(false)
  }

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Asignar Usuarios</DialogTitle>
            <DialogDescription>
              Selecciona usuarios para asignar a esta tarea
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Usuarios</Label>
            <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
              {allUsers.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer hover:bg-accent"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                    className="h-4 w-4"
                    disabled={loading}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
