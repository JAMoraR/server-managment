import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"

export default async function DocsSectionPage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = await createClient()

  const { data: sections } = await supabase
    .from("documentation_sections")
    .select(`
      *,
      documentation_pages (*)
    `)
    .order("order")

  const { data: section } = await supabase
    .from("documentation_sections")
    .select(`
      *,
      documentation_pages (*)
    `)
    .eq("slug", params.slug)
    .single()

  if (!section) {
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
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-1">
                {sections?.map((s: any) => {
                  const sortedPages = s.documentation_pages
                    ? [...s.documentation_pages].sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                    : [];
                  
                  return (
                  <div key={s.id} className="space-y-1">
                    <Link
                      href={`/docs/${s.slug}`}
                      className={`block px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent ${
                        s.id === section.id ? "bg-accent" : ""
                      }`}
                    >
                      {s.title}
                    </Link>
                    {sortedPages.length > 0 && (
                      <div className="ml-4 space-y-1">
                        {sortedPages.map((page: any) => (
                          <Link
                            key={page.id}
                            href={`/docs/${s.slug}/${page.id}`}
                            className="block px-3 py-1.5 text-sm text-muted-foreground rounded-lg hover:bg-accent hover:text-foreground"
                          >
                            {page.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </aside>

        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
              {section.documentation_pages &&
              section.documentation_pages.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-muted-foreground">Pages in this section:</p>
                  <div className="grid gap-3">
                    {section.documentation_pages.map((page: any) => (
                      <Link
                        key={page.id}
                        href={`/docs/${section.slug}/${page.id}`}
                        className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <h3 className="font-medium">{page.title}</h3>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No pages in this section yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
