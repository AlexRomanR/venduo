import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowUpRight,
  BarChart3,
  Megaphone,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react"

import { getMiTienda, getResumenPanel } from "@/lib/data/panel"
import { urlDeTienda } from "@/lib/tienda"
import { RESUMEN_DEMO } from "@/lib/demo-data"
import { getSiteUrl, isSupabaseConfigured } from "@/lib/env"
import { formatMoney, formatNumber } from "@/lib/format"
import { toDataURL } from "@/lib/qr"
import { AvisoSuscripcion } from "@/components/panel/aviso-suscripcion"
import { Cifra, Encabezado } from "@/components/panel/piezas"

export const metadata = { title: "Resumen" }

const SECCIONES = [
  {
    href: "/panel/productos",
    titulo: "Productos",
    detalle: "Carga, edita y controla el stock de tu catálogo.",
    icono: Package,
  },
  {
    href: "/panel/pedidos",
    titulo: "Pedidos",
    detalle: "Confirma pagos y coordina la entrega por WhatsApp.",
    icono: ShoppingBag,
  },
  {
    href: "/panel/vendedores",
    titulo: "Vendedores",
    detalle: "Aprueba solicitudes y sigue las comisiones de tu red.",
    icono: Users,
  },
  {
    href: "/panel/estadisticas",
    titulo: "Estadísticas",
    detalle: "Qué se vende, cuándo y cuánto, preguntado en tus palabras.",
    icono: BarChart3,
  },
  {
    href: "/panel/marketing",
    titulo: "Marketing",
    detalle: "Textos para Facebook y WhatsApp hechos con tu catálogo.",
    icono: Megaphone,
  },
]

/**
 * Resumen del emprendedor: la pantalla de entrada del panel.
 *
 * Quien todavía no eligió plantilla no tiene nada que resumir acá. La
 * comprobación es sobre `template_key` y no sobre la existencia de la tienda
 * porque es lo que marca que el alta terminó.
 */
