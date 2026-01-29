"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { deleteComment } from "@/app/actions/task-actions"
import { Trash2 } from "lucide-react"

interface DeleteCommentDialogProps {
  commentId: string
  taskId: string
  onDeleteStart?: () => void
}

export function DeleteCommentDialog({ commentId, taskId, onDeleteStart }: DeleteCommentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    onDeleteStart?.()

    const result = await deleteComment(commentId, taskId)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      setLoading(false)
    } else {
      toast({
        title: "Éxito",
        description: "Comentario eliminado correctamente",
      })
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar comentario?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El comentario se eliminará permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
