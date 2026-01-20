import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import ReactMarkdown from "react-markdown"

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
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-1">
                {sections.map((section: any) => (
                  <div key={section.id} className="space-y-1">
                    <Link
                      href={`/docs/${section.slug}`}
                      className="block px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent"
                    >
                      {section.title}
                    </Link>
                    {section.documentation_pages &&
                      section.documentation_pages.length > 0 && (
                        <div className="ml-4 space-y-1">
                          {section.documentation_pages.map((page: any) => (
                            <Link
                              key={page.id}
                              href={`/docs/${section.slug}/${page.id}`}
                              className="block px-3 py-1.5 text-sm text-muted-foreground rounded-lg hover:bg-accent hover:text-foreground"
                            >
                              {page.title}
                            </Link>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </nav>
            </CardContent>
          </Card>
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
