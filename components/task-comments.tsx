"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { addComment } from "@/app/actions/task-actions"

interface TaskCommentsProps {
  taskId: string
  comments: Array<{
    id: string
    content: string
    created_at: string
    users: {
      first_name: string
      last_name: string
    }
  }>
  isAssigned: boolean
  isAdmin?: boolean
}

export function TaskComments({ taskId, comments, isAssigned, isAdmin = false }: TaskCommentsProps) {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)

    const result = await addComment(taskId, content)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Éxito",
        description: "Comentario agregado correctamente",
      })
      setContent("")
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actualizaciones de Progreso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay comentarios aún</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border-l-2 border-primary pl-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {comment.users.first_name} {comment.users.last_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleString('es-MX')}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))
          )}
        </div>

        {(isAssigned || isAdmin) && (
          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
              placeholder={
                isAdmin && !isAssigned
                  ? "Agregar feedback como administrador..."
                  : "Agregar una actualización de progreso..."
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !content.trim()}>
              {loading ? "Agregando..." : "Agregar Comentario"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
