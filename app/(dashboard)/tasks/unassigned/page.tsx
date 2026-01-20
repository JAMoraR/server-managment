import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function UnassignedTasksPage() {
  const supabase = await createClient()

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("status", "unassigned")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Unassigned Tasks</h1>
        <p className="text-muted-foreground mt-2">
          Tasks available for assignment
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks?.map((task) => (
          <Link key={task.id} href={`/tasks/${task.id}`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
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
                  Request Assignment
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {tasks?.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No unassigned tasks available</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
