import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import {
  accionDePortada,
  categoriasConFoto,
  fotoDePortada,
  numero,
  productosDeGrilla,
  texto,
} from "@/lib/plantillas/bloques"
import { rutaDeTienda } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import {
  PANO,
  Rotulo,
  Tarjeta,
  Titulo,
  grilla,
} from "@/components/plantillas/atelier/piezas"
import { BLOQUES_CLASICOS } from "@/components/plantillas/clasica/bloques"
import type { KitDeTienda, PropsBloque } from "@/components/plantillas/kit"

/**
 * Los bloques de Atelier.
 *
 * La portada es una página de revista: el titular en la didona a la izquierda
 * y la pieza a la derecha, entera, dentro de un paspartú. Las categorías se
 * pasan de lado como las vitrinas de una galería, una pieza por línea, y en la
 * computadora se ven todas.
 */

function Portada({ bloque, tienda }: PropsBloque) {
  const foto = fotoDePortada(bloque, tienda)
  const titulo = texto(bloque, "title") ?? tienda.nombre
  const bajada = texto(bloque, "subtitle")
  const accion = accionDePortada(bloque) ?? "Ver la colección"

  return (
    <section className="mx-auto w-full max-w-7xl px-5 pt-8 pb-14 md:pt-14 md:pb-20">
      <div
        className={cn(
          "grid gap-10",
          foto && "md:grid-cols-[1fr_1.1fr] md:items-end md:gap-16"
        )}
      >
        <div className={cn(foto && "md:pb-6")}>
          <Rotulo>{tienda.nombre}</Rotulo>
          <h1 className="mt-5 max-w-[13ch] font-titular text-[clamp(3rem,13vw,7rem)] leading-[0.95]">
            {titulo}
          </h1>
          {bajada ? (
            <p className="mt-6 max-w-[42ch] text-lg leading-relaxed opacity-80">
              {bajada}
            </p>
          ) : null}
          <Link
            href={rutaDeTienda(tienda.slug, "/catalogo")}
            className="group mt-9 inline-flex min-h-12 items-center gap-3 rounded-plantilla bg-tinta px-8 text-[11px] tracking-[0.22em] text-papel uppercase transition-colors hover:bg-senal hover:text-white active:scale-[0.98]"
          >
            {accion}
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transform-none"
            />
          </Link>
        </div>

        {foto ? (
          // El paspartú: la pieza entera, con un filete fino a su alrededor.
          <div
            className={cn(
              "relative aspect-[4/5] overflow-hidden p-6 md:p-10",
              PANO
            )}
          >
            <div className="relative size-full">
              <Image
                src={foto}
                alt=""
                fill
                priority
                unoptimized
                sizes="(max-width: 768px) 100vw, 55vw"
                className="object-contain"
              />
            </div>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-3 border border-tinta/20 md:inset-5"
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}

function Categorias({ bloque, tienda }: PropsBloque) {
  const categorias = categoriasConFoto(tienda, numero(bloque, "limit") ?? 6)
  if (categorias.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-7xl py-14 md:py-20">
      <div className="px-5">
        <Titulo titulo={texto(bloque, "title") ?? "Las líneas de la casa"} />
      </div>

      <ul className="mt-8 flex snap-x snap-mandatory scroll-px-5 [scrollbar-width:none] gap-4 overflow-x-auto px-5 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
        {categorias.map((categoria) => (
          <li
            key={categoria.id}
            className="w-[68%] shrink-0 snap-start sm:w-[42%] md:w-auto"
          >
            <Link
              href={rutaDeTienda(tienda.slug, "/catalogo", {
                categoria: categoria.id,
              })}
              className="group block"
            >
              <span
                className={cn(
                  "relative block aspect-[4/5] overflow-hidden",
                  PANO
                )}
              >
                {categoria.foto ? (
                  <Image
                    src={categoria.foto}
                    alt=""
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 70vw, 25vw"
                    className="object-contain p-[12%] transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transform-none"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center font-titular text-5xl italic opacity-30">
                    {categoria.nombre.charAt(0)}
                  </span>
                )}
              </span>
              <span className="mt-4 flex items-baseline justify-between gap-3 border-b border-tinta/20 pb-3">
                <span className="font-titular text-xl italic transition-colors group-hover:text-senal md:text-2xl">
                  {categoria.nombre}
                </span>
                <span className="tabular text-[11px] tracking-[0.18em] opacity-65">
                  {categoria.productos}{" "}
                  {categoria.productos === 1 ? "pieza" : "piezas"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Grilla({ bloque, tienda }: PropsBloque) {
  const productos = productosDeGrilla(bloque, tienda.productos)
  if (productos.length === 0) return null

  const columnas =
    numero(bloque, "columns") ?? tienda.apariencia.disposicion.columnas

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-14 md:py-20">
      <Titulo
        titulo={texto(bloque, "title") ?? "La colección"}
        enlace={{
          etiqueta: "Ver todo",
          href: rutaDeTienda(tienda.slug, "/catalogo"),
        }}
      />
      <div className={cn("mt-8", grilla(columnas))}>
        {productos.map((producto) => (
          <Tarjeta key={producto.id} producto={producto} tienda={tienda} />
        ))}
      </div>
    </section>
  )
}

/** Un texto de la casa: con foto, la pieza a un lado y la historia al otro. */
function Texto({ bloque }: PropsBloque) {
  const titulo = texto(bloque, "title")
  const cuerpo = texto(bloque, "body")
  const foto = texto(bloque, "imageUrl")
  if (!titulo && !cuerpo && !foto) return null

  return (
    <section
      className={cn(
        "mx-auto grid w-full max-w-7xl gap-10 px-5 py-14 md:py-20",
        foto && "md:grid-cols-2 md:items-center md:gap-20"
      )}
    >
      {foto ? (
        <div className={cn("relative aspect-square overflow-hidden", PANO)}>
          <Image
            src={foto}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-[10%]"
          />
        </div>
      ) : null}
      <div className={cn(!foto && "mx-auto max-w-3xl text-center")}>
        {titulo ? (
          <h2 className="font-titular text-[clamp(2.25rem,8vw,4.25rem)] leading-[1.02] italic">
            {titulo}
          </h2>
        ) : null}
        {cuerpo ? (
          <p className="mt-6 text-lg leading-relaxed opacity-80">{cuerpo}</p>
        ) : null}
      </div>
    </section>
  )
}

export const BLOQUES_ATELIER: KitDeTienda["bloques"] = {
  ...BLOQUES_CLASICOS,
  hero: Portada,
  categories: Categorias,
  product_grid: Grilla,
  about: Texto,
}
