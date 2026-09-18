import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowUpRight,
  BarChart3,
  FileSpreadsheet,
  Package,
  Plus,
  ShoppingBag,
  Users,
} from "lucide-react"

import { getCatalogo } from "@/lib/data/catalogo"
import { getMiTienda, getResumenPanel } from "@/lib/data/panel"
import { getTramos } from "@/lib/data/precios"
import { urlDeTienda } from "@/lib/tienda"
import { RESUMEN_DEMO } from "@/lib/demo-data"
import { getSiteUrl, isSupabaseConfigured } from "@/lib/env"
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { formatMoney, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { toDataURL } from "@/lib/qr"
import { Cifra, Encabezado } from "@/components/panel/piezas"
import { GuiaDeInicio } from "@/components/panel/guia-de-inicio"
import { ListaProductos } from "@/components/productos/lista"
import { terminarGuia } from "./acciones"
import {
  ajustarStock,
  alternarProducto,
  borrarProducto,
} from "./productos/acciones"

export const metadata = { title: "Mi panel" }

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
    detalle: "Confirma el envío y coordina la entrega por WhatsApp.",
    icono: ShoppingBag,
  },
  {
    href: "/panel/vendedores",
    titulo: "Promotores",
    detalle: "Quién promociona tus productos y cuánto te vendió.",
    icono: Users,
  },
  {
    href: "/panel/estadisticas",
    titulo: "Estadísticas",
    detalle: "Qué se vende, cuándo y cuánto, preguntado en tus palabras.",
    icono: BarChart3,
  },
]

/**
 * La pantalla de entrada del negocio.
 *
 * Tiene dos caras. **La primera vez es una guía**: cargar lo que vende,
 * agruparlo y cómo sigue el circuito sin que haga nada, en un carrusel que
 * termina acá. La decide `stores.onboarded_at` y no el catálogo, porque un
 * negocio puede cargar su primer producto sin haber terminado de entender cómo
 * funciona el resto. Se puede volver a abrir con `?guia=1`.
 *
 * Terminada la guía, es su panel: los números de los últimos 30 días primero,
 * lo que espera una acción después, y el catálogo con su stock.
 */
