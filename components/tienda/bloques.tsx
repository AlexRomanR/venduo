import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ImageOff, MessageCircle } from "lucide-react"

import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { BloquePublico } from "@/lib/data/tienda-publica"
import type { Product } from "@/types"

/**
 * Los bloques de la tienda pública.
 *
 * Cada tipo sabe leer sus propiedades y tolera que falten: las escribe una
 * plantilla o la IA, y un bloque a medio configurar tiene que salir discreto,
 * no roto. Un tipo desconocido no se dibuja.
 */
export function Bloque({
  bloque,
  productos,
  slug,
  codigo,
}: {
  bloque: BloquePublico
  productos: Product[]
  slug: string
  codigo: string | null
}) {
  const texto = (clave: string) =>
    typeof bloque.props[clave] === "string"
      ? (bloque.props[clave] as string)
      : undefined
  const numero = (clave: string) =>
    typeof bloque.props[clave] === "number"
      ? (bloque.props[clave] as number)
      : undefined

  switch (bloque.tipo) {
    case "hero":
      return (
        <Portada
          titulo={texto("title")}
          bajada={texto("subtitle")}
          accion={texto("ctaText")}
        />
      )

    case "product_grid":
      return (
        <Grilla
          titulo={texto("title") ?? "Productos"}
          columnas={numero("columns") ?? 3}
          productos={filtrarBloque(productos, bloque).slice(
            0,
            numero("limit") ?? 12
          )}
          slug={slug}
          codigo={codigo}
        />
      )

    case "about":
      return <Texto titulo={texto("title")} cuerpo={texto("body")} />

    case "cta":
      return <Cierre titulo={texto("title")} cuerpo={texto("body")} />

    case "faq":
      return <Preguntas titulo={texto("title")} bloque={bloque} />

    case "testimonials":
      return <Voces titulo={texto("title")} bloque={bloque} />

    case "contact":
      return (
        <Contacto
          titulo={texto("title")}
          whatsapp={texto("whatsapp")}
          direccion={texto("address")}
          horario={texto("hours")}
        />
      )

    default:
      return null
  }
}

/** Un `product_grid` puede venir acotado por condición o por categoría. */
function filtrarBloque(productos: Product[], bloque: BloquePublico) {
  let salida = productos

  const condicion = bloque.props.condition
  if (typeof condicion === "string" && condicion !== "todos") {
    salida = salida.filter((p) => p.condition === condicion)
  }

  const categoria = bloque.props.category
  if (typeof categoria === "string" && categoria) {
    salida = salida.filter(
      (p) => p.category?.toLowerCase() === categoria.toLowerCase()
    )
  }

  return salida
}

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

function Portada({
  titulo,
  bajada,
  accion,
}: {
  titulo?: string
  bajada?: string
  accion?: string
}) {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto w-full max-w-5xl px-5">
        <h1 className="max-w-[16ch] font-titular text-[clamp(2.5rem,9vw,5rem)] leading-[0.98] font-extrabold tracking-[-0.04em]">
          {titulo ?? "Bienvenido"}
        </h1>
        {bajada ? (
          <p className="mt-6 max-w-[52ch] text-lg leading-relaxed opacity-70">
            {bajada}
          </p>
        ) : null}
        {accion ? (
          <a
            href="#catalogo"
            className="mt-10 inline-flex min-h-12 items-center gap-2 rounded-sm bg-senal px-6 font-semibold text-white transition-colors hover:bg-senal-alta"
          >
            {accion}
            <ArrowRight aria-hidden="true" className="size-4" />
          </a>
        ) : null}
      </div>
    </section>
  )
}

