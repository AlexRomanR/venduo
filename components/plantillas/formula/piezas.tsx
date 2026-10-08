import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ImageOff, MessageCircle } from "lucide-react"
import type { ReactNode } from "react"

import { numeroDeWhatsApp } from "@/lib/pedidos"
import { CONDICIONES, descuento } from "@/lib/plantillas/bloques"
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

/**
 * Las piezas de Fórmula.
 *
 * La gramática de una botica: los datos a máquina —la familia, el código, el
 * precio—, los nombres en una romana fina, reglas de un pixel y una etiqueta
 * pegada sobre cada frasco. Nada redondeado y casi nada en color: el oliva es
 * para comprar.
 */

/** Los datos van a máquina. Es lo que hace que la tienda se lea como un recetario. */
export const MAQUINA = "font-mono text-[11px] tracking-[0.06em] uppercase"

export function Tarjeta({ producto, tienda }: PropsTarjeta) {
  const agotado = producto.stock === 0
  const rebaja = descuento(producto)
  const retrato = tienda.apariencia.disposicion.tarjeta === "retrato"

  return (
    <Link
      href={rutaDeTienda(tienda.slug, `/p/${producto.id}`)}
      className="group block"
    >
      <div
        className={cn(
          "relative overflow-hidden bg-tinta/[0.06]",
          retrato ? "aspect-[3/4]" : "aspect-square"
        )}
      >
        {producto.image_url ? (
          <Image
            src={producto.image_url}
            alt={producto.name}
            fill
            unoptimized
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 420px"
            className={cn(
              "object-cover transition-[filter,transform] duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transform-none",
              agotado && "opacity-50 grayscale"
            )}
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageOff aria-hidden="true" className="size-7 opacity-25" />
          </div>
        )}
      </div>

      {/* La etiqueta pegada sobre el frasco: sube un poco encima de la foto. */}
      <div className="relative mx-2 -mt-7 border border-tinta bg-papel transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transform-none md:mx-3">
        <p
          className={cn(
            MAQUINA,
            "flex items-center justify-between gap-2 border-b border-tinta/25 px-2.5 py-1.5"
          )}
        >
          <span className="truncate opacity-75">
            {producto.category ?? "Sin familia"}
          </span>
          {agotado ? (
            <span>Agotado</span>
          ) : rebaja ? (
            <span className="text-senal">−{rebaja}%</span>
          ) : producto.condition !== "nuevo" ? (
            <span>{CONDICIONES[producto.condition]}</span>
          ) : null}
        </p>
        <h3 className="px-2.5 pt-2 font-titular text-[1.35rem] leading-[1.05] md:text-2xl">
          {producto.name}
        </h3>
        <p className="flex items-baseline gap-2 px-2.5 pt-1 pb-2.5 font-mono text-[13px]">
          <span className="tabular">{formatMoney(producto.price_cents)}</span>
          {producto.compare_at_price_cents ? (
            <span className="tabular text-[11px] line-through opacity-55">
              {formatMoney(producto.compare_at_price_cents)}
            </span>
          ) : null}
        </p>
      </div>
    </Link>
  )
}

export function grilla(columnas: number) {
  return cn(
    "grid grid-cols-2 gap-x-3 gap-y-9 md:grid-cols-3 md:gap-x-6 md:gap-y-12",
    columnas >= 4 && "lg:grid-cols-4"
  )
}

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
    <div className="flex items-end justify-between gap-4 border-b border-tinta pb-3">
      <Etiqueta className="min-w-0 font-titular text-[clamp(2.25rem,8vw,4rem)] leading-[0.98]">
        {titulo}
      </Etiqueta>
      {enlace ? (
        <Link
          href={enlace.href}
          className={cn(
            MAQUINA,
            "group inline-flex min-h-11 shrink-0 items-center gap-2 transition-colors hover:text-senal"
          )}
        >
          {enlace.etiqueta}
          <ArrowRight
            aria-hidden="true"
            className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none"
          />
        </Link>
      ) : null}
    </div>
  )
}

export function Rotulo({ children }: { children: ReactNode }) {
  return <span className={MAQUINA}>{children}</span>
}

