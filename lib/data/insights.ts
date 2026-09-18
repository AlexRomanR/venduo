import type { InsightSql } from "@/lib/ai/schemas"
import { esEtiquetaDeTotal } from "@/lib/insights/lectura"
import { createClient } from "@/lib/supabase/server"

export interface FilaInsight {
  etiqueta: string
  valor: number
}

export interface GraficoGuardado {
  id: string
  titulo: string
  pregunta: string
  consulta: InsightSql
  createdAt: string
}

/**
 * Ejecuta la consulta que escribió la IA.
 *
 * No se le pasa ninguna tienda, y es a propósito: `run_insight_sql` corre como
 * el usuario contra vistas ya acotadas a la suya. Si esta función recibiera un
 * `store_id`, alguien terminaría pasándole uno ajeno.
 */
export async function ejecutarConsulta(
  consulta: InsightSql
): Promise<FilaInsight[]> {
  const supabase = await createClient()
  if (!supabase) return []

  const { data, error } = await supabase.rpc("run_insight_sql", {
    p_sql: consulta.sql,
  })

  if (error) throw new Error(error.message)

  // `numeric` llega como texto para no perder precisión; acá son centavos o
  // conteos, que entran holgados en un número.
  return (data ?? []).map((fila) => ({
    etiqueta: fila.etiqueta ?? "",
    valor: Number(fila.valor ?? 0),
  }))
}

/**
 * Ajusta la forma a lo que de verdad devolvió la consulta.
 *
 * El modelo elige bien qué medir y se equivoca seguido con la forma: pide una
 * línea para un solo valor, o un ranking para treinta filas. Corregirlo con el
 * resultado en la mano es más barato que insistirle en la instrucción.
 */
export function normalizarForma(
  consulta: InsightSql,
  filas: FilaInsight[]
): InsightSql {
  if (filas.length === 0) return consulta

  if (filas.length === 1) {
    // Solo es una cifra si la fila es de verdad un total. Una consulta
    // agrupada que devolvió un grupo —"activo", "2026-09"— sigue siendo una
    // categoría, y volverla un número suelto tira la etiqueta, que es justo lo
    // que contesta la pregunta.
    if (esEtiquetaDeTotal(filas[0].etiqueta) || consulta.grafico === "numero") {
      return { ...consulta, grafico: "numero" }
    }

    // Una línea de un solo punto no dibuja nada; una barra sí, y con su nombre.
    return consulta.grafico === "linea" || consulta.grafico === "area"
      ? { ...consulta, grafico: "barra" }
      : consulta
  }

  // Una cifra sola no puede dibujar varias filas.
  if (consulta.grafico === "numero") {
    return { ...consulta, grafico: "barra" }
  }

  return consulta
}

/**
 * Si la consulta nombra vistas del otro panel.
 *
 * `run_insight_sql` acepta las dos familias porque es una sola función. Quien
 * es dueño y promotor a la vez podría recibir una respuesta que mezcla su
 * tienda con sus ventas como promotor: no es una fuga, pero es una respuesta
 * equivocada.
 */
export function nombraVistasAjenas(
  sql: string,
  publico: "tienda" | "promotor"
): boolean {
  const ajenas = publico === "promotor" ? /\bmis_\w+/i : /\bpromotor_\w+/i
  return ajenas.test(sql)
}

interface FilaGuardada {
  id: string
  titulo: string
  pregunta: string
  spec: unknown
  created_at: string
}

function aGuardado(fila: FilaGuardada): GraficoGuardado {
  return {
    id: fila.id,
    titulo: fila.titulo,
    pregunta: fila.pregunta,
    consulta: fila.spec as InsightSql,
    createdAt: fila.created_at,
  }
}

/** Los gráficos que el emprendedor dejó guardados. */
export async function getGraficosGuardados(): Promise<GraficoGuardado[]> {
  const supabase = await createClient()
  if (!supabase) return []

  const { data } = await supabase
    .from("insights")
    .select("id, titulo, pregunta, spec, created_at")
    .is("deleted_at", null)
    .order("posicion")
    .order("created_at", { ascending: false })

  return (data ?? []).map(aGuardado)
}

/** Los del promotor. RLS los acota a quien pregunta. */
export async function getGraficosGuardadosPromotor(): Promise<
  GraficoGuardado[]
> {
  const supabase = await createClient()
  if (!supabase) return []

  const { data } = await supabase
    .from("seller_insights")
    .select("id, titulo, pregunta, spec, created_at")
    .is("deleted_at", null)
    .order("posicion")
    .order("created_at", { ascending: false })

  return (data ?? []).map(aGuardado)
}

/**
 * Un gráfico guardado con sus filas calculadas contra los datos de hoy.
 *
 * Lo que se guardó es la consulta, así que se vuelve a ejecutar: no hay ninguna
 * llamada a la IA acá. Un gráfico que guardara el resultado sería una captura
 * de pantalla, no un tablero.
 */
export async function getGraficoConDatos(guardado: GraficoGuardado) {
  try {
    return { ...guardado, filas: await ejecutarConsulta(guardado.consulta) }
  } catch {
    // Una consulta guardada que ya no corre —porque cambió el esquema— no puede
    // tumbar la pantalla entera: se muestra vacía y se puede borrar.
    return { ...guardado, filas: [] as FilaInsight[] }
  }
}
