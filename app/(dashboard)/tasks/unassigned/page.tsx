import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Revalidar cada 20 segundos para tareas sin asignar
export const revalidate = 20

export default async function UnassignedTasksPage() {
  const supabase = await createClient()

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("status", "unassigned")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-down">
        <h1 className="text-3xl font-bold">Tareas Sin Asignar</h1>
        <p className="text-muted-foreground mt-2">
          Tareas disponibles para asignación
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks?.map((task, index) => (
          <Link key={task.id} href={`/tasks/${task.id}`}>
            <Card 
              className="h-full hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
            >
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">
                  {task.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {task.description}
                </p>
                <Button size="sm" className="w-full">
                  Solicitar Asignación
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {tasks?.length === 0 && (
        <Card className="animate-scale-in">
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No hay tareas sin asignar disponibles</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
