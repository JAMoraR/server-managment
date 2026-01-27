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

  // Verificar sesión y usuario actual
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Error de Sesión</h1>
        <p className="text-red-500">No hay sesión activa</p>
      </div>
    )
  }

  // Verificar rol del usuario
  const { data: currentUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single()

  if (currentUser?.role !== "admin") {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Acceso Denegado</h1>
        <p className="text-red-500">No tienes permisos de administrador</p>
      </div>
    )
  }

  const { data: requests, error } = await supabase
    .from("assignment_requests")
    .select(`
      *,
      users!assignment_requests_user_id_fkey (first_name, last_name, email),
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

      {error && (
        <Card className="border-red-500">
          <CardContent className="py-6">
            <p className="text-red-500 font-semibold">Error al cargar solicitudes:</p>
            <pre className="text-sm mt-2 text-muted-foreground">{JSON.stringify(error, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

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
