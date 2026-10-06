"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  Check,
  ImageOff,
  Loader2,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import type { ProductoSugerido } from "@/lib/catalogo"
import { BOTON_PRIMARIO } from "@/lib/estilos"
import { formatMoney } from "@/lib/format"
import { enlaceDeWhatsApp, mensajeDePedido } from "@/lib/pedidos"
import type { Apariencia } from "@/lib/plantillas/apariencia"
import { cn } from "@/lib/utils"
import type { PedidoInput, ResultadoPedido } from "@/app/t/[slug]/acciones"
import { useCarrito } from "@/components/tienda/carrito"

/** El último pedido mandado, para mostrarlo al volver de WhatsApp. */
interface Enviado {
  numero: number
  enlace: string
  /** Qué llevaba el carrito, para no crear el mismo pedido dos veces. */
  firma?: string
  /** Cuándo se mandó, en milisegundos. */
  cuando?: number
}

/**
 * Cuánto tiempo un carrito igual reabre el mismo pedido. Pasado ese rato es
 * una compra nueva: quien vuelve al día siguiente por lo mismo no puede caer en
 * un pedido que la tienda quizás ya cobró.
 */
const REUSAR_DURANTE_MS = 30 * 60 * 1000

/** El carrito reducido a productos y cantidades, sin importar el orden. */
function firmaDelCarrito(
  lineas: Array<{ productoId: string; cantidad: number }>
): string {
  return lineas
    .map((l) => `${l.productoId}:${l.cantidad}`)
    .sort()
    .join(",")
}

/**
 * El carrito, y el pedido que sale por WhatsApp.
 *
 * Quien compra no deja datos: ve lo que eligió, el total, y un botón que abre
 * WhatsApp con el pedido escrito para la tienda. El nombre y el teléfono ya
 * van en el chat; pedirlos acá era un formulario más entre la decisión y la
 * compra, para un tráfico que llega desde un enlace de WhatsApp.
 *
 * El pedido se guarda antes de abrir el chat, con su número: así la tienda lo
 * encuentra en su panel y el stock lo descuenta cuando lo marca pagado.
 *
 * Es el mismo en todas las plantillas y toma la identidad de los tokens. Lo que
 * elige la tienda es cómo se ordena: en dos columnas con el total fijo al
 * costado, como una boleta angosta, o por pasos numerados. Las piezas son las
 * mismas en los tres; cambia dónde va cada una.
 */
