"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, Minus, Plus, ShoppingBag } from "lucide-react"
import { toast } from "sonner"

import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  fotoDe,
  hayStockDe,
  leerOpciones,
  varianteDe,
  type Valores,
  type VariantePublica,
} from "@/lib/variantes"
import type { Product } from "@/types"
import { claveDeLinea, useCarrito } from "@/components/tienda/carrito"

/** Dónde está el botón de agregar: la barra de compra lo mira para no repetirlo. */
export const ANCLA_DE_COMPRA = "agregar-al-carrito"

/**
 * El evento con que el selector pide mostrar una foto —la del color elegido—.
 * Lo escucha la galería de cada kit, sin saber quién lo manda.
 */
export const EVENTO_DE_FOTO = "venduo:foto"

/**
 * Cantidad y agregar al carrito, con la elección de talla y color si el
 * producto las tiene.
 *
 * El botón confirma en su sitio en vez de mandar al carrito: quien compra
 * desde el celular suele querer seguir mirando, y sacarlo de la ficha después
 * de cada producto es lo que hace que abandone con un solo artículo.
 *
 * Con opciones, cada valor sin stock —dado lo que ya se eligió— se ve
 * tachado, el precio es el de la combinación y elegir un color muestra su
 * foto en la galería.
 */
export function AgregarAlCarrito({
  producto,
  slug,
}: {
  producto: Product & { variantes?: VariantePublica[] }
  slug: string
}) {
  const router = useRouter()
  const { agregar, lineas } = useCarrito()
  const variantes = React.useMemo(
    () => producto.variantes ?? [],
    [producto.variantes]
  )
  const opciones = React.useMemo(
    () => (variantes.length ? leerOpciones(producto.opciones) : []),
    [variantes.length, producto.opciones]
  )
  const [cantidad, setCantidad] = React.useState(1)
  const [recien, setRecien] = React.useState(false)
  // Una opción con un solo valor ya viene elegida: no hay nada que decidir.
  const [elegidos, setElegidos] = React.useState<Valores>(() =>
    Object.fromEntries(
      opciones
        .filter((o) => o.valores.length === 1)
        .map((o) => [o.nombre, o.valores[0]])
    )
  )

  const conOpciones = opciones.length > 0
  const faltan = opciones.filter((o) => !elegidos[o.nombre])
  const variante =
    conOpciones && faltan.length === 0 ? varianteDe(variantes, elegidos) : null
  const precioCents = variante?.precioCents ?? producto.price_cents
  const stock = conOpciones ? (variante?.stock ?? 0) : producto.stock

  const agotado = producto.stock === 0
  const yaEnCarrito =
    lineas.find(
      (l) =>
        claveDeLinea(l) ===
        claveDeLinea({ productoId: producto.id, varianteId: variante?.id })
    )?.cantidad ?? 0
  const disponible = Math.max(stock - yaEnCarrito, 0)
  const tope = Math.max(disponible, 1)

  React.useEffect(() => {
    if (!recien) return
    const id = window.setTimeout(() => setRecien(false), 2200)
    return () => window.clearTimeout(id)
  }, [recien])

  function elegir(opcion: string, valor: string) {
    setElegidos((antes) => ({ ...antes, [opcion]: valor }))
    setCantidad(1)
    const foto = fotoDe(variantes, opcion, valor)
    if (foto) {
      window.dispatchEvent(new CustomEvent(EVENTO_DE_FOTO, { detail: foto }))
    }
  }

  function alAgregar() {
    if (agotado || disponible === 0) return
    if (conOpciones && !variante) return

    agregar(
      {
        productoId: producto.id,
        varianteId: variante?.id ?? null,
        variante: variante?.nombre ?? null,
        nombre: producto.name,
        precioCents,
        imagen: variante?.imagen ?? producto.image_url,
        stock,
      },
      Math.min(cantidad, disponible)
    )

    setRecien(true)
    setCantidad(1)
    toast.success(
      `${producto.name}${variante ? ` (${variante.nombre})` : ""} está en tu carrito.`
    )
  }

  if (agotado) {
    return (
      <div id={ANCLA_DE_COMPRA} className="border-t-2 border-tinta pt-7">
        <p className="font-titular text-lg font-bold tracking-[-0.02em]">
          Sin stock por ahora
        </p>
        <p className="mt-2 max-w-[48ch] leading-relaxed opacity-70">
          Este producto se agotó. Escríbele a la tienda para saber cuándo
          vuelve.
        </p>
      </div>
    )
  }

  const elegidaSinStock = conOpciones && variante !== null && stock === 0

  return (
    <div id={ANCLA_DE_COMPRA} className="border-t-2 border-tinta pt-7">
      {conOpciones ? (
        <div className="mb-7 flex flex-col gap-5">
          {opciones.map((opcion) => (
            <fieldset key={opcion.nombre}>
              <legend className="text-xs font-semibold tracking-[0.12em] uppercase opacity-60">
                {opcion.nombre}
                {elegidos[opcion.nombre] ? (
                  <span className="ml-1.5 normal-case opacity-100">
                    · {elegidos[opcion.nombre]}
                  </span>
                ) : null}
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {opcion.valores.map((valor) => {
                  const elegido = elegidos[opcion.nombre] === valor
                  const conStock = hayStockDe(
                    variantes,
                    opcion.nombre,
                    valor,
                    elegidos
                  )
                  return (
                    <button
                      key={valor}
                      type="button"
                      aria-pressed={elegido}
                      aria-label={`${opcion.nombre} ${valor}${conStock ? "" : ", sin stock"}`}
                      onClick={() => elegir(opcion.nombre, valor)}
                      className={cn(
                        "min-h-11 min-w-11 rounded-plantilla border px-4 font-semibold transition-colors",
                        elegido
                          ? "border-tinta bg-tinta text-papel"
                          : "border-tinta/30 hover:border-tinta",
                        !conStock && "line-through decoration-2 opacity-45"
                      )}
                    >
                      {valor}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          ))}
          {elegidaSinStock ? (
            <p className="text-sm font-semibold">
              Esta opción se agotó. Elige otra o escríbele a la tienda.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
            Cantidad
          </span>
          <div className="mt-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCantidad((c) => Math.max(1, c - 1))}
              disabled={cantidad <= 1}
              aria-label="Quitar una unidad"
              className="flex size-11 items-center justify-center rounded-plantilla border border-tinta/30 transition-colors hover:border-senal hover:text-senal disabled:opacity-30"
            >
              <Minus aria-hidden="true" className="size-4" />
            </button>

            <span
              aria-live="polite"
              className="tabular flex h-11 w-14 items-center justify-center font-titular text-lg font-bold"
            >
              {cantidad}
            </span>

            <button
              type="button"
              onClick={() => setCantidad((c) => Math.min(tope, c + 1))}
              disabled={cantidad >= tope}
              aria-label="Agregar una unidad"
              className="flex size-11 items-center justify-center rounded-plantilla border border-tinta/30 transition-colors hover:border-senal hover:text-senal disabled:opacity-30"
            >
              <Plus aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
            Subtotal
          </span>
          <p className="tabular font-titular text-2xl font-extrabold tracking-[-0.03em]">
            {formatMoney(precioCents * cantidad)}
          </p>
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={alAgregar}
          disabled={disponible === 0 || (conOpciones && !variante)}
          className={cn(
            "flex min-h-12 flex-1 items-center justify-center gap-2 rounded-plantilla px-5 font-semibold transition-colors",
            recien
              ? "bg-tinta text-papel"
              : "bg-senal text-white hover:bg-senal-alta",
            (disponible === 0 || (conOpciones && !variante)) && "opacity-50"
          )}
        >
          {recien ? (
            <>
              <Check aria-hidden="true" className="size-4" />
              Agregado
            </>
          ) : faltan.length > 0 ? (
            `Elige ${faltan.map((o) => o.nombre.toLowerCase()).join(" y ")}`
          ) : (
            <>
              <ShoppingBag aria-hidden="true" className="size-4" />
              Agregar al carrito
            </>
          )}
        </button>

        {yaEnCarrito > 0 ? (
          <button
            type="button"
            onClick={() => router.push(`/t/${slug}/carrito`)}
            className="flex min-h-12 items-center justify-center rounded-plantilla border-2 border-tinta px-5 font-semibold transition-colors hover:bg-tinta hover:text-papel"
          >
            Ver mi carrito
          </button>
        ) : null}
      </div>

      {yaEnCarrito > 0 ? (
        <p className="mt-4 text-sm opacity-65">
          Ya tienes {yaEnCarrito} en tu carrito.
          {disponible === 0
            ? " Es todo el stock disponible."
            : ` Puedes agregar ${disponible} más.`}
        </p>
      ) : null}
    </div>
  )
}
