import { notFound } from "next/navigation"

import {
  enlaceDeCatalogo,
  getCatalogo,
  getMaterialDelCatalogo,
} from "@/lib/data/catalogos"
import { isCanvaConfigured } from "@/lib/env"
import { Constructor } from "@/components/catalogos/editor/constructor"

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
  const [abierto, { datos, estiloDeTienda, plantillaDeLaTienda, esDemo }] =
    await Promise.all([getCatalogo(id), getMaterialDelCatalogo()])
  if (!abierto) notFound()

  return (
    <Constructor
      datos={datos}
      estiloDeTienda={estiloDeTienda}
      plantillaDeLaTienda={plantillaDeLaTienda}
      esDemo={esDemo}
      canva={isCanvaConfigured && !esDemo ? "directo" : "a-mano"}
      avisoDeCanva={typeof aviso === "string" ? aviso : null}
      inicial={{
        id: abierto.id,
        catalogo: abierto.catalogo,
        enlace: enlaceDeCatalogo(abierto.token),
      }}
    />
  )
}
