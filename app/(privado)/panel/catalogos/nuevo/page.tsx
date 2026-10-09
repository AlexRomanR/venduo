import { redirect } from "next/navigation"

import {
  getMaterialDelCatalogo,
  plantillasDeCatalogoVisibles,
} from "@/lib/data/catalogos"
import { funcionesDeMiTienda } from "@/lib/data/funciones"
import { getMiTienda } from "@/lib/data/panel"
import { isCanvaConfigured, isSupabaseConfigured } from "@/lib/env"
import { Constructor } from "@/components/catalogos/editor/constructor"

// La IA de esta pantalla corre en sus acciones: con un tope explícito, un
// pedido que se demora termina con un aviso en vez de quedar colgado.
export const maxDuration = 60

export const metadata = { title: "Nuevo catálogo" }

/** Armar un catálogo: productos, plantilla y edición, en la misma pantalla. */
export default async function NuevoCatalogoPage() {
  const [tienda, material, funciones, plantillas] = await Promise.all([
    getMiTienda(),
    getMaterialDelCatalogo(),
    funcionesDeMiTienda(),
    plantillasDeCatalogoVisibles(),
  ])
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")
  if (funciones.catalogos !== "activa") redirect("/panel")

  const { datos, estiloDeTienda, plantillaDeLaTienda, esDemo } = material

  return (
    <Constructor
      datos={datos}
      estiloDeTienda={estiloDeTienda}
      plantillaDeLaTienda={plantillaDeLaTienda}
      esDemo={esDemo}
      canva={isCanvaConfigured && !esDemo ? "directo" : "a-mano"}
      funciones={{
        ia: funciones.ia_catalogos,
        canva: funciones.canva,
        compartir: funciones.catalogo_compartido,
      }}
      plantillas={plantillas}
      inicial={null}
    />
  )
}
