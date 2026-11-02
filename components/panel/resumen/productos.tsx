"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight, Loader2, Minus, Package, Plus } from "lucide-react"
import { toast } from "sonner"

import { formatNumber } from "@/lib/format"
import type { ProductoPorAcabarse, ProductoVendido } from "@/lib/tablero"
import { cn } from "@/lib/utils"
import { Circulo, Flecha } from "@/components/portada/trazos"
import portada from "@/components/portada/portada.module.css"
import { entra, useEscena } from "@/components/panel/resumen/escena"
import {
  BAJADA,
  Mano,
  Rotulo,
  TITULAR,
} from "@/components/panel/resumen/piezas"
import estilos from "@/components/panel/resumen/resumen.module.css"

/** Cómo cae cada polaroid en la mesa: su giro, su altura y su profundidad. */
const MESA = [
  { giro: -4, alto: "lg:translate-y-6", vel: 0.5 },
  { giro: 3, alto: "lg:-translate-y-4", vel: 1.1 },
  { giro: -2, alto: "lg:translate-y-10", vel: 0.8 },
  { giro: 5, alto: "lg:-translate-y-2", vel: 1.3 },
  { giro: -3, alto: "lg:translate-y-8", vel: 0.7 },
]

/**
 * Lo que más se vendió en 30 días, como polaroids sobre la mesa: un producto
 * se reconoce por su foto antes que por su nombre. El primero va más grande,
 * con su número encerrado. En el celular se deslizan de costado.
 */
