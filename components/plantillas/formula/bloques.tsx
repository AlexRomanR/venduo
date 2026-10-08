import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import {
  accionDePortada,
  categoriasConFoto,
  filtroDeGrilla,
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
import {
  MAQUINA,
  Rotulo,
  Tarjeta,
  Titulo,
  grilla,
} from "@/components/plantillas/formula/piezas"
import type { KitDeTienda, PropsBloque } from "@/components/plantillas/kit"

/**
 * Los bloques de Fórmula.
 *
 * La portada es la primera página de un recetario: el titular grande a la
 * izquierda, la foto a la derecha con su etiqueta, y los datos a máquina. Las
 * categorías son un índice —familia, puntos, cantidad—, porque en perfumería
 * de autor se busca por familia olfativa: "amaderados", "cítricos".
 */

function Portada({ bloque, tienda }: PropsBloque) {
  const foto = fotoDePortada(bloque, tienda)
  const titulo = texto(bloque, "title") ?? tienda.nombre
  const bajada = texto(bloque, "subtitle")
  const accion = accionDePortada(bloque) ?? "Ver los frascos"

  return (
    <section className="border-b border-tinta">
      <div
        className={cn(
          "mx-auto grid w-full max-w-7xl px-5",
          foto && "md:grid-cols-[1.25fr_1fr]"
        )}
      >
        <div
          className={cn(
            "flex flex-col justify-between gap-10 py-10 md:py-16",
            foto && "md:border-r md:border-tinta md:pr-12"
          )}
        >
          <p className={cn(MAQUINA, "flex justify-between gap-4 opacity-75")}>
            <span>{tienda.nombre}</span>
            <span className="tabular">
              {tienda.productos.length}{" "}
              {tienda.productos.length === 1 ? "frasco" : "frascos"}
            </span>
          </p>
          <div>
            <h1 className="font-titular text-[clamp(3.5rem,16vw,9rem)] leading-[0.88]">
              {titulo}
            </h1>
            {bajada ? (
              <p className="mt-6 max-w-[44ch] text-lg leading-relaxed opacity-80">
                {bajada}
              </p>
            ) : null}
            <Link
              href={rutaDeTienda(tienda.slug, "/catalogo")}
              className={cn(
                MAQUINA,
                "group mt-8 inline-flex min-h-12 items-center gap-3 rounded-plantilla bg-tinta px-7 text-papel transition-colors hover:bg-senal hover:text-white active:scale-[0.98]"
              )}
            >
              {accion}
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transform-none"
              />
            </Link>
          </div>
        </div>

        {foto ? (
          <div className="relative -mx-5 md:mx-0 md:my-8 md:ml-12">
            <div className="relative aspect-[4/5] overflow-hidden bg-tinta/[0.06] md:aspect-auto md:h-full">
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
            <p
              className={cn(
                MAQUINA,
                "absolute bottom-4 left-4 border border-tinta bg-papel px-3 py-2"
              )}
            >
              Te ayudamos a elegir por WhatsApp
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}

/** Las familias como el índice de un recetario: nombre, puntos y cantidad. */
function Categorias({ bloque, tienda }: PropsBloque) {
  const categorias = categoriasConFoto(tienda, numero(bloque, "limit") ?? 6)
  if (categorias.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-14 md:py-20">
      <Titulo titulo={texto(bloque, "title") ?? "Familias"} />

      <ol className="mt-2 md:columns-2 md:gap-12">
        {categorias.map((categoria, i) => (
          <li key={categoria.id} className="break-inside-avoid">
            <Link
              href={rutaDeTienda(tienda.slug, "/catalogo", {
                categoria: categoria.id,
              })}
              className="group flex min-h-16 items-baseline gap-3 border-b border-tinta/25 py-4 transition-colors hover:text-senal"
            >
              <span className="tabular w-7 shrink-0 font-mono text-xs opacity-65">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-titular text-[1.75rem] leading-none md:text-[2rem]">
                {categoria.nombre}
              </span>
              <span
                aria-hidden="true"
                className="mb-1 min-w-6 flex-1 border-b border-dotted border-current opacity-40"
              />
              <span className="tabular shrink-0 font-mono text-xs">
                {categoria.productos}
              </span>
            </Link>
          </li>
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
    <section className="mx-auto w-full max-w-7xl px-5 py-14 md:py-20">
      <Titulo
        titulo={texto(bloque, "title") ?? "Frascos"}
        enlace={{
          etiqueta: "Ver todo",
          href: rutaDeTienda(tienda.slug, "/catalogo", {
            condicion: filtroDeGrilla(bloque).condicion,
          }),
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

/** Las preguntas como notas al pie, numeradas y a dos columnas. */
function Preguntas({ bloque }: PropsBloque) {
  const lista = items(bloque)
    .map(preguntaYRespuesta)
    .filter((item) => item.pregunta)
  if (lista.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-14 md:py-20">
      <Titulo titulo={texto(bloque, "title") ?? "Antes de comprar"} />
      <dl className="grid md:grid-cols-2 md:gap-x-12">
        {lista.map((item, i) => (
          <div key={i} className="border-b border-tinta/25 py-6">
            <dt className="flex gap-3">
              <span className="tabular shrink-0 font-mono text-xs leading-7 opacity-65">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-titular text-2xl leading-tight">
                {item.pregunta}
              </span>
            </dt>
            {item.respuesta ? (
              <dd className="mt-2 max-w-[56ch] pl-10 leading-relaxed opacity-80">
                {item.respuesta}
              </dd>
            ) : null}
          </div>
        ))}
      </dl>
    </section>
  )
}

function Texto({ bloque }: PropsBloque) {
  const titulo = texto(bloque, "title")
  const cuerpo = texto(bloque, "body")
  if (!titulo && !cuerpo) return null

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-14 md:grid-cols-[1fr_1.5fr] md:gap-16 md:py-20">
      <div>
        <Rotulo>Nota</Rotulo>
        {titulo ? (
          <h2 className="mt-3 font-titular text-[clamp(2.25rem,8vw,4rem)] leading-[0.98]">
            {titulo}
          </h2>
        ) : null}
      </div>
      {cuerpo ? (
        <p className="max-w-[58ch] text-lg leading-relaxed opacity-80 md:pt-8">
          {cuerpo}
        </p>
      ) : null}
    </section>
  )
}

export const BLOQUES_FORMULA: KitDeTienda["bloques"] = {
  ...BLOQUES_CLASICOS,
  hero: Portada,
  categories: Categorias,
  product_grid: Grilla,
  faq: Preguntas,
  about: Texto,
}
