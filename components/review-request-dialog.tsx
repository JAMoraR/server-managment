"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Check, X } from "lucide-react"

interface ReviewRequestDialogProps {
  requestId: string
  action: "approved" | "rejected"
  onSubmit: (requestId: string, action: "approved" | "rejected", comment?: string) => Promise<void>
  userName: string
  taskTitle: string
}

export function ReviewRequestDialog({
  requestId,
  action,
  onSubmit,
  userName,
  taskTitle,
}: ReviewRequestDialogProps) {
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    await onSubmit(requestId, action, comment.trim() || undefined)
    setLoading(false)
    setOpen(false)
    setComment("")
  }

  const isApprove = action === "approved"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant={isApprove ? "default" : "outline"}>
          {isApprove ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Aprobar
            </>
          ) : (
            <>
              <X className="h-4 w-4 mr-1" />
              Rechazar
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isApprove ? "Aprobar Solicitud" : "Rechazar Solicitud"}
          </DialogTitle>
          <DialogDescription>
            {isApprove
              ? `¿Aprobar la solicitud de ${userName} para "${taskTitle}"?`
              : `¿Rechazar la solicitud de ${userName} para "${taskTitle}"?`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="comment">
              Comentario (opcional)
            </Label>
            <Textarea
              id="comment"
              placeholder={
                isApprove
                  ? "Ej: ¡Bienvenido al equipo! Revisa la documentación antes de empezar."
                  : "Ej: Por el momento esta tarea requiere experiencia previa..."
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            variant={isApprove ? "default" : "destructive"}
          >
            {loading ? "Procesando..." : isApprove ? "Aprobar" : "Rechazar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
