import { createClient } from "@/lib/supabase/server"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreateSectionDialog } from "@/components/create-section-dialog"
import { CreatePageDialog } from "@/components/create-page-dialog"
import { DocumentationSectionsList } from "@/components/documentation-sections-list"
import { DocumentationPagesList } from "@/components/documentation-pages-list"

export default async function ManageDocumentationPage() {
  const supabase = await createClient()

  const { data: sections } = await supabase
    .from("documentation_sections")
    .select("*")
    .order("order")

  const { data: pages } = await supabase
    .from("documentation_pages")
    .select(`
      *,
      documentation_sections (title)
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Documentation</h1>
        <p className="text-muted-foreground mt-2">
          Create and edit documentation sections and pages
        </p>
      </div>

      <Tabs defaultValue="sections">
        <TabsList>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
        </TabsList>
        <TabsContent value="sections" className="space-y-4">
          <div className="flex justify-end">
            <CreateSectionDialog />
          </div>
          <DocumentationSectionsList sections={sections || []} />
        </TabsContent>
        <TabsContent value="pages" className="space-y-4">
          <div className="flex justify-end">
            <CreatePageDialog sections={sections || []} />
          </div>
          <DocumentationPagesList pages={pages || []} sections={sections || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
