import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { CreateTaskDialog } from "@/components/create-task-dialog"
import { getTaskStatusLabel, getTaskStatusVariant } from "@/lib/task-status"

// Revalidar cada 30 segundos
export const revalidate = 30

export default async function TasksPage() {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  // Cargar datos en paralelo
  const [userResult, tasksResult] = await Promise.all([
    supabase.from("users").select("role").eq("id", session?.user.id!).single(),
    supabase.from("tasks").select(`
      *,
      task_assignments (
        user_id,
        users (first_name, last_name)
      )
    `).order("created_at", { ascending: false })
  ])

  const user = userResult.data
  const tasks = tasksResult.data

  const isAdmin = user?.role === "admin"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-down">
        <div>
          <h1 className="text-3xl font-bold">Todas las Tareas</h1>
          <p className="text-muted-foreground mt-2">
            Ver y gestionar todas las tareas del sistema
          </p>
        </div>
        {isAdmin && <CreateTaskDialog />}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks?.map((task, index) => (
          <Link key={task.id} href={`/tasks/${task.id}`}>
            <Card 
              className="h-full hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">
                    {task.title}
                  </CardTitle>
                  <Badge
                    variant={getTaskStatusVariant(task.status)}
                    className="ml-2 shrink-0"
                  >
                    {getTaskStatusLabel(task.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {task.description}
                </p>
                {task.task_assignments && task.task_assignments.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Asignado a:{" "}
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
            <p className="text-muted-foreground">No se encontraron tareas</p>
            {isAdmin && (
              <p className="text-sm text-muted-foreground mt-2">
                Haz clic en el botón de arriba para crear tu primera tarea
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
