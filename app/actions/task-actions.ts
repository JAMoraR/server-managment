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

  const { error } = await supabase
    .from("tasks")
    .insert({
      title,
      description,
      created_by: session.user.id,
      status: "unassigned",
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/tasks")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateTask(taskId: string, updates: any) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)

  if (error) {
    return { error: error.message }
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

  const { error } = await supabase
    .from("task_comments")
    .insert({
      task_id: taskId,
      user_id: session.user.id,
      content,
    })

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

export async function handleAssignmentRequest(requestId: string, action: "approved" | "rejected") {
  const supabase = await createClient()
  
  // Update request status
  const { error: updateError, data: request } = await supabase
    .from("assignment_requests")
    .update({ status: action })
    .eq("id", requestId)
    .select("task_id, user_id")
    .single()

  if (updateError) {
    return { error: updateError.message }
  }

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

  revalidatePath("/admin/requests")
  revalidatePath("/tasks")
  revalidatePath("/dashboard")
  return { success: true }
}
