import { EsqueletoDePantalla } from "@/components/panel/esqueleto"

export default function Cargando() {
  return (
    <EsqueletoDePantalla
      bajada="Son los cajones de tu tienda: quien entra las usa para encontrar lo que busca sin recorrer todo."
      titulo="Categorías."
      resaltar="Categorías"
      volver="Productos"
      angosta
    />
  )
}
