import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { DocsSidebar } from "@/components/docs-sidebar"

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
      <div className="animate-fade-in-down">
        <h1 className="text-3xl font-bold">Documentación</h1>
        <p className="text-muted-foreground mt-2">
          Documentación y guías del proyecto
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <aside className="lg:col-span-1 animate-slide-in-left" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
          <DocsSidebar sections={sections || []} currentSectionId={section.id} />
        </aside>

        <div className="lg:col-span-3 animate-slide-in-right" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
              {section.documentation_pages &&
              section.documentation_pages.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-muted-foreground">Páginas en esta sección:</p>
                  <div className="grid gap-3">
                    {section.documentation_pages.map((page: any, index) => (
                      <Link
                        key={page.id}
                        href={`/docs/${section.slug}/${page.id}`}
                        className="block p-4 border rounded-lg hover:bg-accent hover:scale-[1.02] transition-all duration-200 animate-fade-in-up"
                        style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}
                      >
                        <h3 className="font-medium">{page.title}</h3>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No hay páginas en esta sección aún.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
