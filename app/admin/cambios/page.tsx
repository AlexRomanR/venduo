import Link from "next/link"
import { History } from "lucide-react"

import { exigirAdmin } from "@/lib/admin"
import { cambiosDeAdmin } from "@/lib/data/admin"
import { formatRelative } from "@/lib/format"
import { Cabecera, Seccion, SinDatos } from "@/components/panel/piezas"

export const metadata = { title: "Cambios" }

const NOMBRES_DE_ACCION: Record<string, string> = {
  funcion_general: "Cambió una función para todas",
  funcion_de_tienda: "Cambió una función de una tienda",
  ajuste: "Cambió un ajuste",
  plantilla_de_tienda: "Cambió una plantilla de tienda",
  plantilla_de_catalogo: "Cambió una plantilla de catálogo",
  orden_de_plantillas: "Reordenó las plantillas",
  pausar_tienda: "Pausó una tienda",
  reanudar_tienda: "Reanudó una tienda",
  suscripcion_extender: "Extendió una prueba",
  suscripcion_bloquear: "Bloqueó una tienda",
  suscripcion_desbloquear: "Marcó activa una suscripción",
  ocultar_producto: "Ocultó un producto",
  mostrar_producto: "Volvió a mostrar un producto",
  crear_invitacion: "Creó una invitación",
  borrar_invitacion: "Borró una invitación",
}

/** Un valor de antes o de después, en una línea. */
function enLinea(valor: unknown): string {
  if (valor === null || valor === undefined) return "—"
  if (typeof valor === "object") return JSON.stringify(valor)
  return String(valor)
}

export default async function CambiosPage() {
  const { db } = await exigirAdmin()
  const cambios = await cambiosDeAdmin(db)
  const ahora = new Date()

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera
        titulo="Cambios."
        bajada="Todo lo que se cambió desde la administración, con el antes y el después. Los últimos 200."
      />
      <Seccion
        id="registro"
        icono={History}
        titulo="Quién tocó qué"
        bajada="Lo más reciente arriba."
      >
        {cambios.length === 0 ? (
          <SinDatos
            icono={History}
            titulo="Todavía sin cambios"
            texto="Cada cambio que hagas en funciones, plantillas, tiendas o registro va a quedar anotado acá."
          />
        ) : (
          <ul>
            {cambios.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-1 border-t border-tinta/15 px-4 py-3 text-sm first:border-t-0 sm:px-5"
              >
                <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-semibold">
                    {NOMBRES_DE_ACCION[c.action] ?? c.action}
                    {c.tienda && c.target_id ? (
                      <>
                        {" · "}
                        <Link
                          href={`/admin/tiendas/${c.target_id}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {c.tienda}
                        </Link>
                      </>
                    ) : c.target_type !== "tienda" && c.target_id ? (
                      <span className="font-normal opacity-70">
                        {" "}
                        · {c.target_id}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs opacity-65">
                    {formatRelative(c.created_at, ahora)}
                  </span>
                </p>
                {c.before !== null || c.after !== null ? (
                  <p className="font-mono text-xs break-all opacity-70">
                    {enLinea(c.before)} → {enLinea(c.after)}
                  </p>
                ) : null}
                {c.note ? <p className="opacity-70">{c.note}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </Seccion>
    </div>
  )
}
