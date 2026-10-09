import Link from "next/link"
import { Activity, History, Eye, Filter, HeartPulse, Store } from "lucide-react"

import { exigirAdmin } from "@/lib/admin"
import { resumenDeAdmin } from "@/lib/data/admin"
import { formatMoney, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  Cabecera,
  Cifra,
  Cifras,
  Seccion,
  SinDatos,
} from "@/components/panel/piezas"
import { Barras } from "@/components/panel/visitas"

export const metadata = { title: "Resumen" }

const NOMBRES_DE_REGISTRO = {
  abierto: "Abierto",
  cerrado: "Cerrado",
  invitacion: "Con invitación",
} as const

export default async function AdminPage() {
  const { db } = await exigirAdmin()
  const { resumen, masVisitadas, salud } = await resumenDeAdmin(db)

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera
        etiqueta="Administración"
        titulo="Cómo va Venduo."
        bajada="Las tiendas, lo que venden, quién las visita y si todo funciona."
      />

      {resumen ? (
        <>
          <Seccion
            id="tiendas"
            icono={Store}
            titulo="Las tiendas"
            bajada="Cuántas hay y en qué estado está su suscripción."
            accion={{ href: "/admin/tiendas", texto: "Ver todas las tiendas" }}
          >
            <Cifras>
              <Cifra
                etiqueta="Tiendas"
                valor={formatNumber(resumen.tiendas)}
                detalle={`${formatNumber(resumen.tiendas_nuevas_7d)} nuevas esta semana`}
              />
              <Cifra
                etiqueta="Publicadas"
                valor={formatNumber(resumen.publicadas)}
                detalle={
                  resumen.pausadas > 0
                    ? `${formatNumber(resumen.pausadas)} pausadas por Venduo`
                    : "Ninguna pausada"
                }
              />
              <Cifra
                etiqueta="En prueba"
                valor={formatNumber(resumen.en_prueba)}
                detalle={`${formatNumber(resumen.activas)} activas`}
              />
              <Cifra
                etiqueta="Bloqueadas"
                valor={formatNumber(resumen.bloqueadas)}
                alerta={resumen.bloqueadas > 0}
                detalle="Su prueba venció"
              />
            </Cifras>
          </Seccion>

          <Seccion
            id="movimiento"
            icono={Activity}
            titulo="Lo que se mueve"
            bajada="Los últimos 30 días, sumando todas las tiendas."
          >
            <Cifras>
              <Cifra
                etiqueta="Ventas"
                valor={formatMoney(resumen.ventas_30d_cents)}
                detalle="Pedidos pagados"
              />
              <Cifra
                etiqueta="Pedidos"
                valor={formatNumber(resumen.pedidos_30d)}
                detalle="Mandados por WhatsApp"
              />
              <Cifra
                etiqueta="Visitas"
                valor={formatNumber(resumen.visitas_30d)}
                detalle={`${formatNumber(resumen.visitas_7d)} en 7 días`}
              />
              <Cifra
                etiqueta="IA, 24 h"
                valor={formatNumber(resumen.ia_24h.pedidos)}
                alerta={resumen.ia_24h.fallas > 0}
                detalle={
                  resumen.ia_24h.fallas > 0
                    ? `${formatNumber(resumen.ia_24h.fallas)} fallaron`
                    : "Sin fallas"
                }
              />
            </Cifras>
          </Seccion>

          <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
            <Seccion
              id="embudo"
              icono={Filter}
              titulo="Dónde se quedan"
              bajada="De cada cuenta nueva, hasta dónde llega."
              relleno
            >
              <Barras
                ordenar={false}
                filas={[
                  {
                    etiqueta: "Crearon su cuenta",
                    valor: resumen.embudo.cuentas,
                  },
                  {
                    etiqueta: "Armaron su tienda",
                    valor: resumen.embudo.tiendas,
                  },
                  {
                    etiqueta: "Cargaron un producto",
                    valor: resumen.embudo.con_producto,
                  },
                  {
                    etiqueta: "Recibieron una visita",
                    valor: resumen.embudo.con_visita,
                  },
                  {
                    etiqueta: "Recibieron un pedido",
                    valor: resumen.embudo.con_pedido,
                  },
                  {
                    etiqueta: "Concretaron una venta",
                    valor: resumen.embudo.con_venta,
                  },
                ]}
              />
            </Seccion>

            <Seccion
              id="mas-visitadas"
              icono={Eye}
              titulo="Las más visitadas"
              bajada="Los últimos 30 días."
            >
              {masVisitadas.length === 0 ? (
                <SinDatos
                  icono={Eye}
                  titulo="Todavía sin visitas"
                  texto="Cuando alguien abra una tienda, va a aparecer acá."
                />
              ) : (
                <ul>
                  {masVisitadas.map((t) => (
                    <li
                      key={t.id}
                      className="border-t border-tinta/15 first:border-t-0"
                    >
                      <Link
                        href={`/admin/tiendas/${t.id}`}
                        className="flex min-h-11 items-baseline justify-between gap-3 px-4 py-3 transition-colors hover:bg-tinta/[0.03] sm:px-5"
                      >
                        <span className="min-w-0 truncate font-semibold">
                          {t.nombre}
                        </span>
                        <span className="tabular shrink-0 text-sm opacity-70">
                          {formatNumber(Number(t.visitas_30d))} visitas
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Seccion>
          </div>
        </>
      ) : (
        <Seccion id="sin-datos" icono={Store} titulo="Sin datos" relleno>
          <p className="text-sm opacity-70">
            No se pudo leer la base. Mira el estado del sistema abajo.
          </p>
        </Seccion>
      )}

      <Seccion
        id="salud"
        icono={HeartPulse}
        titulo="Si todo funciona"
        bajada="Las piezas de las que depende Venduo, en este momento."
      >
        <ul>
          <Estado
            nombre="Base de datos"
            bien={salud.base}
            detalle={salud.base ? "Responde" : "No responde"}
          />
          <Estado
            nombre="IA"
            bien={!salud.iaApagada && !salud.ia.demo}
            detalle={
              salud.iaApagada
                ? "Apagada desde Funciones"
                : salud.ia.demo
                  ? "En modo demo: respuestas de ejemplo"
                  : `${salud.ia.provider} · ${salud.ia.model}`
            }
            href="/admin/ia"
          />
          <Estado
            nombre="Canva"
            bien={salud.canva}
            detalle={salud.canva ? "Configurado" : "Sin configurar"}
          />
          <Estado
            nombre="Registro"
            bien={salud.registro === "abierto"}
            neutro
            detalle={NOMBRES_DE_REGISTRO[salud.registro]}
            href="/admin/registro"
          />
        </ul>
      </Seccion>

      <p className="flex items-center gap-2 text-xs opacity-65">
        <History aria-hidden="true" className="size-3.5" />
        Lo que cambias acá queda anotado en Cambios.
      </p>
    </div>
  )
}

function Estado({
  nombre,
  bien,
  neutro,
  detalle,
  href,
}: {
  nombre: string
  bien: boolean
  neutro?: boolean
  detalle: string
  href?: string
}) {
  const contenido = (
    <>
      <span className="flex items-center gap-3 font-semibold">
        <span
          aria-hidden="true"
          className={cn(
            "size-2 rounded-full",
            bien ? "bg-tinta" : neutro ? "bg-tinta/40" : "bg-senal"
          )}
        />
        {nombre}
      </span>
      <span
        className={cn(
          "text-sm",
          !bien && !neutro ? "text-senal" : "opacity-70"
        )}
      >
        {detalle}
      </span>
    </>
  )
  const clases =
    "flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 sm:px-5"
  return (
    <li className="border-t border-tinta/15 first:border-t-0">
      {href ? (
        <Link
          href={href}
          className={cn(clases, "transition-colors hover:bg-tinta/[0.03]")}
        >
          {contenido}
        </Link>
      ) : (
        <div className={clases}>{contenido}</div>
      )}
    </li>
  )
}
