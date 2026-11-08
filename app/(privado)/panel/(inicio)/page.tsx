import { Suspense } from "react"
import { redirect } from "next/navigation"
import { after } from "next/server"

import { rutaDeVistaDePlantilla } from "@/lib/api/miniaturas"
import { getBarraLateral, type Contadores } from "@/lib/data/barra"
import { getMiTienda, getResumenPanel } from "@/lib/data/panel"
import { getTablero } from "@/lib/data/tablero"
import { visitasDeMiTienda } from "@/lib/data/visitas"
import { RESUMEN_DEMO, tableroDeDemostracion } from "@/lib/demo-data"
import { isSupabaseConfigured } from "@/lib/env"
import { formatMoney, formatNumber } from "@/lib/format"
import { pedidoEnFila } from "@/lib/pedidos"
import { plantillaDeTienda } from "@/lib/plantillas"
import { totales, type Tablero } from "@/lib/tablero"
import { enlaceLegible, urlDeTienda } from "@/lib/tienda"
import { deVacaciones } from "@/lib/vacaciones"
import { pedirVista, volvioDespuesDeLaCaptura } from "@/lib/vista"
import type { ResumenDeVisitas } from "@/lib/visitas-resumen"
import { AvisoSuscripcion } from "@/components/panel/aviso-suscripcion"
import { EsqueletoDelTablero } from "@/components/panel/tablero/esqueleto"
import { FranjaDeVacaciones } from "@/components/panel/tablero/vacaciones"
import { Cierre } from "@/components/panel/resumen/cierre"
import {
  Entrada,
  type TiendaDeLaEntrada,
} from "@/components/panel/resumen/entrada"
import {
  ParaHoy,
  type Espera,
  type Pendiente,
} from "@/components/panel/resumen/para-hoy"
import { PrimerosPasos } from "@/components/panel/resumen/pasos"
import { Pedidos } from "@/components/panel/resumen/pedidos"
import { MasVendidos, PorAcabarse } from "@/components/panel/resumen/productos"
import { Resumen } from "@/components/panel/resumen/resumen"
import { Ventas } from "@/components/panel/resumen/ventas"
import { Visitas } from "@/components/panel/resumen/visitas"
import portada from "@/components/portada/portada.module.css"
import { guardarVacaciones } from "../../cuenta/acciones"
import { cambiarEstado } from "../pedidos/acciones"
import { ajustarStock } from "../productos/acciones"

export const metadata = { title: "Resumen" }

/**
 * Resumen del emprendedor: la pantalla de entrada del panel.
 *
 * Es el cuaderno de ventas del día, contado en escenas como la portada: la
 * tienda en un celular, lo que espera en notas pegadas, las ventas que crecen
 * en la escena oscura, los pedidos como tickets con su sello y lo que más se
 * vende como polaroids. Lo que se hace todos los días se hace acá: cobrar un
 * pedido y reponer stock.
 *
 * Quien todavía no eligió plantilla no tiene nada que resumir acá. La
 * comprobación es sobre `template_key` y no sobre la existencia de la tienda
 * porque es lo que marca que el alta terminó.
 */
export default async function PanelPage() {
  const tablero = getTablero().catch(() => null)
  const visitas = visitasDeMiTienda().catch(() => null)

  const [tienda, resumen, barra] = await Promise.all([
    getMiTienda(),
    getResumenPanel(),
    getBarraLateral(),
  ])

  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")
  const datos = resumen ?? RESUMEN_DEMO
  const clave = plantillaDeTienda(datos.tienda.templateKey)

  const url = barra.tienda?.url ?? urlDeTienda(datos.tienda.slug)
  const deLaTienda: TiendaDeLaEntrada = {
    nombre: barra.tienda?.nombre ?? datos.tienda.name,
    slug: barra.tienda?.slug ?? datos.tienda.slug,
    url,
    legible: enlaceLegible(url),
    logoUrl: barra.tienda?.logoUrl ?? null,
    publicada: barra.tienda?.publicada ?? datos.tienda.isPublished,
    pausada: barra.tienda?.pausada ?? false,
    deVacaciones: barra.tienda?.deVacaciones ?? false,
  }

  // La captura de la portada, la misma de la app. Si quedó vieja se saca otra
  // después de responder; mientras no haya, la miniatura de su plantilla.
  if (
    tienda &&
    deLaTienda.publicada &&
    !deLaTienda.pausada &&
    (!tienda.vista_at ||
      !tienda.vista_escritorio_url ||
      new Date(tienda.vista_at) < new Date(tienda.vista_cambio_at) ||
      volvioDespuesDeLaCaptura(
        tienda.vista_at,
        tienda.vacaciones_hasta,
        new Date()
      ))
  ) {
    const id = tienda.id
    after(() => pedirVista(id))
  }
  const vista = tienda?.vista_url
    ? { url: tienda.vista_url, real: true }
    : { url: rutaDeVistaDePlantilla(clave), real: false }

  return (
    <Resumen>
      <Entrada
        persona={barra.persona.nombre}
        tienda={deLaTienda}
        suscripcion={datos.suscripcion}
        vista={vista}
        frase={
          <Suspense fallback={<span className="opacity-0">…</span>}>
            <FraseDelDia tablero={tablero} />
          </Suspense>
        }
      />

      {tienda &&
      !deLaTienda.pausada &&
      deVacaciones({
        desde: tienda.vacaciones_desde,
        hasta: tienda.vacaciones_hasta,
      }) ? (
        <FranjaDeVacaciones
          hasta={tienda.vacaciones_hasta}
          reactivar={guardarVacaciones}
        />
      ) : null}

      <AvisoSuscripcion suscripcion={datos.suscripcion} />

      <Suspense fallback={<EsqueletoDelTablero />}>
        <ContenidoDelTablero
          tablero={tablero}
          visitas={visitas}
          conEstadisticas={barra.funciones.estadisticas === "activa"}
          contadores={barra.contadores}
          tienda={deLaTienda}
          sinWhatsApp={isSupabaseConfigured && !tienda?.whatsapp}
        />
      </Suspense>
    </Resumen>
  )
}

