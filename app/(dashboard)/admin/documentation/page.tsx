import { createClient } from "@/lib/supabase/server"
import { CreateSectionDialog } from "@/components/create-section-dialog"
import { DocumentationSectionsList } from "@/components/documentation-sections-list"

// La documentación cambia poco, cache largo
export const revalidate = 120

export default async function ManageDocumentationPage() {
  const supabase = await createClient()

  const { data: sections } = await supabase
    .from("documentation_sections")
    .select(`
      *,
      documentation_pages (*)
    `)
    .order("order")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-down">
        <div>
          <h1 className="text-3xl font-bold">Gestionar Documentación</h1>
          <p className="text-muted-foreground mt-2">
            Crear y editar secciones y páginas de documentación
          </p>
        </div>
        <CreateSectionDialog />
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
        <DocumentationSectionsList sections={sections || []} />
      </div>
    </div>
  )
}
