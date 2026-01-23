"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, FileText, Plus, GripVertical } from "lucide-react"
import { EditSectionDialog } from "@/components/edit-section-dialog"
import { DeleteSectionButton } from "@/components/delete-section-button"
import { CreatePageDialog } from "@/components/create-page-dialog"
import { EditPageDialog } from "@/components/edit-page-dialog"
import { DeletePageButton } from "@/components/delete-page-button"
import { Badge } from "@/components/ui/badge"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { reorderSections, reorderPages } from "@/app/actions/documentation-actions"
import { useToast } from "@/components/ui/use-toast"

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
      order?: number
    }>
  }>
}

function SortableSection({
  section,
  isExpanded,
  onToggle,
  allSections,
}: {
  section: DocumentationSectionsListProps["sections"][0]
  isExpanded: boolean
  onToggle: () => void
  allSections: DocumentationSectionsListProps["sections"]
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const pages = section.documentation_pages || []
  const sortedPages = [...pages].sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <Card ref={setNodeRef} style={style} className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing touch-none"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onToggle}
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
              <SortablePages 
                pages={sortedPages} 
                allSections={allSections}
              />
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function SortablePage({
  page,
  allSections,
}: {
  page: NonNullable<DocumentationSectionsListProps["sections"][0]["documentation_pages"]>[0]
  allSections: DocumentationSectionsListProps["sections"]
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card ref={setNodeRef} style={style} className="border-l-4 border-l-primary/30">
      <CardContent className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm">{page.title}</h4>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
              {page.content.substring(0, 100)}...
            </p>
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <EditPageDialog page={page} sections={allSections} />
          <DeletePageButton pageId={page.id} />
        </div>
      </CardContent>
    </Card>
  )
}

function SortablePages({
  pages,
  allSections,
}: {
  pages: NonNullable<DocumentationSectionsListProps["sections"][0]["documentation_pages"]>
  allSections: DocumentationSectionsListProps["sections"]
}) {
  const [items, setItems] = useState(pages)
  const { toast } = useToast()

  // Sync local state with props when they change
  useEffect(() => {
    setItems(pages)
  }, [pages])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)

      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)

      // Update orders in database
      const updates = newItems.map((item, index) => ({
        id: item.id,
        order: index,
      }))

      const result = await reorderPages(updates)
      if (result.error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar el orden",
          variant: "destructive",
        })
        setItems(items) // Revert on error
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((page) => (
            <SortablePage key={page.id} page={page} allSections={allSections} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export function DocumentationSectionsList({
  sections,
}: DocumentationSectionsListProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [items, setItems] = useState(sections)
  const { toast } = useToast()

  // Sync local state with props when they change
  useEffect(() => {
    setItems(sections)
  }, [sections])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)

      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)

      // Update orders in database
      const updates = newItems.map((item, index) => ({
        id: item.id,
        order: index,
      }))

      const result = await reorderSections(updates)
      if (result.error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar el orden",
          variant: "destructive",
        })
        setItems(items) // Revert on error
      }
    }
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((section) => (
            <SortableSection
              key={section.id}
              section={section}
              isExpanded={expandedSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
              allSections={sections}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
