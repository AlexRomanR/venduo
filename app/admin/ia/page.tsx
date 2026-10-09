import Link from "next/link"
import { AlertTriangle, Bot, Gauge, Store } from "lucide-react"

import { exigirAdmin } from "@/lib/admin"
import { usoDeIa } from "@/lib/data/admin"
import { formatNumber, formatRelative } from "@/lib/format"
import {
  Cabecera,
  Cifra,
  Cifras,
  Seccion,
  SinDatos,
} from "@/components/panel/piezas"

export const metadata = { title: "IA" }

const NOMBRES_DE_TIPO: Record<string, string> = {
  editor: "Editor de la tienda",
  estadisticas: "Preguntas a las estadísticas",
  catalogos: "Catálogos en PDF",
}

export default async function IaPage() {
  const { db } = await exigirAdmin()
  const uso = await usoDeIa(db)
  const ahora = new Date()

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera
        titulo="IA."
        bajada="Cuánto se usa, dónde falla y qué proveedor responde. El interruptor y el tope están en Funciones."
      >
        <Link
          href="/admin/funciones#ia"
          className="flex min-h-11 items-center gap-2 border-2 border-tinta px-4 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"
        >
          <Gauge aria-hidden="true" className="size-4" />
          Interruptor y tope
        </Link>
      </Cabecera>

      <Seccion
        id="uso"
        icono={Bot}
        titulo="Cómo se usa"
        bajada="Los últimos 30 días."
      >
        <Cifras>
          <Cifra
            etiqueta="Pedidos"
            valor={formatNumber(uso.total30)}
            detalle="A la IA, en 30 días"
          />
          <Cifra
            etiqueta="Fallas, 24 h"
            valor={formatNumber(uso.fallas24.length)}
            alerta={uso.fallas24.length > 0}
            detalle={
              uso.fallas24.length > 0 ? "Mira el detalle abajo" : "Ninguna"
            }
          />
          <Cifra
            etiqueta="Proveedor"
            valor={uso.ia.nombre}
            detalle={uso.ia.model}
          />
          <Cifra
            etiqueta="Estado"
            valor={uso.ajustes.iaApagada ? "Apagada" : "Encendida"}
            alerta={uso.ajustes.iaApagada}
            detalle={
              uso.ajustes.iaTopeDiario
                ? `Tope de ${uso.ajustes.iaTopeDiario} por día`
                : "Sin tope diario"
            }
          />
        </Cifras>
        {uso.porTipo.length > 0 ? (
          <ul className="border-t border-tinta/15">
            {uso.porTipo.map((t) => (
              <li
                key={t.tipo}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-tinta/15 px-4 py-3 text-sm first:border-t-0 sm:px-5"
              >
                <span className="font-semibold">
                  {NOMBRES_DE_TIPO[t.tipo] ?? t.tipo}
                </span>
                <span className="tabular opacity-70">
                  {formatNumber(t.pedidos)} pedidos · {formatNumber(t.fallas)}{" "}
                  fallas ·{" "}
                  {(t.msPromedio / 1000).toLocaleString("es-BO", {
                    maximumFractionDigits: 1,
                  })}{" "}
                  s de promedio
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </Seccion>

      <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
        <Seccion
          id="tiendas"
          icono={Store}
          titulo="Las que más la usan"
          bajada="Los últimos 30 días."
        >
          {uso.porTienda.length === 0 ? (
            <SinDatos
              icono={Bot}
              titulo="Todavía nadie la usó"
              texto="Cada pedido a la IA desde el editor, las estadísticas o los catálogos se cuenta acá."
            />
          ) : (
            <ul>
              {uso.porTienda.map((t) => (
                <li
                  key={t.id}
                  className="border-t border-tinta/15 first:border-t-0"
                >
                  <Link
                    href={`/admin/tiendas/${t.id}`}
                    className="flex min-h-11 items-baseline justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-tinta/[0.03] sm:px-5"
                  >
                    <span className="min-w-0 truncate font-semibold">
                      {t.nombre}
                    </span>
                    <span className="tabular shrink-0 opacity-70">
                      {formatNumber(t.pedidos)}
                      {t.fallas > 0
                        ? ` · ${formatNumber(t.fallas)} fallas`
                        : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Seccion>

        <Seccion
          id="fallas"
          icono={AlertTriangle}
          titulo="Lo que falló"
          bajada="Las últimas 24 horas."
        >
          {uso.fallas24.length === 0 ? (
            <SinDatos
              icono={AlertTriangle}
              titulo="Sin fallas"
              texto="Si el proveedor no responde o devuelve algo que no pasa la validación, aparece acá."
            />
          ) : (
            <ul>
              {uso.fallas24.slice(0, 30).map((f, i) => (
                <li
                  key={`${f.created_at}-${i}`}
                  className="border-t border-tinta/15 px-4 py-3 text-sm first:border-t-0 sm:px-5"
                >
                  <p className="flex flex-wrap justify-between gap-x-3">
                    <span className="font-semibold">
                      {(f.store_id && uso.nombres[f.store_id]) || "Sin tienda"}
                    </span>
                    <span className="opacity-65">
                      {formatRelative(f.created_at, ahora)}
                    </span>
                  </p>
                  <p className="opacity-70">
                    {NOMBRES_DE_TIPO[f.kind] ?? f.kind}
                    {f.error ? ` · ${f.error}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Seccion>
      </div>
    </div>
  )
}
