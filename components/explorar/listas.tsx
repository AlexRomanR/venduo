"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, Loader2, Store, Tag } from "lucide-react"
import { toast } from "sonner"

import type { ProductoVitrina, TiendaAbierta } from "@/lib/demo-data"
import { urlDeProducto } from "@/lib/tienda"
import { formatMoney, formatPercent } from "@/lib/format"
import { createClient } from "@/lib/supabase/client"

export function ListaTiendas({ tiendas }: { tiendas: TiendaAbierta[] }) {
  const router = useRouter()
  const [enCurso, setEnCurso] = React.useState<string | null>(null)
  const [hechas, setHechas] = React.useState<Record<string, string>>({})

  async function sumarse(tienda: TiendaAbierta) {
    const supabase = createClient()
    if (!supabase) {
      toast.error("Falta configurar Supabase en .env.local")
      return
    }

    setEnCurso(tienda.id)

    // Sin invitación: el estado lo decide la tienda, no quien se suma.
    const { error } = await supabase.rpc("join_store", {
      p_store_slug: tienda.slug,
    })

    setEnCurso(null)

    if (error) {
      toast.error(
        error.message.includes("tu propia tienda")
          ? "Esa es tu propia tienda."
          : "No pudimos sumarte a esa tienda. Intenta de nuevo."
      )
      return
    }

    const inmediata = tienda.joinMode === "abierta"
    setHechas((previas) => ({
      ...previas,
      [tienda.id]: inmediata ? "activo" : "pendiente",
    }))

    toast.success(
      inmediata
        ? `Ya vendes para ${tienda.name}.`
        : `Solicitud enviada a ${tienda.name}.`
    )
    // El vínculo nuevo cambia la barra y el panel del vendedor, que el
    // navegador guarda un rato: sin esto se verían como antes de sumarse.
    router.refresh()
  }

  return (
    <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
      {tiendas.map((tienda) => {
        const estado = hechas[tienda.id]

        return (
          <div
            key={tienda.id}
            className="group flex flex-col border-t border-tinta/15 py-6 transition-colors duration-300 hover:border-tinta"
          >
            <div className="flex items-start gap-3">
              <Store
                aria-hidden="true"
                className="mt-1 size-4 shrink-0 opacity-40 transition-colors group-hover:text-senal group-hover:opacity-100"
              />
              <h3 className="flex-1 font-titular text-lg font-bold tracking-[-0.02em] transition-colors group-hover:text-senal">
                {tienda.name}
              </h3>
            </div>

            {tienda.tagline ? (
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed opacity-70">
                {tienda.tagline}
              </p>
            ) : null}

            <p className="tabular mt-3 font-titular text-2xl font-extrabold tracking-[-0.03em] text-senal">
              {formatPercent(tienda.commissionBps)}
            </p>
            <p className="text-xs tracking-[0.12em] uppercase opacity-55">
              De comisión por venta
            </p>

            <p className="mt-3 text-xs opacity-45">
              {tienda.joinMode === "abierta"
                ? "Entras al instante"
                : "El dueño revisa cada solicitud"}
            </p>

            <div className="mt-5">
              {estado ? (
                <p className="flex min-h-11 items-center gap-2 text-sm font-semibold text-senal">
                  <Check aria-hidden="true" className="size-4" />
                  {estado === "activo"
                    ? "Ya eres vendedor"
                    : "Solicitud enviada"}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => sumarse(tienda)}
                  disabled={enCurso === tienda.id}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border-2 border-tinta px-4 font-semibold transition-colors hover:bg-tinta hover:text-papel disabled:opacity-50 sm:w-auto"
                >
                  {enCurso === tienda.id ? (
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  ) : null}
                  {tienda.joinMode === "abierta" ? "Sumarme" : "Pedir sumarme"}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ListaProductos({
  productos,
  siteUrl,
}: {
  productos: ProductoVitrina[]
  siteUrl: string
}) {
  const router = useRouter()
  const [enCurso, setEnCurso] = React.useState<string | null>(null)
  const [codigos, setCodigos] = React.useState<Record<string, string>>({})

  async function tomar(producto: ProductoVitrina) {
    const supabase = createClient()
    if (!supabase) {
      toast.error("Falta configurar Supabase en .env.local")
      return
    }

    setEnCurso(producto.id)

    const { data, error } = await supabase.rpc("take_product", {
      p_product_id: producto.id,
    })

    setEnCurso(null)

    if (error) {
      toast.error(
        error.message.includes("tu propia tienda")
          ? "Ese producto es de tu propia tienda."
          : "No pudimos generar tu enlace. Intenta de nuevo."
      )
      return
    }

    setCodigos((previos) => ({ ...previos, [producto.id]: String(data) }))
    toast.success("Tu enlace está listo.")
    router.refresh()
  }

  async function copiar(enlace: string) {
    try {
      await navigator.clipboard.writeText(enlace)
      toast.success("Enlace copiado.")
    } catch {
      // Sin permiso de portapapeles el enlace igual está a la vista.
      toast.error("No pudimos copiarlo. Selecciónalo y cópialo a mano.")
    }
  }

  return (
    <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
      {productos.map((producto) => {
        const codigo = codigos[producto.id]
        const enlace = codigo
          ? urlDeProducto(producto.storeSlug, producto.id, codigo)
          : null
        const ganancia = Math.round(
          (producto.priceCents * producto.commissionBps) / 10000
        )

        return (
          <div
            key={producto.id}
            className="group flex flex-col border-t border-tinta/15 py-6 transition-colors duration-300 hover:border-tinta"
          >
            <div className="flex items-start gap-3">
              <Tag
                aria-hidden="true"
                className="mt-1 size-4 shrink-0 opacity-40 transition-colors group-hover:text-senal group-hover:opacity-100"
              />
              <div className="flex-1">
                <h3 className="font-titular text-lg font-bold tracking-[-0.02em] transition-colors group-hover:text-senal">
                  {producto.name}
                </h3>
                <p className="mt-1 text-xs tracking-[0.12em] uppercase opacity-45">
                  {producto.storeName}
                </p>
              </div>
            </div>

            <p className="tabular mt-3 font-titular text-xl font-bold tracking-[-0.02em]">
              {formatMoney(producto.priceCents)}
              {producto.condition !== "nuevo" ? (
                <span className="ml-2 font-sans text-xs font-normal tracking-[0.12em] uppercase opacity-55">
                  {producto.condition === "segunda_mano"
                    ? "Segunda mano"
                    : "Reacondicionado"}
                </span>
              ) : null}
            </p>

            <p className="mt-2 text-sm opacity-70">
              Ganas{" "}
              <span className="tabular font-semibold text-senal">
                {formatMoney(ganancia)}
              </span>{" "}
              por cada venta
            </p>

            <div className="mt-5">
              {enlace ? (
                <div className="border border-tinta p-3">
                  <p className="text-xs tracking-[0.12em] uppercase opacity-55">
                    Tu enlace
                  </p>
                  <p className="mt-1 font-mono text-xs break-all">{enlace}</p>
                  <button
                    type="button"
                    onClick={() => copiar(enlace)}
                    className="mt-3 flex min-h-11 items-center gap-2 text-sm font-semibold text-senal transition-opacity hover:opacity-70"
                  >
                    <Copy aria-hidden="true" className="size-4" />
                    Copiar enlace
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => tomar(producto)}
                  disabled={enCurso === producto.id}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-senal px-4 font-semibold text-white transition-colors hover:bg-senal-alta disabled:opacity-50 sm:w-auto"
                >
                  {enCurso === producto.id ? (
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  ) : null}
                  Obtener mi enlace
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
