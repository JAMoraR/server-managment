"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"

export interface TaskLinkInput {
  id: string
  link_type: 'plugins' | 'documentacion' | 'tutoriales'
  name: string
  url: string
}

interface TaskLinksInputProps {
  links: TaskLinkInput[]
  onChange: (links: TaskLinkInput[]) => void
  disabled?: boolean
}

export function TaskLinksInput({ links, onChange, disabled }: TaskLinksInputProps) {
  const addLink = () => {
    const newLink: TaskLinkInput = {
      id: `temp-${Date.now()}`,
      link_type: 'plugins',
      name: '',
      url: '',
    }
    onChange([...links, newLink])
  }

  const updateLink = (index: number, field: keyof TaskLinkInput, value: string) => {
    const newLinks = [...links]
    newLinks[index] = { ...newLinks[index], [field]: value }
    onChange(newLinks)
  }

  const removeLink = (index: number) => {
    const newLinks = links.filter((_, i) => i !== index)
    onChange(newLinks)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Enlaces de Recursos</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addLink}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Enlace
        </Button>
      </div>

      {links.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay enlaces agregados. Haz clic en "Agregar Enlace" para comenzar.
        </p>
      )}

      <div className="space-y-3">
        {links.map((link, index) => (
          <div
            key={link.id}
            className="p-4 border rounded-lg space-y-3 bg-muted/20"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`link-type-${index}`}>Tipo</Label>
                    <Select
                      value={link.link_type}
                      onValueChange={(value) =>
                        updateLink(index, 'link_type', value)
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger id={`link-type-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plugins">Plugins</SelectItem>
                        <SelectItem value="documentacion">Documentación</SelectItem>
                        <SelectItem value="tutoriales">Tutoriales</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`link-name-${index}`}>Nombre</Label>
                    <Input
                      id={`link-name-${index}`}
                      value={link.name}
                      onChange={(e) => updateLink(index, 'name', e.target.value)}
                      placeholder="Ej: Plugin de autenticación"
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`link-url-${index}`}>URL</Label>
                  <Input
                    id={`link-url-${index}`}
                    value={link.url}
                    onChange={(e) => updateLink(index, 'url', e.target.value)}
                    placeholder="https://ejemplo.com"
                    type="url"
                    disabled={disabled}
                  />
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeLink(index)}
                disabled={disabled}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
