import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ReviewRequestDialog } from "@/components/review-request-dialog"
import { handleAssignmentRequest } from "@/app/actions/task-actions"
import Link from "next/link"

// Revalidar cada 15 segundos para solicitudes
export const revalidate = 15

export default async function AssignmentRequestsPage() {
  const supabase = await createClient()

  const { data: requests } = await supabase
    .from("assignment_requests")
    .select(`
      *,
      users (first_name, last_name, email),
      tasks (id, title, description, status)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  async function handleReview(requestId: string, action: "approved" | "rejected", comment?: string) {
    "use server"
    await handleAssignmentRequest(requestId, action, comment)
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
                    <Link 
                      href={`/tasks/${request.tasks.id}`}
                      className="hover:underline"
                    >
                      <CardTitle className="text-lg">{request.tasks.title}</CardTitle>
                    </Link>
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
                  <ReviewRequestDialog
                    requestId={request.id}
                    action="approved"
                    onSubmit={handleReview}
                    userName={`${request.users.first_name} ${request.users.last_name}`}
                    taskTitle={request.tasks.title}
                  />
                  <ReviewRequestDialog
                    requestId={request.id}
                    action="rejected"
                    onSubmit={handleReview}
                    userName={`${request.users.first_name} ${request.users.last_name}`}
                    taskTitle={request.tasks.title}
                  />
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
