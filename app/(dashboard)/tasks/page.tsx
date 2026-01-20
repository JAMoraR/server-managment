import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { CreateTaskDialog } from "@/components/create-task-dialog"

export default async function TasksPage() {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session?.user.id!)
    .single()

  const { data: tasks } = await supabase
    .from("tasks")
    .select(`
      *,
      task_assignments (
        user_id,
        users (first_name, last_name)
      )
    `)
    .order("created_at", { ascending: false })

  const isAdmin = user?.role === "admin"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Tasks</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all tasks in the system
          </p>
        </div>
        {isAdmin && <CreateTaskDialog />}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks?.map((task) => (
          <Link key={task.id} href={`/tasks/${task.id}`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">
                    {task.title}
                  </CardTitle>
                  <Badge
                    variant={
                      task.status === "completed"
                        ? "default"
                        : task.status === "unassigned"
                        ? "outline"
                        : "secondary"
                    }
                    className="ml-2 shrink-0"
                  >
                    {task.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {task.description}
                </p>
                {task.task_assignments && task.task_assignments.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Assigned to:{" "}
                    {task.task_assignments
                      .map((a: any) => `${a.users.first_name} ${a.users.last_name}`)
                      .join(", ")}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {tasks?.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No tasks found</p>
            {isAdmin && (
              <p className="text-sm text-muted-foreground mt-2">
                Click the button above to create your first task
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
