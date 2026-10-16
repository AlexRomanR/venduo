import Link from "next/link"
import { redirect } from "next/navigation"
import { Share2, ShoppingBag } from "lucide-react"

import { getPedidos, type FiltroPedidos } from "@/lib/data/pedidos"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { BOTON_SECUNDARIO } from "@/lib/estilos"
import {
  DIAS_PARA_CONCRETAR,
  grupoDeFecha,
  pedidoEnFila,
  tituloDePedido,
  type GrupoDeFecha,
} from "@/lib/pedidos"
import { enlaceLegible, urlDeTienda } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import { FranjaDeFichas } from "@/components/panel/fichas"
import { FichasDeCobro } from "@/components/panel/fichas-grandes"
import { Cabecera, Seccion, SinDatos } from "@/components/panel/piezas"
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
  const { pedidos, resumen, esDemo } = await getPedidos(filtro)

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
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera
        titulo="Tus pedidos."
        bajada="Llegan a tu WhatsApp. Márcalos pagados y se descuentan del stock."
      />

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
    </div>
  )
}
