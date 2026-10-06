"use client"

import * as React from "react"
import Image from "next/image"
import { ArrowDown, BadgeCheck, Link2, PackageMinus } from "lucide-react"

import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * El producto entero en un gesto: del enlace en la bio al pedido cobrado.
 *
 * Tres cuadros que se encienden en orden —el perfil de la red, la tienda
 * online y el panel— porque eso es lo que Venduo vende: no la página sola,
 * sino lo que pasa detrás cuando alguien compra. El pedido entra pagado y el
 * stock baja sin que nadie lo toque.
 *
 * El contenido es ilustrativo. Si el JavaScript no corre o la persona pidió
 * menos movimiento, se muestra el estado final de la primera vuelta.
 */

type Producto = {
  nombre: string
  precio: number
  foto: string
  stock: number
}

const PRODUCTOS: Producto[] = [
  {
    nombre: "Buzo oversize",
    precio: 18000,
    foto: "1556821840-3a63f95609a7",
    stock: 6,
  },
  {
    nombre: "Polera básica",
    precio: 6500,
    foto: "1521572163474-6864f9cf17ab",
    stock: 12,
  },
  {
    nombre: "Mochila urbana",
    precio: 24000,
    foto: "1553062407-98eeb64c6a62",
    stock: 4,
  },
  {
    nombre: "Gorra",
    precio: 5500,
    foto: "1588850561407-ed78c282e89b",
    stock: 9,
  },
]

const COMPRAS = [
  { numero: 148, producto: 2 },
  { numero: 149, producto: 0 },
  { numero: 150, producto: 3 },
]

/** 0: el enlace en la bio. 1: la tienda abierta. 2: el pedido en el panel. */
type Paso = 0 | 1 | 2

const DURACION_PASO = 1500
const PAUSA_FINAL = 2600

