import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ImageOff, MessageCircle } from "lucide-react"
import type { ReactNode } from "react"

import { numeroDeWhatsApp } from "@/lib/pedidos"
import { descuento } from "@/lib/plantillas/bloques"
import { formatMoney } from "@/lib/format"
import { rutaDeTienda } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import type { TiendaPublica } from "@/lib/data/tienda-publica"
import type {
  PropsEncabezado,
  PropsPie,
  PropsTarjeta,
  PropsVacio,
} from "@/components/plantillas/kit"
import { OpcionesDeVitrina } from "@/components/tienda/opciones-de-vitrina"
import { PrecioDeVitrina } from "@/components/tienda/precio"
import { SiRecibePedidos } from "@/components/tienda/carrito"

/**
 * Las piezas de Probador.
 *
 * Una boutique de ropa de mujer: fotos altas de cuerpo entero, la serif de
 * contraste alto en los títulos y lo práctico a la vista —las tallas bajo
 * cada prenda, un sello de "Nuevo" en lo que acaba de entrar—. El ciruela va
 * en lo que se compra y en la rebaja; el rosa empolvado es el papel.
 */

/** Cuántos días una prenda lleva el sello de "Nuevo". */
const DIAS_DE_NUEVO = 14

const BOTON =
  "group inline-flex min-h-12 items-center justify-center gap-3 rounded-plantilla bg-tinta px-7 text-sm font-medium text-papel transition-colors hover:bg-senal active:scale-[0.98]"

/** El botón de Probador: tinta, en minúsculas, con una flecha. */
export function Boton({
  href,
  children,
  className,
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  return (
    <Link href={href} className={cn(BOTON, className)}>
      {children}
      <ArrowRight
        aria-hidden="true"
        className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transform-none"
      />
    </Link>
  )
}

/** Si una prenda entró hace menos de dos semanas. */
export function esNueva(producto: { created_at: string }): boolean {
  const edad = Date.now() - new Date(producto.created_at).getTime()
  return edad >= 0 && edad < DIAS_DE_NUEVO * 24 * 60 * 60 * 1000
}

export function Tarjeta({ producto, tienda }: PropsTarjeta) {
  const agotado = producto.stock === 0
  const rebaja = descuento(producto)
  const retrato = tienda.apariencia.disposicion.tarjeta === "retrato"
  const otra = producto.images.find((foto) => foto !== producto.image_url)
  const nueva = !agotado && !rebaja && esNueva(producto)

  return (
    <Link
      href={rutaDeTienda(tienda.slug, `/p/${producto.id}`)}
      className="group block"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-[calc(var(--radio)*0.6)] bg-tinta/[0.05]",
          retrato ? "aspect-[2/3]" : "aspect-square"
        )}
      >
        {producto.image_url ? (
          <>
            <Image
              src={producto.image_url}
              alt={producto.name}
              fill
              unoptimized
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 320px"
              className={cn(
                "object-cover transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transform-none",
                otra && "group-hover:opacity-0",
                agotado && "opacity-50"
              )}
            />
            {/* La segunda foto aparece al pasar: la espalda, o puesta. */}
            {otra ? (
              <Image
                src={otra}
                alt=""
                fill
                unoptimized
                sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 320px"
                className="object-cover opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100"
              />
            ) : null}
          </>
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageOff aria-hidden="true" className="size-7 opacity-25" />
          </div>
        )}

        {nueva ? (
          <span className="absolute top-2.5 left-2.5 rounded-plantilla bg-papel px-2.5 py-1 text-xs leading-none font-medium tracking-[0.16em] uppercase">
            Nuevo
          </span>
        ) : null}
        {rebaja && !agotado ? (
          <span className="tabular absolute top-2.5 left-2.5 rounded-plantilla bg-senal px-2.5 py-1 text-xs leading-none font-medium text-white">
            −{rebaja}%
          </span>
        ) : null}
        {agotado ? (
          <span className="absolute inset-x-2.5 bottom-2.5 rounded-plantilla bg-papel/90 py-1.5 text-center text-xs tracking-[0.16em] uppercase">
            Agotado
          </span>
        ) : null}
      </div>

      <div className="mt-3">
        <h3 className="text-sm leading-snug transition-colors group-hover:text-senal md:text-[15px]">
          {producto.name}
        </h3>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className={cn("tabular font-medium", rebaja && "text-senal")}>
            <PrecioDeVitrina producto={producto} />
          </span>
          {producto.compare_at_price_cents ? (
            <span className="tabular text-xs line-through opacity-55">
              {formatMoney(producto.compare_at_price_cents)}
            </span>
          ) : null}
        </p>
        <OpcionesDeVitrina
          producto={producto}
          opcion="talla"
          forma="fichas"
          maximo={5}
          className="mt-2"
        />
      </div>
    </Link>
  )
}

export function grilla(columnas: number) {
  return cn(
    "grid grid-cols-2 gap-x-3 gap-y-8 md:gap-x-5 md:gap-y-12",
    columnas >= 3 && "md:grid-cols-3",
    columnas >= 4 && "lg:grid-cols-4"
  )
}

