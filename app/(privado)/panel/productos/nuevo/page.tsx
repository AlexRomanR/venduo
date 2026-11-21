import Link from "next/link"
import { redirect } from "next/navigation"

import { getCatalogo } from "@/lib/data/catalogo"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { Cabecera, Volver } from "@/components/panel/piezas"
import { FormularioProducto } from "@/components/productos/formulario"
import { guardarProducto } from "../acciones"

export const metadata = { title: "Nuevo producto" }

/**
 * Un producto. Quien todavía no tiene ninguno llega antes a la carga de varios,
 * que es por donde conviene empezar; `?uno=1` es haber elegido este formulario.
 */
export default async function NuevoProductoPage({
  searchParams,
}: {
  searchParams: Promise<{ uno?: string }>
}) {
  const tienda = await getMiTienda()
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  const [{ uno }, { categorias, productos }] = await Promise.all([
    searchParams,
    getCatalogo(),
  ])
  if (productos.length === 0 && uno !== "1") {
    redirect("/panel/productos/cargar")
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 md:gap-8">
      <Volver href="/panel/productos">Productos</Volver>

      <Cabecera
        titulo="Un producto nuevo."
        resaltar="nuevo"
        bajada="Con foto, nombre y precio ya se puede vender."
      />
      <Link
        href="/panel/productos/cargar"
        className="-mt-3 inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold underline underline-offset-4 transition-colors hover:text-senal md:-mt-5"
      >
        ¿Son varios? Cárgalos de una vez
      </Link>

      <FormularioProducto
        tiendaId={tienda?.id ?? "demo"}
        categorias={categorias}
        guardar={guardarProducto}
      />
    </div>
  )
}
