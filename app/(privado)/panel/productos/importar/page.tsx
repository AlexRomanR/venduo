import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getCatalogo } from "@/lib/data/catalogo"
import { getMiTienda } from "@/lib/data/panel"
import { getTramos } from "@/lib/data/precios"
import { isSupabaseConfigured } from "@/lib/env"
import { ImportarPlanilla } from "@/components/productos/importar"
import { importarProductos } from "../acciones"

export const metadata = { title: "Cargar desde Excel" }

/**
 * Cargar el catálogo desde una planilla.
 *
 * Existe porque el negocio que llega con cuarenta productos no va a llenar
 * cuarenta formularios, y probablemente ya los tiene anotados en un Excel. Se
 * entra desde la guía del primer ingreso y desde la lista de productos; `desde`
 * dice a cuál volver.
 */
export default async function ImportarPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string }>
}) {
  const tienda = await getMiTienda()
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  const { desde } = await searchParams
  const desdeGuia = desde === "guia"

  const [{ categorias }, tramos] = await Promise.all([
    getCatalogo(),
    getTramos(),
  ])

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link
        href={desdeGuia ? "/panel?paso=1" : "/panel/productos"}
        className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
      >
        <ArrowLeft
          aria-hidden="true"
          className="size-4 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transform-none"
        />
        {desdeGuia ? "Volver a la guía" : "Tu catálogo"}
      </Link>

      <h1 className="mt-6 max-w-[18ch] font-titular text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.02] font-extrabold tracking-[-0.03em]">
        Carga todo tu catálogo de una vez.
      </h1>
      <p className="mt-3 max-w-[58ch] text-sm leading-relaxed opacity-70">
        Llena la plantilla con lo que vendes y cuánto quieres recibir por cada
        cosa. Nosotros calculamos el precio de cada uno y te lo mostramos antes
        de cargar.
      </p>

      <div className="mt-12">
        <ImportarPlanilla
          tramos={tramos}
          categoriasExistentes={categorias.map((c) => c.name)}
          importar={importarProductos}
          destino={desdeGuia ? "/panel?paso=2" : "/panel/productos"}
        />
      </div>
    </div>
  )
}
