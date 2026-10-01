import { Suspense } from "react"
import { redirect } from "next/navigation"
import { EyeOff, PackageX, ShoppingBag, UserPlus } from "lucide-react"

import { getBarraLateral, type Contadores } from "@/lib/data/barra"
import { getMiTienda, getResumenPanel } from "@/lib/data/panel"
import { getTablero } from "@/lib/data/tablero"
import { RESUMEN_DEMO, tableroDeDemostracion } from "@/lib/demo-data"
import { isSupabaseConfigured } from "@/lib/env"
import { formatNumber } from "@/lib/format"
import {
  aparienciaDeTienda,
  PLANTILLAS,
  plantillaDeTienda,
} from "@/lib/plantillas"
import { pasosPendientes, type Tablero } from "@/lib/tablero"
import { urlDeTienda } from "@/lib/tienda"
import { AvisoSuscripcion } from "@/components/panel/aviso-suscripcion"
import { CabeceraDeTienda } from "@/components/panel/tablero/cabecera"
import { ComoTeVa } from "@/components/panel/tablero/como-te-va"
import { EsqueletoDelTablero } from "@/components/panel/tablero/esqueleto"
import { ParaHoy, type Pendiente } from "@/components/panel/tablero/para-hoy"
import { UltimosPedidos } from "@/components/panel/tablero/pedidos"
import { PrimerosPasos } from "@/components/panel/tablero/primeros-pasos"
import { MasVendidos, PorAcabarse } from "@/components/panel/tablero/productos"
import { TuRed } from "@/components/panel/tablero/red"

export const metadata = { title: "Resumen" }

/**
 * Resumen del emprendedor: la pantalla de entrada del panel.
 *
 * Se lee de arriba abajo en el orden en que se usa: qué espera una respuesta,
 * qué le falta a la tienda si es nueva, cómo vienen las ventas, y después el
 * detalle —pedidos, productos, la red—. Cada parte va en su propio panel, con
 * un título que dice para qué sirve.
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

  const [resumen, barra] = await Promise.all([
    getResumenPanel(),
    getBarraLateral(),
  ])
  const datos = resumen ?? RESUMEN_DEMO
  const clave = plantillaDeTienda(datos.tienda.templateKey)

  // La barra trae la tienda tal como la muestra la barra: así la cabecera y la
  // barra dicen lo mismo, también en modo demo.
  const deLaTienda = {
    nombre: barra.tienda?.nombre ?? datos.tienda.name,
    slug: barra.tienda?.slug ?? datos.tienda.slug,
    url: barra.tienda?.url ?? urlDeTienda(datos.tienda.slug),
    logoUrl: barra.tienda?.logoUrl ?? null,
    publicada: barra.tienda?.publicada ?? datos.tienda.isPublished,
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <CabeceraDeTienda
        persona={barra.persona.nombre}
        tienda={deLaTienda}
        apariencia={barra.apariencia ?? aparienciaDeTienda(clave, {})}
        plantilla={PLANTILLAS[clave].nombre}
      />

      <AvisoSuscripcion suscripcion={datos.suscripcion} />

      <Suspense fallback={<EsqueletoDelTablero />}>
        <ContenidoDelTablero
          contadores={barra.contadores}
          tienda={deLaTienda}
        />
      </Suspense>
    </div>
  )
}

/**
 * Lo que consulta la base, aparte de la cabecera: así la cabecera aparece al
 * instante y el resto llega en cuanto está, con su esqueleto mientras tanto.
 */
async function ContenidoDelTablero({
  contadores,
  tienda,
}: {
  contadores: Contadores
  tienda: { nombre: string; slug: string; url: string; publicada: boolean }
}) {
  const tablero = (await getTablero()) ?? tableroDeDemostracion()
  const pendientes = armarPendientes(tablero, contadores, tienda.publicada)
  const faltanPasos = pasosPendientes(tablero.pasos) > 0

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* En una tienda nueva sin nada pendiente, "Estás al día" contradecía a
          los primeros pasos que vienen justo debajo. */}
      {pendientes.length > 0 || !faltanPasos ? (
        <ParaHoy pendientes={pendientes} />
      ) : null}

      <PrimerosPasos pasos={tablero.pasos} tienda={tienda} />

      <ComoTeVa
        serie={tablero.serie}
        hoy={tablero.hoy}
        redActiva={tablero.red.activa}
      />

      <div className="grid gap-6 md:gap-8 xl:grid-cols-2">
        <UltimosPedidos pedidos={tablero.ultimosPedidos} />
        {/* Sin productos no hay qué rankear ni qué reponer: lo dicen los
            primeros pasos. */}
        {tablero.pasos.producto ? (
          <>
            <MasVendidos productos={tablero.masVendidos} />
            <PorAcabarse productos={tablero.porAcabarse} />
          </>
        ) : null}
        <TuRed red={tablero.red} />
      </div>
    </div>
  )
}

/**
 * Lo que espera una respuesta, en orden: primero lo que impide vender,
 * después lo que lo frena, después lo que lo mejora.
 *
 * Usa los contadores de la barra lateral y no los recalcula: los dos lugares
 * muestran los mismos números.
 */
function armarPendientes(
  tablero: Tablero,
  contadores: Contadores,
  publicada: boolean
): Pendiente[] {
  const pendientes: Pendiente[] = []
  const plural = (n: number, uno: string, varios: string) =>
    `${formatNumber(n)} ${n === 1 ? uno : varios}`

  if (!publicada) {
    pendientes.push({
      icono: EyeOff,
      texto: "Tu tienda está en borrador",
      detalle: "Nadie puede comprarte hasta que la publiques.",
      href: "/cuenta",
      accion: "Publicar",
      urgente: true,
    })
  }

  const { pendientes: sinPagar, pagados } = tablero.porGestionar
  if (sinPagar + pagados > 0) {
    pendientes.push({
      icono: ShoppingBag,
      texto: plural(
        sinPagar + pagados,
        "pedido espera tu respuesta",
        "pedidos esperan tu respuesta"
      ),
      detalle: [
        sinPagar > 0 ? plural(sinPagar, "pendiente", "pendientes") : null,
        pagados > 0
          ? plural(pagados, "pagado por enviar", "pagados por enviar")
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
      href: "/panel/pedidos",
      accion: "Ver pedidos",
      urgente: true,
    })
  }

  if (contadores.productosSinStock > 0) {
    pendientes.push({
      icono: PackageX,
      texto: plural(
        contadores.productosSinStock,
        "producto se quedó sin stock",
        "productos se quedaron sin stock"
      ),
      detalle: "Nadie puede comprarlos hasta que los repongas.",
      href: "/panel/productos",
      accion: "Reponer",
      urgente: true,
    })
  }

  if (tablero.red.pendientes > 0) {
    pendientes.push({
      icono: UserPlus,
      texto: plural(
        tablero.red.pendientes,
        "persona quiere vender para ti",
        "personas quieren vender para ti"
      ),
      detalle: "Apruébalas para que empiecen a compartir tus productos.",
      href: "/panel/vendedores",
      accion: "Revisar",
      urgente: false,
    })
  }

  return pendientes
}
