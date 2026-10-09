import { notFound } from "next/navigation"
import {
  CalendarClock,
  ExternalLink,
  MessageCircle,
  NotebookPen,
  Package,
  PauseCircle,
  SlidersHorizontal,
  Store,
} from "lucide-react"

import { exigirAdmin } from "@/lib/admin"
import { tiendaDeAdmin } from "@/lib/data/admin"
import {
  formatDate,
  formatMoney,
  formatNumber,
  formatRelative,
} from "@/lib/format"
import { numeroDeWhatsApp } from "@/lib/pedidos"
import { PLANTILLAS, esClavePlantilla } from "@/lib/plantillas"
import { urlDeTienda } from "@/lib/tienda"
import {
  Cabecera,
  Cifra,
  Cifras,
  Insignia,
  Seccion,
  SinDatos,
  Volver,
} from "@/components/panel/piezas"
import { PanelDeVisitas } from "@/components/panel/visitas"
import { FuncionDeTienda } from "@/components/admin/funciones"
import {
  AccionesDeSuscripcion,
  ModeracionDeProductos,
  NotasDeTienda,
  PausaDeTienda,
} from "@/components/admin/ficha"

export const metadata = { title: "Tienda" }

const NOMBRES_DE_SUSCRIPCION: Record<string, string> = {
  prueba: "En prueba",
  activa: "Activa",
  bloqueada: "Bloqueada",
}

export default async function TiendaAdminPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const { db } = await exigirAdmin()
  const ficha = await tiendaDeAdmin(db, id)
  if (!ficha) notFound()

  const {
    tienda,
    dueno,
    numeros,
    suscripcion,
    productos,
    notas,
    funciones,
    visitas,
  } = ficha
  const ahora = new Date().getTime()
  const plantilla = esClavePlantilla(tienda.template_key)
    ? PLANTILLAS[tienda.template_key].nombre
    : (tienda.template_key ?? "Sin plantilla")
  const url = urlDeTienda(tienda.slug)
  const moderados = productos.filter((p) => p.moderated_at).length

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Volver href="/admin/tiendas">Tiendas</Volver>
      <Cabecera
        titulo={`${tienda.name}.`}
        bajada={
          <>
            {dueno ?? "Sin dueño"} · {plantilla} · creada el{" "}
            {formatDate(tienda.created_at)}
          </>
        }
      >
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-11 items-center gap-2 border-2 border-tinta px-4 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"
        >
          <ExternalLink aria-hidden="true" className="size-4" />
          Ver la tienda
        </a>
        {tienda.whatsapp ? (
          <a
            href={`https://wa.me/${numeroDeWhatsApp(tienda.whatsapp)}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 items-center gap-2 border-2 border-tinta px-4 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            Escribirle
          </a>
        ) : null}
      </Cabecera>

      <Seccion
        id="estado"
        icono={Store}
        titulo="Cómo está"
        bajada="Lo que vende y si se ve."
        extra={
          <span className="flex flex-wrap gap-1.5">
            {tienda.suspended_at ? (
              <Insignia tono="senal">Pausada</Insignia>
            ) : null}
            {tienda.is_published ? (
              <Insignia tono="tinta">Publicada</Insignia>
            ) : (
              <Insignia tono="anulada">Sin publicar</Insignia>
            )}
          </span>
        }
      >
        <Cifras>
          <Cifra
            etiqueta="Ventas 30 d"
            valor={formatMoney(numeros?.ventas_30d_cents ?? 0)}
            detalle={`${formatNumber(numeros?.pedidos_30d ?? 0)} pedidos`}
          />
          <Cifra
            etiqueta="Visitas 30 d"
            valor={formatNumber(visitas.visitas)}
            detalle={`${formatNumber(visitas.visitantes)} visitantes`}
          />
          <Cifra
            etiqueta="Productos"
            valor={formatNumber(productos.length)}
            alerta={moderados > 0}
            detalle={
              moderados > 0
                ? `${moderados} ocultos por Venduo`
                : "Ninguno oculto"
            }
          />
          <Cifra
            etiqueta="Última actividad"
            valor={
              numeros?.ultima_actividad
                ? formatRelative(numeros.ultima_actividad, new Date(ahora))
                : "—"
            }
            detalle={tienda.slug}
          />
        </Cifras>
      </Seccion>

      <PanelDeVisitas visitas={visitas} titulo="Quién la visita" />

      <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
        <Seccion
          id="suscripcion"
          icono={CalendarClock}
          titulo="Suscripción"
          bajada={
            suscripcion
              ? `${NOMBRES_DE_SUSCRIPCION[suscripcion.status] ?? suscripcion.status}${
                  suscripcion.status === "prueba" && suscripcion.trial_ends_at
                    ? ` hasta el ${formatDate(suscripcion.trial_ends_at)}`
                    : suscripcion.status === "bloqueada" && suscripcion.purge_at
                      ? `. Se purga el ${formatDate(suscripcion.purge_at)}`
                      : ""
                }. Solo el estado: el cobro no pasa por Venduo.`
              : "Sin suscripción."
          }
          relleno
        >
          {suscripcion ? (
            <AccionesDeSuscripcion
              tienda={tienda.id}
              estado={suscripcion.status}
            />
          ) : (
            <p className="text-sm opacity-70">
              Esta tienda no tiene suscripción.
            </p>
          )}
        </Seccion>

        <Seccion
          id="pausa"
          icono={PauseCircle}
          titulo="Pausar"
          bajada="Para una denuncia o un contenido que no corresponde."
          relleno
        >
          <PausaDeTienda
            tienda={tienda.id}
            pausada={Boolean(tienda.suspended_at)}
            motivo={tienda.suspension_reason}
          />
        </Seccion>
      </div>

      <Seccion
        id="funciones"
        icono={SlidersHorizontal}
        titulo="Sus funciones"
        bajada="Lo que esta tienda puede usar. Sin cambio propio, sigue lo general. No recibe aviso."
      >
        <ul>
          {funciones.map((f) => (
            <FuncionDeTienda
              key={f.clave}
              tienda={tienda.id}
              clave={f.clave}
              nombre={f.nombre}
              descripcion={f.descripcion}
              general={f.general}
              propio={f.propio}
            />
          ))}
        </ul>
      </Seccion>

      <Seccion
        id="productos"
        icono={Package}
        titulo="Sus productos"
        bajada="Ocultar uno lo saca de la tienda pública. El dueño lo ve marcado en su panel."
      >
        {productos.length === 0 ? (
          <SinDatos
            icono={Package}
            titulo="Todavía sin productos"
            texto="Si lleva días así, es una tienda trabada: vale la pena escribirle."
          />
        ) : (
          <ModeracionDeProductos tienda={tienda.id} productos={productos} />
        )}
      </Seccion>

      <Seccion
        id="notas"
        icono={NotebookPen}
        titulo="Notas"
        bajada="Solo las ves tú."
      >
        <NotasDeTienda tienda={tienda.id} notas={notas} ahora={ahora} />
      </Seccion>
    </div>
  )
}
