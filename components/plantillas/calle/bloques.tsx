import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"

import {
  accionDePortada,
  categoriasConFoto,
  filtroDeGrilla,
  fotoDePortada,
  numero,
  productosDeGrilla,
  texto,
} from "@/lib/plantillas/bloques"
import { rutaDeTienda } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import { BLOQUES_CLASICOS } from "@/components/plantillas/clasica/bloques"
import {
  Rotulo,
  Tarjeta,
  Titulo,
  grilla,
} from "@/components/plantillas/calle/piezas"
import type { KitDeTienda, PropsBloque } from "@/components/plantillas/kit"

/**
 * Los bloques de Calle.
 *
 * La portada es un afiche partido: el titular a la izquierda, enorme, y la
 * foto enmarcada a la derecha con el nombre de la tienda corriendo por su
 * borde. Las categorías no son fotos sino renglones de afiche que se invierten
 * al tocarlos: en una tienda de tandas, la persona busca por palabra —"buzos",
 * "gorras"— más que por imagen.
 */

function Portada({ bloque, tienda }: PropsBloque) {
  const foto = fotoDePortada(bloque, tienda)
  const titulo = texto(bloque, "title") ?? tienda.nombre
  const bajada = texto(bloque, "subtitle")
  const accion = accionDePortada(bloque) ?? "Ver lo nuevo"
  const catalogo = rutaDeTienda(tienda.slug, "/catalogo")

  return (
    <section className="border-b-2 border-tinta">
      <div
        className={cn(
          "mx-auto grid w-full max-w-7xl gap-8 px-5 py-10 md:py-16",
          foto && "md:grid-cols-[1.15fr_1fr] md:items-center md:gap-12"
        )}
      >
        <div>
          <Rotulo>{tienda.nombre}</Rotulo>
          <h1
            className={cn(
              "mt-4 font-titular break-words",
              foto
                ? "text-[clamp(3.5rem,17vw,9.5rem)]"
                : "max-w-[14ch] text-[clamp(3.75rem,19vw,12rem)]",
              // Después del tamaño: cn() descarta un interlineado anterior.
              "leading-[0.84]"
            )}
          >
            {titulo}
          </h1>
          {bajada ? (
            <p className="mt-6 max-w-[44ch] text-lg leading-relaxed opacity-80">
              {bajada}
            </p>
          ) : null}
          <Link
            href={catalogo}
            className="group mt-8 inline-flex min-h-13 items-center gap-3 rounded-plantilla border-2 border-tinta bg-tinta px-7 text-xs font-bold tracking-[0.14em] text-papel uppercase transition-[background-color,border-color,transform] hover:border-senal hover:bg-senal hover:text-white active:scale-[0.98]"
          >
            {accion}
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none"
            />
          </Link>
        </div>

        {foto ? (
          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden border-2 border-tinta bg-tinta/[0.07]">
              <Image
                src={foto}
                alt=""
                fill
                priority
                unoptimized
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
            {/* El nombre corre por el borde, como la etiqueta de una caja. */}
            <span
              aria-hidden="true"
              className="absolute top-0 -right-px hidden h-full items-center bg-tinta px-1.5 font-titular text-sm tracking-[0.2em] text-papel [writing-mode:vertical-rl] md:flex"
            >
              {tienda.nombre}
            </span>
            <span className="absolute -bottom-4 -left-2 -rotate-3 border-2 border-tinta bg-senal px-3 py-2 font-titular text-lg leading-none text-white md:-left-5 md:text-xl">
              Pedidos por WhatsApp
            </span>
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
    <section className="mx-auto w-full max-w-7xl px-5 py-14 md:py-20">
      <Titulo titulo={texto(bloque, "title") ?? "Por sección"} />

      <ul className="mt-6 border-t-2 border-tinta">
        {categorias.map((categoria, i) => (
          <li key={categoria.id} className="border-b-2 border-tinta">
            <Link
              href={rutaDeTienda(tienda.slug, "/catalogo", {
                categoria: categoria.id,
              })}
              className="group flex min-h-20 items-center gap-4 px-1 py-3 transition-colors hover:bg-tinta hover:text-papel md:min-h-24 md:px-3"
            >
              <span className="tabular w-8 shrink-0 text-xs font-bold opacity-60">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 truncate font-titular text-[clamp(2rem,9vw,4.25rem)] leading-none">
                {categoria.nombre}
              </span>
              {categoria.foto ? (
                <span className="relative hidden size-16 shrink-0 overflow-hidden border-2 border-current sm:block md:size-20">
                  <Image
                    src={categoria.foto}
                    alt=""
                    fill
                    unoptimized
                    sizes="80px"
                    className="object-cover"
                  />
                </span>
              ) : null}
              <span className="tabular shrink-0 text-xs font-bold opacity-70">
                {categoria.productos}
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="size-6 shrink-0 transition-transform duration-200 group-hover:rotate-45 motion-reduce:transform-none"
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
    <section className="mx-auto w-full max-w-7xl px-5 py-14 md:py-20">
      <Titulo
        titulo={texto(bloque, "title") ?? "Productos"}
        enlace={{
          etiqueta: "Ver todo",
          href: rutaDeTienda(tienda.slug, "/catalogo", {
            condicion: filtroDeGrilla(bloque).condicion,
          }),
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
    <section className="border-y-2 border-tinta bg-senal text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-5 py-14 md:flex-row md:items-end md:justify-between md:py-20">
        <div>
          <h2 className="max-w-[14ch] font-titular text-[clamp(2.75rem,11vw,6.5rem)] leading-[0.86]">
            {titulo}
          </h2>
          {cuerpo ? (
            <p className="mt-4 max-w-[46ch] leading-relaxed">{cuerpo}</p>
          ) : null}
        </div>
        <Link
          href={rutaDeTienda(tienda.slug, "/catalogo")}
          className="inline-flex min-h-12 shrink-0 items-center gap-3 rounded-plantilla border-2 border-tinta bg-papel px-7 text-xs font-bold tracking-[0.14em] text-tinta uppercase transition-colors hover:bg-tinta hover:text-papel active:scale-[0.98]"
        >
          {texto(bloque, "buttonLabel") ?? "Ver el catálogo"}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  )
}

export const BLOQUES_CALLE: KitDeTienda["bloques"] = {
  ...BLOQUES_CLASICOS,
  hero: Portada,
  categories: Categorias,
  product_grid: Grilla,
  cta: Llamado,
}
