import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Clock, Palette, Share2 } from "lucide-react"

import type { Suscripcion } from "@/lib/data/panel"
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { enlaceLegible } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import { CompartirTienda } from "@/components/panel/tablero/compartir"

const SECUNDARIO = cn(BOTON_SECUNDARIO, "min-h-11 px-4 text-sm")

export interface TiendaDelResumen {
  nombre: string
  slug: string
  url: string
  logoUrl: string | null
  publicada: boolean
  pausada?: boolean
}

/**
 * Lo primero del Resumen: de quién es la tienda y cómo está, en dos o tres
 * palabras por cosa —"Publicada", "Prueba · 5 días"— y no en oraciones.
 *
 * En el celular la tienda se muestra al lado del nombre, con la captura de su
 * portada; en una pantalla ancha está viva en la columna de la derecha
 * (`TiendaEnVivo`), y las acciones van con ella.
 */
export function CabeceraDeTienda({
  persona,
  tienda,
  suscripcion,
  vista,
}: {
  persona: string
  tienda: TiendaDelResumen
  suscripcion: Suscripcion | null
  /** La captura de la portada, o la miniatura de su plantilla. */
  vista: string | null
}) {
  const primerNombre = persona.trim().split(/\s+/)[0]

  return (
    <header className="flex flex-col gap-5">
      <div className="flex items-end gap-4">
        {vista ? (
          <a
            href={tienda.url}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`Ver ${tienda.nombre} como la ve tu cliente`}
            className="shrink-0 lg:hidden"
          >
            <CelularConCaptura src={vista} />
          </a>
        ) : null}

        <div className="min-w-0 flex-1">
          {primerNombre ? (
            <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
              Hola, {primerNombre}
            </p>
          ) : null}
          <h1 className="mt-1 font-titular text-[clamp(1.9rem,6vw,3rem)] leading-[0.98] font-extrabold tracking-[-0.035em] text-balance">
            {tienda.nombre}
          </h1>
          <EstadoDeTienda tienda={tienda} suscripcion={suscripcion} />
        </div>
      </div>

      <div className="lg:hidden">
        <AccionesDeTienda tienda={tienda} />
      </div>
    </header>
  )
}

/** Cómo está la tienda, en fichas: se lee de un vistazo. */
function EstadoDeTienda({
  tienda,
  suscripcion,
}: {
  tienda: TiendaDelResumen
  suscripcion: Suscripcion | null
}) {
  const alAire = tienda.publicada && !tienda.pausada
  const prueba =
    suscripcion?.status === "prueba" && suscripcion.diasRestantes !== null
      ? suscripcion
      : null

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Ficha urgente={!alAire}>
        <span
          aria-hidden="true"
          className={cn(
            "size-2 rounded-full",
            alAire ? "bg-tinta" : "bg-senal"
          )}
        />
        {tienda.pausada
          ? "Pausada por Venduo"
          : tienda.publicada
            ? "Publicada"
            : "En borrador"}
      </Ficha>
      {prueba ? (
        <Ficha urgente={prueba.porVencer}>
          <Clock aria-hidden="true" className="size-3.5" />
          {prueba.diasRestantes !== null && prueba.diasRestantes <= 0
            ? "Prueba · vence hoy"
            : `Prueba · ${prueba.diasRestantes} ${prueba.diasRestantes === 1 ? "día" : "días"}`}
        </Ficha>
      ) : null}
    </div>
  )
}

function Ficha({
  urgente,
  children,
}: {
  urgente: boolean
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 border px-2.5 text-sm font-semibold",
        urgente ? "border-senal text-senal" : "border-tinta/25"
      )}
    >
      {children}
    </span>
  )
}

/**
 * Compartir, ver y editar: lo que alguien busca más veces por día. Compartir
 * va en rojo porque es lo que trae ventas.
 */
export function AccionesDeTienda({
  tienda,
  apilado = false,
}: {
  tienda: TiendaDelResumen
  /** Uno debajo del otro, a todo el ancho: bajo el celular de la derecha. */
  apilado?: boolean
}) {
  return (
    <div
      className={cn(
        "grid gap-2",
        apilado ? "grid-cols-2" : "grid-cols-2 sm:flex sm:flex-wrap"
      )}
    >
      <CompartirTienda
        nombre={tienda.nombre}
        slug={tienda.slug}
        url={tienda.url}
        legible={enlaceLegible(tienda.url)}
      >
        <button
          type="button"
          className={cn(BOTON_PRIMARIO, "col-span-2 min-h-11 text-sm")}
        >
          <Share2 aria-hidden="true" className="size-4" />
          Compartir tu tienda
        </button>
      </CompartirTienda>
      <a
        href={tienda.url}
        target="_blank"
        rel="noreferrer noopener"
        className={SECUNDARIO}
      >
        Ver tienda
        <ArrowUpRight aria-hidden="true" className="size-4" />
      </a>
      <Link href="/editor" className={SECUNDARIO}>
        <Palette aria-hidden="true" className="size-4" />
        Editar
      </Link>
    </div>
  )
}

/**
 * La portada de la tienda dentro de un celular chico. Es la captura que saca
 * la web para la app: una imagen, liviana para los datos del celular.
 */
function CelularConCaptura({ src }: { src: string }) {
  return (
    <span className="block w-[88px] rounded-[1.05rem] bg-tinta p-1 transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transform-none">
      <span className="relative block aspect-[9/19] overflow-hidden rounded-[0.8rem] bg-papel">
        <Image
          src={src}
          alt=""
          fill
          sizes="88px"
          quality={85}
          className="object-cover object-top"
        />
      </span>
    </span>
  )
}
