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

/**
 * El número para abrir un chat de WhatsApp, con el código de Bolivia.
 *
 * El comprador escribe su celular como lo dicta —"70145823"— y `wa.me` pide el
 * número internacional: sin el 591 abría un chat con nadie. Un número que ya
 * trae su código de país se deja como está.
 */
export function numeroDeWhatsApp(telefono: string): string {
  const digitos = telefono.replace(/\D/g, "")
  // Los celulares de Bolivia tienen ocho cifras y empiezan con 6 o 7.
  return /^[67]\d{7}$/.test(digitos) ? `591${digitos}` : digitos
}
