"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ImageOff,
  Loader2,
  Lock,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import type { ProductoSugerido } from "@/lib/catalogo"
import {
  AYUDA_CAMPO,
  BOTON_PRIMARIO,
  CAMPO_LINEA,
  ETIQUETA_CAMPO,
} from "@/lib/estilos"
import { formatMoney } from "@/lib/format"
import type { Apariencia } from "@/lib/plantillas/apariencia"
import { cn } from "@/lib/utils"
import type { PedidoInput, ResultadoPedido } from "@/app/t/[slug]/acciones"
import { useCarrito } from "@/components/tienda/carrito"

/**
 * Carrito y checkout, en una sola pantalla.
 *
 * Separarlos agrega una pantalla entre la decisión y el pedido, y el tráfico de
 * esta tienda llega de un enlace de WhatsApp con datos contados.
 *
 * Es el mismo en todas las plantillas y toma la identidad de los tokens. Lo que
 * elige la tienda es cómo se ordena: en dos columnas con el resumen fijo al
 * costado, como una boleta angosta, o por pasos numerados. Las piezas son las
 * mismas en los tres; cambia dónde va cada una.
 */
export function Checkout({
  slug,
  nombreTienda,
  crear,
  opciones,
  sugeridos = [],
}: {
  slug: string
  nombreTienda: string
  crear: (entrada: PedidoInput) => Promise<ResultadoPedido>
  opciones: Apariencia["carrito"]
  /** Otros productos de la tienda, por si los ofrece para sumar al pedido. */
  sugeridos?: ProductoSugerido[]
}) {
  const router = useRouter()
  const { lineas, referido, subtotalCents, unidades, listo } = useCarrito()

  const [nombre, setNombre] = React.useState("")
  const [telefono, setTelefono] = React.useState("")
  const [correo, setCorreo] = React.useState("")
  const [enCurso, setEnCurso] = React.useState(false)

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    if (enCurso || lineas.length === 0) return

    setEnCurso(true)
    const resultado = await crear({
      nombre,
      telefono,
      correo: opciones.correo ? correo : "",
      referido,
      items: lineas.map((l) => ({
        productoId: l.productoId,
        cantidad: l.cantidad,
      })),
    })

    if (!resultado.ok || !resultado.pedidoId) {
      setEnCurso(false)
      toast.error(resultado.error ?? "No pudimos tomar el pedido.")
      return
    }

    // El carrito se vacía en la pantalla de pago, no acá: si algo fallara en el
    // camino, el comprador se quedaría sin carrito y sin pedido.
    router.push(`/t/${slug}/pedido/${resultado.pedidoId}`)
  }

  if (!listo) {
    return (
      <div className="py-20 text-center opacity-40">
        <Loader2 aria-hidden="true" className="mx-auto size-6 animate-spin" />
      </div>
    )
  }

  if (lineas.length === 0) {
    return (
      <div className="border-t-2 border-tinta py-14">
        <ShoppingBag aria-hidden="true" className="size-8 opacity-25" />
        <h2 className="mt-5 font-titular text-2xl font-extrabold tracking-[-0.03em]">
          Tu carrito está vacío.
        </h2>
        <p className="mt-3 max-w-[46ch] leading-relaxed opacity-70">
          Mira el catálogo de {nombreTienda} y agrega lo que te guste. No pagas
          nada hasta coordinar con la tienda.
        </p>
        <Link
          href={`/t/${slug}`}
          className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-plantilla bg-senal px-6 font-semibold text-white transition-colors hover:bg-senal-alta"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Ver el catálogo
        </Link>
      </div>
    )
  }

  const articulos = `${unidades} ${unidades === 1 ? "artículo" : "artículos"}`
  const sugerencias = opciones.sugerencias ? (
    <Sugerencias sugeridos={sugeridos} />
  ) : null
  const campos = (
    <Campos
      nombre={nombre}
      setNombre={setNombre}
      telefono={telefono}
      setTelefono={setTelefono}
      correo={opciones.correo ? correo : null}
      setCorreo={setCorreo}
    />
  )
  const confirmar = <Confirmar enCurso={enCurso} referido={referido} />

  if (opciones.diseno === "boleta") {
    return (
      <form
        onSubmit={enviar}
        className="mx-auto flex w-full max-w-xl flex-col gap-10"
      >
        {/* Una nota de venta: angosta, con los renglones separados por un
            punteado y el total abajo, como la que se lleva uno de la tienda. */}
        <section className="border-2 border-tinta px-5 pt-5 pb-6 sm:px-7">
          <div className="flex items-baseline justify-between gap-3 border-b-2 border-dashed border-tinta/30 pb-4">
            <h2 className="text-xs font-semibold tracking-[0.16em] uppercase">
              Nota de pedido
            </h2>
            <p className="text-xs tracking-[0.12em] uppercase opacity-55">
              {articulos}
            </p>
          </div>
          <Lineas slug={slug} compacta />
          <Totales
            subtotalCents={subtotalCents}
            className="border-t-2 border-dashed border-tinta/30 pt-5"
          />
        </section>

        {sugerencias}

        <section>
          <EncabezadoDeDatos />
          <div className="mt-7">{campos}</div>
          {confirmar}
          <SeguirComprando slug={slug} />
        </section>
      </form>
    )
  }

  if (opciones.diseno === "pasos") {
    return (
      <form
        onSubmit={enviar}
        className="mx-auto flex w-full max-w-2xl flex-col"
      >
        <Paso numero={1} titulo="Revisa tu pedido" detalle={articulos}>
          <Lineas slug={slug} />
          {sugerencias}
        </Paso>
        <Paso numero={2} titulo="Tus datos" detalle="Para coordinar la entrega">
          {campos}
        </Paso>
        <Paso numero={3} titulo="Confirma">
          <Totales subtotalCents={subtotalCents} />
          {confirmar}
        </Paso>
        <SeguirComprando slug={slug} />
      </form>
    )
  }

  return (
    <form
      onSubmit={enviar}
      className="grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-16"
    >
      <section>
        <h2 className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
          Tu carrito · {articulos}
        </h2>
        <div className="mt-6">
          <Lineas slug={slug} />
        </div>
        {sugerencias}
        <SeguirComprando slug={slug} />
      </section>

      <section className="lg:sticky lg:top-24 lg:self-start">
        <div className="border-t-2 border-tinta pt-7">
          <EncabezadoDeDatos />
          <div className="mt-7">{campos}</div>
          <Totales
            subtotalCents={subtotalCents}
            className="mt-8 border-t border-tinta/15 pt-5"
          />
          {confirmar}
        </div>
      </section>
    </form>
  )
}

