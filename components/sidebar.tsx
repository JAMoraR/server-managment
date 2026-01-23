"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Home, 
  CheckSquare, 
  Users, 
  FileText, 
  Settings,
  LogOut,
  Menu,
  X,
  ClipboardList,
  UserCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

interface SidebarProps {
  user: {
    email: string
    first_name: string
    last_name: string
    role: string
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const isAdmin = user.role === "admin"

  const navigation = [
    { name: "Panel de Control", href: "/dashboard", icon: Home },
    { name: "Todas las Tareas", href: "/tasks", icon: CheckSquare },
    { name: "Mis Tareas", href: "/tasks/my-tasks", icon: ClipboardList },
    { name: "Tareas Sin Asignar", href: "/tasks/unassigned", icon: UserCheck },
    { name: "Documentación", href: "/docs", icon: FileText },
  ]

  const adminNavigation = [
    { name: "Solicitudes de Asignación", href: "/admin/requests", icon: Users },
    { name: "Métricas de Usuarios", href: "/admin/metrics", icon: Settings },
    { name: "Gestionar Documentación", href: "/admin/documentation", icon: FileText },
  ]

  const NavLink = ({ item }: { item: typeof navigation[0] }) => {
    const isActive = pathname === item.href
    return (
      <Link
        href={item.href}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
          isActive
            ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-[1.02]"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <item.icon className={`h-5 w-5 transition-transform ${isActive ? '' : 'group-hover:scale-110'}`} />
        <span className="font-medium">{item.name}</span>
      </Link>
    )
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r shadow-lg transition-transform lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col gap-2">
          {/* Header */}
          <div className="flex h-16 items-center border-b px-6 bg-gradient-to-r from-primary/10 to-transparent">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Gestor de Tareas
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-1">
              {navigation.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
            </div>

            {isAdmin && (
              <>
                <div className="my-4 border-t" />
                <div className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase">
                  Administración
                </div>
                <div className="space-y-1">
                  {adminNavigation.map((item) => (
                    <NavLink key={item.name} item={item} />
                  ))}
                </div>
              </>
            )}
          </nav>

          {/* User menu */}
          <div className="border-t p-4 space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-medium">Tema</span>
              <ThemeToggle />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user.first_name[0]}{user.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-sm">
                    <span className="font-medium">
                      {user.first_name} {user.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {user.role}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
    </>
  )
}