export function TarjetaProducto({
  producto,
  slug,
  codigo,
}: {
  producto: Product
  slug: string
  codigo: string | null
}) {
  const agotado = producto.stock === 0
  const href = codigo
    ? `/t/${slug}/p/${producto.id}?ref=${encodeURIComponent(codigo)}`
    : `/t/${slug}/p/${producto.id}`

  return (
    <Link href={href} className="group flex flex-col">
      <div className="relative aspect-square w-full overflow-hidden border border-tinta/15 bg-tinta/5">
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

function Grilla({
  titulo,
  columnas,
  productos,
  slug,
  codigo,
}: {
  titulo: string
  columnas: number
  productos: Product[]
  slug: string
  codigo: string | null
}) {
  if (productos.length === 0) return null

  return (
    <Seccion className="scroll-mt-20">
      <div id="catalogo" />
      <h2 className="font-titular text-[clamp(1.5rem,4vw,2.25rem)] leading-tight font-extrabold tracking-[-0.03em]">
        {titulo}
      </h2>

      <div
        className={cn(
          "mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2",
          columnas >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
        )}
      >
        {productos.map((producto) => (
          <TarjetaProducto
            key={producto.id}
            producto={producto}
            slug={slug}
            codigo={codigo}
          />
        ))}
      </div>
    </Seccion>
  )
}

function Texto({ titulo, cuerpo }: { titulo?: string; cuerpo?: string }) {
  if (!cuerpo && !titulo) return null

  return (
    <Seccion>
      {titulo ? (
        <h2 className="font-titular text-[clamp(1.5rem,4vw,2.25rem)] leading-tight font-extrabold tracking-[-0.03em]">
          {titulo}
        </h2>
      ) : null}
      {cuerpo ? (
        <p className="mt-6 max-w-[62ch] text-lg leading-relaxed opacity-75">
          {cuerpo}
        </p>
      ) : null}
    </Seccion>
  )
}

function Cierre({ titulo, cuerpo }: { titulo?: string; cuerpo?: string }) {
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

function Preguntas({
  titulo,
  bloque,
}: {
  titulo?: string
  bloque: BloquePublico
}) {
  const items = Array.isArray(bloque.props.items) ? bloque.props.items : []
  if (items.length === 0) return null

  return (
    <Seccion>
      <h2 className="font-titular text-[clamp(1.5rem,4vw,2.25rem)] leading-tight font-extrabold tracking-[-0.03em]">
        {titulo ?? "Preguntas frecuentes"}
      </h2>

      <dl className="mt-10 flex flex-col">
        {items.map((item, i) => {
          const fila = item as Record<string, unknown>
          const pregunta =
            typeof fila.q === "string"
              ? fila.q
              : typeof fila.question === "string"
                ? fila.question
                : null
          const respuesta =
            typeof fila.a === "string"
              ? fila.a
              : typeof fila.answer === "string"
                ? fila.answer
                : null
          if (!pregunta) return null

          return (
            <div
              key={i}
              className="border-t border-tinta/15 py-6 first:border-t-0"
            >
              <dt className="font-titular text-lg font-bold tracking-[-0.01em]">
                {pregunta}
              </dt>
              {respuesta ? (
                <dd className="mt-2 max-w-[62ch] leading-relaxed opacity-70">
                  {respuesta}
                </dd>
              ) : null}
            </div>
          )
        })}
      </dl>
    </Seccion>
  )
}

function Voces({ titulo, bloque }: { titulo?: string; bloque: BloquePublico }) {
  const items = Array.isArray(bloque.props.items) ? bloque.props.items : []
  if (items.length === 0) return null

  return (
    <Seccion>
      <h2 className="font-titular text-[clamp(1.5rem,4vw,2.25rem)] leading-tight font-extrabold tracking-[-0.03em]">
        {titulo ?? "Lo que dicen"}
      </h2>

      <div className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-2">
        {items.map((item, i) => {
          const fila = item as Record<string, unknown>
          const cita = typeof fila.quote === "string" ? fila.quote : null
          const autor = typeof fila.author === "string" ? fila.author : null
          if (!cita) return null

          return (
            <blockquote key={i} className="border-l-2 border-senal pl-5">
              <p className="text-lg leading-relaxed">«{cita}»</p>
              {autor ? (
                <footer className="mt-3 text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
                  {autor}
                </footer>
              ) : null}
            </blockquote>
          )
        })}
      </div>
    </Seccion>
  )
}

function Contacto({
  titulo,
  whatsapp,
  direccion,
  horario,
}: {
  titulo?: string
  whatsapp?: string
  direccion?: string
  horario?: string
}) {
  if (!whatsapp && !direccion && !horario) return null

  return (
    <Seccion>
      <h2 className="font-titular text-[clamp(1.5rem,4vw,2.25rem)] leading-tight font-extrabold tracking-[-0.03em]">
        {titulo ?? "Dónde encontrarnos"}
      </h2>

      <dl className="mt-8 grid gap-6 sm:grid-cols-3">
        {whatsapp ? (
          <div>
            <dt className="text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
              WhatsApp
            </dt>
            <dd className="mt-2">
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
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
