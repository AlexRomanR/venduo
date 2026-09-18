import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getCatalogo } from "@/lib/data/catalogo"
import { getTramos } from "@/lib/data/precios"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { FormularioProducto } from "@/components/productos/formulario"
import { guardarProducto } from "../acciones"

export const metadata = { title: "Nuevo producto" }

export default async function NuevoProductoPage() {
  const tienda = await getMiTienda()
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  const [{ categorias }, tramos] = await Promise.all([
    getCatalogo(),
    getTramos(),
  ])

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/panel/productos"
        className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
      >
        <ArrowLeft
          aria-hidden="true"
          className="size-4 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transform-none"
        />
        Tu catálogo
      </Link>

      <h1 className="mt-6 max-w-[18ch] font-titular text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.02] font-extrabold tracking-[-0.03em]">
        Un producto nuevo.
      </h1>
      <p className="mt-3 max-w-[56ch] text-sm leading-relaxed opacity-70">
        Lo mínimo es el nombre, cuánto quieres recibir por él y cuántas unidades
        tienes. Lo demás hace que se venda mejor, y lo puedes completar después.
      </p>

      <div className="mt-12">
        <FormularioProducto
          tiendaId={tienda?.id ?? "demo"}
          categorias={categorias}
          tramos={tramos}
          guardar={guardarProducto}
        />
      </div>
    </div>
  )
}
