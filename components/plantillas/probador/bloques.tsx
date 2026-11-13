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
  Boton,
  Rotulo,
  Tarjeta,
  Titulo,
  grilla,
} from "@/components/plantillas/probador/piezas"

/**
 * Los bloques de Probador.
 *
 * La portada es la de una revista: una foto alta de cuerpo entero con el
 * rótulo "Nuevo ingreso" y el titular en la serif. Las categorías son
 * ocasiones —para el día, para salir, para la oficina— y se pasan de lado en
 * fotos altas, como perchas. Las preguntas se pliegan: quien compra ropa
 * busca una sola, la del cambio o la de la talla.
 */

function Portada({ bloque, tienda }: PropsBloque) {
  const foto = fotoDePortada(bloque, tienda)
  const titulo = texto(bloque, "title") ?? tienda.nombre
  const bajada = texto(bloque, "subtitle")
  const accion = accionDePortada(bloque) ?? "Ver lo nuevo"

  return (
    <section className="mx-auto w-full max-w-7xl md:px-5 md:pt-8 md:pb-16">
      <div
        className={cn(
          "grid",
          foto
            ? "md:grid-cols-[1fr_1fr] md:items-center md:gap-14 lg:grid-cols-[1.1fr_1fr]"
            : "px-5 pt-14 pb-10 md:px-0"
        )}
      >
        {foto ? (
          <div className="relative aspect-[4/5] overflow-hidden md:max-h-[calc(100svh-8rem)] md:w-full md:rounded-[calc(var(--radio)*0.6)]">
            <Image
              src={foto}
              alt=""
              fill
              priority
              unoptimized
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <span className="absolute top-4 left-4 rounded-plantilla bg-papel px-3 py-1.5 text-xs leading-none font-medium tracking-[0.18em] uppercase md:top-5 md:left-5">
              Nuevo ingreso
            </span>
          </div>
        ) : null}

        <div className={cn(foto && "px-5 pt-7 pb-12 md:px-0 md:py-0")}>
          {foto ? null : <Rotulo>Nuevo ingreso</Rotulo>}
          <h1
            className={cn(
              "max-w-[12ch] font-titular text-[clamp(2.75rem,12vw,6rem)] leading-[0.95]",
              !foto && "mt-4"
            )}
          >
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
      </div>
    </section>
  )
}

