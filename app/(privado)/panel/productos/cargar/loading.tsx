import { EsqueletoDePantalla } from "@/components/panel/esqueleto"

export default function Cargando() {
  return (
    <EsqueletoDePantalla
      bajada="Sube lo que ya tienes. Revisas todo antes de crearlo."
      titulo="Carga varios a la vez."
      resaltar="varios"
      forma="formulario"
      volver="Productos"
      angosta
    />
  )
}