export function MasVendidos({ productos }: { productos: ProductoVendido[] }) {
  const raiz = useRef<HTMLElement>(null)

  useEscena(raiz, (tl, piezas) => {
    entra(
      tl,
      piezas(".js-polaroid"),
      {
        y: 120,
        rotate: (i) => (i % 2 ? 18 : -16),
        scale: 0.8,
        autoAlpha: 0,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.1,
      },
      0.2
    )
  })

  if (productos.length === 0) return null

  return (
    <section
      ref={raiz}
      data-escena
      id="mas-vendidos"
      aria-labelledby="titulo-mas-vendidos"
      className="py-12 lg:py-20"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Rotulo>Lo que más se vende</Rotulo>
          <h2 id="titulo-mas-vendidos" className={TITULAR}>
            Tus estrellas del{" "}
            <span className={portada.resaltado}>último mes.</span>
          </h2>
        </div>
        <Mano className="js-sube text-[18px] text-[var(--tinta)]/45 sm:hidden">
          desliza →
        </Mano>
      </div>

      <ol
        data-lenis-prevent
        className={cn(
          estilos.franja,
          "-mx-4 mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pt-8 pb-10 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-4 sm:overflow-visible sm:[mask-image:none] sm:px-0 lg:gap-6 lg:pt-12 lg:pb-14"
        )}
      >
        {productos.map((producto, i) => {
          const mesa = MESA[i % MESA.length]
          const primero = i === 0
          const tarjeta = (
            <>
              <span className="relative block aspect-square overflow-hidden bg-[var(--tinta)]/[0.05]">
                {producto.foto ? (
                  <Image
                    src={producto.foto}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 180px, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <Package
                    aria-hidden="true"
                    className="absolute inset-0 m-auto size-8 opacity-35"
                  />
                )}
              </span>
              <span
                className={cn(
                  portada.mano,
                  "mt-2.5 block truncate text-[17px] text-[var(--tinta)]"
                )}
              >
                {producto.nombre}
              </span>
              <span className="block text-[12.5px] font-semibold text-[var(--tinta)]/55 tabular-nums">
                {formatNumber(producto.unidades)}{" "}
                {producto.unidades === 1 ? "vendido" : "vendidos"}
              </span>
            </>
          )

          return (
            <li
              key={producto.id ?? producto.nombre}
              className={cn(
                "w-[46%] shrink-0 snap-center sm:w-auto",
                mesa.alto
              )}
            >
              <div className="js-profundo" data-vel={mesa.vel}>
                <div className="js-polaroid relative">
                  <span
                    aria-hidden="true"
                    className={cn(
                      portada.titular,
                      "absolute -top-5 -left-3 z-10 flex size-11 items-center justify-center rounded-full text-[19px]",
                      primero
                        ? "bg-[var(--boli)] text-white"
                        : "bg-[var(--tinta)] text-white"
                    )}
                  >
                    {i + 1}
                  </span>
                  {primero ? (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -top-16 left-8 z-10 hidden items-end gap-1 lg:flex"
                    >
                      <Flecha className="h-8 w-10 -scale-x-100 rotate-[200deg]" />
                      <Mano className="text-[18px] whitespace-nowrap">
                        el que más sale
                      </Mano>
                    </span>
                  ) : null}
                  <div
                    className="transition-[rotate,scale] duration-500 ease-out hover:scale-[1.04] hover:rotate-0"
                    style={{ rotate: `${mesa.giro}deg` }}
                  >
                    {producto.id ? (
                      <Link
                        href={`/panel/productos/${producto.id}`}
                        className={cn(
                          estilos.nota,
                          "group block rounded-[4px] p-2.5 pb-3"
                        )}
                      >
                        {tarjeta}
                      </Link>
                    ) : (
                      <div
                        className={cn(
                          estilos.nota,
                          "block rounded-[4px] p-2.5 pb-3"
                        )}
                      >
                        {tarjeta}
                      </div>
                    )}
                  </div>
                  {primero ? (
                    <Circulo className="pointer-events-none absolute -top-8 -left-6 h-16 w-[4.6rem]" />
                  ) : null}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

type Ajustar = (
  id: string,
  stock: number
) => Promise<{ ok: boolean; error?: string }>

/**
 * Lo que se quedó sin stock o está por quedarse, y se repone acá mismo: más y
 * menos al lado de cada foto, y se guarda solo cuando se deja de tocar. El
 * número salta al cambiar. Con el stock bien, la escena no está.
 */
export function PorAcabarse({
  productos,
  ajustar,
  soloLectura,
}: {
  productos: ProductoPorAcabarse[]
  ajustar: Ajustar
  soloLectura: boolean
}) {
  const raiz = useRef<HTMLElement>(null)

  useEscena(raiz, (tl, piezas) => {
    entra(
      tl,
      piezas(".js-fila"),
      { x: 60, autoAlpha: 0, duration: 0.8, ease: "expo.out", stagger: 0.1 },
      0.2
    )
  })

  if (productos.length === 0) return null
  const agotados = productos.filter((p) => p.stock === 0).length

  return (
    <section
      ref={raiz}
      data-escena
      id="por-acabarse"
      aria-labelledby="titulo-por-acabarse"
      className="grid gap-10 py-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12 lg:py-20"
    >
      <div className="lg:sticky lg:top-24 lg:self-start">
        <Rotulo>Se está acabando</Rotulo>
        <h2 id="titulo-por-acabarse" className={TITULAR}>
          Repón antes de que{" "}
          <span className={portada.resaltado}>se agote.</span>
        </h2>
        <p className={BAJADA}>
          Suma o resta aquí mismo: se guarda solo cuando dejas de tocar.
        </p>
        {agotados > 0 ? (
          <Mano className="js-sube mt-5 text-[21px]">
            {agotados === 1
              ? "1 ya no se puede comprar"
              : `${agotados} ya no se pueden comprar`}
          </Mano>
        ) : null}
        <Link
          href="/panel/productos"
          className={cn(portada.enlace, "js-sube mt-3")}
        >
          Ver todos los productos
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      <ul
        className={cn(
          estilos.nota,
          "self-start overflow-hidden rounded-[20px]"
        )}
      >
        {productos.map((producto) => (
          <FilaParaReponer
            key={`${producto.id}:${producto.nombre}`}
            producto={producto}
            ajustar={ajustar}
            soloLectura={soloLectura}
          />
        ))}
      </ul>
    </section>
  )
}

/** Cuánto se espera después del último toque antes de guardar. */
const ESPERA_MS = 700

function FilaParaReponer({
  producto,
  ajustar,
  soloLectura,
}: {
  producto: ProductoPorAcabarse
  ajustar: Ajustar
  soloLectura: boolean
}) {
  const router = useRouter()
  const [stock, setStock] = useState(producto.stock)
  const [guardando, setGuardando] = useState(false)
  const [direccion, setDireccion] = useState<"sube" | "baja" | null>(null)
  const reloj = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(reloj.current), [])

  function cambiar(nuevo: number) {
    if (soloLectura) {
      toast.info("Estás en modo demo: los cambios no se guardan.")
      return
    }
    const valor = Math.max(0, Math.min(999_999, nuevo))
    setDireccion(valor > stock ? "sube" : "baja")
    setStock(valor)
    window.clearTimeout(reloj.current)
    reloj.current = window.setTimeout(async () => {
      setGuardando(true)
      const resultado = await ajustar(producto.id, valor)
      setGuardando(false)
      if (!resultado.ok) {
        setStock(producto.stock)
        toast.error(resultado.error ?? "No pudimos guardar el stock.")
        return
      }
      router.refresh()
    }, ESPERA_MS)
  }

  const agotado = stock === 0

  return (
    <li className="js-fila flex min-h-[5.5rem] items-center gap-2 border-t border-[var(--regla)] px-3.5 py-3 first:border-t-0 sm:gap-4 sm:px-5">
      <Link
        href={`/panel/productos/${producto.id}`}
        className="group flex min-w-0 flex-1 items-center gap-3 sm:gap-3.5"
      >
        <span className="relative size-12 shrink-0 overflow-hidden rounded-[12px] bg-[var(--tinta)]/[0.05] sm:size-14">
          {producto.foto ? (
            <Image
              src={producto.foto}
              alt=""
              fill
              sizes="56px"
              className={cn(
                "object-cover transition-[filter] duration-300",
                agotado && "grayscale"
              )}
            />
          ) : (
            <Package
              aria-hidden="true"
              className="absolute inset-0 m-auto size-5 opacity-45"
            />
          )}
        </span>
        <span className="min-w-0">
          <span className="line-clamp-2 block text-[15.5px] leading-snug font-semibold group-hover:underline group-hover:decoration-[var(--boli)] group-hover:underline-offset-4 sm:text-[16px]">
            {producto.nombre}
          </span>
          <span
            className={cn(
              "block text-[13px] font-semibold",
              agotado ? "text-[var(--boli)]" : "text-[var(--tinta)]/55"
            )}
          >
            {agotado ? "Agotado" : "Queda poco"}
          </span>
        </span>
      </Link>

      {producto.variantes ? (
        <Link
          href={`/panel/productos/${producto.id}#variantes`}
          className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-[var(--regla)] bg-white px-4 text-[14px] font-semibold transition-colors hover:border-[var(--tinta)]"
        >
          <span className={cn("tabular-nums", agotado && "text-[var(--boli)]")}>
            {formatNumber(stock)}
          </span>
          en {producto.variantes} opciones
        </Link>
      ) : (
        <div
          role="group"
          aria-label={`Unidades de ${producto.nombre}`}
          className="flex shrink-0 items-center sm:gap-1"
        >
          <button
            type="button"
            onClick={() => cambiar(stock - 1)}
            disabled={stock === 0}
            aria-label="Una menos"
            className="flex size-9 items-center justify-center rounded-full border border-[var(--regla)] bg-white transition-[transform,background-color] hover:bg-[var(--tinta)]/[0.05] active:scale-90 disabled:opacity-30 sm:size-10"
          >
            <Minus aria-hidden="true" className="size-4" />
          </button>
          <span
            aria-live="polite"
            className="relative flex h-12 w-10 items-center justify-center overflow-hidden sm:w-12"
          >
            {guardando ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <span
                key={stock}
                className={cn(
                  portada.titular,
                  portada.cifras,
                  "text-[24px] leading-none sm:text-[28px]",
                  direccion && "numero-entra",
                  agotado && "text-[var(--boli)]"
                )}
              >
                {formatNumber(stock)}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => cambiar(stock + 1)}
            aria-label="Una más"
            className="flex size-9 items-center justify-center rounded-full bg-[var(--tinta)] text-white transition-[transform,background-color] hover:bg-[var(--boli)] active:scale-90 sm:size-10"
          >
            <Plus aria-hidden="true" className="size-4" />
          </button>
        </div>
      )}
    </li>
  )
}
