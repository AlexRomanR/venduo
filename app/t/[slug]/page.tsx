import { notFound } from "next/navigation"

import {
  codigoDeReferido,
  getReferido,
  getTiendaPublica,
} from "@/lib/data/tienda-publica"
import { Bloque, TarjetaProducto } from "@/components/tienda/bloques"
import { FiltrosTienda } from "@/components/tienda/filtros"
import {
  BarraDelCarrito,
  Cabecera,
  DatosDeLaTienda,
  Pie,
} from "@/components/tienda/marco"

/**
 * La tienda pública.
 *
 * Se arma con los bloques que sembró la plantilla, y debajo va el catálogo
 * completo con su filtro. Los bloques son la cara del negocio; el catálogo
 * filtrable es lo que la gente vino a usar, y por eso está siempre, aunque la
 * plantilla no traiga ninguna grilla.
 */
export default async function TiendaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = await params
  const tienda = await getTiendaPublica(slug)
  if (!tienda) notFound()

  const consulta = await searchParams
  // El código se propaga tal como vino; el cartel de "te trajo" depende de
  // poder resolver el nombre, que es otra cosa y puede fallar sin consecuencia.
  const codigo = codigoDeReferido(consulta.ref)
  const referido = await getReferido(tienda.id, codigo)

  const condicion =
    typeof consulta.condicion === "string" ? consulta.condicion : null
  const categoria =
    typeof consulta.categoria === "string" ? consulta.categoria : null

  const catalogo = tienda.productos.filter((p) => {
    if (categoria && p.category_id !== categoria) return false
    if (!condicion) return true
    // "oferta" no es una condición del producto: es tener precio anterior.
    if (condicion === "oferta") return Boolean(p.compare_at_price_cents)
    return p.condition === condicion
  })

  const usados = tienda.productos.filter((p) => p.condition !== "nuevo").length

  return (
    <>
      <Cabecera
        nombre={tienda.nombre}
        slug={tienda.slug}
        logoUrl={tienda.logoUrl}
        referido={referido}
      />

      <main className="flex-1">
        {tienda.bloques.length === 0 ? (
          <section className="py-16 md:py-24">
            <div className="mx-auto w-full max-w-6xl px-5">
              <h1 className="max-w-[16ch] font-titular text-[clamp(2.5rem,9vw,5rem)] leading-[0.98] font-extrabold tracking-[-0.04em]">
                {tienda.nombre}
              </h1>
              {tienda.descripcion ? (
                <p className="mt-6 max-w-[52ch] text-lg leading-relaxed opacity-70">
                  {tienda.descripcion}
                </p>
              ) : null}
            </div>
          </section>
        ) : (
          tienda.bloques
            // La grilla de la plantilla sobra: abajo está el catálogo completo
            // con su filtro, y dos grillas seguidas se leen como un error.
            .filter((b) => b.tipo !== "product_grid")
            .map((bloque) => (
              <Bloque
                key={bloque.id}
                bloque={bloque}
                productos={tienda.productos}
                slug={tienda.slug}
                codigo={codigo}
              />
            ))
        )}

        <DatosDeLaTienda
          nombre={tienda.nombre}
          // Con bloques, la descripción puede no aparecer en ninguno: se
          // muestra acá. Sin bloques ya salió en la portada de respaldo.
          descripcion={
            tienda.bloques.some((b) => b.tipo === "about")
              ? null
              : tienda.bloques.length === 0
                ? null
                : tienda.descripcion
          }
          whatsapp={tienda.whatsapp}
          productos={tienda.productos.length}
          comisionBps={tienda.comisionBps}
          aceptaVendedores={tienda.aceptaVendedores}
        />

        <section
          id="catalogo"
          className="scroll-mt-20 border-t-2 border-tinta py-14 md:py-16"
        >
          <div className="mx-auto w-full max-w-6xl px-5">
            <h2 className="font-titular text-[clamp(1.75rem,5vw,2.75rem)] leading-tight font-extrabold tracking-[-0.03em]">
              El catálogo
            </h2>

            <div className="mt-8">
              <FiltrosTienda
                categorias={tienda.categorias}
                usados={usados}
                total={tienda.productos.length}
                mostrando={catalogo.length}
              />
            </div>

            {catalogo.length === 0 ? (
              <p className="mt-12 max-w-[48ch] leading-relaxed opacity-55">
                {tienda.productos.length === 0
                  ? "Esta tienda todavía no cargó sus productos. Vuelve en un rato."
                  : "Nada coincide con ese filtro. Prueba con otro, o mira todo el catálogo."}
              </p>
            ) : (
              <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {catalogo.map((producto) => (
                  <TarjetaProducto
                    key={producto.id}
                    producto={producto}
                    slug={tienda.slug}
                    codigo={codigo}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Pie nombre={tienda.nombre} />
      <BarraDelCarrito slug={tienda.slug} />
    </>
  )
}
