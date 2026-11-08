import { EsqueletoDePantalla } from "@/components/panel/esqueleto"

export default function Cargando() {
  return (
    <EsqueletoDePantalla
      bajada="Lo que vendiste en el chat o en persona. Se descuenta del stock."
      titulo="Nueva venta."
      resaltar="venta"
      volver="Pedidos"
      forma="productos"
    />
  )
}
