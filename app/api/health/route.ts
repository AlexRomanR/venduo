import { NextResponse } from "next/server"

import { getAIStatus } from "@/lib/ai"
import { isSupabaseConfigured } from "@/lib/env"

/** Chequeo rápido de que el server está vivo y qué capas están conectadas. */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    supabase: isSupabaseConfigured ? "conectado" : "sin configurar",
    ai: getAIStatus(),
    timestamp: new Date().toISOString(),
  })
}
