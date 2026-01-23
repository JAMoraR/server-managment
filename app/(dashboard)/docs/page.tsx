import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { DocsSidebar } from "@/components/docs-sidebar"

// La documentación cambia poco, cache más largo
export const revalidate = 300

export default async function DocsPage() {
  const supabase = await createClient()

  const { data: sections } = await supabase
    .from("documentation_sections")
    .select(`
      *,
      documentation_pages (*)
    `)
    .order("order")

  if (!sections || sections.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Documentación</h1>
          <p className="text-muted-foreground mt-2">
            Documentación y guías del proyecto
          </p>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              No hay documentación disponible aún
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-down">
        <h1 className="text-3xl font-bold">Documentación</h1>
        <p className="text-muted-foreground mt-2">
          Documentación y guías del proyecto
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <aside className="lg:col-span-1 animate-slide-in-left" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
          <DocsSidebar sections={sections} />
        </aside>

        <div className="lg:col-span-3 animate-slide-in-right" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                Bienvenido a la Documentación
              </h2>
              <p className="text-muted-foreground">
                Selecciona una sección de la barra lateral para ver su contenido.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
