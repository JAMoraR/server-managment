import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"

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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto lg:ml-64">
        <div className="container mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
