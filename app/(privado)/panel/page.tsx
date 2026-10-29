import { Suspense } from "react"
import { redirect } from "next/navigation"
import { after } from "next/server"
import { PackageMinus, PackageX, ShoppingBag } from "lucide-react"

import { rutaDeVistaDePlantilla } from "@/lib/api/miniaturas"
import { getBarraLateral, type Contadores } from "@/lib/data/barra"
import { getMiTienda, getResumenPanel } from "@/lib/data/panel"
import { getTablero } from "@/lib/data/tablero"
import { visitasDeMiTienda } from "@/lib/data/visitas"
import { RESUMEN_DEMO, tableroDeDemostracion } from "@/lib/demo-data"
import { isSupabaseConfigured } from "@/lib/env"
import { plantillaDeTienda } from "@/lib/plantillas"
import type { Tablero } from "@/lib/tablero"
import { urlDeTienda } from "@/lib/tienda"
import { deVacaciones } from "@/lib/vacaciones"
import { pedirVista, volvioDespuesDeLaCaptura } from "@/lib/vista"
import type { ResumenDeVisitas } from "@/lib/visitas-resumen"
import { AvisoSuscripcion } from "@/components/panel/aviso-suscripcion"
import {
  CabeceraDeTienda,
  type TiendaDelResumen,
} from "@/components/panel/tablero/cabecera"
import { ComoTeVa } from "@/components/panel/tablero/como-te-va"
import { EsqueletoDelTablero } from "@/components/panel/tablero/esqueleto"
import {
  ParaHoy,
  type Alerta,
  type Atajo,
} from "@/components/panel/tablero/para-hoy"
import { UltimosPedidos } from "@/components/panel/tablero/pedidos"
import { PrimerosPasos } from "@/components/panel/tablero/primeros-pasos"
import { MasVendidos, PorAcabarse } from "@/components/panel/tablero/productos"
import { FranjaDeVacaciones } from "@/components/panel/tablero/vacaciones"
import { PanelDeVisitas } from "@/components/panel/visitas"
import { guardarVacaciones } from "../cuenta/acciones"
import { cambiarEstado } from "./pedidos/acciones"
import { ajustarStock } from "./productos/acciones"

export const metadata = { title: "Resumen" }

/**
 * Resumen del emprendedor: la pantalla de entrada del panel.
 *
 * Se mira, no se lee, como el Inicio de la app: lo que espera algo en números
 * grandes que se tocan, las ventas que suben al aparecer, y los pedidos y los
 * productos por sus fotos. Lo que se hace todos los días se hace acá: cobrar
 * un pedido y reponer stock.
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

  const deLaTienda: TiendaDelResumen = {
    nombre: barra.tienda?.nombre ?? datos.tienda.name,
    slug: barra.tienda?.slug ?? datos.tienda.slug,
    url: barra.tienda?.url ?? urlDeTienda(datos.tienda.slug),
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
    <div className="flex flex-col gap-6 md:gap-8">
      <CabeceraDeTienda
        persona={barra.persona.nombre}
        tienda={deLaTienda}
        suscripcion={datos.suscripcion}
        vista={vista}
        escritorio={{
          url: tienda?.vista_escritorio_url ?? null,
          clave,
          apariencia: barra.apariencia,
        }}
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
    </div>
  )
}

/**
 * Lo que consulta la base, aparte de la cabecera: así la cabecera aparece al
 * instante y el resto llega en cuanto está, con su esqueleto mientras tanto.
 * Cada parte entra de a una, apenas desfasada.
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
  tienda: TiendaDelResumen
  sinWhatsApp: boolean
}) {
  const [leido, visitas] = await Promise.all([lectura, lecturaDeVisitas])
  const tablero = leido ?? tableroDeDemostracion()
  const soloLectura = tablero.esDemo || !isSupabaseConfigured
  const { alertas, atajos } = armarParaHoy(
    tablero,
    contadores,
    tienda.publicada,
    sinWhatsApp
  )

  // Arriba, a todo el ancho, lo que pide algo y cómo vienen las ventas; abajo,
  // en dos columnas en una pantalla ancha, los pedidos y los productos. En el
  // celular, una sola columna en el mismo orden que el Inicio de la app.
  const arriba = [
    <ParaHoy key="para-hoy" alertas={alertas} atajos={atajos} />,
    <PrimerosPasos key="pasos" pasos={tablero.pasos} tienda={tienda} />,
    <ComoTeVa
      key="ventas"
      serie={tablero.serie}
      hoy={tablero.hoy}
      conEstadisticas={conEstadisticas}
    />,
  ]
  const productos = tablero.pasos.producto
    ? [
        // Sin productos no hay qué rankear ni qué reponer: lo dicen los
        // primeros pasos.
        <MasVendidos key="mas-vendidos" productos={tablero.masVendidos} />,
        <PorAcabarse
          key="por-acabarse"
          productos={tablero.porAcabarse}
          ajustar={ajustarStock}
          soloLectura={soloLectura}
        />,
      ]
    : []

  let orden = 0
  const entra = (parte: React.ReactNode, clave: string) => (
    <div
      key={clave}
      className="panel-entra min-w-0 empty:hidden"
      style={{ "--orden": orden++ } as React.CSSProperties}
    >
      {parte}
    </div>
  )

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {arriba.map((parte, indice) => entra(parte, `arriba-${indice}`))}

      <div className="grid items-start gap-6 md:gap-8 xl:grid-cols-2">
        {entra(
          <UltimosPedidos
            pedidos={tablero.ultimosPedidos}
            cobrar={cambiarEstado}
            soloLectura={soloLectura}
          />,
          "pedidos"
        )}
        {productos.length > 0 ? (
          <div className="flex min-w-0 flex-col gap-6 empty:hidden md:gap-8">
            {productos.map((parte, indice) =>
              entra(parte, `productos-${indice}`)
            )}
          </div>
        ) : null}
      </div>

      {visitas ? entra(<PanelDeVisitas visitas={visitas} />, "visitas") : null}
    </div>
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
): { alertas: Alerta[]; atajos: Atajo[] } {
  const alertas: Alerta[] = []
  // Sin número, el botón de compra de la tienda no le escribe a nadie: es lo
  // primero, antes incluso que publicarla.
  if (sinWhatsApp)
    alertas.push({ texto: "Agrega tu WhatsApp", href: "/cuenta" })
  if (!publicada) alertas.push({ texto: "Publica tu tienda", href: "/cuenta" })

  const atajos: Atajo[] = [
    {
      valor: tablero.porGestionar.pendientes,
      etiqueta: "Por cobrar",
      icono: ShoppingBag,
      href: "/panel/pedidos?estado=pendiente",
      urgente: true,
    },
    {
      valor: contadores.productosSinStock,
      etiqueta: "Sin stock",
      icono: PackageX,
      href: "/panel/productos?estado=sin_stock",
      urgente: true,
    },
    {
      valor: contadores.productosPocoStock,
      etiqueta: "Queda poco",
      icono: PackageMinus,
      href: "/panel/productos?estado=poco_stock",
      urgente: false,
    },
  ]

  return { alertas, atajos }
}
