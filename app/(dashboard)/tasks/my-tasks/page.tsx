import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getTaskStatusLabel, getTaskStatusVariant } from "@/lib/task-status"

// Revalidar cada 30 segundos
export const revalidate = 30

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
      <div className="animate-fade-in-down">
        <h1 className="text-3xl font-bold">Mis Tareas</h1>
        <p className="text-muted-foreground mt-2">
          Tareas asignadas a ti
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {myTasks.map((task: any, index) => (
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
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {task.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {myTasks.length === 0 && (
        <Card className="animate-scale-in">
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No tienes tareas asignadas aún</p>
            <p className="text-sm text-muted-foreground mt-2">
              Revisa las tareas sin asignar para solicitar una asignación
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
