"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import { EditSectionDialog } from "@/components/edit-section-dialog"
import { DeleteSectionButton } from "@/components/delete-section-button"

interface DocumentationSectionsListProps {
  sections: Array<{
    id: string
    title: string
    slug: string
    order: number
  }>
}

export function DocumentationSectionsList({
  sections,
}: DocumentationSectionsListProps) {
  if (sections.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">No sections created yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {sections.map((section) => (
        <Card key={section.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <h3 className="font-medium">{section.title}</h3>
              <p className="text-sm text-muted-foreground">
                Slug: {section.slug} • Order: {section.order}
              </p>
            </div>
            <div className="flex gap-2">
              <EditSectionDialog section={section} />
              <DeleteSectionButton sectionId={section.id} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
