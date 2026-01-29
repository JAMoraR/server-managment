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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { pauseTask, resumeTask } from "@/app/actions/task-actions"
import { Pause, Play } from "lucide-react"

interface PauseTaskButtonProps {
  taskId: string
  isPaused: boolean
  pausedReason?: string
  pausedBy?: { first_name: string; last_name: string }
  pausedAt?: string
}

export function PauseTaskButton({ 
  taskId, 
  isPaused, 
  pausedReason, 
  pausedBy,
  pausedAt 
}: PauseTaskButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  const handlePause = async () => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Por favor proporciona un motivo para pausar la tarea",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    const result = await pauseTask(taskId, reason)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Éxito",
        description: "Tarea pausada correctamente",
      })
      setOpen(false)
      setReason("")
      router.refresh()
    }

    setLoading(false)
  }

  const handleResume = async () => {
    setLoading(true)

    const result = await resumeTask(taskId)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Éxito",
        description: "Tarea reanudada correctamente",
      })
      router.refresh()
    }

    setLoading(false)
  }

  if (isPaused) {
    return (
      <div className="space-y-3">
        {pausedReason && (
          <div className="p-3 bg-orange-100 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-600 rounded-lg">
            <p className="text-sm font-semibold text-orange-900 dark:text-orange-400 mb-1">
              Tarea en pausa
            </p>
            <p className="text-sm text-orange-800 dark:text-orange-300">
              {pausedReason}
            </p>
            {pausedBy && pausedAt && (
              <p className="text-xs text-orange-700 dark:text-orange-400 mt-2">
                Pausada por {pausedBy.first_name} {pausedBy.last_name} el{" "}
                {new Date(pausedAt).toLocaleString('es-MX')}
              </p>
            )}
          </div>
        )}
        <Button
          onClick={handleResume}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          <Play className="h-4 w-4 mr-2" />
          {loading ? "Reanudando..." : "Reanudar Tarea"}
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Pause className="h-4 w-4 mr-2" />
          Pausar Tarea
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pausar Tarea</DialogTitle>
          <DialogDescription>
            Proporciona un motivo para pausar esta tarea. Esto será visible para todos los miembros del equipo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo de la pausa</Label>
            <Textarea
              id="reason"
              placeholder="Ej: Esperando respuesta del cliente, falta información, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handlePause}
            disabled={loading || !reason.trim()}
          >
            {loading ? "Pausando..." : "Pausar Tarea"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
