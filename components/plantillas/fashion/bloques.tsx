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
  Tarjeta,
  TituloDeSeccion,
} from "@/components/plantillas/fashion/piezas"
import type { KitDeTienda, PropsBloque } from "@/components/plantillas/kit"

/**
 * Los bloques de Pasarela.
 *
 * La portada es una foto a sangre con el titular encima, las categorías son
 * fotos y no palabras, y las grillas van de a dos en el celular: en ropa, una
 * sola prenda por pantalla obliga a desplazarse demasiado para comparar.
 */

function Portada({ bloque, tienda, codigo }: PropsBloque) {
  const foto = fotoDePortada(bloque, tienda.productos)
  const titulo = texto(bloque, "title") ?? tienda.nombre
  const bajada = texto(bloque, "subtitle")
  const accion = accionDePortada(bloque) ?? "Ver la colección"
  const catalogo = rutaDeTienda(tienda.slug, "/catalogo", { ref: codigo })

  // Sin ninguna foto en la tienda, la portada es tipográfica. Un recuadro gris
  // con texto encima se lee como una imagen que no cargó.
  if (!foto) {
    return (
      <section className="border-b-2 border-tinta">
        <div className="mx-auto w-full max-w-7xl px-5 py-16 md:py-24">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase opacity-60">
            {tienda.nombre}
          </p>
          <h1 className="mt-4 max-w-[12ch] font-titular text-[clamp(3.25rem,15vw,9rem)] leading-[0.88]">
            {titulo}
          </h1>
          {bajada ? (
            <p className="mt-6 max-w-[46ch] text-lg leading-relaxed opacity-70">
              {bajada}
            </p>
          ) : null}
          <BotonDePortada href={catalogo} oscuro>
            {accion}
          </BotonDePortada>
        </div>
      </section>
    )
  }

  return (
    <section className="relative isolate flex min-h-[72svh] items-end overflow-hidden bg-tinta md:min-h-[80svh]">
      <Image
        src={foto}
        alt=""
        fill
        priority
        unoptimized
        sizes="100vw"
        className="-z-10 object-cover"
      />
      {/* Un velo solo abajo, donde va el texto: la foto se sigue viendo entera
          y el titular se lee sobre cualquier prenda. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-tinta/85 via-tinta/30 to-transparent"
      />

      <div className="mx-auto w-full max-w-7xl px-5 pb-10 text-papel md:pb-16">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase opacity-80">
          {tienda.nombre}
        </p>
        <h1 className="mt-3 max-w-[12ch] font-titular text-[clamp(3.25rem,14vw,9rem)] leading-[0.88]">
          {titulo}
        </h1>
        {bajada ? (
          <p className="mt-5 max-w-[46ch] leading-relaxed opacity-85 md:text-lg">
            {bajada}
          </p>
        ) : null}
        <BotonDePortada href={catalogo}>{accion}</BotonDePortada>
      </div>
    </section>
  )
}

function BotonDePortada({
  href,
  oscuro = false,
  children,
}: {
  href: string
  oscuro?: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group mt-8 inline-flex min-h-12 items-center gap-3 px-7 text-xs font-semibold tracking-[0.16em] uppercase transition-colors hover:bg-senal hover:text-white",
        oscuro ? "bg-tinta text-papel" : "bg-papel text-tinta"
      )}
    >
      {children}
      <ArrowRight
        aria-hidden="true"
        className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transform-none"
      />
    </Link>
  )
}

function Categorias({ bloque, tienda, codigo }: PropsBloque) {
  const categorias = categoriasConFoto(tienda, numero(bloque, "limit") ?? 6)
  if (categorias.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-14 md:py-20">
      <TituloDeSeccion
        titulo={texto(bloque, "title") ?? "Compra por categoría"}
        enlace={{
          etiqueta: "Ver todo",
          href: rutaDeTienda(tienda.slug, "/catalogo", { ref: codigo }),
        }}
      />

      <ul
        className={cn(
          "mt-6 grid grid-cols-2 gap-3 md:gap-4",
          categorias.length >= 4 ? "md:grid-cols-4" : "md:grid-cols-3"
        )}
      >
        {categorias.map((categoria) => (
          <li key={categoria.id}>
            <Link
              href={rutaDeTienda(tienda.slug, "/catalogo", {
                categoria: categoria.id,
                ref: codigo,
              })}
              // Sin foto, el recuadro es negro y la categoría se lee como un
              // rótulo: un gris vacío parecía una imagen que no cargó.
              className={cn(
                "group relative block aspect-[3/4] overflow-hidden",
                categoria.foto
                  ? "bg-tinta/[0.06]"
                  : "bg-tinta text-papel transition-colors hover:bg-senal"
              )}
            >
              {categoria.foto ? (
                <>
                  <Image
                    src={categoria.foto}
                    alt=""
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transform-none"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-tinta/75 to-transparent"
                  />
                </>
              ) : null}

              <span
                className={cn(
                  "absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 md:p-4",
                  categoria.foto && "text-papel"
                )}
              >
                <span className="font-titular text-xl leading-none md:text-3xl">
                  {categoria.nombre}
                </span>
                <span className="tabular text-xs opacity-80">
                  {categoria.productos}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Grilla({ bloque, tienda, codigo }: PropsBloque) {
  const productos = productosDeGrilla(bloque, tienda.productos)
  if (productos.length === 0) return null

  const columnas =
    numero(bloque, "columns") ?? tienda.apariencia.disposicion.columnas

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-14 md:py-20">
      <TituloDeSeccion
        titulo={texto(bloque, "title") ?? "Productos"}
        enlace={{
          etiqueta: "Ver todo",
          href: rutaDeTienda(tienda.slug, "/catalogo", {
            condicion: filtroDeGrilla(bloque).condicion,
            ref: codigo,
          }),
        }}
      />

      <div
        className={cn(
          "mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5",
          columnas >= 4 && "lg:grid-cols-4"
        )}
      >
        {productos.map((producto) => (
          <Tarjeta
            key={producto.id}
            producto={producto}
            tienda={tienda}
            codigo={codigo}
          />
        ))}
      </div>
    </section>
  )
}

function Texto({ bloque }: PropsBloque) {
  const titulo = texto(bloque, "title")
  const cuerpo = texto(bloque, "body")
  if (!titulo && !cuerpo) return null

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-14 md:grid-cols-[1fr_1.4fr] md:gap-16 md:py-20">
      {titulo ? (
        <h2 className="font-titular text-[clamp(2rem,7vw,4rem)] leading-[0.92]">
          {titulo}
        </h2>
      ) : null}
      {cuerpo ? (
        <p className="max-w-[58ch] text-lg leading-relaxed opacity-75 md:pt-2">
          {cuerpo}
        </p>
      ) : null}
    </section>
  )
}

function Preguntas({ bloque }: PropsBloque) {
  const lista = items(bloque)
    .map(preguntaYRespuesta)
    .filter((item) => item.pregunta)
  if (lista.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-14 md:py-20">
      <TituloDeSeccion
        titulo={texto(bloque, "title") ?? "Preguntas frecuentes"}
      />
      <dl className="grid md:grid-cols-2 md:gap-x-10">
        {lista.map((item, i) => (
          <div key={i} className="border-b border-tinta/15 py-6">
            <dt className="text-sm font-semibold tracking-[0.06em] uppercase">
              {item.pregunta}
            </dt>
            {item.respuesta ? (
              <dd className="mt-2 max-w-[56ch] leading-relaxed opacity-70">
                {item.respuesta}
              </dd>
            ) : null}
          </div>
        ))}
      </dl>
    </section>
  )
}

function Cierre({ bloque, tienda, codigo }: PropsBloque) {
  const titulo = texto(bloque, "title")
  if (!titulo) return null

  return (
    <section className="bg-tinta text-papel">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-5 py-16 md:flex-row md:items-end md:justify-between md:py-24">
        <div>
          <h2 className="max-w-[14ch] font-titular text-[clamp(2.25rem,8vw,5rem)] leading-[0.9]">
            {titulo}
          </h2>
          {texto(bloque, "body") ? (
            <p className="mt-4 max-w-[46ch] leading-relaxed opacity-75">
              {texto(bloque, "body")}
            </p>
          ) : null}
        </div>
        <Link
          href={rutaDeTienda(tienda.slug, "/catalogo", { ref: codigo })}
          className="inline-flex min-h-12 shrink-0 items-center gap-3 bg-papel px-7 text-xs font-semibold tracking-[0.16em] text-tinta uppercase transition-colors hover:bg-senal hover:text-white"
        >
          {texto(bloque, "buttonLabel") ?? "Ver la colección"}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  )
}

export const BLOQUES_FASHION: KitDeTienda["bloques"] = {
  ...BLOQUES_CLASICOS,
  hero: Portada,
  categories: Categorias,
  product_grid: Grilla,
  about: Texto,
  faq: Preguntas,
  cta: Cierre,
}
