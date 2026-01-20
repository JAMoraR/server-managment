import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function UserMetricsPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from("users")
    .select(`
      *,
      task_assignments (
        task_id,
        tasks (status)
      )
    `)
    .order("first_name")

  const userMetrics = users?.map((user: any) => {
    const assignments = user.task_assignments || []
    const totalTasks = assignments.length
    const completedTasks = assignments.filter(
      (a: any) => a.tasks.status === "completed"
    ).length
    const inProgressTasks = assignments.filter(
      (a: any) => a.tasks.status === "in_progress"
    ).length
    const pendingTasks = assignments.filter(
      (a: any) => a.tasks.status === "pending"
    ).length

    return {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      role: user.role,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      completionRate:
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Metrics</h1>
        <p className="text-muted-foreground mt-2">
          View performance metrics for all users
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Total Tasks</TableHead>
                <TableHead className="text-center">Completed</TableHead>
                <TableHead className="text-center">In Progress</TableHead>
                <TableHead className="text-center">Pending</TableHead>
                <TableHead className="text-center">Completion Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userMetrics?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell className="text-center">{user.totalTasks}</TableCell>
                  <TableCell className="text-center text-green-600">
                    {user.completedTasks}
                  </TableCell>
                  <TableCell className="text-center text-blue-600">
                    {user.inProgressTasks}
                  </TableCell>
                  <TableCell className="text-center text-gray-600">
                    {user.pendingTasks}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {user.completionRate}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
