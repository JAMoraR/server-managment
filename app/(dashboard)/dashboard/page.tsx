import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckSquare, Clock, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// Revalidar cada 60 segundos para mejor rendimiento
export const revalidate = 60

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user.id

  // Cargar datos en paralelo para mejor rendimiento
  const [userResult, allTasksResult, myAssignmentsResult] = await Promise.all([
    supabase.from("users").select("*").eq("id", userId!).single(),
    supabase.from("tasks").select("*"),
    supabase.from("task_assignments").select("task_id, tasks(*)").eq("user_id", userId!)
  ])

  const user = userResult.data
  const allTasks = allTasksResult.data
  const myAssignments = myAssignmentsResult.data

  const myTasks = myAssignments?.map(a => a.tasks) || []
  
  const pendingTasks = myTasks.filter((t: any) => t.status === "pending" || t.status === "in_progress")
  const completedTasks = myTasks.filter((t: any) => t.status === "completed")
  const unassignedTasks = allTasks?.filter(t => t.status === "unassigned") || []
  
  // Total completed tasks (all users)
  const totalCompletedTasks = allTasks?.filter(t => t.status === "completed").length || 0
  const totalTasks = allTasks?.length || 0
  const completionPercentage = totalTasks > 0 ? Math.round((totalCompletedTasks / totalTasks) * 100) : 0

  const stats = [
    {
      title: "Mis Tareas Activas",
      value: pendingTasks.length,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      href: "/tasks/my-tasks",
    },
    {
      title: "Mis Tareas Completadas",
      value: completedTasks.length,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      href: "/tasks/my-tasks",
    },
    {
      title: "Tareas Sin Asignar",
      value: unassignedTasks.length,
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      href: "/tasks/unassigned",
    },
    {
      title: "Total de Tareas",
      value: allTasks?.length || 0,
      icon: CheckSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      href: "/tasks",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="animate-fade-in-down">
        <h1 className="text-3xl font-bold">Panel de Control</h1>
        <p className="text-muted-foreground mt-2">
          ¡Bienvenido de nuevo, {user?.first_name}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Link key={stat.title} href={stat.href}>
            <Card 
              className="hover:shadow-2xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer animate-fade-in-up group"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  <stat.icon className={`h-4 w-4 ${stat.color} group-hover:scale-110 transition-transform`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold group-hover:text-primary transition-colors">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Overall Progress Section */}
      <Card className="animate-scale-in hover:shadow-xl transition-all duration-300 group" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
        <CardHeader>
          <CardTitle className="group-hover:text-primary transition-colors">Progreso General</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total de tareas completadas por todos los miembros del equipo
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1 hover:scale-105 transition-transform duration-200">
              <p className="text-sm font-medium text-muted-foreground">
                Tareas Completadas
              </p>
              <p className="text-3xl font-bold">
                {totalCompletedTasks} <span className="text-lg text-muted-foreground">/ {totalTasks}</span>
              </p>
            </div>
            <div className="text-right hover:scale-110 transition-transform duration-200">
              <p className="text-4xl font-bold text-green-600 hover:animate-wiggle">{completionPercentage}%</p>
              <p className="text-sm text-muted-foreground">Completado</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-4 overflow-hidden hover:h-5 transition-all duration-300 cursor-pointer group/progress">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end px-2 group-hover/progress:animate-shake"
                style={{ width: `${completionPercentage}%` }}
              >
                {completionPercentage > 10 && (
                  <span className="text-xs font-semibold text-white">
                    {completionPercentage}%
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{totalTasks - totalCompletedTasks} pendientes</span>
              <span>{totalCompletedTasks} completadas</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="animate-slide-in-left hover:shadow-xl transition-all duration-300" style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}>
          <CardHeader>
            <CardTitle className="hover:text-primary transition-colors">Tareas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {myTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No tienes tareas asignadas aún. ¡Revisa las tareas sin asignar para comenzar!
              </p>
            ) : (
              <div className="space-y-3">
                {myTasks.slice(0, 5).map((task: any) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="block p-3 rounded-lg border hover:bg-accent hover:scale-[1.02] transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{task.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {task.description}
                        </p>
                      </div>
                      <span
                        className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : task.status === "in_progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-slide-in-right hover:shadow-xl transition-all duration-300" style={{ animationDelay: '600ms', animationFillMode: 'backwards' }}>
          <CardHeader>
            <CardTitle className="hover:text-primary transition-colors">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/tasks">
              <Button className="w-full hover:scale-105 hover:shadow-lg transition-all duration-300" variant="outline">
                Ver Todas las Tareas
              </Button>
            </Link>
            <Link href="/tasks/unassigned">
              <Button className="w-full hover:scale-105 hover:shadow-lg transition-all duration-300" variant="outline">
                Explorar Tareas Sin Asignar
              </Button>
            </Link>
            <Link href="/docs">
              <Button className="w-full hover:scale-105 hover:shadow-lg transition-all duration-300" variant="outline">
                Ver Documentación
              </Button>
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin/requests">
                <Button className="w-full hover:scale-105 hover:shadow-xl hover:brightness-110 transition-all duration-300" variant="default">
                  Gestionar Solicitudes de Asignación
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
