"use client"

import * as React from "react"
import Image from "next/image"
import { ArrowDown, QrCode } from "lucide-react"

import { formatMoney } from "@/lib/format"

/**
 * El mecanismo del producto, dramatizado en un gesto.
 *
 * Se escribe un párrafo describiendo un negocio y la tienda se llena sola.
 * Es la promesa central de Venduo puesta a funcionar en el primer viewport,
 * en vez de explicada en un párrafo.
 *
 * El contenido es ilustrativo. Si el JavaScript no corre o la persona pidió
 * menos movimiento, se muestra el estado final completo.
 */

type Producto = { nombre: string; precio: number; foto: string }

type Ejemplo = {
  prompt: string
  tienda: string
  productos: Producto[]
}

const EJEMPLOS: Ejemplo[] = [
  {
    prompt:
      "Vendo ropa deportiva en Santa Cruz. Buzos, poleras, mochilas y gorras.",
    tienda: "Rosa Deportes",
    productos: [
      {
        nombre: "Buzo oversize",
        precio: 18000,
        foto: "1556821840-3a63f95609a7",
      },
      {
        nombre: "Polera básica",
        precio: 6500,
        foto: "1521572163474-6864f9cf17ab",
      },
      {
        nombre: "Mochila urbana",
        precio: 24000,
        foto: "1553062407-98eeb64c6a62",
      },
      { nombre: "Gorra", precio: 5500, foto: "1588850561407-ed78c282e89b" },
    ],
  },
  {
    prompt:
      "Tengo una panadería en La Paz. Hago cuñapés, empanadas y pan de batalla.",
    tienda: "Panadería Doña Elsa",
    productos: [
      { nombre: "Cuñapé x6", precio: 1500, foto: "1509440159596-0249088772ff" },
      {
        nombre: "Empanada de queso",
        precio: 500,
        foto: "1601050690597-df0568f70950",
      },
      {
        nombre: "Pan de batalla x10",
        precio: 1000,
        foto: "1549931319-a545dcf3bc73",
      },
      {
        nombre: "Torta de naranja",
        precio: 8000,
        foto: "1578985545062-69928b1d9587",
      },
    ],
  },
]

const VELOCIDAD_TIPEO = 26
const PAUSA_ANTES_DE_LLENAR = 380
const PAUSA_ENTRE_EJEMPLOS = 4200

export function DemoTienda() {
  const ref = React.useRef<HTMLDivElement>(null)
  const [armado, setArmado] = React.useState(false)
  const [indice, setIndice] = React.useState(0)
  const [escrito, setEscrito] = React.useState("")
  const [entrados, setEntrados] = React.useState(0)

  const ejemplo = EJEMPLOS[indice]

  React.useEffect(() => {
    setArmado(true)
  }, [])

  React.useEffect(() => {
    if (!armado) return

    const nodo = ref.current
    const reducido = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches

    // Sin observador o con movimiento reducido, se muestra el estado final.
    if (!nodo || reducido || typeof IntersectionObserver === "undefined") {
      setEscrito(EJEMPLOS[0].prompt)
      setEntrados(EJEMPLOS[0].productos.length)
      return
    }

    let cancelado = false
    const temporizadores: number[] = []

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return
        observador.disconnect()
        correr(0)
      },
      { rootMargin: "0px 0px -10% 0px" }
    )

    function correr(i: number) {
      if (cancelado) return

      const actual = EJEMPLOS[i]
      setIndice(i)
      setEscrito("")
      setEntrados(0)

      actual.prompt.split("").forEach((_, c) => {
        temporizadores.push(
          window.setTimeout(
            () => setEscrito(actual.prompt.slice(0, c + 1)),
            VELOCIDAD_TIPEO * c
          )
        )
      })

      const finTipeo = VELOCIDAD_TIPEO * actual.prompt.length

      actual.productos.forEach((_, p) => {
        temporizadores.push(
          window.setTimeout(
            () => setEntrados(p + 1),
            finTipeo + PAUSA_ANTES_DE_LLENAR + 130 * p
          )
        )
      })

      temporizadores.push(
        window.setTimeout(
          () => correr((i + 1) % EJEMPLOS.length),
          finTipeo + PAUSA_ANTES_DE_LLENAR + PAUSA_ENTRE_EJEMPLOS
        )
      )
    }

    observador.observe(nodo)

    return () => {
      cancelado = true
      observador.disconnect()
      temporizadores.forEach(window.clearTimeout)
    }
  }, [armado])

  return (
    <div ref={ref} className="w-full">
      {/* Lo que la persona escribe. */}
      <div className="border border-tinta bg-papel p-4">
        <p className="mb-2 text-[0.7rem] font-semibold tracking-[0.12em] text-senal uppercase">
          Cuenta qué vendes
        </p>
        <p className="min-h-[3.5rem] text-sm leading-relaxed sm:min-h-[3rem]">
          {escrito}
          {armado && escrito.length < ejemplo.prompt.length ? (
            <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.18em] animate-pulse bg-senal" />
          ) : null}
        </p>
      </div>

      <div className="flex justify-center py-2" aria-hidden="true">
        <ArrowDown className="size-5 text-senal" />
      </div>

      {/* Lo que Venduo arma. */}
      <div className="overflow-hidden border border-tinta bg-papel">
        <header className="flex items-center gap-3 border-b border-tinta px-4 py-3">
          <span className="flex-1 font-titular text-sm font-bold tracking-tight">
            {ejemplo.tienda}
          </span>
          <span className="rounded-full border border-senal/40 px-2 py-0.5 text-[0.7rem] font-medium text-senal">
            Abierta
          </span>
        </header>

        <ul className="grid grid-cols-2 gap-3 p-4">
          {ejemplo.productos.map((p, i) => {
            const dentro = !armado || i < entrados
            return (
              <li
                key={`${ejemplo.tienda}-${p.nombre}`}
                className="transition-[opacity,transform] duration-500 ease-out"
                style={{
                  opacity: dentro ? 1 : 0,
                  transform: dentro ? "none" : "translateY(12px)",
                }}
              >
                <div className="relative aspect-square overflow-hidden border border-tinta/15 bg-tinta/[0.04]">
                  <Image
                    /* Original grande: Next redimensiona según `sizes`. */
                    src={`https://images.unsplash.com/photo-${p.foto}?w=1200&q=85&auto=format&fit=crop`}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 45vw, 260px"
                    quality={90}
                    className="object-cover grayscale"
                  />
                </div>
                <p className="mt-2 text-xs leading-tight">{p.nombre}</p>
                <p className="tabular font-titular text-sm font-bold">
                  {formatMoney(p.precio)}
                </p>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-3 border-t border-tinta px-4 py-3">
          <QrCode className="size-8 shrink-0" aria-hidden="true" />
          <p className="text-xs leading-snug opacity-75">
            El cliente escanea, paga, y la venta entra sola a tus estadísticas.
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed opacity-50">
        Ejemplo ilustrativo. Las tiendas y los productos no corresponden a
        comercios reales.
      </p>
    </div>
  )
}
