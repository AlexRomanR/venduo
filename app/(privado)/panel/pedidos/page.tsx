import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus, Share2, ShoppingBag } from "lucide-react"

import { getPedidos, type FiltroPedidos } from "@/lib/data/pedidos"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import {
  DIAS_PARA_CONCRETAR,
  grupoDeFecha,
  pedidoEnFila,
  tituloDePedido,
  type GrupoDeFecha,
} from "@/lib/pedidos"
import { PERIODOS, textoDePeriodo, type Periodo } from "@/lib/exportar"
import { enlaceLegible, urlDeTienda } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import { FranjaDeFichas } from "@/components/panel/fichas"
import { FichasDeCobro } from "@/components/panel/fichas-grandes"
import { Cabecera, Seccion, SinDatos } from "@/components/panel/piezas"
import { DescargarPedidos } from "@/components/panel/descargar"
import { CompartirTienda } from "@/components/panel/tablero/compartir"
import { ListaDePedidos, type Renglon } from "@/components/pedidos/lista"
import { cambiarEstado } from "./acciones"

export const metadata = { title: "Pedidos" }

const FILTROS: FiltroPedidos[] = [
  "pendiente",
  "pagado",
  "cancelado",
  "no_concretado",
]

const BOTON = cn(BOTON_SECUNDARIO, "min-h-11 px-4 text-sm")

/**
 * Los pedidos de la tienda, la misma pantalla de la app.
 *
 * Llegan por WhatsApp: el comprador manda su carrito con el número del pedido,
 * y acá queda registrado. Arriba, la plata: lo que falta cobrar y lo que ya
 * entró, que son también los dos filtros más usados. Debajo, los pedidos por
 * día y con la foto de lo que pidieron, que es por lo que se los reconoce.
 */
export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [tienda, consulta] = await Promise.all([getMiTienda(), searchParams])
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  const filtro = FILTROS.find((f) => f === consulta.estado)
  const { pedidos, resumen, porPeriodo, esDemo } = await getPedidos(filtro)

  const href = (valor?: FiltroPedidos) =>
    valor ? `/panel/pedidos?estado=${valor}` : "/panel/pedidos"
  // Tocar la ficha elegida la suelta: vuelve a todos.
  const alternar = (valor: FiltroPedidos) =>
    href(filtro === valor ? undefined : valor)

  const ahora = new Date()
  const renglones: Renglon[] = []
  let anterior: GrupoDeFecha | null = null
  for (const pedido of pedidos) {
    const grupo = grupoDeFecha(pedido.creado, ahora)
    if (grupo !== anterior) renglones.push({ tipo: "grupo", grupo })
    anterior = grupo
    renglones.push({
      tipo: "pedido",
      pedido: pedidoEnFila(
        {
          ...pedido,
          titulo: tituloDePedido(pedido),
          articulos: pedido.items.reduce((t, item) => t + item.cantidad, 0),
        },
        ahora
      ),
    })
  }

  return (
    <div className="flex flex-col gap-6 max-lg:pb-16 md:gap-8">
      <Cabecera
        titulo="Tus pedidos."
        bajada="Llegan a tu WhatsApp. Márcalos pagados y se descuentan del stock."
        accionesSoloEnPantallaAncha
      >
        <Link
          href="/panel/pedidos/nueva"
          className={cn(BOTON_PRIMARIO, "min-h-11 px-4 text-sm")}
        >
          <Plus aria-hidden="true" className="size-4" />
          Nueva venta
        </Link>
      </Cabecera>

      <FichasDeCobro
        cobros={[
          {
            etiqueta: "Por cobrar",
            cents: resumen.porCobrarCents,
            pedidos: resumen.pendientes,
            urgente: true,
            elegida: filtro === "pendiente",
            href: alternar("pendiente"),
          },
          {
            etiqueta: "Cobrado",
            cents: resumen.cobradoCents,
            pedidos: resumen.pagados,
            elegida: filtro === "pagado",
            href: alternar("pagado"),
          },
        ]}
      />

      <Seccion
        id="lista"
        icono={ShoppingBag}
        titulo="Los que llegaron"
        bajada="Toca uno para ver qué pidió."
        extra={
          resumen.total > 0 ? (
            <DescargarPedidos
              cuentas={porPeriodo}
              textos={
                Object.fromEntries(
                  PERIODOS.map(({ valor }) => [valor, textoDePeriodo(valor)])
                ) as Record<Periodo, string>
              }
              esDemo={esDemo}
            />
          ) : null
        }
      >
        <FranjaDeFichas
          etiqueta="Filtrar por estado"
          fichas={[
            {
              href: href(),
              nombre: "Todos",
              cuenta: resumen.total,
              activa: !filtro,
            },
            {
              href: href("pendiente"),
              nombre: "Pendientes",
              cuenta: resumen.pendientes,
              urgente: true,
              activa: filtro === "pendiente",
            },
            {
              href: href("pagado"),
              nombre: "Pagados",
              cuenta: resumen.pagados,
              activa: filtro === "pagado",
            },
            {
              href: href("cancelado"),
              nombre: "Cancelados",
              cuenta: resumen.cancelados,
              activa: filtro === "cancelado",
            },
            {
              href: href("no_concretado"),
              nombre: "No concretados",
              cuenta: resumen.noConcretados,
              activa: filtro === "no_concretado",
            },
          ]}
        />

        {renglones.length > 0 ? (
          <ListaDePedidos
            renglones={renglones}
            cobrar={cambiarEstado}
            soloLectura={esDemo}
          />
        ) : filtro ? (
          <SinDatos
            icono={ShoppingBag}
            titulo={
              filtro === "no_concretado"
                ? "Ningún pedido quedó sin concretar"
                : "No hay pedidos en ese estado"
            }
            texto={
              filtro === "no_concretado"
                ? `Los pendientes de más de ${DIAS_PARA_CONCRETAR} días. Si al final te pagan, igual se marcan pagados.`
                : "Prueba con otro filtro."
            }
          >
            <Link href={href()} scroll={false} className={BOTON}>
              Ver todos
            </Link>
          </SinDatos>
        ) : (
          <SinDatos
            icono={ShoppingBag}
            titulo="Todavía no llegó ningún pedido"
            texto="Comparte tu tienda: cada carrito que te manden por WhatsApp aparece aquí."
          >
            {tienda ? (
              <CompartirTienda
                nombre={tienda.name}
                slug={tienda.slug}
                url={urlDeTienda(tienda.slug)}
                legible={enlaceLegible(urlDeTienda(tienda.slug))}
              >
                <button type="button" className={BOTON}>
                  <Share2 aria-hidden="true" className="size-4" />
                  Compartir mi tienda
                </button>
              </CompartirTienda>
            ) : null}
          </SinDatos>
        )}
      </Seccion>

      {/* Lo vendido en el chat o en persona también baja el stock: el botón
          flota sobre las pestañas, al alcance del pulgar. */}
      <Link
        href="/panel/pedidos/nueva"
        className={cn(
          BOTON_PRIMARIO,
          "fixed right-4 bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] z-20 min-h-12 px-5 lg:hidden"
        )}
      >
        <Plus aria-hidden="true" className="size-5" />
        Nueva venta
      </Link>
    </div>
  )
}
