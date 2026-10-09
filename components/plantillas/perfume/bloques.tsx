import Image from "next/image"
import Link from "next/link"
import { Plus } from "lucide-react"

import {
  accionDePortada,
  categoriasConFoto,
  fotoDePortada,
  items,
  numero,
  preguntaYRespuesta,
  productosDeGrilla,
  texto,
} from "@/lib/plantillas/bloques"
import { rutaDeTienda } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import { BLOQUES_CLASICOS } from "@/components/plantillas/clasica/bloques"
import type { KitDeTienda, PropsBloque } from "@/components/plantillas/kit"
import {
  EnlacePildora,
  Tarjeta,
  TituloDeSeccion,
  Vitrina,
} from "@/components/plantillas/perfume/piezas"

/**
 * Los bloques de Esencia.
 *
 * Mucho aire entre secciones, todo centrado, y una sola banda oscura —la
 * portada— que hace de escaparate de noche. La foto va enmarcada en un arco:
 * es la forma de las vitrinas de perfumería y separa el producto del fondo sin
 * sombras.
 */

function Portada({ bloque, tienda }: PropsBloque) {
  const foto = fotoDePortada(bloque, tienda)
  const titulo = texto(bloque, "title") ?? tienda.nombre
  const bajada = texto(bloque, "subtitle")
  const accion = accionDePortada(bloque) ?? "Descubrir la colección"

  return (
    <section className="bg-tinta text-papel">
      <div
        className={cn(
          "mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-16 md:py-24",
          foto && "md:grid-cols-[1.1fr_1fr] md:gap-16"
        )}
      >
        <div className={cn("text-center", foto && "md:text-left")}>
          <p
            className={cn(
              "flex items-center justify-center gap-3 text-[11px] tracking-[0.3em] uppercase opacity-75",
              foto && "md:justify-start"
            )}
          >
            <span aria-hidden="true" className="h-px w-8 bg-senal-alta" />
            {tienda.nombre}
          </p>
          <h1
            className={cn(
              "mx-auto mt-6 max-w-[16ch] font-titular text-[clamp(2.75rem,10vw,5.5rem)] leading-[1.02] text-balance italic",
              foto && "md:mx-0"
            )}
          >
            {titulo}
          </h1>
          {bajada ? (
            <p
              className={cn(
                "mx-auto mt-6 max-w-[42ch] leading-relaxed opacity-75 md:text-lg",
                foto && "md:mx-0"
              )}
            >
              {bajada}
            </p>
          ) : null}
          <EnlacePildora
            href={rutaDeTienda(tienda.slug, "/catalogo")}
            claro
            className="mt-10"
          >
            {accion}
          </EnlacePildora>
        </div>

        {foto ? (
          <div className="mx-auto w-full max-w-[18rem] md:max-w-sm">
            <div className="relative aspect-[3/4] overflow-hidden rounded-t-full border border-papel/15 bg-papel/5">
              <Image
                src={foto}
                alt=""
                fill
                priority
                unoptimized
                sizes="(max-width: 768px) 18rem, 24rem"
                className="object-cover"
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function Grilla({ bloque, tienda }: PropsBloque) {
  const productos = productosDeGrilla(bloque, tienda.productos)
  if (productos.length === 0) return null

  const columnas =
    numero(bloque, "columns") ?? tienda.apariencia.disposicion.columnas

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 md:py-24">
      <TituloDeSeccion titulo={texto(bloque, "title") ?? "La colección"} />

      <div className="mt-12">
        <Vitrina columnas={columnas}>
          {productos.map((producto) => (
            <Tarjeta key={producto.id} producto={producto} tienda={tienda} />
          ))}
        </Vitrina>
      </div>

      <div className="mt-14 text-center">
        <EnlacePildora href={rutaDeTienda(tienda.slug, "/catalogo")}>
          Ver toda la colección
        </EnlacePildora>
      </div>
    </section>
  )
}

function Categorias({ bloque, tienda }: PropsBloque) {
  const categorias = categoriasConFoto(tienda, numero(bloque, "limit") ?? 6)
  if (categorias.length === 0) return null

  return (
    <section className="border-y border-tinta/10 bg-tinta/[0.025]">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 md:py-20">
        <TituloDeSeccion
          titulo={texto(bloque, "title") ?? "Explora la colección"}
          bajada={texto(bloque, "subtitle")}
        />

        {/* En el celular se desplaza de lado: los círculos no se entienden de
            a dos por fila, y en fila se recorren con el pulgar. */}
        <div className="-mx-5 mt-12 [scrollbar-width:none] overflow-x-auto px-5 [&::-webkit-scrollbar]:hidden">
          <ul className="mx-auto flex w-max gap-8 md:flex-wrap md:justify-center md:gap-12">
            {categorias.map((categoria) => (
              <li key={categoria.id}>
                <Link
                  href={rutaDeTienda(tienda.slug, "/catalogo", {
                    categoria: categoria.id,
                  })}
                  className="group flex w-28 flex-col items-center text-center md:w-36"
                >
                  <span className="relative flex size-28 items-center justify-center overflow-hidden rounded-full border border-tinta/10 bg-tinta/[0.05] md:size-36">
                    {/* Sin foto, la inicial en cursiva: un círculo vacío se
                        lee como una imagen que no cargó. */}
                    <span
                      aria-hidden="true"
                      className="font-titular text-5xl italic opacity-30 md:text-6xl"
                    >
                      {categoria.nombre.charAt(0)}
                    </span>
                    {categoria.foto ? (
                      <Image
                        src={categoria.foto}
                        alt=""
                        fill
                        unoptimized
                        sizes="144px"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] motion-reduce:transform-none"
                      />
                    ) : null}
                  </span>
                  <span className="mt-4 font-titular text-xl leading-tight italic transition-colors group-hover:text-senal">
                    {categoria.nombre}
                  </span>
                  <span className="tabular mt-1 text-[10px] tracking-[0.22em] uppercase opacity-55">
                    {categoria.productos}{" "}
                    {categoria.productos === 1 ? "pieza" : "piezas"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function Texto({ bloque }: PropsBloque) {
  const titulo = texto(bloque, "title")
  const cuerpo = texto(bloque, "body")
  const foto = texto(bloque, "imageUrl")
  if (!titulo && !cuerpo && !foto) return null

  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-16 text-center md:py-24">
      {/* En arco, como las demás fotos de Esencia. */}
      {foto ? (
        <div className="relative mx-auto mb-10 aspect-[4/5] w-full max-w-xs overflow-hidden rounded-t-full bg-tinta/[0.045]">
          <Image
            src={foto}
            alt=""
            fill
            unoptimized
            sizes="320px"
            className="object-cover"
          />
        </div>
      ) : null}
      <TituloDeSeccion titulo={titulo ?? ""} />
      {cuerpo ? (
        <p className="mx-auto mt-8 max-w-[56ch] text-lg leading-loose opacity-75">
          {cuerpo}
        </p>
      ) : null}
    </section>
  )
}

/**
 * Las preguntas se pliegan con `<details>`: sin JavaScript, accesibles de
 * fábrica, y la página no se estira con respuestas que nadie abrió.
 */
function Preguntas({ bloque }: PropsBloque) {
  const lista = items(bloque)
    .map(preguntaYRespuesta)
    .filter((item) => item.pregunta)
  if (lista.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-16 md:py-24">
      <TituloDeSeccion titulo={texto(bloque, "title") ?? "Antes de comprar"} />

      <div className="mt-12 border-t border-tinta/15">
        {lista.map((item, i) => (
          <details key={i} className="group border-b border-tinta/15">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-4 text-left font-titular text-xl leading-snug [&::-webkit-details-marker]:hidden">
              {item.pregunta}
              <Plus
                aria-hidden="true"
                className="size-4 shrink-0 stroke-[1.5] transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none"
              />
            </summary>
            {item.respuesta ? (
              <p className="max-w-[58ch] pb-6 leading-relaxed opacity-75">
                {item.respuesta}
              </p>
            ) : null}
          </details>
        ))}
      </div>
    </section>
  )
}

function Voces({ bloque }: PropsBloque) {
  const lista = items(bloque).filter((item) => typeof item.quote === "string")
  if (lista.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 md:py-24">
      <TituloDeSeccion titulo={texto(bloque, "title") ?? "Lo que dicen"} />
      <div className="mt-12 grid gap-12 md:grid-cols-2">
        {lista.map((item, i) => (
          <blockquote key={i} className="text-center">
            <p className="font-titular text-2xl leading-snug italic">
              «{String(item.quote)}»
            </p>
            {typeof item.author === "string" ? (
              <footer className="mt-4 text-[11px] tracking-[0.24em] uppercase opacity-60">
                {item.author}
              </footer>
            ) : null}
          </blockquote>
        ))}
      </div>
    </section>
  )
}

function Cierre({ bloque, tienda }: PropsBloque) {
  const titulo = texto(bloque, "title")
  if (!titulo) return null

  return (
    <section className="bg-tinta text-papel">
      <div className="mx-auto w-full max-w-3xl px-5 py-16 text-center md:py-24">
        <h2 className="font-titular text-[clamp(2.25rem,7vw,4rem)] leading-[1.05] italic">
          {titulo}
        </h2>
        {texto(bloque, "body") ? (
          <p className="mx-auto mt-6 max-w-[46ch] leading-relaxed opacity-75">
            {texto(bloque, "body")}
          </p>
        ) : null}
        <EnlacePildora
          href={rutaDeTienda(tienda.slug, "/catalogo")}
          claro
          className="mt-10"
        >
          {texto(bloque, "buttonLabel") ?? "Ver la colección"}
        </EnlacePildora>
      </div>
    </section>
  )
}

export const BLOQUES_PERFUME: KitDeTienda["bloques"] = {
  ...BLOQUES_CLASICOS,
  hero: Portada,
  categories: Categorias,
  product_grid: Grilla,
  about: Texto,
  faq: Preguntas,
  testimonials: Voces,
  cta: Cierre,
}
