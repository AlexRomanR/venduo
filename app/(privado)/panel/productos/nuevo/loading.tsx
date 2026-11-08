import { EsqueletoDePantalla } from "@/components/panel/esqueleto"

export default function Cargando() {
  return (
    <EsqueletoDePantalla
      bajada="Con foto, nombre y precio ya se puede vender."
      titulo="Un producto nuevo."
      resaltar="nuevo"
      forma="formulario"
      volver="Productos"
      angosta
    />
  )
}
