import { cache } from "react"

import { createClient } from "@/lib/supabase/server"
import type { Tramo } from "@/lib/precio"

/**
 * Los tramos de precio vigentes.
 *
 * Salen de `pricing_tiers`, que es catálogo global y de lectura pública. Se
 * leen una vez por petición y se pasan a quien tenga que mostrar un desglose:
 * así no hay una copia de los porcentajes en el código.
 */
export const getTramos = cache(async function getTramos(): Promise<Tramo[]> {
  const supabase = await createClient()
  if (!supabase) return TRAMOS_DEMO

  const { data } = await supabase
    .from("pricing_tiers")
    .select(
      "min_cost_cents, max_cost_cents, commission_bps, take_bps, indirect_bps"
    )
    .order("min_cost_cents")

  if (!data || data.length === 0) return TRAMOS_DEMO

  return data.map((fila) => ({
    desdeCents: fila.min_cost_cents,
    hastaCents: fila.max_cost_cents,
    comisionBps: fila.commission_bps,
    takeBps: fila.take_bps,
    indirectaBps: fila.indirect_bps,
  }))
})

/**
 * Los mismos valores que siembra la migración, para el modo demo.
 *
 * Es una copia y por eso solo se usa sin base de datos: el proyecto tiene que
 * arrancar recién clonado y la portada explica el precio con estos números.
 */
export const TRAMOS_DEMO: Tramo[] = [
  {
    desdeCents: 0,
    hastaCents: 5000,
    comisionBps: 2500,
    takeBps: 1000,
    indirectaBps: 1000,
  },
  {
    desdeCents: 5001,
    hastaCents: 20000,
    comisionBps: 2000,
    takeBps: 800,
    indirectaBps: 800,
  },
  {
    desdeCents: 20001,
    hastaCents: 60000,
    comisionBps: 1500,
    takeBps: 600,
    indirectaBps: 600,
  },
  {
    desdeCents: 60001,
    hastaCents: 150000,
    comisionBps: 1200,
    takeBps: 500,
    indirectaBps: 500,
  },
  {
    desdeCents: 150001,
    hastaCents: null,
    comisionBps: 800,
    takeBps: 400,
    indirectaBps: 300,
  },
]
