import Link from "next/link"

import { getProductosVitrina } from "@/lib/data/vitrina"
import { getSiteUrl } from "@/lib/env"
import { formatNumber } from "@/lib/format"
import { Buscador, Paginacion } from "@/components/explorar/controles"
import { ListaProductos } from "@/components/explorar/listas"

export const metadata = { title: "Productos para vender" }

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; p?: string }>
}) {
  const { q, p } = await searchParams
  const pagina = Math.max(1, Number.parseInt(p ?? "1", 10) || 1)

  const { items, total, paginas } = await getProductosVitrina({ q, pagina })

  return (
    <div>
      <h1 className="max-w-[16ch] font-titular text-[clamp(1.9rem,5vw,2.75rem)] leading-[1.04] font-extrabold tracking-[-0.03em] text-balance">
        Productos listos para vender.
      </h1>
      <p className="mt-4 max-w-[52ch] leading-relaxed opacity-70">
        Cada emprendedor marcó estos como disponibles para vendedores. Tomas el
        que quieras y recibes tu enlace al instante, sin esperar aprobación.
      </p>

      <div className="mt-8 max-w-[38rem]">
        <Buscador etiqueta="Buscar un producto por nombre" />
      </div>

      <p className="mt-6 text-xs font-semibold tracking-[0.12em] text-senal uppercase">
        {formatNumber(total)} {total === 1 ? "producto" : "productos"}
        {q ? ` para «${q}»` : ""}
      </p>

      <div className="mt-6">
        {items.length > 0 ? (
          <ListaProductos productos={items} siteUrl={getSiteUrl()} />
        ) : (
          <div className="border-t-2 border-tinta pt-6">
            <h2 className="font-titular text-xl font-bold tracking-[-0.02em]">
              {q
                ? "Ningún producto coincide"
                : "Todavía no hay productos sueltos"}
            </h2>
            <p className="mt-2 max-w-[52ch] leading-relaxed opacity-70">
              {q
                ? "Prueba con otra palabra, o mira la lista completa."
                : "Ninguna tienda marcó productos como disponibles para vendedores."}{" "}
              También puedes{" "}
              <Link
                href="/explorar/tiendas"
                className="font-semibold text-senal underline underline-offset-4"
              >
                sumarte a una tienda entera
              </Link>
              .
            </p>
          </div>
        )}
      </div>

      <Paginacion
        pagina={pagina}
        paginas={paginas}
        base="/explorar/productos"
        q={q}
      />
    </div>
  )
}
