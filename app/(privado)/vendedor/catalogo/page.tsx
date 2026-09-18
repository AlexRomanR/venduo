import { getProductosVitrina } from "@/lib/data/vitrina"
import { formatNumber } from "@/lib/format"
import { Buscador, Paginacion } from "@/components/promotor/controles"
import { TarjetaProducto } from "@/components/promotor/producto"

export const metadata = { title: "Catálogo para promocionar" }

/**
 * Todo lo que un promotor puede tomar.
 *
 * Sin filtros de negocio a propósito: el catálogo es uno solo, y lo que decide
 * qué promocionar es el producto y lo que deja, no de quién es.
 */
export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; p?: string }>
}) {
  const { q, p } = await searchParams
  const pagina = Math.max(1, Number.parseInt(p ?? "1", 10) || 1)
  const { items, total, paginas } = await getProductosVitrina({ q, pagina })

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-14">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
            Catálogo
          </p>
          <h1 className="mt-3 max-w-[16ch] font-titular text-[clamp(1.9rem,5vw,2.75rem)] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance">
            Elige qué vas a promocionar.
          </h1>
          <p className="mt-3 max-w-[52ch] leading-relaxed opacity-70">
            Cada producto de acá lo publicó un negocio para que lo vendas. Tocas
            Promocionar y tu enlace está listo, sin esperar a nadie.
          </p>
        </div>
        <Buscador etiqueta="Busca un producto: polera, café, mochila…" />
      </div>

      <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
        {formatNumber(total)} {total === 1 ? "producto" : "productos"}
        {q ? ` para «${q}»` : " disponibles"}
      </p>

      {items.length > 0 ? (
        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((producto, i) => (
            <TarjetaProducto key={producto.id} producto={producto} indice={i} />
          ))}
        </div>
      ) : (
        <div className="border-t-2 border-tinta pt-6">
          <h2 className="font-titular text-xl font-bold tracking-[-0.02em]">
            {q
              ? "Ningún producto coincide"
              : "El catálogo está vacío por ahora"}
          </h2>
          <p className="mt-2 max-w-[52ch] leading-relaxed opacity-70">
            {q
              ? "Prueba con otra palabra, o borra la búsqueda para ver todo."
              : "Los negocios están cargando sus productos. Vuelve en un rato: cada producto nuevo aparece acá al instante."}
          </p>
        </div>
      )}

      <Paginacion
        pagina={pagina}
        paginas={paginas}
        base="/vendedor/catalogo"
        q={q}
      />
    </div>
  )
}
