import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { handleAssignmentRequest } from "@/app/actions/task-actions"

// Revalidar cada 15 segundos para solicitudes
export const revalidate = 15

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
      <div className="animate-fade-in-down">
        <h1 className="text-3xl font-bold">Solicitudes de Asignación</h1>
        <p className="text-muted-foreground mt-2">
          Gestionar solicitudes de usuarios para ser asignados a tareas
        </p>
      </div>

      <div className="space-y-4">
        {requests && requests.length > 0 ? (
          requests.map((request: any, index) => (
            <Card 
              key={request.id}
              className="hover:shadow-lg hover:scale-[1.01] transition-all animate-fade-in-up"
              style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{request.tasks.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Solicitado por {request.users.first_name} {request.users.last_name} (
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
                      Aprobar
                    </Button>
                  </form>
                  <form action={rejectRequest.bind(null, request.id)}>
                    <Button type="submit" size="sm" variant="outline">
                      Rechazar
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="animate-scale-in">
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">No hay solicitudes pendientes</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