export default async function PanelPage() {
  const tienda = await getMiTienda()

  // Sin credenciales el modo demo tiene que seguir siendo navegable: no hay
  // tienda que buscar ni alta que completar.
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  const resumen = (await getResumenPanel()) ?? RESUMEN_DEMO
  const url = urlDeTienda(resumen.tienda.slug)
  const qr = await toDataURL(url, { size: 320, margin: 1, dark: "#16171a" })

  // Lo que espera una acción. Se arma acá y no en la interfaz porque el orden
  // importa: primero lo que bloquea vender, después lo que lo mejora.
  const pendientes: Array<{ texto: string; href: string; urgente: boolean }> =
    []

  if (!resumen.tienda.isPublished) {
    pendientes.push({
      texto: "Tu tienda todavía está en borrador: nadie puede comprarte.",
      href: "/cuenta",
      urgente: true,
    })
  }
  if (resumen.productos === 0) {
    pendientes.push({
      texto: "No cargaste ningún producto todavía.",
      href: "/panel/productos",
      urgente: true,
    })
  }
  if (resumen.pedidosPendientes > 0) {
    pendientes.push({
      // Cuenta pendientes y pagados: unos esperan que confirmes el cobro y
      // otros que coordines la entrega. Los dos esperan algo tuyo.
      texto: `${formatNumber(resumen.pedidosPendientes)} ${resumen.pedidosPendientes === 1 ? "pedido espera" : "pedidos esperan"} que los gestiones.`,
      href: "/panel/pedidos",
      urgente: true,
    })
  }
  if (resumen.vendedoresPendientes > 0) {
    pendientes.push({
      texto: `${formatNumber(resumen.vendedoresPendientes)} ${resumen.vendedoresPendientes === 1 ? "persona quiere" : "personas quieren"} vender para ti.`,
      href: "/panel/vendedores",
      urgente: false,
    })
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-titular text-[clamp(1.75rem,5vw,2.5rem)] leading-none font-extrabold tracking-[-0.03em]">
              {resumen.tienda.name}
            </h1>
            <span
              className={
                resumen.tienda.isPublished
                  ? "rounded-full border border-senal px-2 py-0.5 text-xs font-semibold tracking-[0.12em] text-senal uppercase"
                  : "rounded-full border border-tinta/25 px-2 py-0.5 text-xs font-semibold tracking-[0.12em] uppercase opacity-55"
              }
            >
              {resumen.tienda.isPublished ? "Publicada" : "Borrador"}
            </span>
          </div>
          <p className="mt-2 font-mono text-sm break-all opacity-55">
            {url.replace(/^https?:\/\//, "")}
          </p>
        </div>

        <Link
          href={`/t/${resumen.tienda.slug}`}
          className="group inline-flex min-h-11 items-center gap-2 rounded-sm border-2 border-tinta px-5 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"
        >
          Ver mi tienda
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      <AvisoSuscripcion suscripcion={resumen.suscripcion} />

      <section>
        <Encabezado
          etiqueta="Últimos 30 días"
          accion={{ href: "/panel/estadisticas", texto: "Ver estadísticas" }}
        />
        <div className="mt-6 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          <Cifra
            etiqueta="Ventas"
            valor={formatMoney(resumen.ventasCents)}
            detalle={`${formatNumber(resumen.pedidos)} ${resumen.pedidos === 1 ? "pedido" : "pedidos"}`}
          />
          <Cifra
            etiqueta="Por gestionar"
            valor={formatNumber(resumen.pedidosPendientes)}
            detalle={
              resumen.pedidosPendientes > 0
                ? "Cobro o entrega sin cerrar"
                : "Nada pendiente"
            }
            alerta={resumen.pedidosPendientes > 0}
          />
          <Cifra
            etiqueta="Vendedores activos"
            valor={formatNumber(resumen.vendedoresActivos)}
            detalle={
              resumen.vendedoresPendientes > 0
                ? `${formatNumber(resumen.vendedoresPendientes)} esperando aprobación`
                : "Sin solicitudes pendientes"
            }
            alerta={resumen.vendedoresPendientes > 0}
          />
          <Cifra
            etiqueta="Productos"
            valor={formatNumber(resumen.productos)}
            detalle={
              resumen.productos > 0 ? "En tu catálogo" : "Todavía ninguno"
            }
          />
        </div>
      </section>

      {pendientes.length > 0 ? (
        <section>
          <Encabezado etiqueta="Te está esperando" />
          <ul className="mt-6">
            {pendientes.map((item) => (
              <li key={item.href + item.texto}>
                <Link
                  href={item.href}
                  className="group flex min-h-11 items-center gap-4 border-t border-tinta/15 py-4 transition-colors hover:border-senal"
                >
                  <span
                    aria-hidden="true"
                    className={
                      item.urgente
                        ? "size-2 shrink-0 rounded-full bg-senal"
                        : "size-2 shrink-0 rounded-full bg-tinta/30"
                    }
                  />
                  <span className="flex-1 text-sm leading-relaxed transition-colors group-hover:text-senal">
                    {item.texto}
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-4 shrink-0 opacity-40 transition-opacity group-hover:opacity-100"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
        <div>
          <Encabezado etiqueta="Secciones" />
          <ul className="mt-6">
            {SECCIONES.map((seccion) => {
              const Icono = seccion.icono

              return (
                <li key={seccion.href}>
                  <Link
                    href={seccion.href}
                    className="group flex gap-4 border-t border-tinta/15 py-5 transition-colors hover:border-senal"
                  >
                    <Icono
                      aria-hidden="true"
                      className="mt-1 size-4 shrink-0 opacity-40 transition-colors group-hover:text-senal group-hover:opacity-100"
                    />
                    <div className="flex-1">
                      <h3 className="font-titular font-bold tracking-[-0.01em] transition-colors group-hover:text-senal">
                        {seccion.titulo}
                      </h3>
                      <p className="mt-1 max-w-[52ch] text-sm leading-relaxed opacity-70">
                        {seccion.detalle}
                      </p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* El QR es lo que se imprime y se pega en el mostrador: por eso la
            tienda se identifica por slug y no por identificador interno. */}
        <div className="lg:w-56">
          <Encabezado etiqueta="Tu código" />
          <div className="mt-6 border border-tinta p-4">
            <Image
              src={qr}
              alt={`Código QR de ${resumen.tienda.name}`}
              width={320}
              height={320}
              unoptimized
              className="h-auto w-full"
            />
          </div>
          <p className="mt-3 text-sm leading-relaxed opacity-55">
            Imprímelo y pégalo donde vendes. Lleva directo a tu tienda.
          </p>
        </div>
      </section>
    </div>
  )
}