export function Checkout({
  slug,
  nombreTienda,
  whatsapp,
  demo = false,
  crear,
  opciones,
  sugeridos = [],
}: {
  slug: string
  nombreTienda: string
  /** Sin número, la tienda no puede recibir el pedido: no se ofrece el botón. */
  whatsapp: string | null
  /**
   * La tienda de ejemplo, sin base. Muestra el botón aunque no tenga número:
   * tocarlo explica que es un ejemplo, que es más útil que esconderlo.
   */
  demo?: boolean
  crear: (entrada: PedidoInput) => Promise<ResultadoPedido>
  opciones: Apariencia["carrito"]
  /** Otros productos de la tienda, por si los ofrece para sumar al pedido. */
  sugeridos?: ProductoSugerido[]
}) {
  const { lineas, subtotalCents, unidades, listo, vaciar } = useCarrito()
  const [enCurso, setEnCurso] = React.useState(false)
  const [enviado, setEnviado] = React.useState<Enviado | null>(null)
  const clave = `venduo:enviado:${slug}`

  // Quien vuelve de WhatsApp con el botón de atrás encuentra su pedido, y no
  // un carrito vacío que parece que lo perdió.
  React.useEffect(() => {
    try {
      const crudo = window.sessionStorage.getItem(clave)
      if (crudo) setEnviado(JSON.parse(crudo) as Enviado)
    } catch {
      // Sin almacenamiento, el aviso dura lo que dure esta pantalla.
    }
  }, [clave])

  async function enviar() {
    if (enCurso || lineas.length === 0) return

    // Quien vuelve atrás desde WhatsApp y manda otra vez lo mismo no crea otro
    // pedido: se reabre el chat con el que ya existe. Cada pedido de más es uno
    // que la tienda ve pendiente y nunca se cobra.
    const firma = firmaDelCarrito(lineas)
    if (
      enviado?.firma === firma &&
      Date.now() - (enviado.cuando ?? 0) < REUSAR_DURANTE_MS
    ) {
      vaciar()
      window.location.href = enviado.enlace
      return
    }

    setEnCurso(true)
    const resultado = await crear({
      items: lineas.map((l) => ({
        productoId: l.productoId,
        cantidad: l.cantidad,
      })),
    })

    if (!resultado.ok) {
      setEnCurso(false)
      toast.error(resultado.error)
      return
    }

    // El mensaje se arma con lo que calculó el servidor, no con lo que dice
    // el carrito: si un precio cambió mientras tanto, la tienda lee el real.
    const mensaje = mensajeDePedido({
      numero: resultado.numero,
      tienda: nombreTienda,
      lineas: resultado.lineas,
      totalCents: resultado.totalCents,
    })
    const nuevo: Enviado = {
      numero: resultado.numero,
      enlace: enlaceDeWhatsApp(resultado.whatsapp, mensaje),
      firma,
      cuando: Date.now(),
    }

    try {
      window.sessionStorage.setItem(clave, JSON.stringify(nuevo))
    } catch {
      // Sin almacenamiento igual se abre el chat; solo se pierde el aviso.
    }
    vaciar()
    setEnviado(nuevo)
    setEnCurso(false)

    // Se navega en vez de abrir otra pestaña: después de esperar al servidor
    // el navegador ya no considera esto un toque, y bloquearía la ventana.
    window.location.href = nuevo.enlace
  }

  if (!listo) {
    return (
      <div className="py-20 text-center opacity-40">
        <Loader2 aria-hidden="true" className="mx-auto size-6 animate-spin" />
      </div>
    )
  }

  if (lineas.length === 0) {
    return enviado ? (
      <PedidoEnviado enviado={enviado} slug={slug} />
    ) : (
      <div className="border-t-2 border-tinta py-14">
        <ShoppingBag aria-hidden="true" className="size-8 opacity-25" />
        <h2 className="mt-5 font-titular text-2xl font-extrabold tracking-[-0.03em]">
          Tu carrito está vacío.
        </h2>
        <p className="mt-3 max-w-[46ch] leading-relaxed opacity-70">
          Mira el catálogo de {nombreTienda} y agrega lo que te guste. Cuando
          estés listo, mandas tu pedido por WhatsApp.
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
  const boton = (
    <EnviarPorWhatsApp
      enCurso={enCurso}
      disponible={demo || Boolean(whatsapp)}
      alEnviar={enviar}
    />
  )

  if (opciones.diseno === "boleta") {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-10">
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
          <Total
            totalCents={subtotalCents}
            className="border-t-2 border-dashed border-tinta/30 pt-5"
          />
        </section>

        {sugerencias}

        <section>
          {boton}
          <SeguirComprando slug={slug} />
        </section>
      </div>
    )
  }

  if (opciones.diseno === "pasos") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col">
        <Paso numero={1} titulo="Revisa tu pedido" detalle={articulos}>
          <Lineas slug={slug} />
          {sugerencias}
        </Paso>
        <Paso numero={2} titulo="Mándalo por WhatsApp">
          <Total totalCents={subtotalCents} />
          {boton}
        </Paso>
        <SeguirComprando slug={slug} />
      </div>
    )
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
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
          <h2 className="font-titular text-xl font-bold tracking-[-0.02em]">
            Tu pedido
          </h2>
          <Total
            totalCents={subtotalCents}
            className="mt-6 border-t border-tinta/15 pt-5"
          />
          {boton}
        </div>
      </section>
    </div>
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

function Total({
  totalCents,
  className,
}: {
  totalCents: number
  className?: string
}) {
  return (
    <dl className={className}>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="font-titular text-lg font-bold tracking-[-0.02em]">
          Total
        </dt>
        <dd className="tabular font-titular text-2xl font-extrabold tracking-[-0.03em]">
          {formatMoney(totalCents)}
        </dd>
      </div>
    </dl>
  )
}

/**
 * El botón que manda el pedido.
 *
 * En la señal de la tienda y no en el verde de WhatsApp: es la acción de
 * compra de esta tienda, y lleva el color que la tienda eligió para eso.
 */
function EnviarPorWhatsApp({
  enCurso,
  disponible,
  alEnviar,
}: {
  enCurso: boolean
  disponible: boolean
  alEnviar: () => void
}) {
  if (!disponible) {
    return (
      <p className="mt-7 border-l-2 border-senal pl-4 text-sm leading-relaxed">
        Esta tienda todavía no recibe pedidos por WhatsApp. Vuelve a intentarlo
        más tarde.
      </p>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={alEnviar}
        disabled={enCurso}
        className={cn(BOTON_PRIMARIO, "mt-7 w-full")}
      >
        {enCurso ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <MessageCircle aria-hidden="true" className="size-4" />
        )}
        Enviar pedido por WhatsApp
      </button>

      <p className="mt-4 text-xs leading-relaxed opacity-60">
        Se abre WhatsApp con tu pedido ya escrito para la tienda. Ahí te
        responden y acuerdan el pago.
      </p>
    </>
  )
}

/** Lo que ve quien ya mandó su pedido, y vuelve a la tienda. */
function PedidoEnviado({ enviado, slug }: { enviado: Enviado; slug: string }) {
  return (
    <div className="border-t-2 border-tinta py-14">
      <span className="flex size-11 items-center justify-center rounded-full bg-senal text-white">
        <Check aria-hidden="true" className="size-5" />
      </span>
      <h2 className="mt-5 font-titular text-2xl font-extrabold tracking-[-0.03em]">
        Tu pedido #{enviado.numero} está listo.
      </h2>
      <p className="mt-3 max-w-[46ch] leading-relaxed opacity-70">
        Lo mandas desde WhatsApp. Si no se abrió, o todavía no lo enviaste,
        tócalo de nuevo: el mensaje sigue escrito.
      </p>
      <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2">
        <a
          href={enviado.enlace}
          className="inline-flex min-h-12 items-center gap-2 rounded-plantilla bg-senal px-6 font-semibold text-white transition-colors hover:bg-senal-alta"
        >
          <MessageCircle aria-hidden="true" className="size-4" />
          Abrir WhatsApp
        </a>
        <SeguirComprando slug={slug} />
      </div>
    </div>
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
