"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

async function uploadCommentImage(file: File, userId: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  
  // Validar tipo de archivo
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { error: "Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)." }
  }
  
  // Validar tamaño (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: "El archivo es muy grande. El tamaño máximo es 5MB." }
  }
  
  // Crear nombre único para el archivo
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  
  // Subir archivo
  const { data, error } = await supabase.storage
    .from('comment-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) {
    return { error: error.message }
  }
  
  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('comment-images')
    .getPublicUrl(fileName)
  
  return { url: publicUrl }
}

export async function createTask(formData: FormData) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const linksJson = formData.get("links") as string

  // Create the task first
  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      title,
      description,
      created_by: session.user.id,
      status: "unassigned",
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // If there are links, insert them
  if (linksJson && task) {
    try {
      const links = JSON.parse(linksJson)
      if (links.length > 0) {
        const linksToInsert = links.map((link: any) => ({
          task_id: task.id,
          link_type: link.link_type,
          name: link.name,
          url: link.url,
        }))

        const { error: linksError } = await supabase
          .from("task_links")
          .insert(linksToInsert)

        if (linksError) {
          console.error("Error inserting links:", linksError)
        }
      }
    } catch (e) {
      console.error("Error parsing links:", e)
    }
  }

  revalidatePath("/tasks")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateTask(taskId: string, updates: any) {
  const supabase = await createClient()

  // Extract links from updates if present
  const { links, ...taskUpdates } = updates

  // Update task
  const { error } = await supabase
    .from("tasks")
    .update(taskUpdates)
    .eq("id", taskId)

  if (error) {
    return { error: error.message }
  }

  // If links are provided, update them
  if (links !== undefined) {
    // Delete existing links
    await supabase
      .from("task_links")
      .delete()
      .eq("task_id", taskId)

    // Insert new links
    if (links.length > 0) {
      const linksToInsert = links
        .filter((link: any) => link.name && link.url) // Only insert valid links
        .map((link: any) => ({
          task_id: taskId,
          link_type: link.link_type,
          name: link.name,
          url: link.url,
        }))

      if (linksToInsert.length > 0) {
        const { error: linksError } = await supabase
          .from("task_links")
          .insert(linksToInsert)

        if (linksError) {
          console.error("Error updating links:", linksError)
        }
      }
    }
  }

  revalidatePath("/tasks")
  revalidatePath(`/tasks/${taskId}`)
  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/tasks")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function assignUsersToTask(taskId: string, userIds: string[]) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  // Get existing assignments to compare
  const { data: existingAssignments } = await supabase
    .from("task_assignments")
    .select("user_id")
    .eq("task_id", taskId)

  const existingUserIds = existingAssignments?.map(a => a.user_id) || []
  const newUserIds = userIds.filter(id => !existingUserIds.includes(id))
  const removedUserIds = existingUserIds.filter(id => !userIds.includes(id))

  // Get task info and admin info for notifications
  const [taskResult, adminResult] = await Promise.all([
    supabase.from("tasks").select("title").eq("id", taskId).single(),
    supabase.from("users").select("first_name, last_name").eq("id", session.user.id).single()
  ])

  const task = taskResult.data
  const admin = adminResult.data

  // Delete existing assignments
  await supabase
    .from("task_assignments")
    .delete()
    .eq("task_id", taskId)

  // Insert new assignments
  if (userIds.length > 0) {
    const { error } = await supabase
      .from("task_assignments")
      .insert(userIds.map(userId => ({ task_id: taskId, user_id: userId })))

    if (error) {
      return { error: error.message }
    }
  }

  // If task had users but now has none, change status to 'paused'
  if (existingUserIds.length > 0 && userIds.length === 0) {
    await supabase
      .from("tasks")
      .update({ status: "paused" })
      .eq("id", taskId)
  }

  // Create notifications
  const notifications = []

  // Notify newly assigned users
  if (newUserIds.length > 0 && task && admin) {
    const addedNotifications = newUserIds
      .map(userId => ({
        user_id: userId,
        type: "task_assignment",
        title: `Nueva tarea asignada: ${task.title}`,
        message: `${admin.first_name} ${admin.last_name} te ha asignado una nueva tarea.`,
        link: `/tasks/${taskId}`
      }))
    notifications.push(...addedNotifications)
  }

  // Notify removed users
  if (removedUserIds.length > 0 && task && admin) {
    const removedNotifications = removedUserIds
      .map(userId => ({
        user_id: userId,
        type: "task_unassignment",
        title: `Removido de tarea: ${task.title}`,
        message: `${admin.first_name} ${admin.last_name} te ha removido de esta tarea.`,
        link: `/tasks/${taskId}`
      }))
    notifications.push(...removedNotifications)
  }

  // Insert all notifications
  if (notifications.length > 0) {
    await supabase.from("notifications").insert(notifications)
  }

  revalidatePath("/tasks")
  revalidatePath(`/tasks/${taskId}`)
  revalidatePath("/dashboard")
  revalidatePath("/notifications")
  return { success: true }
}