/** Lo que hay en el carrito, con sus cantidades. */
function Lineas({
  slug,
  compacta = false,
}: {
  slug: string
  /** Renglones de boleta: foto chica y un punteado entre uno y otro. */
  compacta?: boolean
}) {
  const { lineas, cambiar, quitar } = useCarrito()

  return (
    <ul className="flex flex-col">
      {lineas.map((linea) => (
        <li
          key={linea.productoId}
          className={cn(
            "flex border-t first:border-t-0",
            compacta
              ? "gap-3 border-dashed border-tinta/25 py-4"
              : "gap-4 border-tinta/15 py-5 first:pt-0"
          )}
        >
          <Link
            href={`/t/${slug}/p/${linea.productoId}`}
            className={cn(
              "shrink-0 overflow-hidden border border-tinta/15 bg-tinta/5",
              compacta ? "size-14" : "size-20 sm:size-24"
            )}
          >
            {linea.imagen ? (
              <Image
                src={linea.imagen}
                alt={linea.nombre}
                width={192}
                height={192}
                unoptimized
                className="size-full object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center">
                <ImageOff aria-hidden="true" className="size-5 opacity-25" />
              </span>
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
              <h3
                className={cn(
                  "min-w-0 flex-1 font-titular font-bold tracking-[-0.01em]",
                  compacta ? "text-sm" : "text-base"
                )}
              >
                <Link
                  href={`/t/${slug}/p/${linea.productoId}`}
                  className="transition-colors hover:text-senal"
                >
                  {linea.nombre}
                </Link>
              </h3>
              <p className="tabular font-titular font-bold">
                {formatMoney(linea.precioCents * linea.cantidad)}
              </p>
            </div>

            <p className="tabular mt-1 text-xs opacity-45">
              {formatMoney(linea.precioCents)} cada uno
            </p>

            <div
              className={cn(
                "flex items-center gap-1",
                compacta ? "mt-2" : "mt-3"
              )}
            >
              <button
                type="button"
                onClick={() => cambiar(linea.productoId, linea.cantidad - 1)}
                aria-label={`Quitar una unidad de ${linea.nombre}`}
                className="flex size-11 items-center justify-center border border-tinta/25 transition-colors hover:border-senal hover:text-senal"
              >
                <Minus aria-hidden="true" className="size-3.5" />
              </button>
              <span
                aria-live="polite"
                className="tabular flex h-11 w-11 items-center justify-center font-semibold"
              >
                {linea.cantidad}
              </span>
              <button
                type="button"
                onClick={() => cambiar(linea.productoId, linea.cantidad + 1)}
                disabled={linea.cantidad >= linea.stock}
                aria-label={`Agregar una unidad de ${linea.nombre}`}
                className="flex size-11 items-center justify-center border border-tinta/25 transition-colors hover:border-senal hover:text-senal disabled:opacity-30"
              >
                <Plus aria-hidden="true" className="size-3.5" />
              </button>

              <button
                type="button"
                onClick={() => quitar(linea.productoId)}
                aria-label={`Quitar ${linea.nombre} del carrito`}
                className="ml-auto flex size-11 items-center justify-center opacity-40 transition-colors hover:text-senal hover:opacity-100"
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </div>

            {linea.cantidad >= linea.stock ? (
              <p className="mt-2 text-xs text-senal">
                Es todo el stock que queda.
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * Tres productos más, para sumar sin salir del carrito.
 *
 * Los que ya están en el pedido no se ofrecen: al agregar uno, pasa de acá a
 * la lista de arriba, y eso es lo que confirma que entró.
 */
function Sugerencias({ sugeridos }: { sugeridos: ProductoSugerido[] }) {
  const { lineas, agregar } = useCarrito()

  const libres = sugeridos
    .filter((producto) => !lineas.some((l) => l.productoId === producto.id))
    .slice(0, 3)

  if (libres.length === 0) return null

  return (
    <section aria-labelledby="suma-a-tu-pedido" className="mt-10">
      <h3
        id="suma-a-tu-pedido"
        className="text-xs font-semibold tracking-[0.12em] uppercase opacity-60"
      >
        Suma a tu pedido
      </h3>
      <ul className="mt-4 grid grid-cols-3 gap-3">
        {libres.map((producto) => (
          <li key={producto.id} className="flex min-w-0 flex-col">
            <div className="relative aspect-square overflow-hidden border border-tinta/15 bg-tinta/5">
              {producto.imagen ? (
                <Image
                  src={producto.imagen}
                  alt=""
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 30vw, 180px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-snug font-semibold">
              {producto.nombre}
            </p>
            <p className="tabular mt-0.5 text-sm opacity-70">
              {formatMoney(producto.precioCents)}
            </p>
            <div className="mt-auto pt-3">
              <button
                type="button"
                onClick={() => {
                  agregar(
                    {
                      productoId: producto.id,
                      nombre: producto.nombre,
                      precioCents: producto.precioCents,
                      imagen: producto.imagen,
                      stock: producto.stock,
                    },
                    1
                  )
                  toast.success(`${producto.nombre} está en tu carrito.`)
                }}
                aria-label={`Agregar ${producto.nombre}`}
                className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-plantilla border-2 border-tinta px-2 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"
              >
                <Plus aria-hidden="true" className="size-4 shrink-0" />
                Agregar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function EncabezadoDeDatos() {
  return (
    <>
      <h2 className="font-titular text-xl font-bold tracking-[-0.02em]">
        Tus datos
      </h2>
      <p className="mt-2 max-w-[44ch] text-sm leading-relaxed opacity-60">
        La tienda los usa para coordinar la entrega. No se publican en ningún
        lado.
      </p>
    </>
  )
}

function Campos({
  nombre,
  setNombre,
  telefono,
  setTelefono,
  correo,
  setCorreo,
}: {
  nombre: string
  setNombre: (valor: string) => void
  telefono: string
  setTelefono: (valor: string) => void
  /** `null` si la tienda no pide correo. */
  correo: string | null
  setCorreo: (valor: string) => void
}) {
  return (
    <div className="grid gap-6">
      <label className="block">
        <span className={ETIQUETA_CAMPO}>Tu nombre</span>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          maxLength={120}
          autoComplete="name"
          className={cn(CAMPO_LINEA, "mt-2 w-full outline-none")}
        />
      </label>

      <label className="block">
        <span className={ETIQUETA_CAMPO}>Tu WhatsApp</span>
        <input
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          required
          type="tel"
          inputMode="tel"
          placeholder="70000000"
          autoComplete="tel"
          className={cn(CAMPO_LINEA, "mt-2 w-full outline-none")}
        />
        <span className={cn(AYUDA_CAMPO, "mt-2 block")}>
          Por aquí se coordina la entrega y el pago.
        </span>
      </label>

      {correo !== null ? (
        <label className="block">
          <span className={ETIQUETA_CAMPO}>Tu correo (opcional)</span>
          <input
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            type="email"
            autoComplete="email"
            className={cn(CAMPO_LINEA, "mt-2 w-full outline-none")}
          />
        </label>
      ) : null}
    </div>
  )
}

function Totales({
  subtotalCents,
  className,
}: {
  subtotalCents: number
  className?: string
}) {
  return (
    <dl className={className}>
      <div className="flex items-baseline justify-between">
        <dt className="text-sm opacity-60">Subtotal</dt>
        <dd className="tabular text-sm">{formatMoney(subtotalCents)}</dd>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-4">
        <dt className="text-sm opacity-60">Entrega</dt>
        <dd className="text-right text-sm opacity-60">
          Se coordina por WhatsApp
        </dd>
      </div>
      <div className="mt-4 flex items-baseline justify-between border-t-2 border-tinta pt-4">
        <dt className="font-titular text-lg font-bold tracking-[-0.02em]">
          Total
        </dt>
        <dd className="tabular font-titular text-2xl font-extrabold tracking-[-0.03em]">
          {formatMoney(subtotalCents)}
        </dd>
      </div>
    </dl>
  )
}

function Confirmar({
  enCurso,
  referido,
}: {
  enCurso: boolean
  referido: string | null
}) {
  return (
    <>
      {referido ? (
        <p className="mt-5 border-l-2 border-senal pl-4 text-sm leading-relaxed opacity-70">
          Tu compra queda referida al vendedor{" "}
          <span className="font-semibold text-senal">{referido}</span>.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enCurso}
        className={cn(BOTON_PRIMARIO, "mt-7 w-full")}
      >
        {enCurso ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : null}
        Confirmar pedido
      </button>

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed opacity-50">
        <Lock aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        Todavía no pagas nada. En el paso siguiente ves el QR de la tienda para
        transferir, y subes tu comprobante.
      </p>
    </>
  )
}

/** Un paso numerado del carrito por pasos. */
function Paso({
  numero,
  titulo,
  detalle,
  children,
}: {
  numero: number
  titulo: string
  detalle?: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t-2 border-tinta pt-6 pb-10">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          aria-hidden="true"
          className="tabular font-titular text-3xl leading-none font-extrabold text-senal"
        >
          {numero}
        </span>
        <h2 className="font-titular text-xl font-bold tracking-[-0.02em]">
          <span className="sr-only">Paso {numero}: </span>
          {titulo}
        </h2>
        {detalle ? (
          <span className="ml-auto text-xs tracking-[0.12em] uppercase opacity-55">
            {detalle}
          </span>
        ) : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  )
}

function SeguirComprando({ slug }: { slug: string }) {
  return (
    <Link
      href={`/t/${slug}`}
      className="group mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
    >
      <ArrowLeft
        aria-hidden="true"
        className="size-4 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transform-none"
      />
      Seguir comprando
    </Link>
  )
}