export function Encabezado({ antetitulo, titulo, bajada }: PropsEncabezado) {
  return (
    <div className="border-b border-tinta pb-5">
      {antetitulo ? <Rotulo>{antetitulo}</Rotulo> : null}
      <h1
        className={cn(
          "font-titular text-[clamp(2.75rem,10vw,5rem)] leading-[0.95]",
          antetitulo && "mt-2"
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
    <div className="border border-tinta px-5 py-14 text-center md:py-20">
      <p className={cn(MAQUINA, "opacity-70")}>Sin existencias</p>
      <h2 className="mt-3 font-titular text-[clamp(2rem,8vw,3.25rem)] leading-tight">
        {titulo}
      </h2>
      <p className="mx-auto mt-3 max-w-[44ch] leading-relaxed opacity-75">
        {texto}
      </p>
      {accion ? (
        <Link
          href={accion.href}
          className={cn(
            MAQUINA,
            "mt-8 inline-flex min-h-12 items-center gap-3 rounded-plantilla bg-tinta px-7 text-papel transition-colors hover:bg-senal hover:text-white active:scale-[0.98]"
          )}
        >
          {accion.etiqueta}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
    </div>
  )
}

/**
 * El cierre: la ficha de la casa, como la hoja técnica que acompaña a una
 * fragancia. Datos a máquina en dos columnas y la puerta al catálogo.
 */
export function Cierre({ tienda }: { tienda: TiendaPublica }) {
  const familias = tienda.categorias.filter((c) => c.productos > 0).length

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-14 md:py-20">
      <div className="grid border border-tinta md:grid-cols-[1.2fr_1fr]">
        <div className="border-b border-tinta p-5 md:border-r md:border-b-0 md:p-10">
          <Rotulo>Ficha de la casa</Rotulo>
          <h2 className="mt-4 font-titular text-[clamp(2.5rem,10vw,5rem)] leading-[0.95]">
            {tienda.nombre}
          </h2>
          {tienda.descripcion ? (
            <p className="mt-5 max-w-[50ch] text-lg leading-relaxed opacity-80">
              {tienda.descripcion}
            </p>
          ) : null}
        </div>

        <dl className="flex flex-col">
          <Fila titulo="Frascos">
            <span className="tabular">{tienda.productos.length}</span>
          </Fila>
          {familias > 0 ? (
            <Fila titulo="Familias">
              <span className="tabular">{familias}</span>
            </Fila>
          ) : null}
          <Fila titulo="Pedidos">Por WhatsApp</Fila>
          {tienda.whatsapp ? (
            <Fila titulo="Asesoría">
              <a
                href={`https://wa.me/${numeroDeWhatsApp(tienda.whatsapp)}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-11 items-center gap-2 underline underline-offset-4 transition-colors hover:text-senal"
              >
                <MessageCircle aria-hidden="true" className="size-4" />
                Escríbenos
              </a>
            </Fila>
          ) : null}
          {tienda.productos.length > 0 ? (
            <Link
              href={rutaDeTienda(tienda.slug, "/catalogo")}
              className="group mt-auto flex min-h-16 items-center justify-between gap-4 bg-tinta px-5 text-papel transition-colors hover:bg-senal hover:text-white md:px-6"
            >
              <span className="font-titular text-2xl md:text-3xl">
                Ver todo el catálogo
              </span>
              <ArrowRight
                aria-hidden="true"
                className="size-5 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none"
              />
            </Link>
          ) : null}
        </dl>
      </div>
    </section>
  )
}

function Fila({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 border-b border-tinta/25 px-5 md:px-6">
      <dt className={cn(MAQUINA, "opacity-70")}>{titulo}</dt>
      <dd className="font-mono text-sm">{children}</dd>
    </div>
  )
}

export function Pie({ marco }: PropsPie) {
  const enlace = cn(
    MAQUINA,
    "flex min-h-11 items-center opacity-80 transition-opacity hover:opacity-100"
  )

  return (
    <footer className="border-t border-tinta">
      <div className="mx-auto w-full max-w-7xl px-5 pt-12 pb-8">
        <p className="font-titular text-[clamp(3rem,14vw,8.5rem)] leading-[0.9]">
          {marco.nombre}
        </p>

        <div className="mt-10 grid gap-x-8 gap-y-6 border-t border-tinta/25 pt-6 sm:grid-cols-3">
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

          <p className="text-sm leading-relaxed opacity-75">
            Los pedidos y el pago se acuerdan con la tienda por WhatsApp.
          </p>

          <Link href="/" className={cn(enlace, "sm:justify-end")}>
            Hecho con Venduo
          </Link>
        </div>
      </div>
    </footer>
  )
}
