"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface TaskLink {
  id: string
  name: string
  url: string
  link_type: 'plugins' | 'documentacion' | 'tutoriales'
}

interface TaskLinksDisplayProps {
  links: TaskLink[]
}

export function TaskLinksDisplay({ links }: TaskLinksDisplayProps) {
  const { toast } = useToast()

  const handleCopy = async (url: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: "Éxito",
        description: "Enlace copiado al portapapeles",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive",
      })
    }
  }

  const handleOpen = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const groupedLinks = {
    plugins: links.filter(link => link.link_type === 'plugins'),
    documentacion: links.filter(link => link.link_type === 'documentacion'),
    tutoriales: links.filter(link => link.link_type === 'tutoriales'),
  }

  const sectionTitles = {
    plugins: 'Plugins',
    documentacion: 'Documentación',
    tutoriales: 'Tutoriales',
  }

  if (links.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {(Object.keys(groupedLinks) as Array<keyof typeof groupedLinks>).map((category) => {
        const categoryLinks = groupedLinks[category]
        if (categoryLinks.length === 0) return null

        return (
          <div key={category} className="space-y-3">
            <h3 className="text-lg font-semibold">{sectionTitles[category]}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {categoryLinks.map((link) => (
                <Card
                  key={link.id}
                  className="p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                  onClick={() => handleOpen(link.url)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{link.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {link.url}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleCopy(link.url, e)}
                        className="h-8 w-8 p-0"
                        title="Copiar enlace"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpen(link.url)
                        }}
                        className="h-8 w-8 p-0"
                        title="Abrir en nueva pestaña"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
