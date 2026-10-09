import { notFound, redirect } from "next/navigation"

import {
  enlaceDeCatalogo,
  getCatalogo,
  getMaterialDelCatalogo,
  plantillasDeCatalogoVisibles,
} from "@/lib/data/catalogos"
import { funcionesDeMiTienda } from "@/lib/data/funciones"
import { isCanvaConfigured } from "@/lib/env"
import { Constructor } from "@/components/catalogos/editor/constructor"

// La IA de esta pantalla corre en sus acciones: con un tope explícito, un
// pedido que se demora termina con un aviso en vez de quedar colgado.
export const maxDuration = 60

export const metadata = { title: "Editar catálogo" }

/** Un catálogo guardado, abierto en el editor con los productos de hoy. */
export default async function CatalogoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ canva?: string | string[] }>
}) {
  const [{ id }, { canva: aviso }] = await Promise.all([params, searchParams])
  const [
    abierto,
    { datos, estiloDeTienda, plantillaDeLaTienda, esDemo },
    funciones,
    plantillas,
  ] = await Promise.all([
    getCatalogo(id),
    getMaterialDelCatalogo(),
    funcionesDeMiTienda(),
    plantillasDeCatalogoVisibles(),
  ])
  if (funciones.catalogos !== "activa") redirect("/panel")
  if (!abierto) notFound()

  return (
    <Constructor
      datos={datos}
      estiloDeTienda={estiloDeTienda}
      plantillaDeLaTienda={plantillaDeLaTienda}
      esDemo={esDemo}
      canva={isCanvaConfigured && !esDemo ? "directo" : "a-mano"}
      avisoDeCanva={typeof aviso === "string" ? aviso : null}
      funciones={{
        ia: funciones.ia_catalogos,
        canva: funciones.canva,
        compartir: funciones.catalogo_compartido,
      }}
      plantillas={plantillas}
      inicial={{
        id: abierto.id,
        catalogo: abierto.catalogo,
        enlace: enlaceDeCatalogo(abierto.token),
      }}
    />
  )
}
