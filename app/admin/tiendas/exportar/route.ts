import { exigirAdmin } from "@/lib/admin"
import { tiendasDeAdmin } from "@/lib/data/admin"
import { diaEnBolivia } from "@/lib/format"

export const dynamic = "force-dynamic"

/** Un campo de CSV: entre comillas si hace falta, y sin fórmulas de planilla. */
function campo(valor: string | number | boolean | null): string {
  if (valor === null) return ""
  let texto = String(valor)
  // Una celda que empieza con = + - @ la ejecuta Excel como fórmula.
  if (/^[=+\-@]/.test(texto)) texto = `'${texto}`
  return /[",\n;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

export async function GET() {
  const { db } = await exigirAdmin()
  const tiendas = await tiendasDeAdmin(db)

  const cabecera = [
    "nombre",
    "enlace",
    "dueno",
    "plantilla",
    "creada",
    "publicada",
    "pausada",
    "suscripcion",
    "prueba_hasta",
    "productos",
    "pedidos_30d",
    "ventas_30d_bs",
    "visitas_7d",
    "visitas_30d",
    "ultima_actividad",
  ]
  const filas = tiendas.map((t) =>
    [
      t.nombre,
      t.slug,
      t.dueno,
      t.plantilla,
      t.creada,
      t.publicada,
      t.pausada,
      t.suscripcion,
      t.prueba_hasta,
      t.productos,
      t.pedidos_30d,
      (t.ventas_30d_cents / 100).toFixed(2),
      t.visitas_7d,
      t.visitas_30d,
      t.ultima_actividad,
    ]
      .map(campo)
      .join(",")
  )

  // La marca BOM hace que Excel lea las tildes como UTF-8.
  const csv = "﻿" + [cabecera.join(","), ...filas].join("\r\n")
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="venduo-tiendas-${diaEnBolivia()}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