/** El título de una sección: la serif de revista, y "Ver todo" a su altura. */
export function Titulo({
  titulo,
  enlace,
  como = "h2",
}: {
  titulo: string
  enlace?: { etiqueta: string; href: string }
  como?: "h1" | "h2"
}) {
  const Etiqueta = como

  return (
    <div className="flex items-end justify-between gap-4">
      <Etiqueta className="min-w-0 font-titular text-[clamp(1.875rem,7vw,3.25rem)] leading-[1.02]">
        {titulo}
      </Etiqueta>
      {enlace ? (
        <Link
          href={enlace.href}
          className="inline-flex min-h-11 shrink-0 items-center text-sm underline decoration-tinta/30 underline-offset-[6px] transition-colors hover:text-senal hover:decoration-senal"
        >
          {enlace.etiqueta}
        </Link>
      ) : null}
    </div>
  )
}

export function Rotulo({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs font-medium tracking-[0.18em] uppercase">
      {children}
    </span>
  )
}

export function Encabezado({ antetitulo, titulo, bajada }: PropsEncabezado) {
  return (
    <div className="border-b border-tinta/15 pb-6">
      {antetitulo ? <Rotulo>{antetitulo}</Rotulo> : null}
      <h1
        className={cn(
          "font-titular text-[clamp(2.25rem,9vw,4.25rem)] leading-[1]",
          antetitulo && "mt-3"
        )}
      >
        {titulo}
      </h1>
      {bajada ? (
        <p className="mt-4 max-w-[52ch] leading-relaxed opacity-75">{bajada}</p>
      ) : null}
    </div>
  )
}

export function Vacio({ titulo, texto, accion }: PropsVacio) {
  return (
    <div className="rounded-[calc(var(--radio)*0.6)] bg-tinta/[0.04] px-6 py-16 text-center md:py-24">
      <h2 className="font-titular text-[clamp(1.875rem,7vw,3rem)] leading-tight">
        {titulo}
      </h2>
      <p className="mx-auto mt-4 max-w-[44ch] leading-relaxed opacity-75">
        {texto}
      </p>
      {accion ? (
        <Boton href={accion.href} className="mt-8">
          {accion.etiqueta}
        </Boton>
      ) : null}
    </div>
  )
}

/** Cómo se compra, con la tienda firmando en la serif. */
export function Cierre({ tienda }: { tienda: TiendaPublica }) {
  return (
    <section className="bg-tinta/[0.04]">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1.2fr_1fr] md:items-end md:gap-20 md:py-24">
        <div>
          <Rotulo>La boutique</Rotulo>
          <h2 className="mt-4 font-titular text-[clamp(2.25rem,10vw,5rem)] leading-[0.98]">
            {tienda.nombre}
          </h2>
          {tienda.descripcion ? (
            <p className="mt-5 max-w-[48ch] text-lg leading-relaxed opacity-80">
              {tienda.descripcion}
            </p>
          ) : null}
          {tienda.productos.length > 0 ? (
            <Boton
              href={rutaDeTienda(tienda.slug, "/catalogo")}
              className="mt-8"
            >
              Ver la colección
            </Boton>
          ) : null}
        </div>

        <dl>
          <SiRecibePedidos>
            <Dato titulo="Cómo comprar">
              Elige tus prendas y tu talla, y envíanos el pedido por WhatsApp.
              Ahí coordinamos el pago y la entrega.
            </Dato>
          </SiRecibePedidos>
          {tienda.whatsapp ? (
            <Dato titulo="¿Dudas con la talla?">
              <a
                href={`https://wa.me/${numeroDeWhatsApp(tienda.whatsapp)}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-11 items-center gap-2 underline decoration-tinta/30 underline-offset-4 transition-colors hover:text-senal hover:decoration-senal"
              >
                <MessageCircle aria-hidden="true" className="size-4" />
                Escríbenos y te ayudamos
              </a>
            </Dato>
          ) : null}
        </dl>
      </div>
    </section>
  )
}

function Dato({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="border-t border-tinta/20 py-5">
      <dt>
        <Rotulo>{titulo}</Rotulo>
      </dt>
      <dd className="mt-2 leading-relaxed opacity-85">{children}</dd>
    </div>
  )
}

/** El pie sobre el papel: el nombre grande en la serif y los enlaces debajo. */
export function Pie({ marco }: PropsPie) {
  const enlace =
    "flex min-h-11 items-center text-sm opacity-75 transition-opacity hover:opacity-100"

  return (
    <footer className="border-t border-tinta/15">
      <div className="mx-auto w-full max-w-7xl px-5 pt-10 pb-8">
        <p className="font-titular text-3xl leading-none md:text-4xl">
          {marco.nombre}
        </p>

        <div className="mt-6 grid gap-x-8 gap-y-6 border-t border-tinta/15 pt-6 sm:grid-cols-3">
          <nav aria-label="Tienda" className="flex flex-col">
            <Link href={rutaDeTienda(marco.slug, "")} className={enlace}>
              Inicio
            </Link>
            <Link
              href={rutaDeTienda(marco.slug, "/catalogo")}
              className={enlace}
            >
              Catálogo
            </Link>
            {marco.whatsapp ? (
              <a
                href={`https://wa.me/${numeroDeWhatsApp(marco.whatsapp)}`}
                target="_blank"
                rel="noreferrer noopener"
                className={enlace}
              >
                WhatsApp
              </a>
            ) : null}
          </nav>

          <p className="text-sm leading-relaxed opacity-70">
            Los pedidos y el pago los coordinamos por WhatsApp.
          </p>

          <Link href="/" className={cn(enlace, "sm:justify-end")}>
            Hecho con Venduo
          </Link>
        </div>
      </div>
    </footer>
  )
}
