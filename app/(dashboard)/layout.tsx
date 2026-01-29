import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"

// Revalidar más frecuentemente para ver notificaciones en tiempo real
export const revalidate = 0
export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect("/auth/login")
  }

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single()

  if (!user) {
    redirect("/auth/login")
  }

  // Obtener conteos de notificaciones
  let notificationsCount = 0
  let pendingRequestsCount = 0

  // Para usuarios regulares: contar notificaciones no leídas
  if (user.role !== "admin") {
    try {
      const { count: unreadCount } = await supabase
        .from("notifications")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", session.user.id)
        .eq("read", false)

      notificationsCount = unreadCount || 0
    } catch (error) {
      console.error("Error fetching notifications count:", error)
      notificationsCount = 0
    }
  }

  // Para administradores: contar solicitudes pendientes
  if (user.role === "admin") {
    try {
      const { count } = await supabase
        .from("assignment_requests")
        .select("*", { count: 'exact', head: true })
        .eq("status", "pending")

      pendingRequestsCount = count || 0
    } catch (error) {
      console.error("Error fetching pending requests count:", error)
      pendingRequestsCount = 0
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        user={user} 
        notificationsCount={notificationsCount}
        pendingRequestsCount={pendingRequestsCount}
      />
      <main className="flex-1 overflow-y-auto lg:ml-64">
        <div className="container mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