/**
 * Lo que pasó hoy, en una frase, debajo del nombre de la tienda: lo vendido y,
 * resaltado, lo que espera el cobro. Llega cuando la base respondió.
 */
async function FraseDelDia({
  tablero: lectura,
}: {
  tablero: Promise<Tablero | null>
}) {
  const tablero = (await lectura) ?? tableroDeDemostracion()
  const hoy = tablero.serie.at(-1)
  const semana = totales(tablero.serie.slice(-7))
  const pendientes = tablero.porGestionar.pendientes
  const pedidos = (n: number) =>
    `${formatNumber(n)} ${n === 1 ? "pedido" : "pedidos"}`

  const vendido =
    hoy && hoy.pedidos > 0
      ? `Hoy llevas ${formatMoney(hoy.ventasCents)} en ${pedidos(hoy.pedidos)}.`
      : semana.pedidos > 0
        ? `En la semana vendiste ${formatMoney(semana.ventasCents)} en ${pedidos(semana.pedidos)}.`
        : "Tu tienda está lista para recibir pedidos."

  return (
    <>
      {vendido}{" "}
      {pendientes > 0 ? (
        <span className={portada.resaltado}>
          {pendientes === 1
            ? "Un pedido espera tu cobro."
            : `${formatNumber(pendientes)} pedidos esperan tu cobro.`}
        </span>
      ) : null}
    </>
  )
}

/**
 * Lo que consulta la base, aparte de la entrada: así la tienda aparece al
 * instante y las escenas llegan en cuanto están, con su esqueleto mientras
 * tanto.
 */
async function ContenidoDelTablero({
  tablero: lectura,
  visitas: lecturaDeVisitas,
  conEstadisticas,
  contadores,
  tienda,
  sinWhatsApp,
}: {
  tablero: Promise<Tablero | null>
  visitas: Promise<ResumenDeVisitas | null>
  conEstadisticas: boolean
  contadores: Contadores
  tienda: TiendaDeLaEntrada
  sinWhatsApp: boolean
}) {
  const [leido, visitas] = await Promise.all([lectura, lecturaDeVisitas])
  const tablero = leido ?? tableroDeDemostracion()
  const soloLectura = tablero.esDemo || !isSupabaseConfigured
  const { pendientes, esperas } = armarParaHoy(
    tablero,
    contadores,
    tienda.publicada,
    sinWhatsApp
  )
  const ahora = new Date()
  const deLaTienda = {
    nombre: tienda.nombre,
    slug: tienda.slug,
    url: tienda.url,
    legible: tienda.legible,
  }

  return (
    <>
      <ParaHoy pendientes={pendientes} esperas={esperas} />
      <PrimerosPasos pasos={tablero.pasos} tienda={deLaTienda} />
      <Ventas
        serie={tablero.serie}
        hoy={tablero.hoy}
        conEstadisticas={conEstadisticas}
      />
      <Pedidos
        pedidos={tablero.ultimosPedidos.map((pedido) =>
          pedidoEnFila(pedido, ahora)
        )}
        cobrar={cambiarEstado}
        soloLectura={soloLectura}
        tienda={deLaTienda}
      />
      {/* Sin productos no hay qué rankear ni qué reponer: lo dicen los
          primeros pasos. */}
      {tablero.pasos.producto ? (
        <>
          <MasVendidos productos={tablero.masVendidos} />
          <PorAcabarse
            productos={tablero.porAcabarse}
            ajustar={ajustarStock}
            soloLectura={soloLectura}
          />
        </>
      ) : null}
      {visitas ? <Visitas visitas={visitas} /> : null}
      <Cierre tienda={deLaTienda} />
    </>
  )
}

/**
 * Lo que espera una respuesta: arriba lo que impide vender, dicho como lo que
 * hay que hacer; abajo, lo que espera contado en números.
 *
 * Usa los contadores de la barra lateral y no los recalcula: los dos lugares
 * muestran los mismos números.
 */
function armarParaHoy(
  tablero: Tablero,
  contadores: Contadores,
  publicada: boolean,
  sinWhatsApp: boolean
): { pendientes: Pendiente[]; esperas: Espera[] } {
  const pendientes: Pendiente[] = []
  // Sin número, el botón de compra de la tienda no le escribe a nadie: es lo
  // primero, antes incluso que publicarla.
  if (sinWhatsApp)
    pendientes.push({ texto: "Agrega tu WhatsApp", href: "/cuenta" })
  if (!publicada)
    pendientes.push({ texto: "Publica tu tienda", href: "/cuenta" })

  const esperas: Espera[] = [
    {
      clave: "cobrar",
      valor: tablero.porGestionar.pendientes,
      etiqueta: "Por cobrar",
      href: "/panel/pedidos?estado=pendiente",
      urgente: true,
    },
    {
      clave: "agotado",
      valor: contadores.productosSinStock,
      etiqueta: "Sin stock",
      href: "/panel/productos?estado=sin_stock",
      urgente: true,
    },
    {
      clave: "poco",
      valor: contadores.productosPocoStock,
      etiqueta: "Queda poco",
      href: "/panel/productos?estado=poco_stock",
      urgente: false,
    },
  ]

  return { pendientes, esperas }
}
