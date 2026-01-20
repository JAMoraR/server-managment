import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TaskStatusSelector } from "@/components/task-status-selector"
import { TaskComments } from "@/components/task-comments"
import { AssignTaskDialog } from "@/components/assign-task-dialog"
import { RequestAssignmentButton } from "@/components/request-assignment-button"
import { EditTaskDialog } from "@/components/edit-task-dialog"
import { DeleteTaskButton } from "@/components/delete-task-button"

export default async function TaskDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", session?.user.id!)
    .single()

  const { data: task } = await supabase
    .from("tasks")
    .select(`
      *,
      task_assignments (
        user_id,
        users (id, first_name, last_name, email)
      )
    `)
    .eq("id", params.id)
    .single()

  if (!task) {
    notFound()
  }

  const { data: comments } = await supabase
    .from("task_comments")
    .select(`
      *,
      users (first_name, last_name)
    `)
    .eq("task_id", params.id)
    .order("created_at", { ascending: true })

  const { data: allUsers } = await supabase
    .from("users")
    .select("id, first_name, last_name, email")
    .order("first_name")

  const isAdmin = user?.role === "admin"
  const isAssigned = task.task_assignments?.some((a: any) => a.user_id === session?.user.id)

  // Check if user has pending request
  const { data: pendingRequest } = await supabase
    .from("assignment_requests")
    .select("*")
    .eq("task_id", params.id)
    .eq("user_id", session?.user.id!)
    .eq("status", "pending")
    .single()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{task.title}</h1>
            <Badge
              variant={
                task.status === "completed"
                  ? "default"
                  : task.status === "unassigned"
                  ? "outline"
                  : "secondary"
              }
            >
              {task.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Created {new Date(task.created_at).toLocaleDateString()}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <EditTaskDialog task={task} />
            <DeleteTaskButton taskId={task.id} />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{task.description}</p>
            </CardContent>
          </Card>

          {(isAssigned || isAdmin) && (
            <TaskComments
              taskId={task.id}
              comments={comments || []}
              isAssigned={isAssigned}
            />
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              {isAssigned || isAdmin ? (
                <TaskStatusSelector taskId={task.id} currentStatus={task.status} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  You must be assigned to update status
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Assigned Users</CardTitle>
                {isAdmin && <AssignTaskDialog task={task} allUsers={allUsers || []} />}
              </div>
            </CardHeader>
            <CardContent>
              {task.task_assignments && task.task_assignments.length > 0 ? (
                <ul className="space-y-2">
                  {task.task_assignments.map((assignment: any) => (
                    <li
                      key={assignment.user_id}
                      className="text-sm flex items-center gap-2"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                        {assignment.users.first_name[0]}
                        {assignment.users.last_name[0]}
                      </div>
                      <div>
                        <div className="font-medium">
                          {assignment.users.first_name} {assignment.users.last_name}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {assignment.users.email}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">No users assigned</p>
                  {!isAdmin && (
                    <RequestAssignmentButton
                      taskId={task.id}
                      hasPendingRequest={!!pendingRequest}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
