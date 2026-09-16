import { SeccionPendiente } from "@/components/panel/seccion-pendiente"

export const metadata = { title: "Pedidos" }

export default function PedidosPage() {
  return (
    <SeccionPendiente
      titulo="Pedidos"
      detalle="Confirma pagos y coordina la entrega."
      loQueVa="Aquí vas a ver cada pedido con su comprobante de pago por QR, y desde acá vas a abrir la conversación de WhatsApp con el comprador para coordinar la entrega."
    />
  )
}
