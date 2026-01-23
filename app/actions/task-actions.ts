"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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

  revalidatePath("/tasks")
  revalidatePath(`/tasks/${taskId}`)
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateTaskStatus(taskId: string, status: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  // Check if user is assigned to the task
  const { data: assignment } = await supabase
    .from("task_assignments")
    .select("*")
    .eq("task_id", taskId)
    .eq("user_id", session.user.id)
    .single()

  if (!assignment) {
    // Check if user is admin
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (user?.role !== "admin") {
      return { error: "Not authorized to update this task" }
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

export async function addComment(taskId: string, content: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  // Insert comment
  const { data: comment, error } = await supabase
    .from("task_comments")
    .insert({
      task_id: taskId,
      user_id: session.user.id,
      content,
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
