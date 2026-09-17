import type { OrderStatus } from "@/types"

/**
 * Los estados de un pedido, con su nombre en pantalla.
 *
 * Vive acá y no en `lib/data/pedidos.ts` porque lo leen componentes de cliente,
 * y ese módulo importa el cliente de servidor de Supabase: traerlo al navegador
 * rompe la compilación.
 */
export const ESTADOS: Array<{ valor: OrderStatus; etiqueta: string }> = [
  { valor: "pendiente", etiqueta: "Pendiente" },
  { valor: "pagado", etiqueta: "Pagado" },
  { valor: "enviado", etiqueta: "Enviado" },
  { valor: "entregado", etiqueta: "Entregado" },
  { valor: "cancelado", etiqueta: "Cancelado" },
]