export async function updateTaskStatus(taskId: string, status: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  // Check if user is assigned to the task
  const { data: assignments } = await supabase
    .from("task_assignments")
    .select("*")
    .eq("task_id", taskId)
    .eq("user_id", session.user.id)

  const isAssigned = assignments && assignments.length > 0

  if (!isAssigned) {
    // Check if user is admin
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (user?.role !== "admin") {
      return { error: "No tienes autorización para actualizar esta tarea. Solo los usuarios asignados y administradores pueden cambiar el estado." }
    }
  }

  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/tasks")
  revalidatePath(`/tasks/${taskId}`)
  revalidatePath("/dashboard")
  return { success: true }
}

export async function pauseTask(taskId: string, reason: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  // Check if user is assigned to the task or is admin
  const { data: assignments } = await supabase
    .from("task_assignments")
    .select("*")
    .eq("task_id", taskId)
    .eq("user_id", session.user.id)

  const isAssigned = assignments && assignments.length > 0

  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single()

  if (!isAssigned && user?.role !== "admin") {
    return { error: "No tienes autorización para pausar esta tarea" }
  }

  const { error } = await supabase
    .from("tasks")
    .update({ 
      status: "paused",
      paused_reason: reason,
      paused_by: session.user.id,
      paused_at: new Date().toISOString()
    })
    .eq("id", taskId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/tasks")
  revalidatePath(`/tasks/${taskId}`)
  revalidatePath("/dashboard")
  return { success: true }
}

export async function resumeTask(taskId: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  // Check if user is assigned to the task or is admin
  const { data: assignments } = await supabase
    .from("task_assignments")
    .select("*")
    .eq("task_id", taskId)
    .eq("user_id", session.user.id)

  const isAssigned = assignments && assignments.length > 0

  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single()

  if (!isAssigned && user?.role !== "admin") {
    return { error: "No tienes autorización para reanudar esta tarea" }
  }

  const { error } = await supabase
    .from("tasks")
    .update({ 
      status: "pending",
      paused_reason: null,
      paused_by: null,
      paused_at: null
    })
    .eq("id", taskId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/tasks")
  revalidatePath(`/tasks/${taskId}`)
  revalidatePath("/dashboard")
  return { success: true }
}

export async function addComment(formData: FormData) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  const taskId = formData.get("taskId") as string
  const content = formData.get("content") as string
  const image = formData.get("image") as File | null

  let imageUrl: string | null = null

  // Si hay una imagen, subirla primero
  if (image && image.size > 0) {
    const uploadResult = await uploadCommentImage(image, session.user.id)
    if (uploadResult.error) {
      return { error: uploadResult.error }
    }
    imageUrl = uploadResult.url || null
  }

  // Insert comment
  const { data: comment, error } = await supabase
    .from("task_comments")
    .insert({
      task_id: taskId,
      user_id: session.user.id,
      content,
      image_url: imageUrl,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Get user info and task info
  const [userResult, taskResult, assignedUsersResult] = await Promise.all([
    supabase.from("users").select("role, first_name, last_name").eq("id", session.user.id).single(),
    supabase.from("tasks").select("title").eq("id", taskId).single(),
    supabase.from("task_assignments").select("user_id").eq("task_id", taskId)
  ])

  const user = userResult.data
  const task = taskResult.data
  const assignedUsers = assignedUsersResult.data || []

  // If admin commented, notify all assigned users (except the admin)
  if (user?.role === "admin" && assignedUsers.length > 0) {
    const notificationsToCreate = assignedUsers
      .filter((assignment: any) => assignment.user_id !== session.user.id)
      .map((assignment: any) => ({
        user_id: assignment.user_id,
        type: "task_comment",
        title: `Nuevo comentario en: ${task?.title || "Tarea"}`,
        message: `${user.first_name} ${user.last_name} comentó: "${content.substring(0, 100)}${content.length > 100 ? "..." : ""}"`,
        link: `/tasks/${taskId}`,
        task_comment_id: comment.id
      }))

    if (notificationsToCreate.length > 0) {
      await supabase.from("notifications").insert(notificationsToCreate)
    }
  }

  revalidatePath(`/tasks/${taskId}`)
  revalidatePath("/notifications")
  return { success: true }
}

export async function updateComment(formData: FormData) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  const commentId = formData.get("commentId") as string
  const taskId = formData.get("taskId") as string
  const content = formData.get("content") as string
  const image = formData.get("image") as File | null
  const removeImage = formData.get("removeImage") === "true"

  // Verify the user owns this comment
  const { data: comment } = await supabase
    .from("task_comments")
    .select("user_id, image_url")
    .eq("id", commentId)
    .single()

  if (!comment || comment.user_id !== session.user.id) {
    return { error: "Not authorized to update this comment" }
  }

  let imageUrl: string | null | undefined = undefined

  // Si se está eliminando la imagen
  if (removeImage && comment.image_url) {
    // Extraer el path del archivo de la URL
    const urlParts = comment.image_url.split('/comment-images/')
    if (urlParts.length > 1) {
      const filePath = urlParts[1]
      await supabase.storage.from('comment-images').remove([filePath])
    }
    imageUrl = null
  }
  // Si hay una nueva imagen, subirla
  else if (image && image.size > 0) {
    // Eliminar imagen anterior si existe
    if (comment.image_url) {
      const urlParts = comment.image_url.split('/comment-images/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        await supabase.storage.from('comment-images').remove([filePath])
      }
    }
    
    const uploadResult = await uploadCommentImage(image, session.user.id)
    if (uploadResult.error) {
      return { error: uploadResult.error }
    }
    imageUrl = uploadResult.url || null
  }

  // Update comment
  const updateData: any = {
    content,
    updated_at: new Date().toISOString(),
  }
  
  if (imageUrl !== undefined) {
    updateData.image_url = imageUrl
  }

  const { error } = await supabase
    .from("task_comments")
    .update(updateData)
    .eq("id", commentId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/tasks/${taskId}`)
  return { success: true }
}

export async function deleteComment(commentId: string, taskId: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  // Verify the user owns this comment and get image_url
  const { data: comment } = await supabase
    .from("task_comments")
    .select("user_id, image_url")
    .eq("id", commentId)
    .single()

  if (!comment || comment.user_id !== session.user.id) {
    return { error: "Not authorized to delete this comment" }
  }

  // If comment has an image, delete it from storage first
  if (comment.image_url) {
    const urlParts = comment.image_url.split('/comment-images/')
    if (urlParts.length > 1) {
      const filePath = urlParts[1]
      await supabase.storage.from('comment-images').remove([filePath])
    }
  }

  // Delete comment
  const { error } = await supabase
    .from("task_comments")
    .delete()
    .eq("id", commentId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/tasks/${taskId}`)
  return { success: true }
}

export async function requestAssignment(taskId: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  // Check if request already exists
  const { data: existing } = await supabase
    .from("assignment_requests")
    .select("*")
    .eq("task_id", taskId)
    .eq("user_id", session.user.id)
    .eq("status", "pending")
    .single()

  if (existing) {
    return { error: "You already have a pending request for this task" }
  }

  const { error } = await supabase
    .from("assignment_requests")
    .insert({
      task_id: taskId,
      user_id: session.user.id,
      status: "pending",
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/tasks/${taskId}`)
  revalidatePath("/admin/requests")
  return { success: true }
}

export async function handleAssignmentRequest(
  requestId: string, 
  action: "approved" | "rejected", 
  adminComment?: string
) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }
  
  // Update request status with admin info
  const { error: updateError, data: request } = await supabase
    .from("assignment_requests")
    .update({ 
      status: action,
      admin_comment: adminComment,
      reviewed_at: new Date().toISOString(),
      reviewed_by: session.user.id
    })
    .eq("id", requestId)
    .select("task_id, user_id")
    .single()

  if (updateError) {
    return { error: updateError.message }
  }

  // Get task info for notification
  const { data: task } = await supabase
    .from("tasks")
    .select("title")
    .eq("id", request.task_id)
    .single()

  // If approved, create assignment
  if (action === "approved") {
    const { error: assignError } = await supabase
      .from("task_assignments")
      .insert({
        task_id: request.task_id,
        user_id: request.user_id,
      })

    if (assignError) {
      return { error: assignError.message }
    }
  }

  // Create notification for user
  const notificationMessage = adminComment 
    ? `Tu solicitud ha sido ${action === "approved" ? "aprobada" : "rechazada"}. Comentario del administrador: "${adminComment}"`
    : `Tu solicitud ha sido ${action === "approved" ? "aprobada" : "rechazada"}.`

  await supabase
    .from("notifications")
    .insert({
      user_id: request.user_id,
      type: "assignment_response",
      title: `Solicitud ${action === "approved" ? "Aprobada" : "Rechazada"}: ${task?.title || "Tarea"}`,
      message: notificationMessage,
      link: `/tasks/${request.task_id}`,
      assignment_request_id: requestId
    })

  revalidatePath("/admin/requests")
  revalidatePath("/tasks")
  revalidatePath("/dashboard")
  revalidatePath("/notifications")
  return { success: true }
}

export async function getUserAssignmentRequests() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  const { data: requests, error } = await supabase
    .from("assignment_requests")
    .select(`
      *,
      tasks (
        id,
        title,
        description,
        status
      )
    `)
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { requests }
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", session.user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/notifications")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function markAllNotificationsAsRead() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", session.user.id)
    .eq("read", false)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/notifications")
  revalidatePath("/dashboard")
  return { success: true }
}
