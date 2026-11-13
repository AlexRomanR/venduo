import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Fragment } from "react"

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
import { preguntasPlegadas } from "@/components/plantillas/comunes/preguntas"
import type { KitDeTienda, PropsBloque } from "@/components/plantillas/kit"
import {
  BANDEJA,
  Boton,
  Sello,
  Tarjeta,
  Titulo,
  grilla,
} from "@/components/plantillas/tocador/piezas"

/**
 * Los bloques de Tocador.
 *
 * La portada: el titular, la foto redondeada y el sello de ayuda con el tono
 * apoyado en su esquina. Las categorías son **los pasos de una rutina**,
 * numerados por el orden en que la tienda las puso —limpiar, tratar,
 * hidratar, proteger— y unidos por flechas.
 */

function Portada({ bloque, tienda }: PropsBloque) {
  const foto = fotoDePortada(bloque, tienda)
  const titulo = texto(bloque, "title") ?? tienda.nombre
  const bajada = texto(bloque, "subtitle")
  const accion = accionDePortada(bloque) ?? "Ver los productos"

  return (
    <section className="mx-auto w-full max-w-7xl px-5 pt-8 pb-14 md:pt-14 md:pb-20">
      <div className="grid gap-10 md:grid-cols-[1fr_1fr] md:items-center md:gap-16">
        <div>
          <h1 className="max-w-[12ch] font-titular text-[clamp(2.75rem,11vw,5.5rem)] leading-[0.98]">
            {titulo}
          </h1>
          {bajada ? (
            <p className="mt-5 max-w-[40ch] text-lg leading-relaxed opacity-80">
              {bajada}
            </p>
          ) : null}
          <Boton href={rutaDeTienda(tienda.slug, "/catalogo")} className="mt-8">
            {accion}
          </Boton>
        </div>

        {foto ? (
          <div className="relative mb-8 md:mb-0">
            <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-tinta/[0.04]">
              <Image
                src={foto}
                alt=""
                fill
                priority
                unoptimized
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <Sello tienda={tienda} className="absolute -right-1 -bottom-10" />
          </div>
        ) : (
          <Sello tienda={tienda} className="md:justify-self-center" />
        )}
      </div>
    </section>
  )
}

function Rutina({ bloque, tienda }: PropsBloque) {
  const categorias = categoriasConFoto(tienda, numero(bloque, "limit") ?? 6)
  if (categorias.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-7xl py-12 md:py-20">
      <div className="px-5">
        <Titulo titulo={texto(bloque, "title") ?? "Tu rutina"} />
      </div>
      <ol className="mt-7 flex snap-x snap-mandatory scroll-px-5 [scrollbar-width:none] items-stretch gap-1 overflow-x-auto px-5 md:overflow-visible [&::-webkit-scrollbar]:hidden">
        {categorias.map((categoria, i) => (
          <Fragment key={categoria.id}>
            {i > 0 ? (
              <li aria-hidden="true" className="flex shrink-0 items-center">
                <ChevronRight className="size-4 opacity-40" />
              </li>
            ) : null}
            <li className="w-[8.5rem] shrink-0 snap-start md:w-auto md:flex-1">
              <Link
                href={rutaDeTienda(tienda.slug, "/catalogo", {
                  categoria: categoria.id,
                })}
                className={cn(
                  "group flex h-full min-h-[8.25rem] flex-col p-4 transition-colors hover:bg-tinta/[0.07]",
                  BANDEJA
                )}
              >
                <span className="tabular font-titular text-4xl leading-none text-senal">
                  {i + 1}
                </span>
                <span className="mt-auto pt-3 text-[15px] leading-snug font-medium">
                  {categoria.nombre}
                </span>
                <span className="tabular mt-0.5 text-xs opacity-65">
                  {categoria.productos}{" "}
                  {categoria.productos === 1 ? "producto" : "productos"}
                </span>
              </Link>
            </li>
          </Fragment>
        ))}
      </ol>
    </section>
  )
}

function Grilla({ bloque, tienda }: PropsBloque) {
  const productos = productosDeGrilla(bloque, tienda.productos)
  if (productos.length === 0) return null

  const columnas =
    numero(bloque, "columns") ?? tienda.apariencia.disposicion.columnas

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-12 md:py-20">
      <Titulo
        titulo={texto(bloque, "title") ?? "Los favoritos"}
        enlace={{
          etiqueta: "Ver todo",
          href: rutaDeTienda(tienda.slug, "/catalogo"),
        }}
      />
      <div
        data-ajuste="disposicion.tarjeta disposicion.columnas"
        className={cn("mt-7", grilla(columnas))}
      >
        {productos.map((producto) => (
          <Tarjeta key={producto.id} producto={producto} tienda={tienda} />
        ))}
      </div>
    </section>
  )
}

/** El cierre con botón: una bandeja grande con el sello al lado. */
function Cierre({ bloque, tienda }: PropsBloque) {
  const titulo = texto(bloque, "title")
  const cuerpo = texto(bloque, "body")
  if (!titulo && !cuerpo) return null

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-10 md:py-14">
      <div
        className={cn(
          "flex flex-col gap-8 px-6 py-12 md:flex-row md:items-center md:justify-between md:px-12",
          BANDEJA
        )}
      >
        <div>
          <h2 className="max-w-[18ch] font-titular text-[clamp(1.875rem,7vw,3rem)] leading-[1.02]">
            {titulo ?? "Escríbenos"}
          </h2>
          {cuerpo ? (
            <p className="mt-4 max-w-[44ch] leading-relaxed opacity-80">
              {cuerpo}
            </p>
          ) : null}
          <Boton href={rutaDeTienda(tienda.slug, "/catalogo")} className="mt-7">
            {texto(bloque, "buttonLabel") ?? "Ver los productos"}
          </Boton>
        </div>
        <Sello tienda={tienda} className="shrink-0 self-center" />
      </div>
    </section>
  )
}

export const BLOQUES_TOCADOR: KitDeTienda["bloques"] = {
  ...BLOQUES_CLASICOS,
  hero: Portada,
  categories: Rutina,
  product_grid: Grilla,
  faq: preguntasPlegadas(Titulo),
  cta: Cierre,
}