function Categorias({ bloque, tienda }: PropsBloque) {
  const categorias = categoriasConFoto(tienda, numero(bloque, "limit") ?? 6)
  if (categorias.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-7xl py-12 md:py-20">
      <div className="px-5">
        <Titulo titulo={texto(bloque, "title") ?? "Para cada ocasión"} />
      </div>

      <ul className="mt-7 flex snap-x snap-mandatory scroll-px-5 [scrollbar-width:none] gap-3 overflow-x-auto px-5 md:gap-5 [&::-webkit-scrollbar]:hidden">
        {categorias.map((categoria) => (
          <li
            key={categoria.id}
            className="w-[44%] shrink-0 snap-start sm:w-[30%] md:w-[calc((100%-3.75rem)/4)]"
          >
            <Link
              href={rutaDeTienda(tienda.slug, "/catalogo", {
                categoria: categoria.id,
              })}
              className="group block"
            >
              <span className="relative block aspect-[2/3] overflow-hidden rounded-[calc(var(--radio)*0.6)] bg-tinta/[0.05]">
                {categoria.foto ? (
                  <Image
                    src={categoria.foto}
                    alt=""
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 45vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transform-none"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center font-titular text-5xl opacity-25">
                    {categoria.nombre.charAt(0)}
                  </span>
                )}
              </span>
              <span className="mt-3 block font-titular text-lg leading-tight transition-colors group-hover:text-senal md:text-xl">
                {categoria.nombre}
              </span>
              <span className="tabular mt-0.5 block text-xs opacity-65">
                {categoria.productos}{" "}
                {categoria.productos === 1 ? "prenda" : "prendas"}
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
    <section className="mx-auto w-full max-w-7xl px-5 py-12 md:py-20">
      <Titulo
        titulo={texto(bloque, "title") ?? "Nuevo ingreso"}
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

/** Un texto de la tienda: con foto alta a un lado, como una nota de revista. */
function Texto({ bloque }: PropsBloque) {
  const titulo = texto(bloque, "title")
  const cuerpo = texto(bloque, "body")
  const foto = texto(bloque, "imageUrl")
  if (!titulo && !cuerpo && !foto) return null

  return (
    <section
      className={cn(
        "mx-auto grid w-full max-w-7xl gap-8 px-5 py-12 md:py-20",
        foto && "md:grid-cols-[0.9fr_1fr] md:items-center md:gap-16"
      )}
    >
      {foto ? (
        <div className="relative aspect-[4/5] overflow-hidden rounded-[calc(var(--radio)*0.6)]">
          <Image
            src={foto}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 45vw"
            className="object-cover"
          />
        </div>
      ) : null}
      <div className={cn(!foto && "max-w-3xl")}>
        {titulo ? (
          <h2 className="font-titular text-[clamp(2rem,8vw,3.75rem)] leading-[1]">
            {titulo}
          </h2>
        ) : null}
        {cuerpo ? (
          <p className="mt-5 text-lg leading-relaxed whitespace-pre-line opacity-80">
            {cuerpo}
          </p>
        ) : null}
      </div>
    </section>
  )
}

/** Las preguntas, plegadas: se abre la que interesa. */
function Preguntas({ bloque }: PropsBloque) {
  const lista = items(bloque)
    .map(preguntaYRespuesta)
    .filter((item) => item.pregunta)
  if (lista.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-12 md:py-20">
      <Titulo titulo={texto(bloque, "title") ?? "Antes de comprar"} />
      <div className="mt-7 border-t border-tinta/20">
        {lista.map((item, i) => (
          <details key={i} className="group border-b border-tinta/20">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg leading-snug [&::-webkit-details-marker]:hidden">
              {item.pregunta}
              <Plus
                aria-hidden="true"
                className="size-5 shrink-0 transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
              />
            </summary>
            {item.respuesta ? (
              <p className="max-w-[60ch] pb-5 leading-relaxed opacity-80">
                {item.respuesta}
              </p>
            ) : null}
          </details>
        ))}
      </div>
    </section>
  )
}

/** El cierre con botón: una franja ciruela, como la faja de una revista. */
function Cierre({ bloque, tienda }: PropsBloque) {
  const titulo = texto(bloque, "title")
  const cuerpo = texto(bloque, "body")
  if (!titulo && !cuerpo) return null

  return (
    <section className="bg-senal text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-14 md:flex-row md:items-end md:justify-between md:py-20">
        <div>
          <h2 className="max-w-[18ch] font-titular text-[clamp(2rem,8vw,3.5rem)] leading-[1]">
            {titulo ?? "Escríbenos"}
          </h2>
          {cuerpo ? (
            <p className="mt-4 max-w-[46ch] text-lg leading-relaxed opacity-90">
              {cuerpo}
            </p>
          ) : null}
        </div>
        <Link
          href={rutaDeTienda(tienda.slug, "/catalogo")}
          className="inline-flex min-h-12 shrink-0 items-center justify-center self-start rounded-plantilla bg-papel px-7 text-sm font-medium text-tinta transition-transform active:scale-[0.98] md:self-auto"
        >
          {texto(bloque, "buttonLabel") ?? "Ver la colección"}
        </Link>
      </div>
    </section>
  )
}

export const BLOQUES_PROBADOR: KitDeTienda["bloques"] = {
  ...BLOQUES_CLASICOS,
  hero: Portada,
  categories: Categorias,
  product_grid: Grilla,
  about: Texto,
  faq: Preguntas,
  cta: Cierre,
}
