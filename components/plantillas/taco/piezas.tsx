import Image from "next/image"
import Link from "next/link"
import { ImageOff, MessageCircle } from "lucide-react"
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
 * Las piezas de Taco.
 *
 * Una zapatería de mujer en voz baja. La firma es **la repisa**: una regla de
 * tinta de 2 px bajo cada foto, donde se apoya el par, que se ve de perfil.
 * Debajo, sobre la misma placa, los números que quedan. Los títulos y el
 * nombre de la tienda van en minúsculas; los nombres de producto y los
 * botones conservan las suyas.
 */

/** La placa donde se apoya un par: la tinta apenas. */
export const PLACA = "bg-tinta/[0.045]"

/** La repisa: la regla de tinta donde se apoya el par. */
export function Repisa({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("block h-0.5 bg-tinta", className)}
    />
  )
}

/** El botón de Taco: recto, petróleo. No va en minúsculas. */
export const BOTON =
  "inline-flex min-h-12 items-center justify-center rounded-plantilla bg-senal px-7 text-sm font-medium text-white transition-colors hover:bg-senal-alta active:scale-[0.98]"

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
          "relative flex flex-col overflow-hidden",
          PLACA,
          retrato ? "aspect-[4/5]" : "aspect-square"
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden",
            retrato ? "aspect-square" : "aspect-[4/3]"
          )}
        >
          {producto.image_url ? (
            <Image
              src={producto.image_url}
              alt={producto.name}
              fill
              unoptimized
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 320px"
              className={cn(
                "object-cover object-bottom transition-transform duration-500 ease-out group-hover:translate-x-[2%] motion-reduce:transform-none",
                agotado && "opacity-45"
              )}
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <ImageOff aria-hidden="true" className="size-7 opacity-25" />
            </div>
          )}
        </div>
        <Repisa />
        <div className="flex flex-1 items-center px-2">
          {agotado ? (
            <span className="text-xs opacity-70">sin números por ahora</span>
          ) : (
            <OpcionesDeVitrina
              producto={producto}
              opcion="numero"
              forma="fichas"
              maximo={5}
              respaldo={
                producto.category ? (
                  <span className="text-xs lowercase opacity-70">
                    {producto.category}
                  </span>
                ) : null
              }
            />
          )}
        </div>
        {rebaja && !agotado ? (
          <span className="tabular absolute top-0 left-0 bg-senal px-2 py-1 text-xs font-medium text-white">
            −{rebaja}%
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 text-sm leading-snug transition-colors group-hover:text-senal">
        {producto.name}
      </h3>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="tabular font-medium">
          <PrecioDeVitrina producto={producto} />
        </span>
        {producto.compare_at_price_cents ? (
          <span className="tabular text-xs line-through opacity-55">
            {formatMoney(producto.compare_at_price_cents)}
          </span>
        ) : null}
      </p>
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

/** El título de una sección, en minúsculas y apretado. */
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
      <Etiqueta className="min-w-0 font-titular text-[clamp(1.875rem,7vw,3rem)] leading-[1] lowercase">
        {titulo}
      </Etiqueta>
      {enlace ? (
        <Link
          href={enlace.href}
          className="inline-flex min-h-11 shrink-0 items-center text-sm lowercase underline decoration-tinta/30 underline-offset-[6px] transition-colors hover:text-senal hover:decoration-senal"
        >
          {enlace.etiqueta}
        </Link>
      ) : null}
    </div>
  )
}

export function Rotulo({ children }: { children: ReactNode }) {
  return <span className="text-sm font-medium lowercase">{children}</span>
}

export function Encabezado({ antetitulo, titulo, bajada }: PropsEncabezado) {
  return (
    <div>
      {antetitulo ? <Rotulo>{antetitulo}</Rotulo> : null}
      <h1
        className={cn(
          "font-titular text-[clamp(2.5rem,10vw,4.5rem)] leading-[0.95] lowercase",
          antetitulo && "mt-2"
        )}
      >
        {titulo}
      </h1>
      {bajada ? (
        <p className="mt-4 max-w-[52ch] leading-relaxed opacity-75">{bajada}</p>
      ) : null}
      <Repisa className="mt-6" />
    </div>
  )
}

export function Vacio({ titulo, texto, accion }: PropsVacio) {
  return (
    <div className={cn("px-6 pt-16 text-center md:pt-24", PLACA)}>
      <h2 className="font-titular text-[clamp(1.875rem,7vw,2.75rem)] leading-tight lowercase">
        {titulo}
      </h2>
      <p className="mx-auto mt-4 max-w-[44ch] leading-relaxed opacity-75">
        {texto}
      </p>
      {accion ? (
        <Link href={accion.href} className={cn(BOTON, "mt-8")}>
          {accion.etiqueta}
        </Link>
      ) : null}
      <Repisa className="mt-16" />
    </div>
  )
}

/** La tienda y cómo se compra, sobre la repisa. */
export function Cierre({ tienda }: { tienda: TiendaPublica }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-16 md:py-24">
      <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-end md:gap-20">
        <div>
          <h2 className="font-titular text-[clamp(2.5rem,10vw,5rem)] leading-[0.95] lowercase">
            {tienda.nombre}
          </h2>
          {tienda.descripcion ? (
            <p className="mt-5 max-w-[48ch] text-lg leading-relaxed opacity-80">
              {tienda.descripcion}
            </p>
          ) : null}
        </div>
        <dl className="flex flex-col gap-5">
          <SiRecibePedidos>
            <div>
              <dt>
                <Rotulo>cómo comprar</Rotulo>
              </dt>
              <dd className="mt-1.5 leading-relaxed opacity-85">
                Elige tus pares y tu número, y envíanos el pedido por WhatsApp.
                Ahí coordinamos el pago y la entrega.
              </dd>
            </div>
          </SiRecibePedidos>
          {tienda.whatsapp ? (
            <div>
              <dt className="sr-only">WhatsApp</dt>
              <dd>
                <a
                  href={`https://wa.me/${numeroDeWhatsApp(tienda.whatsapp)}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-11 items-center gap-2 underline decoration-tinta/30 underline-offset-4 transition-colors hover:text-senal hover:decoration-senal"
                >
                  <MessageCircle aria-hidden="true" className="size-4" />
                  ¿Dudas con tu número? Escríbenos
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
      <Repisa className="mt-12" />
    </section>
  )
}

/** El pie: la repisa, el nombre en minúsculas, enorme, y los enlaces. */
export function Pie({ marco }: PropsPie) {
  const enlace =
    "flex min-h-11 items-center text-sm lowercase opacity-75 transition-opacity hover:opacity-100"

  return (
    <footer>
      <div className="mx-auto w-full max-w-7xl px-5 pt-10 pb-8">
        <p className="font-titular text-[clamp(2.75rem,13vw,7rem)] leading-[0.9] lowercase">
          {marco.nombre}
        </p>
        <Repisa className="mt-4" />
        <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-3">
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
          <Link href="/" className={cn(enlace, "normal-case sm:justify-end")}>
            Hecho con Venduo
          </Link>
        </div>
      </div>
    </footer>
  )
}