export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ guia?: string; paso?: string }>
}) {
  const tienda = await getMiTienda()

  // Sin credenciales el modo demo tiene que seguir siendo navegable: no hay
  // tienda que buscar ni alta que completar.
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  const { guia, paso } = await searchParams
  const [resumenReal, catalogo, tramos] = await Promise.all([
    getResumenPanel(),
    getCatalogo(),
    getTramos(),
  ])
  const resumen = resumenReal ?? RESUMEN_DEMO

  // En modo demo no hay nadie que termine la guía: se muestra el panel, y la
  // guía queda a un clic en la barra lateral.
  const guiaPendiente = isSupabaseConfigured && !tienda?.onboarded_at
  if (guiaPendiente || guia === "1" || paso) {
    return (
      <GuiaDeInicio
        nombre={resumen.tienda.name}
        pasoInicial={Number(paso) || 1}
        productos={catalogo.productos.length}
        categorias={catalogo.categorias.length}
        tramos={tramos}
        terminar={terminarGuia}
      />
    )
  }

  const url = urlDeTienda(resumen.tienda.slug)
  const qr = await toDataURL(url, { size: 320, margin: 1, dark: "#16171a" })
  const ultimos = catalogo.productos.slice(0, 5)
  const sinStock = catalogo.productos.filter((p) => p.stock === 0).length

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
  if (sinStock > 0) {
    pendientes.push({
      texto: `${formatNumber(sinStock)} ${sinStock === 1 ? "producto se quedó" : "productos se quedaron"} sin stock: nadie puede comprarlos.`,
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
      texto: `${formatNumber(resumen.vendedoresPendientes)} ${resumen.vendedoresPendientes === 1 ? "promotor quiere" : "promotores quieren"} vender lo tuyo.`,
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
          className="group inline-flex min-h-11 items-center gap-2 rounded-plantilla border-2 border-tinta px-5 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"
        >
          Ver mi página
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      <section>
        <Encabezado
          etiqueta="Tu negocio en los últimos 30 días"
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
            etiqueta="Promotores activos"
            valor={formatNumber(resumen.vendedoresActivos)}
            detalle={
              resumen.vendedoresActivos > 0
                ? "Promocionando lo tuyo"
                : "Todavía ninguno"
            }
          />
          <Cifra
            etiqueta="Productos"
            valor={formatNumber(catalogo.productos.length)}
            detalle={
              sinStock > 0
                ? `${formatNumber(sinStock)} sin stock`
                : "Todos con stock"
            }
            alerta={sinStock > 0}
          />
        </div>
      </section>

      <section>
        <Encabezado
          etiqueta="Tu catálogo"
          titulo={
            catalogo.productos.length === 0
              ? "Todavía sin productos"
              : catalogo.productos.length === 1
                ? "1 producto publicado"
                : `${formatNumber(catalogo.productos.length)} productos publicados`
          }
          accion={
            catalogo.productos.length > 0
              ? { href: "/panel/productos", texto: "Ver todo" }
              : undefined
          }
        />
        <p className="mt-3 max-w-[58ch] text-sm leading-relaxed opacity-70">
          {catalogo.productos.length === 0
            ? "Sin productos no hay nada que los promotores puedan elegir. Cárgalos uno por uno o todos juntos desde un Excel."
            : "El precio que ve quien compra sale de lo que tú quieres recibir: le sumamos la comisión del promotor y nuestra parte. Acá ajustas el stock sin entrar a cada producto."}
        </p>

        {catalogo.productos.length > 0 ? (
          <div className="mt-8">
            <ListaProductos
              productos={ultimos}
              soloLectura={catalogo.esDemo}
              acciones={{
                alternar: alternarProducto,
                ajustarStock,
                borrar: borrarProducto,
              }}
            />
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/panel/productos/nuevo"
            className={cn(
              catalogo.productos.length === 0
                ? BOTON_PRIMARIO
                : BOTON_SECUNDARIO,
              "sm:w-auto"
            )}
          >
            <Plus aria-hidden="true" className="size-4" />
            {catalogo.productos.length === 0
              ? "Cargar un producto"
              : "Cargar otro producto"}
          </Link>
          <Link
            href="/panel/productos/importar"
            className={cn(BOTON_SECUNDARIO, "sm:w-auto")}
          >
            <FileSpreadsheet aria-hidden="true" className="size-4" />
            Cargar desde un Excel
          </Link>
        </div>
      </section>

      <section className="border-t-2 border-tinta pt-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <div>
            <Encabezado
              etiqueta="Tus números"
              titulo="Pregúntale a tu negocio"
            />
            <p className="mt-3 max-w-[48ch] text-sm leading-relaxed opacity-70">
              Escribes una pregunta como se la harías a alguien y te responde
              con un gráfico hecho con tus ventas. Solo se leen tus datos.
            </p>
            <Link
              href="/panel/estadisticas"
              className={cn(BOTON_SECUNDARIO, "mt-6 w-full sm:w-auto")}
            >
              <BarChart3 aria-hidden="true" className="size-4" />
              Abrir mis estadísticas
            </Link>
          </div>

          <ul className="border-t border-tinta/15">
            {[
              "¿Qué producto se vendió más este mes?",
              "¿Cuánto vendí por semana en los últimos tres meses?",
              "¿Qué promotores me trajeron más ventas?",
            ].map((pregunta) => (
              <li key={pregunta}>
                <Link
                  href="/panel/estadisticas"
                  className="group flex min-h-11 items-center justify-between gap-4 border-b border-tinta/15 py-4 text-sm transition-colors hover:text-senal"
                >
                  <span className="font-titular font-bold tracking-[-0.01em]">
                    {pregunta}
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-4 shrink-0 opacity-40 transition-opacity group-hover:opacity-100"
                  />
                </Link>
              </li>
            ))}
          </ul>
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
            Imprímelo y pégalo donde vendes. Lleva directo a tu página.
          </p>
        </div>
      </section>
    </div>
  )
}
