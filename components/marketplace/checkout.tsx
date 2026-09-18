"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  ImageOff,
  Loader2,
  LockKeyhole,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { crearPedidosMarketplace } from "@/app/(marketplace)/carrito/acciones"
import { useCarritoMarketplace } from "@/components/marketplace/carrito"
import { formatMoney } from "@/lib/format"
import {
  datosCompradorSchema,
  type DatosComprador,
} from "@/lib/validation/checkout-marketplace"

export function CheckoutMarketplace() {
  const { lineas, listo, subtotalCents, cambiar, quitar, vaciar } =
    useCarritoMarketplace()
  const [enCurso, setEnCurso] = React.useState(false)
  const formulario = useForm<DatosComprador>({
    resolver: zodResolver(datosCompradorSchema),
    defaultValues: { nombre: "", telefono: "", correo: "" },
  })

  const grupos = React.useMemo(() => {
    const mapa = new Map<string, typeof lineas>()
    for (const linea of lineas) {
      const existentes = mapa.get(linea.negocioId) ?? []
      existentes.push(linea)
      mapa.set(linea.negocioId, existentes)
    }
    return [...mapa.values()]
  }, [lineas])

  async function enviar(datos: DatosComprador) {
    if (enCurso || lineas.length === 0) return
    setEnCurso(true)
    const resultado = await crearPedidosMarketplace({
      ...datos,
      items: lineas.map((linea) => ({
        productoId: linea.productoId,
        cantidad: linea.cantidad,
        referido: linea.referido,
      })),
    })
    setEnCurso(false)

    if (!resultado.ok || !resultado.pedidoIds?.length) {
      toast.error(resultado.error ?? "No pudimos crear el pedido.")
      return
    }

    vaciar()
    window.location.assign(
      `/pago?pedidos=${encodeURIComponent(resultado.pedidoIds.join(","))}`
    )
  }

  if (!listo) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2
          aria-hidden="true"
          className="size-6 animate-spin opacity-40"
        />
      </div>
    )
  }

  if (lineas.length === 0) {
    return (
      <div className="px-5 py-16 lg:px-10">
        <ShoppingBag aria-hidden="true" className="size-10 opacity-20" />
        <h1 className="mt-6 max-w-[15ch] font-titular text-4xl font-extrabold tracking-[-0.04em]">
          Tu carrito espera algo bueno.
        </h1>
        <p className="mt-4 max-w-[48ch] leading-relaxed opacity-65">
          Explora el Marketplace y guarda lo que quieras comprar. No necesitas
          una cuenta.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-plantilla bg-senal px-6 font-semibold text-white hover:bg-senal-alta"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Explorar productos
        </Link>
      </div>
    )
  }

  return (
    <div className="px-5 py-8 lg:px-10 lg:py-10">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold opacity-60 hover:text-senal hover:opacity-100"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Seguir comprando
        </Link>
        <h1 className="mt-3 font-titular text-[clamp(2.5rem,7vw,4.75rem)] leading-[0.95] font-extrabold tracking-[-0.04em]">
          Tu compra
        </h1>
      </div>

      <form
        onSubmit={formulario.handleSubmit(enviar)}
        className="grid gap-12 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] xl:gap-16"
      >
        <div>
          <div className="flex flex-col gap-9">
            {grupos.map((grupo) => {
              const nombre = grupo[0]?.negocioNombre ?? "Negocio"
              const subtotal = grupo.reduce(
                (total, linea) => total + linea.precioCents * linea.cantidad,
                0
              )
              return (
                <section key={grupo[0]?.negocioId}>
                  <div className="flex items-baseline justify-between gap-4 border-b-2 border-tinta pb-3">
                    <h2 className="font-titular text-lg font-bold tracking-[-0.02em]">
                      {nombre}
                    </h2>
                    <p className="tabular text-sm font-semibold">
                      {formatMoney(subtotal)}
                    </p>
                  </div>
                  <ul>
                    {grupo.map((linea) => (
                      <li
                        key={`${linea.productoId}:${linea.referido ?? "directo"}`}
                        className="flex gap-4 border-b border-tinta/15 py-5"
                      >
                        <Link
                          href={`/producto/${linea.productoId}`}
                          className="relative size-20 shrink-0 overflow-hidden bg-tinta/[0.06] sm:size-24"
                        >
                          {linea.imagen ? (
                            <Image
                              src={linea.imagen}
                              alt={linea.nombre}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="flex size-full items-center justify-center">
                              <ImageOff
                                aria-hidden="true"
                                className="size-5 opacity-20"
                              />
                            </span>
                          )}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <Link
                              href={`/producto/${linea.productoId}`}
                              className="font-titular font-bold tracking-[-0.015em] hover:text-senal"
                            >
                              {linea.nombre}
                            </Link>
                            <p className="tabular shrink-0 font-semibold">
                              {formatMoney(linea.precioCents * linea.cantidad)}
                            </p>
                          </div>
                          <p className="tabular mt-1 text-xs opacity-45">
                            {formatMoney(linea.precioCents)} cada uno
                          </p>
                          <div className="mt-3 flex items-center">
                            <button
                              type="button"
                              onClick={() =>
                                cambiar(
                                  linea.productoId,
                                  linea.referido,
                                  linea.cantidad - 1
                                )
                              }
                              aria-label={`Quitar una unidad de ${linea.nombre}`}
                              className="flex size-11 items-center justify-center border border-tinta/25"
                            >
                              <Minus aria-hidden="true" className="size-3.5" />
                            </button>
                            <span className="tabular flex size-11 items-center justify-center font-semibold">
                              {linea.cantidad}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                cambiar(
                                  linea.productoId,
                                  linea.referido,
                                  linea.cantidad + 1
                                )
                              }
                              disabled={linea.cantidad >= linea.stock}
                              aria-label={`Agregar una unidad de ${linea.nombre}`}
                              className="flex size-11 items-center justify-center border border-tinta/25 disabled:opacity-30"
                            >
                              <Plus aria-hidden="true" className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                quitar(linea.productoId, linea.referido)
                              }
                              aria-label={`Quitar ${linea.nombre} del carrito`}
                              className="ml-auto flex size-11 items-center justify-center opacity-45 hover:text-senal hover:opacity-100"
                            >
                              <Trash2 aria-hidden="true" className="size-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>

          {grupos.length > 1 ? (
            <p className="mt-7 flex items-start gap-2 border-t border-tinta/15 pt-5 text-sm leading-relaxed opacity-65">
              <LockKeyhole
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              Se crearán {grupos.length} pedidos porque cada negocio coordina su
              propia entrega. Los pagas por separado y todos quedan protegidos.
            </p>
          ) : null}
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div className="border-t-2 border-tinta pt-6">
            <h2 className="font-titular text-2xl font-extrabold tracking-[-0.03em]">
              ¿Dónde coordinamos?
            </h2>
            <p className="mt-2 text-sm leading-relaxed opacity-60">
              No necesitas crear una cuenta. El negocio usa estos datos para
              acordar la entrega.
            </p>

            <div className="mt-7 grid gap-5">
              <label>
                <span className="text-xs font-semibold tracking-[0.1em] uppercase opacity-55">
                  Tu nombre
                </span>
                <input
                  {...formulario.register("nombre")}
                  autoComplete="name"
                  className="mt-2 min-h-12 w-full border border-tinta/30 bg-transparent px-3 outline-none focus:border-senal"
                />
                {formulario.formState.errors.nombre ? (
                  <span className="mt-1 block text-xs text-senal">
                    {formulario.formState.errors.nombre.message}
                  </span>
                ) : null}
              </label>
              <label>
                <span className="text-xs font-semibold tracking-[0.1em] uppercase opacity-55">
                  Tu WhatsApp
                </span>
                <input
                  {...formulario.register("telefono")}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="70000000"
                  className="mt-2 min-h-12 w-full border border-tinta/30 bg-transparent px-3 outline-none placeholder:text-tinta/35 focus:border-senal"
                />
                {formulario.formState.errors.telefono ? (
                  <span className="mt-1 block text-xs text-senal">
                    {formulario.formState.errors.telefono.message}
                  </span>
                ) : null}
              </label>
              <label>
                <span className="text-xs font-semibold tracking-[0.1em] uppercase opacity-55">
                  Correo (opcional)
                </span>
                <input
                  {...formulario.register("correo")}
                  type="email"
                  autoComplete="email"
                  className="mt-2 min-h-12 w-full border border-tinta/30 bg-transparent px-3 outline-none focus:border-senal"
                />
                {formulario.formState.errors.correo ? (
                  <span className="mt-1 block text-xs text-senal">
                    {formulario.formState.errors.correo.message}
                  </span>
                ) : null}
              </label>
            </div>

            <dl className="mt-8 border-t border-tinta/15 pt-5">
              <div className="flex items-baseline justify-between gap-5 text-sm">
                <dt className="opacity-60">Productos</dt>
                <dd className="tabular">{formatMoney(subtotalCents)}</dd>
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-5 text-sm">
                <dt className="opacity-60">Entrega</dt>
                <dd className="text-right opacity-60">
                  Se coordina por WhatsApp
                </dd>
              </div>
              <div className="mt-5 flex items-baseline justify-between gap-5 border-t-2 border-tinta pt-4">
                <dt className="font-titular text-xl font-bold">Total</dt>
                <dd className="tabular font-titular text-3xl font-extrabold tracking-[-0.04em]">
                  {formatMoney(subtotalCents)}
                </dd>
              </div>
            </dl>

            <button
              type="submit"
              disabled={enCurso}
              className="mt-7 flex min-h-14 w-full items-center justify-center gap-2 rounded-plantilla bg-senal px-6 font-semibold text-white hover:bg-senal-alta disabled:opacity-60"
            >
              {enCurso ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <ShieldCheck aria-hidden="true" className="size-4" />
              )}
              {enCurso ? "Preparando pago…" : "Ir al pago protegido"}
            </button>
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed opacity-55">
              <LockKeyhole
                aria-hidden="true"
                className="mt-0.5 size-3.5 shrink-0"
              />
              PagoFácil retiene el monto. Venduo no guarda el dinero de tu
              compra.
            </p>
          </div>
        </aside>
      </form>
    </div>
  )
}
