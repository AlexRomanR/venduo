import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ImageOff, MessageCircle } from "lucide-react"

import { numeroDeWhatsApp } from "@/lib/pedidos"
import {
  accionDePortada,
  categoriasConFoto,
  filtroDeGrilla,
  items,
  numero,
  preguntaYRespuesta,
  productosDeGrilla,
  texto,
  type TipoDeBloque,
} from "@/lib/plantillas/bloques"
import { formatMoney } from "@/lib/format"
import { rutaDeTienda } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import type {
  PropsBloque,
  PropsTarjeta,
  KitDeTienda,
} from "@/components/plantillas/kit"

/**
 * Los bloques de la base editorial.
 *
 * Cada uno tolera que falten propiedades y no se dibuja si no tiene con qué:
 * los escribe una plantilla o la IA, y un bloque a medio configurar tiene que
 * salir discreto, no roto.
 */

function Seccion({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn("border-t border-tinta/15 py-16 md:py-20", className)}
    >
      <div className="mx-auto w-full max-w-5xl px-5">{children}</div>
    </section>
  )
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-titular text-[clamp(1.5rem,4vw,2.25rem)] leading-tight font-extrabold tracking-[-0.03em]">
      {children}
    </h2>
  )
}

function Portada({ bloque }: PropsBloque) {
  const accion = accionDePortada(bloque)
  const bajada = texto(bloque, "subtitle")
  // Solo la foto propia: sin ella, la portada editorial sigue siendo
  // tipográfica, como siempre fue.
  const foto = texto(bloque, "imageUrl")

  return (
    <section className="py-20 md:py-28">
      <div
        className={cn(
          "mx-auto w-full max-w-5xl px-5",
          foto &&
            "grid gap-10 md:grid-cols-[1.3fr_1fr] md:items-center md:gap-14"
        )}
      >
        <div>
          <h1 className="max-w-[16ch] font-titular text-[clamp(2.5rem,9vw,5rem)] leading-[0.98] font-extrabold tracking-[-0.04em]">
            {texto(bloque, "title") ?? "Bienvenido"}
          </h1>
          {bajada ? (
            <p className="mt-6 max-w-[52ch] text-lg leading-relaxed opacity-70">
              {bajada}
            </p>
          ) : null}
          {accion ? (
            <a
              href="#catalogo"
              className="mt-10 inline-flex min-h-12 items-center gap-2 rounded-plantilla bg-senal px-6 font-semibold text-white transition-colors hover:bg-senal-alta"
            >
              {accion}
              <ArrowRight aria-hidden="true" className="size-4" />
            </a>
          ) : null}
        </div>
        {foto ? (
          <div className="relative aspect-[4/5] overflow-hidden border border-tinta/15 bg-tinta/5">
            <Image
              src={foto}
              alt=""
              fill
              priority
              unoptimized
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover"
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function Tarjeta({ producto, tienda }: PropsTarjeta) {
  const agotado = producto.stock === 0
  const retrato = tienda.apariencia.disposicion.tarjeta === "retrato"

  return (
    <Link
      href={rutaDeTienda(tienda.slug, `/p/${producto.id}`)}
      className="group flex flex-col"
    >
      <div
        className={cn(
          "relative w-full overflow-hidden border border-tinta/15 bg-tinta/5",
          retrato ? "aspect-[3/4]" : "aspect-square"
        )}
      >
        {producto.image_url ? (
          <Image
            src={producto.image_url}
            alt={producto.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 340px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageOff aria-hidden="true" className="size-8 opacity-20" />
          </div>
        )}

        {agotado ? (
          <span className="absolute top-0 left-0 bg-tinta px-2 py-1 text-[10px] font-semibold tracking-[0.12em] text-papel uppercase">
            Agotado
          </span>
        ) : producto.compare_at_price_cents ? (
          <span className="absolute top-0 left-0 bg-senal px-2 py-1 text-[10px] font-semibold tracking-[0.12em] text-white uppercase">
            Oferta
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 font-titular text-base font-bold tracking-[-0.01em] transition-colors group-hover:text-senal">
        {producto.name}
      </h3>

      <p className="mt-1 flex items-baseline gap-2">
        <span className="tabular font-titular text-lg font-bold tracking-[-0.02em]">
          {formatMoney(producto.price_cents)}
        </span>
        {producto.compare_at_price_cents ? (
          <span className="tabular text-sm line-through opacity-40">
            {formatMoney(producto.compare_at_price_cents)}
          </span>
        ) : null}
      </p>

      {producto.condition !== "nuevo" ? (
        <p className="mt-1 text-xs tracking-[0.1em] text-senal uppercase">
          {producto.condition === "segunda_mano"
            ? "Segunda mano"
            : "Reacondicionado"}
        </p>
      ) : null}
    </Link>
  )
}

function Grilla({ bloque, tienda }: PropsBloque) {
  const productos = productosDeGrilla(bloque, tienda.productos)
  if (productos.length === 0) return null

  const columnas = numero(bloque, "columns") ?? 3

  return (
    <Seccion>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Titulo>{texto(bloque, "title") ?? "Productos"}</Titulo>
        <Link
          href={rutaDeTienda(tienda.slug, "/catalogo", {
            condicion: filtroDeGrilla(bloque).condicion,
          })}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
        >
          Ver todo
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      <div
        className={cn(
          "mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2",
          columnas >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
        )}
      >
        {productos.map((producto) => (
          <Tarjeta key={producto.id} producto={producto} tienda={tienda} />
        ))}
      </div>
    </Seccion>
  )
}

function Categorias({ bloque, tienda }: PropsBloque) {
  const categorias = categoriasConFoto(tienda, numero(bloque, "limit") ?? 6)
  if (categorias.length === 0) return null

  return (
    <Seccion>
      <Titulo>{texto(bloque, "title") ?? "Categorías"}</Titulo>

      <ul className="mt-8 grid border-t border-tinta sm:grid-cols-2">
        {categorias.map((categoria) => (
          <li key={categoria.id} className="border-b border-tinta/15">
            <Link
              href={rutaDeTienda(tienda.slug, "/catalogo", {
                categoria: categoria.id,
              })}
              className="group flex min-h-16 items-center justify-between gap-4 py-4 sm:pr-8"
            >
              <span className="font-titular text-xl font-bold tracking-[-0.02em] transition-colors group-hover:text-senal">
                {categoria.nombre}
              </span>
              <span className="tabular text-sm opacity-45">
                {categoria.productos}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Seccion>
  )
}

function Texto({ bloque }: PropsBloque) {
  const titulo = texto(bloque, "title")
  const cuerpo = texto(bloque, "body")
  const foto = texto(bloque, "imageUrl")
  if (!cuerpo && !titulo && !foto) return null

  return (
    <Seccion>
      <div
        className={cn(
          foto &&
            "grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center md:gap-14"
        )}
      >
        <div>
          {titulo ? <Titulo>{titulo}</Titulo> : null}
          {cuerpo ? (
            <p className="mt-6 max-w-[62ch] text-lg leading-relaxed opacity-75">
              {cuerpo}
            </p>
          ) : null}
        </div>
        {foto ? (
          <div className="relative aspect-[4/5] overflow-hidden border border-tinta/15 bg-tinta/5">
            <Image
              src={foto}
              alt=""
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 420px"
              className="object-cover"
            />
          </div>
        ) : null}
      </div>
    </Seccion>
  )
}

function Cierre({ bloque }: PropsBloque) {
  const titulo = texto(bloque, "title")
  const cuerpo = texto(bloque, "body")
  if (!titulo && !cuerpo) return null

  return (
    <section className="bg-senal py-16 text-white md:py-20">
      <div className="mx-auto w-full max-w-5xl px-5">
        <h2 className="max-w-[20ch] font-titular text-[clamp(1.75rem,5vw,3rem)] leading-[1.02] font-extrabold tracking-[-0.03em]">
          {titulo ?? "Escríbenos"}
        </h2>
        {cuerpo ? (
          <p className="mt-5 max-w-[52ch] text-lg leading-relaxed opacity-90">
            {cuerpo}
          </p>
        ) : null}
      </div>
    </section>
  )
}

function Preguntas({ bloque }: PropsBloque) {
  const lista = items(bloque)
    .map(preguntaYRespuesta)
    .filter((item) => item.pregunta)
  if (lista.length === 0) return null

  return (
    <Seccion>
      <Titulo>{texto(bloque, "title") ?? "Preguntas frecuentes"}</Titulo>

      <dl className="mt-10 flex flex-col">
        {lista.map((item, i) => (
          <div
            key={i}
            className="border-t border-tinta/15 py-6 first:border-t-0"
          >
            <dt className="font-titular text-lg font-bold tracking-[-0.01em]">
              {item.pregunta}
            </dt>
            {item.respuesta ? (
              <dd className="mt-2 max-w-[62ch] leading-relaxed opacity-70">
                {item.respuesta}
              </dd>
            ) : null}
          </div>
        ))}
      </dl>
    </Seccion>
  )
}

function Voces({ bloque }: PropsBloque) {
  const lista = items(bloque).filter((item) => typeof item.quote === "string")
  if (lista.length === 0) return null

  return (
    <Seccion>
      <Titulo>{texto(bloque, "title") ?? "Lo que dicen"}</Titulo>

      <div className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-2">
        {lista.map((item, i) => (
          <blockquote key={i} className="border-l-2 border-senal pl-5">
            <p className="text-lg leading-relaxed">«{String(item.quote)}»</p>
            {typeof item.author === "string" ? (
              <footer className="mt-3 text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
                {item.author}
              </footer>
            ) : null}
          </blockquote>
        ))}
      </div>
    </Seccion>
  )
}

function Contacto({ bloque }: PropsBloque) {
  const whatsapp = texto(bloque, "whatsapp")
  const direccion = texto(bloque, "address")
  const horario = texto(bloque, "hours")
  if (!whatsapp && !direccion && !horario) return null

  return (
    <Seccion>
      <Titulo>{texto(bloque, "title") ?? "Dónde encontrarnos"}</Titulo>

      <dl className="mt-8 grid gap-6 sm:grid-cols-3">
        {whatsapp ? (
          <div>
            <dt className="text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
              WhatsApp
            </dt>
            <dd className="mt-2">
              <a
                href={`https://wa.me/${numeroDeWhatsApp(whatsapp)}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-11 items-center gap-2 font-semibold transition-colors hover:text-senal"
              >
                <MessageCircle aria-hidden="true" className="size-4" />
                {whatsapp}
              </a>
            </dd>
          </div>
        ) : null}

        {direccion ? (
          <div>
            <dt className="text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
              Dirección
            </dt>
            <dd className="mt-2 leading-relaxed">{direccion}</dd>
          </div>
        ) : null}

        {horario ? (
          <div>
            <dt className="text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
              Horario
            </dt>
            <dd className="mt-2 leading-relaxed">{horario}</dd>
          </div>
        ) : null}
      </dl>
    </Seccion>
  )
}

export const BLOQUES_CLASICOS: KitDeTienda["bloques"] = {
  hero: Portada,
  categories: Categorias,
  product_grid: Grilla,
  about: Texto,
  testimonials: Voces,
  cta: Cierre,
  contact: Contacto,
  faq: Preguntas,
} satisfies Record<TipoDeBloque, unknown>
