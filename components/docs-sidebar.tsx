"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight } from "lucide-react"

interface DocsSidebarProps {
  sections: Array<{
    id: string
    slug: string
    title: string
    documentation_pages?: Array<{
      id: string
      title: string
      order?: number
    }>
  }>
  currentSectionId?: string
  currentPageId?: string
}

export function DocsSidebar({ sections, currentSectionId, currentPageId }: DocsSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(currentSectionId ? [currentSectionId] : [])
  )

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <nav className="space-y-1">
          {sections.map((section) => {
            const isExpanded = expandedSections.has(section.id)
            const sortedPages = section.documentation_pages
              ? [...section.documentation_pages].sort((a, b) => (a.order || 0) - (b.order || 0))
              : []
            const isCurrentSection = section.id === currentSectionId

            return (
              <div key={section.id} className="space-y-1">
                <div className="flex items-center gap-1">
                  {sortedPages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => toggleSection(section.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Link
                    href={`/docs/${section.slug}`}
                    className={`flex-1 block px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent hover:scale-[1.02] transition-all duration-200 ${
                      isCurrentSection ? "bg-accent" : ""
                    } ${sortedPages.length === 0 ? "ml-8" : ""}`}
                  >
                    {section.title}
                  </Link>
                </div>
                {isExpanded && sortedPages.length > 0 && (
                  <div className="ml-8 space-y-1">
                    {sortedPages.map((page) => (
                      <Link
                        key={page.id}
                        href={`/docs/${section.slug}/${page.id}`}
                        className={`block px-3 py-1.5 text-sm rounded-lg hover:bg-accent ${
                          page.id === currentPageId
                            ? "bg-accent text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {page.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </CardContent>
    </Card>
  )
}
