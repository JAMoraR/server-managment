import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function MyTasksPage() {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()

  const { data: assignments } = await supabase
    .from("task_assignments")
    .select(`
      *,
      tasks (
        *,
        task_assignments (
          user_id,
          users (first_name, last_name)
        )
      )
    `)
    .eq("user_id", session?.user.id!)

  const myTasks = assignments?.map(a => a.tasks) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Tasks</h1>
        <p className="text-muted-foreground mt-2">
          Tasks assigned to you
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {myTasks.map((task: any) => (
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
                        : task.status === "in_progress"
                        ? "secondary"
                        : "outline"
                    }
                    className="ml-2 shrink-0"
                  >
                    {task.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {task.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {myTasks.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No tasks assigned to you yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Check unassigned tasks to request assignment
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
