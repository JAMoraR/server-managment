"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createDocumentationSection(formData: FormData) {
  const supabase = await createClient()

  const title = formData.get("title") as string
  const slug = formData.get("slug") as string
  const order = parseInt(formData.get("order") as string)

  const { error } = await supabase
    .from("documentation_sections")
    .insert({ title, slug, order })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/documentation")
  revalidatePath("/docs")
  return { success: true }
}

export async function updateDocumentationSection(
  sectionId: string,
  updates: any
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("documentation_sections")
    .update(updates)
    .eq("id", sectionId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/documentation")
  revalidatePath("/docs")
  return { success: true }
}

export async function deleteDocumentationSection(sectionId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("documentation_sections")
    .delete()
    .eq("id", sectionId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/documentation")
  revalidatePath("/docs")
  return { success: true }
}

export async function createDocumentationPage(formData: FormData) {
  const supabase = await createClient()

  const section_id = formData.get("section_id") as string
  const title = formData.get("title") as string
  const content = formData.get("content") as string

  // Get the current max order for this section
  const { data: existingPages } = await supabase
    .from("documentation_pages")
    .select("order")
    .eq("section_id", section_id)
    .order("order", { ascending: false })
    .limit(1)

  const maxOrder = existingPages && existingPages.length > 0 ? (existingPages[0].order || 0) : -1
  const newOrder = maxOrder + 1

  const { error } = await supabase
    .from("documentation_pages")
    .insert({ section_id, title, content, order: newOrder })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/documentation")
  revalidatePath("/docs")
  return { success: true }
}

export async function updateDocumentationPage(pageId: string, updates: any) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("documentation_pages")
    .update(updates)
    .eq("id", pageId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/documentation")
  revalidatePath("/docs")
  return { success: true }
}

export async function deleteDocumentationPage(pageId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("documentation_pages")
    .delete()
    .eq("id", pageId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/documentation")
  revalidatePath("/docs")
  return { success: true }
}

export async function reorderSections(sections: Array<{ id: string; order: number }>) {
  const supabase = await createClient()

  // Update each section's order
  for (const section of sections) {
    const { error } = await supabase
      .from("documentation_sections")
      .update({ order: section.order })
      .eq("id", section.id)

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath("/admin/documentation")
  revalidatePath("/docs")
  return { success: true }
}

export async function reorderPages(pages: Array<{ id: string; order: number }>) {
  const supabase = await createClient()

  // Update each page's order
  for (const page of pages) {
    const { error } = await supabase
      .from("documentation_pages")
      .update({ order: page.order })
      .eq("id", page.id)

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath("/admin/documentation")
  revalidatePath("/docs")
  return { success: true }
}
