// Función auxiliar para traducir estados de tareas
export function getTaskStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    unassigned: "Sin Asignar",
    pending: "Pendiente",
    in_progress: "En Curso",
    completed: "Completada",
    paused: "En Pausa",
  }
  return statusLabels[status] || status
}

// Función auxiliar para obtener la variante de badge según el estado
export function getTaskStatusVariant(status: string): "unassigned" | "pending" | "in_progress" | "completed" | "paused" | "default" {
  const variants: Record<string, "unassigned" | "pending" | "in_progress" | "completed" | "paused"> = {
    unassigned: "unassigned",
    pending: "pending",
    in_progress: "in_progress",
    completed: "completed",
    paused: "paused",
  }
  return variants[status] || "default"
}
