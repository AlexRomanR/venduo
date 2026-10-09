import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"

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
import { BLOQUES_CLASICOS } from "@/components/plantillas/clasica/bloques"
import type { KitDeTienda, PropsBloque } from "@/components/plantillas/kit"
import {
  PLACA,
  Tarjeta,
  Titulo,
  grilla,
} from "@/components/plantillas/pisada/piezas"

/**
 * Los bloques de Pisada.
 *
 * La portada es un lanzamiento: una placa oscura, el titular en cursiva que
 * se corre hacia la foto y, detrás, el nombre de la tienda en contorno, como
 * el número de una camiseta. Las categorías son fichas grandes con la foto en
 * un círculo: se tocan con el pulgar sin apuntar.
 */

function Portada({ bloque, tienda }: PropsBloque) {
  const foto = fotoDePortada(bloque, tienda)
  const titulo = texto(bloque, "title") ?? tienda.nombre
  const bajada = texto(bloque, "subtitle")
  const accion = accionDePortada(bloque) ?? "Ver los modelos"

  return (
    <section className="mx-auto w-full max-w-7xl px-3 pt-3 pb-10 md:px-5 md:pt-5 md:pb-16">
      <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-tinta text-papel">
        {/* El nombre en contorno, enorme y cortado: es fondo, no se lee. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[0.18em] -left-[0.04em] -z-10 font-titular text-[clamp(7rem,34vw,22rem)] leading-none whitespace-nowrap text-transparent italic opacity-25 [-webkit-text-stroke:1.5px_var(--papel)]"
        >
          {tienda.nombre}
        </span>

        <div
          className={cn(
            "grid gap-6 p-6 md:p-12",
            foto && "md:grid-cols-[1.05fr_1fr] md:items-center md:gap-10"
          )}
        >
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-papel/10 px-3 py-1.5 text-[11px] font-bold tracking-[0.1em] uppercase">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-senal-alta"
              />
              {tienda.nombre}
            </p>
            <h1 className="mt-5 font-titular text-[clamp(3.25rem,15vw,8.5rem)] leading-[0.84] italic">
              {titulo}
            </h1>
            {bajada ? (
              <p className="mt-5 max-w-[42ch] leading-relaxed opacity-85 md:text-lg">
                {bajada}
              </p>
            ) : null}
            <Link
              href={rutaDeTienda(tienda.slug, "/catalogo")}
              className="group mt-8 inline-flex min-h-13 items-center gap-3 rounded-plantilla bg-senal pr-2 pl-6 text-sm font-bold tracking-[0.06em] text-white uppercase transition-transform active:scale-[0.98]"
            >
              {accion}
              <span className="flex size-9 items-center justify-center rounded-full bg-white text-tinta transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transform-none">
                <ArrowRight aria-hidden="true" className="size-4" />
              </span>
            </Link>
          </div>

          {foto ? (
            <div className="relative aspect-square overflow-hidden rounded-[1.25rem] bg-papel/10 md:aspect-[4/5]">
              <Image
                src={foto}
                alt=""
                fill
                priority
                unoptimized
                sizes="(max-width: 768px) 100vw, 48vw"
                className="object-cover"
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function Categorias({ bloque, tienda }: PropsBloque) {
  const categorias = categoriasConFoto(tienda, numero(bloque, "limit") ?? 6)
  if (categorias.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-12 md:py-16">
      <Titulo titulo={texto(bloque, "title") ?? "Elige tu estilo"} />

      <ul className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {categorias.map((categoria) => (
          <li key={categoria.id}>
            <Link
              href={rutaDeTienda(tienda.slug, "/catalogo", {
                categoria: categoria.id,
              })}
              className={cn(
                "group flex min-h-24 items-center gap-4 p-3 pr-5 transition-colors hover:bg-tinta hover:text-papel active:scale-[0.99]",
                PLACA
              )}
            >
              <span className="relative size-[4.5rem] shrink-0 overflow-hidden rounded-full bg-papel">
                {categoria.foto ? (
                  <Image
                    src={categoria.foto}
                    alt=""
                    fill
                    unoptimized
                    sizes="72px"
                    className="object-cover transition-transform duration-500 group-hover:scale-110 motion-reduce:transform-none"
                  />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-titular text-[1.75rem] leading-none italic">
                  {categoria.nombre}
                </span>
                <span className="tabular mt-1 block text-xs font-semibold opacity-65">
                  {categoria.productos}{" "}
                  {categoria.productos === 1 ? "modelo" : "modelos"}
                </span>
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="size-5 shrink-0 transition-transform duration-300 group-hover:rotate-45 motion-reduce:transform-none"
              />
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
    <section className="mx-auto w-full max-w-7xl px-5 py-12 md:py-16">
      <Titulo
        titulo={texto(bloque, "title") ?? "Modelos"}
        enlace={{
          etiqueta: "Ver todo",
          href: rutaDeTienda(tienda.slug, "/catalogo"),
        }}
      />
      <div className={cn("mt-6", grilla(columnas))}>
        {productos.map((producto) => (
          <Tarjeta key={producto.id} producto={producto} tienda={tienda} />
        ))}
      </div>
    </section>
  )
}

function Llamado({ bloque, tienda }: PropsBloque) {
  const titulo = texto(bloque, "title")
  if (!titulo) return null
  const cuerpo = texto(bloque, "body")

  return (
    <section className="mx-auto w-full max-w-7xl px-3 py-6 md:px-5">
      <div className="flex flex-col items-start gap-6 rounded-[1.75rem] bg-senal px-6 py-12 text-white md:flex-row md:items-end md:justify-between md:px-12 md:py-16">
        <div>
          <h2 className="max-w-[14ch] font-titular text-[clamp(2.75rem,11vw,6rem)] leading-[0.86] italic">
            {titulo}
          </h2>
          {cuerpo ? (
            <p className="mt-4 max-w-[46ch] leading-relaxed">{cuerpo}</p>
          ) : null}
        </div>
        <Link
          href={rutaDeTienda(tienda.slug, "/catalogo")}
          className="inline-flex min-h-12 shrink-0 items-center gap-3 rounded-plantilla bg-white px-7 text-sm font-bold tracking-[0.06em] text-tinta uppercase transition-transform active:scale-[0.98]"
        >
          {texto(bloque, "buttonLabel") ?? "Ver el catálogo"}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  )
}

export const BLOQUES_PISADA: KitDeTienda["bloques"] = {
  ...BLOQUES_CLASICOS,
  hero: Portada,
  categories: Categorias,
  product_grid: Grilla,
  cta: Llamado,
}
