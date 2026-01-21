import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { DocsSidebar } from "@/components/docs-sidebar"

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
          <h1 className="text-3xl font-bold">Documentation</h1>
          <p className="text-muted-foreground mt-2">
            Project documentation and guides
          </p>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              No documentation available yet
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Documentation</h1>
        <p className="text-muted-foreground mt-2">
          Project documentation and guides
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <DocsSidebar sections={sections} />
        </aside>

        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                Welcome to the Documentation
              </h2>
              <p className="text-muted-foreground">
                Select a section from the sidebar to view its contents.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
