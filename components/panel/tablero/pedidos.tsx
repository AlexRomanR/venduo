import { ShoppingBag } from "lucide-react"

import { pedidoEnFila } from "@/lib/pedidos"
import type { PedidoReciente } from "@/lib/tablero"
import type { OrderStatus } from "@/types"
import { Seccion, SinDatos } from "@/components/panel/piezas"
import { ListaDePedidos } from "@/components/pedidos/lista"

/**
 * Los pedidos más nuevos, con la misma fila que Pedidos y que la app: la foto
 * de lo que pidieron, y "Cobrado" a mano para confirmar un pago sin salir del
 * Resumen. En el celular van tres, como en el Inicio de la app; en una
 * pantalla ancha, cinco, junto a los productos.
 */
export function UltimosPedidos({
  pedidos,
  cobrar,
  soloLectura = false,
}: {
  pedidos: PedidoReciente[]
  cobrar: (
    id: string,
    estado: OrderStatus
  ) => Promise<{ ok: boolean; error?: string }>
  /** El modo demo: se ve todo, nada se guarda. */
  soloLectura?: boolean
}) {
  const ahora = new Date()

  return (
    <Seccion
      id="ultimos-pedidos"
      icono={ShoppingBag}
      titulo="Últimos pedidos"
      bajada="Los más nuevos. Márcalos cobrados apenas te paguen."
      accion={
        pedidos.length > 0
          ? { href: "/panel/pedidos", texto: "Ver todos" }
          : undefined
      }
    >
      {pedidos.length === 0 ? (
        <SinDatos
          icono={ShoppingBag}
          titulo="Todavía no llegó ningún pedido"
          texto="Comparte tu tienda: cada carrito que te manden por WhatsApp aparece aquí."
        />
      ) : (
        <ListaDePedidos
          renglones={pedidos.map((pedido) => ({
            tipo: "pedido",
            pedido: pedidoEnFila(pedido, ahora),
          }))}
          cobrar={cobrar}
          soloLectura={soloLectura}
          ocultarEnCelularDesde={3}
        />
      )}
    </Seccion>
  )
}
