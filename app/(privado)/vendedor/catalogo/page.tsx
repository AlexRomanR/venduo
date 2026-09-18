import { getProductosVitrina } from "@/lib/data/vitrina"
import type {
  OrdenVitrina,
  PrecioVitrina,
  PublicadoVitrina,
} from "@/lib/data/vitrina"
import { formatNumber } from "@/lib/format"
import {
  Buscador,
  FiltrosCatalogo,
  Paginacion,
} from "@/components/promotor/controles"
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
  searchParams: Promise<{
    q?: string
    p?: string
    categoria?: string
    condicion?: string
    precio?: string
    publicado?: string
    orden?: string
  }>
}) {
  const { q, p, categoria, condicion, precio, publicado, orden } =
    await searchParams
  const pagina = Math.max(1, Number.parseInt(p ?? "1", 10) || 1)
  const filtros = {
    q,
    pagina,
    categoria,
    condicion: esCondicion(condicion) ? condicion : undefined,
    precio: esPrecio(precio) ? precio : undefined,
    publicado: esPublicado(publicado) ? publicado : undefined,
    orden: esOrden(orden) ? orden : undefined,
  }
  const { items, total, paginas, categorias } =
    await getProductosVitrina(filtros)
  const hayFiltros = Boolean(categoria || condicion || precio || publicado)

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-14">
        <div>
          <h1 className="max-w-[18ch] font-titular text-[clamp(1.9rem,5vw,2.75rem)] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance">
            Encuentra el producto que mejor puedes vender.
          </h1>
          <p className="mt-3 max-w-[52ch] leading-relaxed opacity-70">
            Compara cuánto ganas, el precio que verá tu comprador, el stock y
            cuándo se publicó. Abre uno y crea tu enlace sin esperar aprobación.
          </p>
        </div>
        <Buscador etiqueta="Busca un producto: polera, café, mochila…" />
      </div>

      <FiltrosCatalogo categorias={categorias} />

      <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
        {formatNumber(total)} {total === 1 ? "producto" : "productos"}
        {q
          ? ` para «${q}»`
          : ` ${total === 1 ? "disponible" : "disponibles"} para promocionar`}
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
            {q || hayFiltros
              ? "Ningún producto coincide"
              : "El catálogo está vacío por ahora"}
          </h2>
          <p className="mt-2 max-w-[52ch] leading-relaxed opacity-70">
            {q || hayFiltros
              ? "Cambia uno de los filtros o límpialos para volver a ver todo el catálogo."
              : "Los negocios están cargando sus productos. Vuelve en un rato: cada producto nuevo aparece acá al instante."}
          </p>
        </div>
      )}

      <Paginacion
        pagina={pagina}
        paginas={paginas}
        base="/vendedor/catalogo"
        parametros={{ q, categoria, condicion, precio, publicado, orden }}
      />
    </div>
  )
}

function esCondicion(
  valor?: string
): valor is "nuevo" | "segunda_mano" | "reacondicionado" {
  return ["nuevo", "segunda_mano", "reacondicionado"].includes(valor ?? "")
}

function esPrecio(valor?: string): valor is PrecioVitrina {
  return ["hasta_100", "100_300", "300_700", "700_mas"].includes(valor ?? "")
}

function esPublicado(valor?: string): valor is PublicadoVitrina {
  return ["7", "30", "90"].includes(valor ?? "")
}

function esOrden(valor?: string): valor is OrdenVitrina {
  return [
    "recientes",
    "precio_asc",
    "precio_desc",
    "stock_desc",
    "ofertas",
  ].includes(valor ?? "")
}