export function DemoRedes() {
  const ref = React.useRef<HTMLDivElement>(null)
  const [paso, setPaso] = React.useState<Paso>(2)
  const [vuelta, setVuelta] = React.useState(0)
  const [stocks, setStocks] = React.useState(() =>
    PRODUCTOS.map((p, i) => (i === COMPRAS[0].producto ? p.stock - 1 : p.stock))
  )
  const [pedidos, setPedidos] = React.useState([COMPRAS[0]])

  React.useEffect(() => {
    const nodo = ref.current
    const reducido = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches

    // Sin observador o con movimiento reducido queda el estado final.
    if (!nodo || reducido || typeof IntersectionObserver === "undefined") return

    let cancelado = false
    const temporizadores: number[] = []
    const despues = (ms: number, hacer: () => void) =>
      temporizadores.push(
        window.setTimeout(() => {
          if (!cancelado) hacer()
        }, ms)
      )

    function correr(n: number) {
      const compra = COMPRAS[n % COMPRAS.length]
      setVuelta(n)
      setPaso(0)
      despues(DURACION_PASO, () => setPaso(1))
      despues(DURACION_PASO * 2, () => {
        setPaso(2)
        setPedidos((antes) => [compra, ...antes].slice(0, 2))
        setStocks((antes) =>
          antes.map((s, i) => (i === compra.producto ? Math.max(s - 1, 0) : s))
        )
      })
      despues(DURACION_PASO * 2 + PAUSA_FINAL, () => correr(n + 1))
    }

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return
        observador.disconnect()
        // La primera vuelta arranca desde cero: lo de antes era el estado
        // final para quien no ve el movimiento.
        setStocks(PRODUCTOS.map((p) => p.stock))
        setPedidos([])
        correr(0)
      },
      { rootMargin: "0px 0px -10% 0px" }
    )

    observador.observe(nodo)

    return () => {
      cancelado = true
      observador.disconnect()
      temporizadores.forEach(window.clearTimeout)
    }
  }, [])

  const enCurso = COMPRAS[vuelta % COMPRAS.length]

  return (
    <div ref={ref} className="w-full min-w-0">
      {/* 1. El perfil de la red, con el enlace en la bio. */}
      <Cuadro numero="01" titulo="Tu perfil" activo={paso === 0}>
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-tinta font-titular text-sm font-extrabold">
            RD
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">@rosa.deportes</p>
            <p className="truncate text-xs opacity-70">
              Ropa deportiva · Santa Cruz · 12,4 mil seguidores
            </p>
          </div>
        </div>
        <p
          className={cn(
            "mx-4 mb-3 flex items-center gap-2 border px-3 py-2 text-xs font-semibold transition-colors duration-300",
            paso === 0 ? "border-senal text-senal" : "border-tinta/25"
          )}
        >
          <Link2 aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">venduo.app/t/rosa-deportes</span>
        </p>
      </Cuadro>

      <Flecha />

      {/* 2. La tienda online que abre quien compra. */}
      <Cuadro numero="02" titulo="Tu tienda online" activo={paso === 1}>
        <ul className="grid grid-cols-4 gap-2 px-3 py-3 sm:gap-3 sm:px-4">
          {PRODUCTOS.map((producto, i) => {
            const elegido = paso === 1 && i === enCurso.producto
            return (
              <li key={producto.nombre} className="min-w-0">
                <div
                  className={cn(
                    "relative aspect-square overflow-hidden border bg-tinta/[0.04] transition-colors duration-300",
                    elegido ? "border-senal" : "border-tinta/15"
                  )}
                >
                  <Image
                    /* Original grande: Next redimensiona según `sizes`. */
                    src={`https://images.unsplash.com/photo-${producto.foto}?w=1200&q=85&auto=format&fit=crop`}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 22vw, 110px"
                    quality={85}
                    className="object-cover grayscale"
                  />
                </div>
                <p className="mt-1.5 truncate text-[0.7rem] leading-tight">
                  {producto.nombre}
                </p>
                <p className="tabular font-titular text-xs font-bold">
                  {formatMoney(producto.precio)}
                </p>
                <p
                  className={cn(
                    "tabular text-[0.65rem] transition-colors duration-300",
                    stocks[i] <= 3 ? "text-senal" : "opacity-70"
                  )}
                >
                  Quedan {stocks[i]}
                </p>
              </li>
            )
          })}
        </ul>
      </Cuadro>

      <Flecha />

      {/* 3. El panel, donde el pedido entra por WhatsApp y el stock baja solo
          al marcarlo pagado. */}
      <Cuadro numero="03" titulo="Tu negocio" activo={paso === 2}>
        <ul aria-live="polite">
          {pedidos.length === 0 ? (
            <li className="px-4 py-3 text-xs opacity-70">
              Esperando el próximo pedido…
            </li>
          ) : (
            pedidos.map((pedido, i) => (
              <li
                key={`${pedido.numero}-${i}`}
                className="flex items-center gap-3 border-t border-tinta/15 px-4 py-2.5 first:border-t-0"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="tabular text-[0.7rem] opacity-65">
                      #{pedido.numero}
                    </span>
                    <span className="truncate text-sm font-semibold">
                      Por WhatsApp
                    </span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-[0.7rem] opacity-70">
                    <PackageMinus aria-hidden="true" className="size-3.5" />
                    {PRODUCTOS[pedido.producto].nombre}: quedan{" "}
                    {stocks[pedido.producto]}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="tabular font-titular text-sm font-bold">
                    {formatMoney(PRODUCTOS[pedido.producto].precio)}
                  </span>
                  <span className="inline-flex items-center gap-1 border border-tinta px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-[0.1em] uppercase">
                    <BadgeCheck aria-hidden="true" className="size-3" />
                    Pagado
                  </span>
                </span>
              </li>
            ))
          )}
        </ul>
      </Cuadro>

      <p className="mt-3 text-xs leading-relaxed opacity-60">
        Ejemplo ilustrativo. La tienda y los pedidos no corresponden a un
        comercio real.
      </p>
    </div>
  )
}

function Cuadro({
  numero,
  titulo,
  activo,
  children,
}: {
  numero: string
  titulo: string
  activo: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "border bg-papel transition-colors duration-300",
        activo ? "border-tinta" : "border-tinta/25"
      )}
    >
      <p className="flex items-center gap-2 border-b border-tinta/15 px-4 py-2 text-[0.7rem] font-semibold tracking-[0.12em] uppercase">
        <span
          className={cn(
            "tabular transition-colors duration-300",
            activo ? "text-senal" : "opacity-65"
          )}
        >
          {numero}
        </span>
        {titulo}
      </p>
      {children}
    </div>
  )
}

function Flecha() {
  return (
    <div className="flex justify-center py-1.5" aria-hidden="true">
      <ArrowDown className="size-4 text-senal" />
    </div>
  )
}
