import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"

// Revalidar cada 30 segundos para actualizar badges
export const revalidate = 30

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

  // Para usuarios regulares: contar notificaciones no leídas en los últimos 7 días
  if (user.role !== "admin") {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", session.user.id)
      .eq("read", false)
      .gte("created_at", sevenDaysAgo.toISOString())

    const { count: requestsCount } = await supabase
      .from("assignment_requests")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", session.user.id)
      .in("status", ["approved", "rejected"])
      .gte("created_at", sevenDaysAgo.toISOString())

    notificationsCount = (unreadCount || 0) + (requestsCount || 0)
  }

  // Para administradores: contar solicitudes pendientes
  if (user.role === "admin") {
    const { count } = await supabase
      .from("assignment_requests")
      .select("*", { count: 'exact', head: true })
      .eq("status", "pending")

    pendingRequestsCount = count || 0
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
