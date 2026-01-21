import { createClient } from "@/lib/supabase/server"
import { CreateSectionDialog } from "@/components/create-section-dialog"
import { DocumentationSectionsList } from "@/components/documentation-sections-list"

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Documentation</h1>
          <p className="text-muted-foreground mt-2">
            Create and edit documentation sections and pages
          </p>
        </div>
        <CreateSectionDialog />
      </div>

      <DocumentationSectionsList sections={sections || []} />
    </div>
  )
}
