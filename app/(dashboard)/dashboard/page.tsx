import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckSquare, Clock, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user.id

  // Get user info
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId!)
    .single()

  // Get task statistics
  const { data: allTasks } = await supabase
    .from("tasks")
    .select("*")

  const { data: myAssignments } = await supabase
    .from("task_assignments")
    .select("task_id, tasks(*)")
    .eq("user_id", userId!)

  const myTasks = myAssignments?.map(a => a.tasks) || []
  
  const pendingTasks = myTasks.filter((t: any) => t.status === "pending" || t.status === "in_progress")
  const completedTasks = myTasks.filter((t: any) => t.status === "completed")
  const unassignedTasks = allTasks?.filter(t => t.status === "unassigned") || []

  const stats = [
    {
      title: "My Active Tasks",
      value: pendingTasks.length,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      href: "/tasks/my-tasks",
    },
    {
      title: "Completed Tasks",
      value: completedTasks.length,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      href: "/tasks/my-tasks",
    },
    {
      title: "Unassigned Tasks",
      value: unassignedTasks.length,
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      href: "/tasks/unassigned",
    },
    {
      title: "Total Tasks",
      value: allTasks?.length || 0,
      icon: CheckSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      href: "/tasks",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user?.first_name}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {myTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No tasks assigned yet. Check unassigned tasks to get started!
              </p>
            ) : (
              <div className="space-y-3">
                {myTasks.slice(0, 5).map((task: any) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="block p-3 rounded-lg border hover:bg-accent transition-colors"
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

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/tasks">
              <Button className="w-full" variant="outline">
                View All Tasks
              </Button>
            </Link>
            <Link href="/tasks/unassigned">
              <Button className="w-full" variant="outline">
                Browse Unassigned Tasks
              </Button>
            </Link>
            <Link href="/docs">
              <Button className="w-full" variant="outline">
                View Documentation
              </Button>
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin/requests">
                <Button className="w-full" variant="default">
                  Manage Assignment Requests
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
