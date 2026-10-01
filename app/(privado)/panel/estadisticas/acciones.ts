"use server"

import { revalidatePath } from "next/cache"

import { buildInsightSql } from "@/lib/ai/tasks"
import { insightSqlSchema, type InsightSql } from "@/lib/ai/schemas"
import {
  ejecutarConsulta,
  normalizarForma,
  type FilaInsight,
} from "@/lib/data/insights"
import { getMiTienda } from "@/lib/data/panel"
import { createClient, getUsuario } from "@/lib/supabase/server"

export interface Respuesta {
  ok: boolean
  error?: string
  consulta?: InsightSql
  filas?: FilaInsight[]
  provider?: string
  model?: string
}

/**
 * Una pregunta en palabras, un gráfico.
 *
 * El orden importa y es el que exige la regla: la IA **propone**, el sistema
 * **valida** y recién entonces **ejecuta**. Entre la propuesta y la ejecución
 * hay dos filtros —el esquema zod y la normalización— y la consulta la arma la
 * base, no el modelo.
 */
export async function preguntar(
  pregunta: string,
  anterior: InsightSql | null
): Promise<Respuesta> {
  const limpia = pregunta.trim().slice(0, 500)
  if (limpia.length < 4) {
    return { ok: false, error: "Escribe un poco más para poder responderte." }
  }

  const tienda = await getMiTienda()
  if (!tienda) return { ok: false, error: "Todavía no tienes una tienda." }

  let propuesta
  try {
    propuesta = await buildInsightSql({
      pregunta: limpia,
      anterior,
      hoy: new Date().toISOString().slice(0, 10),
    })
  } catch (error) {
    // Se registra en el servidor: sin esto, un fallo del proveedor es
    // indistinguible de una pregunta mal entendida y no hay por dónde empezar.
    console.error("[insights] el proveedor de IA falló:", error)

    // Saturación y error real piden cosas distintas de quien está mirando: una
    // se arregla esperando diez segundos y la otra cambiando la pregunta.
    const detalle = error instanceof Error ? error.message : ""
    const saturado = /503|UNAVAILABLE|429|high demand/i.test(detalle)

    return {
      ok: false,
      error: saturado
        ? "El modelo está saturado en este momento. Vuelve a preguntar en unos segundos."
        : "La IA no pudo responder ahora. Intenta de nuevo en un momento.",
    }
  }

  // La salida del modelo se valida antes de tocar la base, siempre.
  const validada = insightSqlSchema.safeParse(propuesta.consulta)
  if (!validada.success) {
    console.error(
      "[insights] la salida del modelo no validó:",
      validada.error.issues
    )
    return {
      ok: false,
      error:
        "No entendimos la pregunta con los datos que hay. Prueba nombrando qué quieres ver: ventas, productos, vendedores o catálogo.",
    }
  }

  let filas: FilaInsight[]
  try {
    filas = await ejecutarConsulta(validada.data)
  } catch (error) {
    // El mensaje de la base dice qué regla se rompió y es útil para corregir
    // la pregunta, así que se muestra en vez de tragarlo.
    const detalle = error instanceof Error ? error.message : ""
    console.error("[insights] la consulta falló:", detalle, validada.data.sql)
    return {
      ok: false,
      error: detalle.includes("vistas")
        ? "Esa pregunta necesita datos que todavía no puedo consultar."
        : "No pudimos calcular ese gráfico. Prueba con otra pregunta.",
    }
  }

  const consulta = normalizarForma(validada.data, filas)

  await registrar(
    limpia,
    consulta,
    propuesta.provider,
    propuesta.model,
    tienda.id
  )

  return {
    ok: true,
    consulta,
    filas,
    provider: propuesta.provider,
    model: propuesta.model,
  }
}

/** Guarda el gráfico en el tablero del emprendedor. */
export async function guardar(consulta: InsightSql, pregunta: string) {
  const supabase = await createClient()
  if (!supabase) return { ok: false, error: "Supabase sin configurar." }

  const user = await getUsuario()
  const tienda = await getMiTienda()

  if (!user || !tienda) return { ok: false, error: "No tienes una tienda." }

  const { error } = await supabase.from("insights").insert({
    store_id: tienda.id,
    user_id: user.id,
    titulo: consulta.titulo,
    pregunta,
    spec: consulta,
  })

  if (error) return { ok: false, error: "No pudimos guardar el gráfico." }

  revalidatePath("/panel/estadisticas")
  return { ok: true }
}

/** Borrado lógico, como todo en el sistema. */
export async function borrar(id: string) {
  const supabase = await createClient()
  if (!supabase) return { ok: false, error: "Supabase sin configurar." }

  const { error } = await supabase
    .from("insights")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { ok: false, error: "No pudimos borrar el gráfico." }

  revalidatePath("/panel/estadisticas")
  return { ok: true }
}

/**
 * Deja constancia de lo que generó la IA.
 *
 * Se guarda la consulta y no las filas: el registro sirve para auditar qué
 * escribió el modelo —y revisarlo si algo salió raro—, no para conservar un
 * resultado que cambia cada día.
 */
async function registrar(
  pregunta: string,
  consulta: InsightSql,
  provider: string,
  model: string,
  storeId: string
) {
  const supabase = await createClient()
  if (!supabase) return

  const user = await getUsuario()
  if (!user) return

  await supabase.from("ai_generations").insert({
    user_id: user.id,
    store_id: storeId,
    kind: "analisis",
    provider,
    model,
    prompt: pregunta,
    output: consulta,
  })
}
