import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Contador } from "@/components/panel/contador"

/*
 * Números grandes que se tocan, arriba de una lista: lo que espera algo,
 * contado. En el cuaderno son notas pegadas, torcidas un poco, que caen al
 * llegar; tocar una filtra la lista de abajo, y la elegida se endereza con el
 * borde en tinta. Lo urgente va en la señal y encerrado con un círculo a mano.
 * Son los mismos de la app: `FichasDeCobro` en Pedidos y `FichasGrandes` en
 * Productos.
 */

/** El giro de cada nota en la mesa: nunca dos iguales seguidas. */
const GIROS = ["-1.6deg", "1.3deg", "-0.9deg", "1.5deg"]

function claseDeNota(elegida: boolean, tocable: boolean) {
  return cn(
    "sombra-cuaderno group relative flex min-w-0 flex-col rounded-[18px] bg-hoja transition-[rotate,translate,border-color] duration-300 ease-out",
    elegida
      ? "border-2 border-tinta [rotate:0deg]"
      : "border border-tinta/12 [rotate:var(--giro)]",
    tocable && "hover:-translate-y-1 hover:[rotate:0deg] active:translate-y-0"
  )
}

function estiloDeNota(indice: number) {
  return {
    "--giro": GIROS[indice % GIROS.length],
    "--orden": indice,
  } as React.CSSProperties
}

/** El círculo a mano alrededor de un número urgente. Se dibuja al aparecer. */
function Circulo() {
  return (
    <svg
      viewBox="0 0 120 70"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute -inset-x-3 -inset-y-2 h-[calc(100%+1rem)] w-[calc(100%+1.5rem)] overflow-visible"
    >
      <path
        className="trazo-a-mano"
        pathLength={1}
        d="M70 6 C 30 2, 4 18, 6 36 C 8 56, 40 66, 70 64 C 100 62, 118 48, 114 30 C 110 12, 86 4, 52 8"
      />
    </svg>
  )
}

function Columnas({
  cantidad,
  children,
}: {
  cantidad: number
  children: React.ReactNode
}) {
  return (
    <div
      // Desde una pantalla ancha, notas de 17rem: dos notas de 450 px para un
      // número se veían vacías.
      className="grid grid-cols-[repeat(var(--columnas),minmax(0,1fr))] gap-2.5 pt-1 sm:gap-4 lg:grid-cols-[repeat(var(--columnas),17rem)]"
      style={{ "--columnas": cantidad } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

export interface Cobro {
  etiqueta: string
  cents: number
  pedidos: number
  /** Plata que todavía espera: va en la señal mientras haya. */
  urgente?: boolean
  elegida: boolean
  href: string
}

/** Lo que falta cobrar y lo que ya entró, en plata y en grande. */
export function FichasDeCobro({ cobros }: { cobros: Cobro[] }) {
  return (
    <Columnas cantidad={cobros.length}>
      {cobros.map((cobro, indice) => {
        const urgente = Boolean(cobro.urgente) && cobro.cents > 0
        return (
          <Link
            key={cobro.etiqueta}
            href={cobro.href}
            scroll={false}
            aria-current={cobro.elegida ? "page" : undefined}
            style={estiloDeNota(indice)}
            className={cn(
              claseDeNota(cobro.elegida, true),
              "gap-1 p-3.5 sm:p-4 lg:px-6 lg:py-5"
            )}
          >
            <span
              className={cn(
                "text-xs font-semibold tracking-[0.12em] uppercase",
                "opacity-65"
              )}
            >
              {cobro.etiqueta}
            </span>
            <span className="relative mt-1 self-start">
              <Contador
                valor={cobro.cents}
                tipo="dinero"
                className={cn(
                  "relative block truncate font-titular text-[clamp(1.25rem,6vw,1.75rem)] leading-[1.15] font-extrabold tracking-[-0.035em] lg:text-4xl lg:leading-[44px]",
                  urgente && "text-senal"
                )}
              />
              {urgente ? <Circulo /> : null}
            </span>
            <span className="text-sm opacity-70">
              {formatNumber(cobro.pedidos)}{" "}
              {cobro.pedidos === 1 ? "pedido" : "pedidos"}
            </span>
          </Link>
        )
      })}
    </Columnas>
  )
}

/**
 * Sin nada que reponer, una sola nota a lo ancho en vez de "0 · 0": lo que se
 * dice cuando todo está bien es una línea, no dos ceros.
 */
export function NotaAlDia({
  icono: Icono,
  titulo,
  detalle,
}: {
  icono: LucideIcon
  titulo: string
  detalle: string
}) {
  return (
    <div
      style={estiloDeNota(0)}
      className={cn(
        claseDeNota(false, false),
        "min-h-[96px] flex-row items-center gap-4 p-4 sm:px-6 lg:max-w-[35rem]"
      )}
    >
      <Icono aria-hidden="true" className="size-6 shrink-0 opacity-50" />
      <span className="min-w-0">
        <span className="block font-titular text-xl leading-tight font-bold tracking-[-0.02em]">
          {titulo}
        </span>
        <span className="block text-sm text-tinta/70">{detalle}</span>
      </span>
    </div>
  )
}

export interface FichaGrande {
  clave: string
  valor: number
  tipo?: "numero" | "dinero"
  etiqueta: string
  icono: LucideIcon
  /** Pide algo mientras no sea cero: va en la señal y se encierra. */
  urgente?: boolean
  elegida?: boolean
  /** Sin enlace, la nota solo informa. */
  href?: string
}

/** Una fila de notas con un número grande, cada una con su ícono. */
export function FichasGrandes({ fichas }: { fichas: FichaGrande[] }) {
  return (
    <Columnas cantidad={fichas.length}>
      {fichas.map((ficha, indice) => {
        const Icono = ficha.icono
        const urgente = Boolean(ficha.urgente) && ficha.valor > 0
        const contenido = (
          <>
            <Icono
              aria-hidden="true"
              className={cn(
                "size-[18px]",
                urgente ? "text-senal" : "opacity-50"
              )}
            />
            <span className="mt-3 block min-w-0">
              <span className="relative inline-block max-w-full min-w-[1.6em] text-center">
                <Contador
                  valor={ficha.valor}
                  tipo={ficha.tipo ?? "numero"}
                  className={cn(
                    "relative block truncate font-titular text-[32px] leading-10 font-extrabold tracking-[-0.04em] lg:text-[40px] lg:leading-[48px]",
                    // Un monto es más largo que una cuenta: en el celular se
                    // achica con el ancho, como la app achica la letra para que entre.
                    ficha.tipo === "dinero" &&
                      "max-sm:text-[clamp(1.125rem,5.2vw,1.875rem)]",
                    urgente && "text-senal"
                  )}
                />
                {urgente ? <Circulo /> : null}
              </span>
              <span className="mt-1 block text-sm leading-tight font-semibold">
                {ficha.etiqueta}
              </span>
            </span>
          </>
        )
        const clase = cn(
          claseDeNota(Boolean(ficha.elegida), Boolean(ficha.href)),
          "min-h-[96px] justify-between p-3 sm:px-4 lg:px-6 lg:py-5"
        )

        return ficha.href ? (
          <Link
            key={ficha.clave}
            href={ficha.href}
            scroll={false}
            aria-current={ficha.elegida ? "page" : undefined}
            style={estiloDeNota(indice)}
            className={clase}
          >
            {contenido}
          </Link>
        ) : (
          <div key={ficha.clave} style={estiloDeNota(indice)} className={clase}>
            {contenido}
          </div>
        )
      })}
    </Columnas>
  )
}
