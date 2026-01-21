"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, FileText, Plus } from "lucide-react"
import { EditSectionDialog } from "@/components/edit-section-dialog"
import { DeleteSectionButton } from "@/components/delete-section-button"
import { CreatePageDialog } from "@/components/create-page-dialog"
import { EditPageDialog } from "@/components/edit-page-dialog"
import { DeletePageButton } from "@/components/delete-page-button"
import { Badge } from "@/components/ui/badge"

interface DocumentationSectionsListProps {
  sections: Array<{
    id: string
    title: string
    slug: string
    order: number
    documentation_pages?: Array<{
      id: string
      title: string
      content: string
      section_id: string
    }>
  }>
}

export function DocumentationSectionsList({
  sections,
}: DocumentationSectionsListProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

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
    <div className="space-y-3">
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id)
        const pages = section.documentation_pages || []
        
        return (
          <Card key={section.id}>
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => toggleSection(section.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{section.title}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {pages.length} {pages.length === 1 ? 'página' : 'páginas'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Slug: {section.slug} • Order: {section.order}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <EditSectionDialog section={section} />
                  <DeleteSectionButton sectionId={section.id} />
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0 pb-4 px-4">
                <div className="ml-10 space-y-2">
                  <div className="flex justify-end mb-3">
                    <CreatePageDialog 
                      sections={[section]} 
                      defaultSectionId={section.id}
                    />
                  </div>
                  
                  {pages.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No hay páginas en esta sección
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Haz clic en "Nueva Página" para crear una
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pages.map((page) => (
                        <Card key={page.id} className="border-l-4 border-l-primary/30">
                          <CardContent className="flex items-center justify-between p-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{page.title}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                {page.content.substring(0, 100)}...
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <EditPageDialog page={page} sections={sections} />
                              <DeletePageButton pageId={page.id} />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
