import { redirect } from "next/navigation"

import { getCatalogo } from "@/lib/data/catalogo"
import { funcionesDeMiTienda } from "@/lib/data/funciones"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { Cabecera, Volver } from "@/components/panel/piezas"
import { CargaDeProductos } from "@/components/productos/carga"
import {
  crearProductos,
  leerFotos,
  leerLista,
  leerColumnasDePlanilla,
} from "./acciones"

export const metadata = { title: "Cargar varios" }

// Leer una tanda de fotos con la IA puede tardar: la acción tiene su minuto.
export const maxDuration = 60

/**
 * Cargar varios productos a la vez, desde fotos, una planilla o una lista
 * escrita. La planilla anda aunque la IA esté apagada: se eligen las columnas
 * a mano.
 */
export default async function CargarProductosPage() {
  const tienda = await getMiTienda()
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  const [{ productos, categorias, esDemo }, funciones] = await Promise.all([
    getCatalogo(),
    funcionesDeMiTienda(),
  ])

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 md:gap-8">
      <Volver href="/panel/productos">Productos</Volver>

      <CargaDeProductos
        cabecera={
          <Cabecera
            titulo="Carga varios a la vez."
            bajada="Sube lo que ya tienes. Revisas todo antes de crearlo."
          />
        }
        tiendaId={tienda?.id ?? null}
        existentes={productos.map((p) => p.name)}
        categorias={categorias.map((c) => c.name)}
        conIa={funciones.ia_productos === "activa"}
        esDemo={esDemo}
        acciones={{
          leerFotos,
          leerLista,
          leerColumnasDePlanilla,
          crearProductos,
        }}
      />
    </div>
  )
}
