import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { DocsSidebar } from "@/components/docs-sidebar"
import ReactMarkdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"

export default async function DocsPageDetail({
  params,
}: {
  params: { slug: string; pageId: string }
}) {
  const supabase = await createClient()

  const { data: sections } = await supabase
    .from("documentation_sections")
    .select(`
      *,
      documentation_pages (*)
    `)
    .order("order")

  const { data: page } = await supabase
    .from("documentation_pages")
    .select(`
      *,
      documentation_sections (*)
    `)
    .eq("id", params.pageId)
    .single()

  if (!page) {
    notFound()
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
          <DocsSidebar 
            sections={sections || []} 
            currentSectionId={page.documentation_sections.id}
            currentPageId={page.id}
          />
        </aside>

        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">{page.title}</h2>
              <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:whitespace-pre-line [&_h3]:mt-8 [&_h3]:mb-4 [&_h3]:first:mt-0 [&_p]:my-4 [&_ul]:my-4">
                <ReactMarkdown
                  remarkPlugins={[remarkBreaks, remarkGfm]}
                >
                  {page.content}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
