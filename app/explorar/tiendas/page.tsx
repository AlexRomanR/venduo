import Link from "next/link"

import { getTiendasAbiertas } from "@/lib/data/vitrina"
import { formatNumber } from "@/lib/format"
import { Buscador, Paginacion } from "@/components/explorar/controles"
import { ListaTiendas } from "@/components/explorar/listas"

export const metadata = { title: "Tiendas que buscan vendedores" }

export default async function TiendasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; p?: string }>
}) {
  const { q, p } = await searchParams
  const pagina = Math.max(1, Number.parseInt(p ?? "1", 10) || 1)

  const { items, total, paginas } = await getTiendasAbiertas({ q, pagina })

  return (
    <div>
      <h1 className="max-w-[16ch] font-titular text-[clamp(1.9rem,5vw,2.75rem)] leading-[1.04] font-extrabold tracking-[-0.03em] text-balance">
        Tiendas que buscan vendedores.
      </h1>
      <p className="mt-4 max-w-[52ch] leading-relaxed opacity-70">
        Sumarte a una te habilita su catálogo completo. Algunas te aceptan al
        instante; otras revisan primero.
      </p>

      <div className="mt-8 max-w-[38rem]">
        <Buscador etiqueta="Buscar una tienda por nombre" />
      </div>

      <p className="mt-6 text-xs font-semibold tracking-[0.12em] text-senal uppercase">
        {formatNumber(total)} {total === 1 ? "tienda" : "tiendas"}
        {q ? ` para «${q}»` : ""}
      </p>

      <div className="mt-6">
        {items.length > 0 ? (
          <ListaTiendas tiendas={items} />
        ) : (
          <div className="border-t-2 border-tinta pt-6">
            <h2 className="font-titular text-xl font-bold tracking-[-0.02em]">
              {q
                ? "Ninguna tienda coincide"
                : "Todavía no hay tiendas abiertas"}
            </h2>
            <p className="mt-2 max-w-[52ch] leading-relaxed opacity-70">
              {q
                ? "Prueba con otra palabra, o mira la lista completa."
                : "Ninguna tienda tiene la red de vendedores activada ahora mismo."}{" "}
              También puedes{" "}
              <Link
                href="/explorar/productos"
                className="font-semibold text-senal underline underline-offset-4"
              >
                tomar productos sueltos
              </Link>
              .
            </p>
          </div>
        )}
      </div>

      <Paginacion
        pagina={pagina}
        paginas={paginas}
        base="/explorar/tiendas"
        q={q}
      />
    </div>
  )
}
