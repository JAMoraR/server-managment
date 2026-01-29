"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { addComment, updateComment } from "@/app/actions/task-actions"
import { DeleteCommentDialog } from "@/components/delete-comment-dialog"
import { Pencil, X, Check, Image as ImageIcon, Trash2 } from "lucide-react"
import Image from "next/image"

interface TaskCommentsProps {
  taskId: string
  comments: Array<{
    id: string
    content: string
    created_at: string
    updated_at?: string
    user_id: string
    image_url?: string | null
    users: {
      first_name: string
      last_name: string
    }
  }>
  currentUserId?: string
  isAssigned: boolean
  isAdmin?: boolean
}

export function TaskComments({ taskId, comments, currentUserId, isAssigned, isAdmin = false }: TaskCommentsProps) {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [removeEditImage, setRemoveEditImage] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !imagePreview) return

    setLoading(true)

    const formData = new FormData()
    formData.append("taskId", taskId)
    formData.append("content", content)
    
    if (fileInputRef.current?.files?.[0]) {
      formData.append("image", fileInputRef.current.files[0])
    }

    const result = await addComment(formData)

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
      setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      router.refresh()
    }

    setLoading(false)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string)
        setRemoveEditImage(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeEditImagePreview = () => {
    setEditImagePreview(null)
    setRemoveEditImage(true)
    if (editFileInputRef.current) editFileInputRef.current.value = ""
  }

  const startEdit = (commentId: string, currentContent: string, currentImageUrl?: string | null) => {
    setEditingId(commentId)
    setEditContent(currentContent)
    setEditImagePreview(currentImageUrl || null)
    setRemoveEditImage(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent("")
    setEditImagePreview(null)
    setRemoveEditImage(false)
    if (editFileInputRef.current) editFileInputRef.current.value = ""
  }

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) {
      toast({
        title: "Error",
        description: "El comentario no puede estar vacío",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append("commentId", commentId)
    formData.append("taskId", taskId)
    formData.append("content", editContent)
    formData.append("removeImage", removeEditImage.toString())
    
    if (editFileInputRef.current?.files?.[0]) {
      formData.append("image", editFileInputRef.current.files[0])
    }

    const result = await updateComment(formData)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Éxito",
        description: "Comentario actualizado correctamente",
      })
      setEditingId(null)
      setEditContent("")
      setEditImagePreview(null)
      setRemoveEditImage(false)
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
            comments.map((comment) => {
              const isOwner = currentUserId === comment.user_id
              const isEditing = editingId === comment.id

              return (
                <div key={comment.id} className="border-l-2 border-primary pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {comment.users.first_name} {comment.users.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString('es-MX')}
                      </span>
                      {comment.updated_at && (
                        <span className="text-xs text-muted-foreground italic">
                          (editado)
                        </span>
                      )}
                    </div>
                    {isOwner && !isEditing && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(comment.id, comment.content, comment.image_url)}
                          className="h-7 px-2"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <DeleteCommentDialog 
                          commentId={comment.id} 
                          taskId={taskId}
                          onDeleteStart={() => setLoading(true)}
                        />
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="space-y-2 mt-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        disabled={loading}
                        className="text-sm"
                      />
                      
                      {/* Preview de imagen en edición */}
                      {editImagePreview && !removeEditImage && (
                        <div className="relative inline-block">
                          <Image
                            src={editImagePreview}
                            alt="Preview"
                            width={200}
                            height={200}
                            className="rounded-md object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1"
                            onClick={removeEditImagePreview}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <input
                          ref={editFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleEditImageChange}
                          className="hidden"
                          id={`edit-image-${comment.id}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => editFileInputRef.current?.click()}
                          disabled={loading}
                        >
                          <ImageIcon className="h-3.5 w-3.5 mr-1" />
                          {editImagePreview && !removeEditImage ? "Cambiar imagen" : "Agregar imagen"}
                        </Button>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(comment.id)}
                          disabled={loading || !editContent.trim()}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEdit}
                          disabled={loading}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                      {comment.image_url && (
                        <div className="mt-2">
                          <Image
                            src={comment.image_url}
                            alt="Imagen adjunta"
                            width={300}
                            height={300}
                            className="rounded-md object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(comment.image_url!, '_blank')}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
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
            
            {/* Preview de imagen */}
            {imagePreview && (
              <div className="relative inline-block">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={200}
                  height={200}
                  className="rounded-md object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1"
                  onClick={removeImage}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="comment-image"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Adjuntar imagen
              </Button>
              <Button type="submit" disabled={loading || (!content.trim() && !imagePreview)}>
                {loading ? "Agregando..." : "Agregar Comentario"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
