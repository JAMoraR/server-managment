import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function DiagnosticPage() {
  const supabase = await createClient()

  // 1. Verificar sesión
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  // 2. Obtener información del usuario actual
  let currentUser = null
  let userError = null
  if (session) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single()
    currentUser = data
    userError = error
  }

  // 3. Intentar obtener solicitudes
  let requests = null
  let requestsError = null
  if (session) {
    const { data, error } = await supabase
      .from("assignment_requests")
      .select(`
        *,
        users (first_name, last_name, email, role),
        tasks (id, title, description, status)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
    
    requests = data
    requestsError = error
  }

  // 4. Contar todas las solicitudes (bypass RLS con query directo)
  let totalRequests = null
  if (session) {
    const { count } = await supabase
      .from("assignment_requests")
      .select("*", { count: 'exact', head: true })
      .eq("status", "pending")
    
    totalRequests = count
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Diagnóstico de Solicitudes</h1>
        <p className="text-muted-foreground mt-2">
          Información de depuración para resolver problemas de visualización
        </p>
      </div>

      {/* Sesión */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            1. Estado de Sesión
            {session ? (
              <Badge variant="default" className="bg-green-500">Activa</Badge>
            ) : (
              <Badge variant="destructive">No activa</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessionError && (
            <div className="text-red-500 mb-4">
              <strong>Error:</strong>
              <pre className="text-xs mt-2">{JSON.stringify(sessionError, null, 2)}</pre>
            </div>
          )}
          {session ? (
            <div className="space-y-2">
              <p><strong>User ID:</strong> {session.user.id}</p>
              <p><strong>Email:</strong> {session.user.email}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">No hay sesión activa</p>
          )}
        </CardContent>
      </Card>

      {/* Usuario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            2. Información del Usuario
            {currentUser?.role === 'admin' ? (
              <Badge variant="default" className="bg-purple-500">Admin</Badge>
            ) : currentUser?.role === 'user' ? (
              <Badge variant="secondary">Usuario</Badge>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userError && (
            <div className="text-red-500 mb-4">
              <strong>Error:</strong>
              <pre className="text-xs mt-2">{JSON.stringify(userError, null, 2)}</pre>
            </div>
          )}
          {currentUser ? (
            <div className="space-y-2">
              <p><strong>Nombre:</strong> {currentUser.first_name} {currentUser.last_name}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
              <p><strong>Rol:</strong> <Badge>{currentUser.role}</Badge></p>
              <p><strong>ID:</strong> {currentUser.id}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">No se pudo obtener información del usuario</p>
          )}
        </CardContent>
      </Card>

      {/* Solicitudes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            3. Solicitudes de Asignación
            {totalRequests !== null && (
              <Badge variant="outline">{totalRequests} pendientes en BD</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requestsError && (
            <div className="text-red-500 mb-4">
              <strong>Error al obtener solicitudes:</strong>
              <pre className="text-xs mt-2 bg-red-50 p-3 rounded">{JSON.stringify(requestsError, null, 2)}</pre>
            </div>
          )}
          {requests ? (
            <div className="space-y-2">
              <p><strong>Solicitudes visibles:</strong> {requests.length}</p>
              {requests.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {requests.map((req: any) => (
                    <div key={req.id} className="border p-3 rounded">
                      <p className="font-semibold">{req.tasks?.title || 'Sin título'}</p>
                      <p className="text-sm text-muted-foreground">
                        Usuario: {req.users?.first_name} {req.users?.last_name} ({req.users?.role})
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No hay solicitudes visibles (pero pueden existir {totalRequests} en la BD)</p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No se pudieron obtener solicitudes</p>
          )}
        </CardContent>
      </Card>

      {/* Diagnóstico y soluciones */}
      <Card>
        <CardHeader>
          <CardTitle>4. Diagnóstico y Soluciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!session && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <strong className="text-red-700">❌ No hay sesión activa</strong>
              <p className="text-sm mt-2">Necesitas iniciar sesión para ver solicitudes.</p>
            </div>
          )}

          {session && currentUser?.role !== 'admin' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <strong className="text-yellow-700">⚠️ No eres administrador</strong>
              <p className="text-sm mt-2">Tu rol actual es: <Badge>{currentUser?.role}</Badge></p>
              <p className="text-sm mt-2">Para convertirte en administrador, ejecuta este SQL en Supabase:</p>
              <pre className="text-xs mt-2 bg-white p-3 rounded border">
                {`UPDATE public.users SET role = 'admin' WHERE id = '${session?.user.id}';`}
              </pre>
            </div>
          )}

          {session && currentUser?.role === 'admin' && requestsError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <strong className="text-red-700">❌ Error de políticas RLS</strong>
              <p className="text-sm mt-2">Las políticas de Row Level Security pueden no estar configuradas correctamente.</p>
              <p className="text-sm mt-2">Ejecuta el archivo <code className="bg-white px-2 py-1 rounded">fix_assignment_requests_rls.sql</code> en el SQL Editor de Supabase.</p>
            </div>
          )}

          {session && currentUser?.role === 'admin' && !requestsError && requests?.length === 0 && totalRequests === 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <strong className="text-green-700">✅ Todo funciona correctamente</strong>
              <p className="text-sm mt-2">No hay solicitudes pendientes en este momento.</p>
            </div>
          )}

          {session && currentUser?.role === 'admin' && !requestsError && requests?.length === 0 && totalRequests && totalRequests > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <strong className="text-red-700">❌ Problema de políticas RLS</strong>
              <p className="text-sm mt-2">Hay {totalRequests} solicitudes en la base de datos, pero no puedes verlas.</p>
              <p className="text-sm mt-2">Ejecuta el archivo <code className="bg-white px-2 py-1 rounded">fix_assignment_requests_rls.sql</code> en el SQL Editor de Supabase.</p>
            </div>
          )}

          {session && currentUser?.role === 'admin' && requests && requests.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <strong className="text-green-700">✅ Todo funciona correctamente</strong>
              <p className="text-sm mt-2">Puedes ver {requests.length} solicitudes pendientes.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
