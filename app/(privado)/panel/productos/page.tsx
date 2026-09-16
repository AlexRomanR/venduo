import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus, Tags } from "lucide-react"

import { getCatalogo, type FiltrosCatalogo } from "@/lib/data/catalogo"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { formatMoney, formatNumber } from "@/lib/format"
import type { ProductCondition } from "@/types"
import { Cifra, Encabezado, Vacio } from "@/components/panel/piezas"
import { FiltrosCatalogo as Filtros } from "@/components/productos/filtros"
import { ListaProductos } from "@/components/productos/lista"
import { ajustarStock, alternarProducto, borrarProducto } from "./acciones"

export const metadata = { title: "Productos" }

/**
 * El catálogo del emprendedor.
 *
 * Las cifras de arriba se calculan sobre todo el catálogo y no sobre lo
 * filtrado: son el estado del negocio, no el pie de la tabla. Las dos que
 * pueden pedir una acción —lo que se está por acabar y lo que ya se acabó— van
 * en rojo, y el resto en tinta, para que el acento siga queriendo decir algo.
 */
export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const tienda = await getMiTienda()
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  const parametros = await searchParams
  const texto = (clave: string) => {
    const valor = parametros[clave]
    return typeof valor === "string" ? valor : undefined
  }

  const filtros: FiltrosCatalogo = {
    buscar: texto("buscar"),
    categoria: texto("categoria"),
    condicion: texto("condicion") as ProductCondition | undefined,
    estado: texto("estado"),
    orden: texto("orden"),
  }

  const { productos, categorias, resumen, esDemo } = await getCatalogo(filtros)
  const hayFiltros = Object.values(filtros).some(Boolean)

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div>
          <h1 className="max-w-[18ch] font-titular text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.02] font-extrabold tracking-[-0.03em]">
            Tu catálogo.
          </h1>
          <p className="mt-3 max-w-[54ch] text-sm leading-relaxed opacity-70">
            Lo que vendes, a qué precio y cuánto te queda. Esto mismo es lo que
            ve quien entra a tu tienda y lo que reparten tus vendedores.
            {esDemo ? (
              <>
                {" "}
                <span className="font-semibold">
                  Estás en modo demo: los productos son de ejemplo y los cambios
                  no se guardan.
                </span>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/panel/productos/categorias"
            className="flex min-h-11 items-center gap-2 rounded-sm border-2 border-tinta px-4 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"
          >
            <Tags aria-hidden="true" className="size-4" />
            Categorías
          </Link>

          <Link
            href="/panel/productos/nuevo"
            className="flex min-h-11 items-center gap-2 rounded-sm bg-senal px-4 text-sm font-semibold text-white transition-colors hover:bg-senal-alta"
          >
            <Plus aria-hidden="true" className="size-4" />
            Nuevo producto
          </Link>
        </div>
      </div>

      <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          etiqueta="En catálogo"
          valor={formatNumber(resumen.total)}
          detalle={`${resumen.activos} publicados · ${resumen.ocultos} ocultos`}
        />
        <Cifra
          etiqueta="Unidades"
          valor={formatNumber(resumen.unidades)}
          detalle={`${resumen.conVendedores} abiertos a vendedores`}
        />
        <Cifra
          etiqueta="Vale tu stock"
          valor={formatMoney(resumen.valorInventarioCents)}
          detalle="Precio por unidades en mano"
        />
        <Cifra
          etiqueta="Piden reposición"
          valor={formatNumber(resumen.sinStock + resumen.pocoStock)}
          detalle={`${resumen.sinStock} agotados · ${resumen.pocoStock} por acabarse`}
          alerta={resumen.sinStock + resumen.pocoStock > 0}
        />
      </div>

      <section className="border-t border-tinta/15 pt-10">
        <Filtros categorias={categorias} />

        <div className="mt-10">
          {productos.length === 0 ? (
            hayFiltros ? (
              <Vacio
                titulo="Nada coincide con ese filtro"
                detalle="Prueba quitando alguno, o busca por otra palabra. El catálogo completo sigue ahí."
              />
            ) : (
              <Vacio
                titulo="Todavía no cargaste ningún producto"
                detalle="Carga el primero con su foto, su precio y cuántas unidades tienes. Desde ese momento tu tienda tiene qué mostrar y tus vendedores qué repartir."
                accion={{
                  href: "/panel/productos/nuevo",
                  texto: "Cargar el primero",
                }}
              />
            )
          ) : (
            <>
              <Encabezado
                etiqueta={
                  hayFiltros
                    ? `${productos.length} de ${resumen.total}`
                    : `${resumen.total} ${resumen.total === 1 ? "producto" : "productos"}`
                }
              />

              <div className="mt-6">
                <ListaProductos
                  productos={productos}
                  soloLectura={esDemo}
                  acciones={{
                    alternar: alternarProducto,
                    ajustarStock,
                    borrar: borrarProducto,
                  }}
                />
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
