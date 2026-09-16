import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getCatalogo } from "@/lib/data/catalogo"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { Categorias } from "@/components/productos/categorias"
import { borrarCategoria, guardarCategoria } from "../acciones"

export const metadata = { title: "Categorías" }

export default async function CategoriasPage() {
  const tienda = await getMiTienda()
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  const { categorias, esDemo } = await getCatalogo()

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
        Categorías.
      </h1>
      <p className="mt-3 max-w-[58ch] text-sm leading-relaxed opacity-70">
        Son los cajones de tu tienda. Quien entra las usa para encontrar lo que
        busca sin recorrer todo. Renombrar una arrastra a sus productos, y
        borrarla no borra ninguno: quedan sin categoría.
        {esDemo ? (
          <>
            {" "}
            <span className="font-semibold">
              Estás en modo demo: los cambios no se guardan.
            </span>
          </>
        ) : null}
      </p>

      <div className="mt-12">
        <Categorias
          categorias={categorias}
          soloLectura={esDemo}
          guardar={guardarCategoria}
          borrar={borrarCategoria}
        />
      </div>
    </div>
  )
}
