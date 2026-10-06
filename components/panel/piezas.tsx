import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/*
 * Las piezas con las que se arma toda pantalla del panel.
 *
 * Salen del Resumen, que fue la primera en ordenarse así: cada cosa en su
 * panel, encerrada por una regla, con un título que dice para qué sirve. Las
 * demás pantallas se armaban cada una a su manera —cifras sueltas, rótulos
 * chicos y reglas al 15%— y lo importante se perdía entre lo demás. Cómo se
 * usan está en `.agents/rules/ui-styling.md`, "Las pantallas del panel".
 */

/**
 * El titular de una pantalla, su bajada y sus acciones.
 *
 * Las acciones bajan a su propia línea en el celular en vez de apretar el
 * titular: en 375 px un titular de dos palabras por renglón no se lee.
 */
export function Cabecera({
  etiqueta,
  titulo,
  bajada,
  demo,
  children,
}: {
  /** Lo que va arriba del titular, en versalita: "Pedido". */
  etiqueta?: string
  titulo: React.ReactNode
  bajada?: React.ReactNode
  /** El aviso de modo demo, si corresponde. Va en la bajada, resaltado. */
  demo?: string | false
  /** Las acciones de la pantalla. */
  children?: React.ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
      <div className="max-w-[60ch] min-w-0 flex-[1_1_20rem]">
        {etiqueta ? (
          <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
            {etiqueta}
          </p>
        ) : null}
        <h1
          className={cn(
            "font-titular text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.02] font-extrabold tracking-[-0.03em] text-balance",
            etiqueta && "mt-1.5"
          )}
        >
          {titulo}
        </h1>
        {bajada || demo ? (
          <p className="mt-3 text-sm leading-relaxed opacity-70">
            {bajada}
            {demo ? (
              <>
                {bajada ? " " : null}
                <span className="font-semibold">{demo}</span>
              </>
            ) : null}
          </p>
        ) : null}
      </div>

      {children ? (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </header>
  )
}

/** La vuelta a la pantalla de la que sale una de detalle. */
export function Volver({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
    >
      <ArrowLeft
        aria-hidden="true"
        className="size-4 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transform-none"
      />
      {children}
    </Link>
  )
}

/**
 * Un panel: lo que ordena toda pantalla del panel.
 *
 * Es el panel de demostración de DESIGN.md —regla estructural de un píxel,
 * esquina viva, sin sombra— y no una tarjeta. Encerrada en su panel, cada cosa
 * se reconoce de un vistazo, y su título dice para qué sirve en vez de solo
 * nombrarla: "Lo que falta cobrar", no "Resumen".
 *
 * `accion` es el pie: un enlace a todo el ancho para seguir en otra pantalla,
 * del tamaño de un pulgar. `relleno` le da al cuerpo el margen interior de un
 * formulario o de un texto; una lista lo trae en cada fila.
 */
export function Seccion({
  id,
  icono: Icono,
  titulo,
  bajada,
  extra,
  accion,
  relleno = false,
  className,
  children,
}: {
  id: string
  icono: LucideIcon
  titulo: string
  bajada?: React.ReactNode
  /** Lo que va a la derecha del título: un selector, un contador, un botón. */
  extra?: React.ReactNode
  accion?: { href: string; texto: string }
  relleno?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className={cn(
        "flex min-w-0 scroll-mt-6 flex-col border border-tinta",
        className
      )}
    >
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-tinta/15 px-4 py-3.5 sm:px-5">
        {/* El título reclama 16rem antes de ceder: en un celular, lo que va a
            la derecha baja a su propia línea en vez de apretar la bajada en
            una columna de una palabra por renglón. */}
        <div className="flex min-w-[min(100%,16rem)] flex-1 items-start gap-3">
          <Icono aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div className="min-w-0">
            <h2
              id={`${id}-titulo`}
              className="font-titular text-lg leading-tight font-bold tracking-[-0.02em]"
            >
              {titulo}
            </h2>
            {bajada ? (
              <p className="mt-0.5 text-sm leading-snug opacity-70">{bajada}</p>
            ) : null}
          </div>
        </div>
        {extra}
      </header>

      <div
        className={cn(
          "flex flex-1 flex-col",
          relleno && "gap-5 px-4 py-5 sm:px-5"
        )}
      >
        {children}
      </div>

      {accion ? (
        <Link
          href={accion.href}
          className="group flex min-h-12 items-center justify-between gap-3 border-t border-tinta/15 px-4 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel sm:px-5"
        >
          {accion.texto}
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none"
          />
        </Link>
      ) : null}
    </section>
  )
}

/**
 * Lo que muestra un panel sin datos: qué va a aparecer acá y cómo llegar.
 *
 * Una tienda recién creada es el estado normal durante una demostración, no un
 * caso raro, así que dice qué hacer y no solo que no hay nada.
 */
export function SinDatos({
  icono: Icono,
  titulo,
  texto,
  children,
}: {
  icono: LucideIcon
  titulo: string
  texto: string
  /** Una acción, si la hay. */
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col items-start gap-3 px-4 py-6 sm:px-5">
      <Icono aria-hidden="true" className="size-6 opacity-30" />
      <div>
        <p className="font-titular font-bold tracking-[-0.01em]">{titulo}</p>
        <p className="mt-1 max-w-[52ch] text-sm leading-relaxed opacity-70">
          {texto}
        </p>
      </div>
      {children}
    </div>
  )
}

/**
 * Las cifras de un panel, separadas por una regla de un píxel.
 *
 * Van de a cuatro, o de a dos: una celda vacía dejaría ver el gris de las
 * reglas como un bloque.
 */
export function Cifras({ children }: { children: React.ReactNode }) {
  return (
    <dl className="grid grid-cols-2 gap-px bg-tinta/15 lg:grid-cols-4">
      {children}
    </dl>
  )
}

/**
 * Una cifra del panel.
 *
 * El numeral va en tinta y no en rojo, al revés que en la portada: son cuatro
 * juntas, y si todas fueran rojas el acento dejaría de señalar nada. `alerta`
 * lo enciende solo cuando el número pide una acción —pedidos esperando,
 * productos agotados— y así el rojo vuelve a querer decir algo.
 */
export function Cifra({
  etiqueta,
  valor,
  detalle,
  alerta = false,
}: {
  etiqueta: string
  valor: string
  detalle?: string
  alerta?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col bg-papel px-4 py-4 sm:px-5">
      <dt className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
        {etiqueta}
      </dt>
      <dd
        className={cn(
          "tabular mt-2 font-titular text-[clamp(1.4rem,4vw,1.85rem)] leading-none font-extrabold tracking-[-0.04em]",
          alerta && "text-senal"
        )}
      >
        {valor}
      </dd>
      {detalle ? (
        <dd className="mt-2 text-sm leading-snug opacity-70">{detalle}</dd>
      ) : null}
    </div>
  )
}

/** La foto chica de un producto en una fila, o su lugar vacío. */
export function Miniatura({
  foto,
  icono: Icono,
}: {
  foto: string | null
  icono: LucideIcon
}) {
  return (
    <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden border border-tinta/15 bg-tinta/[0.05]">
      {foto ? (
        <Image
          src={foto}
          alt=""
          fill
          unoptimized
          sizes="44px"
          className="object-cover"
        />
      ) : (
        <Icono aria-hidden="true" className="size-4 opacity-35" />
      )}
    </span>
  )
}

/**
 * Una marca chica en versalita: un estado, una condición.
 *
 * `senal` solo para lo que pide una acción, como todo el rojo del panel.
 */
export function Insignia({
  tono = "tinta",
  children,
}: {
  tono?: "senal" | "llena" | "tinta" | "suave" | "anulada"
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 border px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase",
        tono === "senal" && "border-senal text-senal",
        tono === "llena" && "border-tinta bg-tinta text-papel",
        tono === "tinta" && "border-tinta text-tinta",
        tono === "suave" && "border-tinta/30 text-tinta/70",
        tono === "anulada" && "border-tinta/25 text-tinta/55 line-through"
      )}
    >
      {children}
    </span>
  )
}
