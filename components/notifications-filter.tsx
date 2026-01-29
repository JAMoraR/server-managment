"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter, useSearchParams } from "next/navigation"

interface NotificationsFilterProps {
  currentFilter: string
}

export function NotificationsFilter({ currentFilter }: NotificationsFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete("filter")
    } else {
      params.set("filter", value)
    }
    router.push(`/notifications?${params.toString()}`)
  }

  return (
    <Tabs value={currentFilter} onValueChange={handleFilterChange} className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-3">
        <TabsTrigger value="all">Todas</TabsTrigger>
        <TabsTrigger value="unread">No Leídas</TabsTrigger>
        <TabsTrigger value="read">Leídas</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
