"use client"

import { useState, useEffect } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Pencil } from "lucide-react"
import { updateTask } from "@/app/actions/task-actions"
import { TaskLinksInput, TaskLinkInput } from "@/components/task-links-input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface EditTaskDialogProps {
  task: {
    id: string
    title: string
    description: string
    task_links?: Array<{
      id: string
      link_type: 'plugins' | 'documentacion' | 'tutoriales'
      name: string
      url: string
    }>
  }
}

export function EditTaskDialog({ task }: EditTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [links, setLinks] = useState<TaskLinkInput[]>([])
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Initialize links when dialog opens
    if (open && task.task_links) {
      setLinks(task.task_links.map(link => ({
        id: link.id,
        link_type: link.link_type,
        name: link.name,
        url: link.url,
      })))
    }
  }, [open, task.task_links])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await updateTask(task.id, { title, description, links })

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Éxito",
        description: "Tarea actualizada correctamente",
      })
      setOpen(false)
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Tarea</DialogTitle>
            <DialogDescription>
              Actualizar detalles de la tarea
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="general" className="py-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="links">Enlaces</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  required
                  disabled={loading}
                />
              </div>
            </TabsContent>
            <TabsContent value="links" className="mt-4">
              <TaskLinksInput
                links={links}
                onChange={setLinks}
                disabled={loading}
              />
            </TabsContent>
          </Tabs>
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
