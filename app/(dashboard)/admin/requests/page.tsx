import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { handleAssignmentRequest } from "@/app/actions/task-actions"

export default async function AssignmentRequestsPage() {
  const supabase = await createClient()

  const { data: requests } = await supabase
    .from("assignment_requests")
    .select(`
      *,
      users (first_name, last_name, email),
      tasks (title, description, status)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  async function approveRequest(requestId: string) {
    "use server"
    await handleAssignmentRequest(requestId, "approved")
  }

  async function rejectRequest(requestId: string) {
    "use server"
    await handleAssignmentRequest(requestId, "rejected")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assignment Requests</h1>
        <p className="text-muted-foreground mt-2">
          Manage user requests to be assigned to tasks
        </p>
      </div>

      <div className="space-y-4">
        {requests && requests.length > 0 ? (
          requests.map((request: any) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{request.tasks.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Requested by {request.users.first_name} {request.users.last_name} (
                      {request.users.email})
                    </p>
                  </div>
                  <Badge variant="outline">
                    {request.tasks.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {request.tasks.description}
                </p>
                <div className="flex gap-2">
                  <form action={approveRequest.bind(null, request.id)}>
                    <Button type="submit" size="sm">
                      Approve
                    </Button>
                  </form>
                  <form action={rejectRequest.bind(null, request.id)}>
                    <Button type="submit" size="sm" variant="outline">
                      Reject
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">No pending requests</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
