import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Update the keep_alive table
    const { error } = await supabase
      .from("keep_alive")
      .update({ last_ping: new Date().toISOString() })
      .eq("id", (await supabase.from("keep_alive").select("id").single()).data?.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Database pinged successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
