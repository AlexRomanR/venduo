import { notFound } from "next/navigation"

import {
  codigoDeReferido,
  getReferido,
  getTiendaPublica,
} from "@/lib/data/tienda-publica"
import { Bloque, TarjetaProducto } from "@/components/tienda/bloques"
import { Cabecera, Pie } from "@/components/tienda/marco"

/**
 * La tienda pública.
 *
 * Se arma con los bloques que sembró la plantilla al crear la tienda. Si una
 * tienda todavía no tiene bloques —o los tiene todos ocultos— igual muestra su
 * catálogo: un comercio recién creado es el estado normal durante una
 * demostración, no un caso raro.
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

  const tieneGrilla = tienda.bloques.some((b) => b.tipo === "product_grid")

  return (
    <>
      <Cabecera
        nombre={tienda.nombre}
        slug={tienda.slug}
        logoUrl={tienda.logoUrl}
        referido={referido}
      />

      <main>
        {tienda.bloques.length === 0 ? (
          <section className="py-20 md:py-28">
            <div className="mx-auto w-full max-w-5xl px-5">
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
          tienda.bloques.map((bloque) => (
            <Bloque
              key={bloque.id}
              bloque={bloque}
              productos={tienda.productos}
              slug={tienda.slug}
              codigo={codigo}
            />
          ))
        )}

        {/* Red de seguridad: si ningún bloque dibuja productos, el catálogo no
            puede quedar invisible. Es lo que la persona vino a ver. */}
        {!tieneGrilla && tienda.productos.length > 0 ? (
          <section className="border-t border-tinta/15 py-16 md:py-20">
            <div className="mx-auto w-full max-w-5xl px-5">
              <h2 className="font-titular text-[clamp(1.5rem,4vw,2.25rem)] leading-tight font-extrabold tracking-[-0.03em]">
                Nuestros productos
              </h2>

              <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {tienda.productos.map((producto) => (
                  <TarjetaProducto
                    key={producto.id}
                    producto={producto}
                    slug={tienda.slug}
                    codigo={codigo}
                  />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {tienda.productos.length === 0 ? (
          <section className="border-t border-tinta/15 py-16">
            <div className="mx-auto w-full max-w-5xl px-5">
              <p className="max-w-[48ch] leading-relaxed opacity-55">
                Esta tienda todavía no cargó sus productos. Vuelve en un rato.
              </p>
            </div>
          </section>
        ) : null}
      </main>

      <Pie nombre={tienda.nombre} />
    </>
  )
}
