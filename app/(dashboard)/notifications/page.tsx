import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { CheckCircle2, XCircle, Clock } from "lucide-react"

// Revalidar cada 30 segundos
export const revalidate = 30

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: requests } = await supabase
    .from("assignment_requests")
    .select(`
      *,
      tasks (
        id,
        title,
        description,
        status
      )
    `)
    .eq("user_id", session?.user.id!)
    .order("created_at", { ascending: false })

  const isRecent = (createdAt: string) => {
    const requestDate = new Date(createdAt)
    return requestDate >= sevenDaysAgo
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        )
      case "approved":
        return (
          <Badge className="bg-green-600 hover:bg-green-700 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Aprobada
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rechazada
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "pending":
        return "Tu solicitud está siendo revisada por un administrador."
      case "approved":
        return "¡Tu solicitud fue aprobada! Ahora estás asignado a esta tarea."
      case "rejected":
        return "Tu solicitud fue rechazada por un administrador."
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-down">
        <h1 className="text-3xl font-bold">Mis Notificaciones</h1>
        <p className="text-muted-foreground mt-2">
          Estado de tus solicitudes de asignación a tareas
        </p>
      </div>

      <div className="space-y-4">
        {requests && requests.length > 0 ? (
          requests.map((request: any, index) => {
            const isNew = request.status !== "pending" && isRecent(request.created_at)
            return (
              <Card
                key={request.id}
                className={`hover:shadow-lg hover:scale-[1.01] transition-all animate-fade-in-up ${
                  isNew ? "ring-2 ring-primary" : ""
                }`}
                style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/tasks/${request.tasks.id}`}
                          className="hover:underline"
                        >
                          <CardTitle className="text-lg">{request.tasks.title}</CardTitle>
                        </Link>
                        {isNew && (
                          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-primary text-primary-foreground animate-pulse">
                            Nuevo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Solicitado el {new Date(request.created_at).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(request.status)}
                      <Badge variant="secondary" className="text-xs">
                        {request.tasks.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">{getStatusMessage(request.status)}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {request.tasks.description}
                  </p>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card className="animate-scale-in">
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">No tienes solicitudes de asignación</p>
              <p className="text-sm text-muted-foreground mt-2">
                Cuando solicites ser asignado a una tarea, verás el estado aquí
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
