"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EditPageDialog } from "@/components/edit-page-dialog"
import { DeletePageButton } from "@/components/delete-page-button"

interface DocumentationPagesListProps {
  pages: Array<{
    id: string
    title: string
    content: string
    section_id: string
    documentation_sections: {
      title: string
    }
  }>
  sections: Array<{
    id: string
    title: string
  }>
}

export function DocumentationPagesList({
  pages,
  sections,
}: DocumentationPagesListProps) {
  if (pages.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">No pages created yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {pages.map((page) => (
        <Card key={page.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium">{page.title}</h3>
                <Badge variant="outline">
                  {page.documentation_sections.title}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {page.content.substring(0, 100)}...
              </p>
            </div>
            <div className="flex gap-2">
              <EditPageDialog page={page} sections={sections} />
              <DeletePageButton pageId={page.id} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
