import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2, XCircle, Clock, MessageSquare, Bell, UserPlus, UserMinus, Check, CheckCheck } from "lucide-react"
import { MarkAsReadButton } from "@/components/mark-as-read-button"
import { MarkAllAsReadButton } from "@/components/mark-all-as-read-button"
import { NotificationsFilter } from "@/components/notifications-filter"

// No cachear esta página para ver notificaciones en tiempo real
export const revalidate = 0
export const dynamic = "force-dynamic"

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: { filter?: string }
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const filter = searchParams.filter || "all" // "all", "unread", "read"

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // Obtener notificaciones generales con filtro
  let notifications = []
  try {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session?.user.id!)

    // Aplicar filtro
    if (filter === "unread") {
      query = query.eq("read", false)
    } else if (filter === "read") {
      query = query.eq("read", true)
    }

    const { data } = await query.order("created_at", { ascending: false })
    notifications = data || []
  } catch (error) {
    console.error("Error fetching notifications:", error)
  }

  // Obtener solicitudes (para compatibilidad con el sistema anterior)
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
    const date = new Date(createdAt)
    return date >= sevenDaysAgo
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "assignment_response":
        return <Bell className="h-4 w-4" />
      case "task_comment":
        return <MessageSquare className="h-4 w-4" />
      case "task_assignment":
        return <UserPlus className="h-4 w-4 text-green-600" />
      case "task_unassignment":
        return <UserMinus className="h-4 w-4 text-orange-600" />
      default:
        return <Bell className="h-4 w-4" />
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mis Notificaciones</h1>
            <p className="text-muted-foreground mt-2">
              Notificaciones y estado de tus solicitudes de asignación
            </p>
          </div>
          {notifications && notifications.some((n: any) => !n.read) && filter !== "read" && (
            <MarkAllAsReadButton />
          )}
        </div>
      </div>

      {/* Filtros */}
      <NotificationsFilter currentFilter={filter} />

      {/* Notificaciones generales */}
      {notifications && notifications.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">
            {filter === "all" && "Notificaciones Recientes"}
            {filter === "unread" && "Notificaciones No Leídas"}
            {filter === "read" && "Notificaciones Leídas"}
          </h2>
          <div className="space-y-3">
            {notifications.map((notification: any, index) => {
              const isNew = !notification.read && isRecent(notification.created_at)
              return (
                <Card
                  key={notification.id}
                  className={`hover:shadow-lg hover:scale-[1.01] transition-all animate-fade-in-up ${
                    isNew ? "ring-2 ring-primary" : ""
                  } ${!notification.read ? "bg-accent/50" : ""}`}
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {notification.link ? (
                              <Link href={notification.link} className={`font-semibold hover:underline ${!notification.read ? "font-bold" : ""}`}>
                                {notification.title}
                              </Link>
                            ) : (
                              <span className={`font-semibold ${!notification.read ? "font-bold" : ""}`}>{notification.title}</span>
                            )}
                            {isNew && (
                              <Badge className="text-xs">Nuevo</Badge>
                            )}
                            {!notification.read && (
                              <Badge variant="secondary" className="text-xs">
                                No leída
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(notification.created_at).toLocaleDateString('es-MX', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {!notification.read && (
                              <MarkAsReadButton notificationId={notification.id} />
                            )}
                          </div>
                        </div>
                        <p className={`text-sm text-muted-foreground ${!notification.read ? "font-medium" : ""}`}>{notification.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ) : (
        <Card className="animate-scale-in">
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              {filter === "unread" && "No tienes notificaciones sin leer"}
              {filter === "read" && "No tienes notificaciones leídas"}
              {filter === "all" && "No tienes notificaciones"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Solicitudes de asignación */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Historial de Solicitudes</h2>
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
                    {request.admin_comment && (
                      <div className="mb-3 p-3 bg-muted rounded-lg">
                        <p className="text-xs font-semibold mb-1">Comentario del administrador:</p>
                        <p className="text-sm">{request.admin_comment}</p>
                      </div>
                    )}
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
    </div>
  )
}
