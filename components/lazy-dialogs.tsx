"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

// Lazy load dialogs
export const CreateTaskDialogLazy = dynamic(
  () => import("@/components/create-task-dialog").then(mod => ({ default: mod.CreateTaskDialog })),
  {
    loading: () => <Skeleton className="h-10 w-32" />,
    ssr: false
  }
)

export const EditTaskDialogLazy = dynamic(
  () => import("@/components/edit-task-dialog").then(mod => ({ default: mod.EditTaskDialog })),
  {
    loading: () => <Skeleton className="h-10 w-32" />,
    ssr: false
  }
)

export const AssignTaskDialogLazy = dynamic(
  () => import("@/components/assign-task-dialog").then(mod => ({ default: mod.AssignTaskDialog })),
  {
    loading: () => <Skeleton className="h-10 w-32" />,
    ssr: false
  }
)

export const CreateSectionDialogLazy = dynamic(
  () => import("@/components/create-section-dialog").then(mod => ({ default: mod.CreateSectionDialog })),
  {
    loading: () => <Skeleton className="h-10 w-32" />,
    ssr: false
  }
)

export const CreatePageDialogLazy = dynamic(
  () => import("@/components/create-page-dialog").then(mod => ({ default: mod.CreatePageDialog })),
  {
    loading: () => <Skeleton className="h-10 w-32" />,
    ssr: false
  }
)
