"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  Check,
  ChevronDown,
  Copy,
  Link2,
  MessageCircle,
  Search,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react"

import type { ProductoVitrina } from "@/lib/demo-data"
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { FotoProducto } from "@/components/promotor/producto"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"

interface Paso {
  icono: LucideIcon
  titulo: string
  detalle: string
}

const PASOS: Paso[] = [
  {
    icono: SlidersHorizontal,
    titulo: "Filtra hasta encontrar algo que sí venderías",
    detalle:
      "Busca por categoría, precio, estado y fecha de publicación. Piensa en la gente que ya te responde por WhatsApp: el mejor producto es el que encaja con ellos.",
  },
  {
    icono: BadgeDollarSign,
    titulo: "Compara el precio con lo que ganas",
    detalle:
      "Cada ficha te muestra el precio que verá el comprador, tu ganancia por unidad y el stock disponible. Tú eliges; ningún negocio tiene que aprobarte.",
  },
  {
    icono: Link2,
    titulo: "Crea tu enlace y compártelo",
    detalle:
      "Al tocar Crear mi enlace, Venduo genera un código único para ese producto. Queda guardado en Mis enlaces para copiarlo, mandarlo por WhatsApp o descargar su QR cuando quieras.",
  },
]

/** Guía breve del primer enlace, con la misma mecánica del alta del negocio. */
export function GuiaInicialPromotor({
  nombre,
  productos,
}: {
  nombre: string
  productos: ProductoVitrina[]
}) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [actual, setActual] = React.useState(0)
  const ejemplo = productos[0]

  React.useEffect(() => {
    if (!api) return
    const alCambiar = () => setActual(api.selectedScrollSnap())
    alCambiar()
    api.on("select", alCambiar)
    return () => {
      api.off("select", alCambiar)
    }
  }, [api])

  const ultimo = actual === PASOS.length - 1
  const destino = ejemplo
    ? `/vendedor/catalogo/${ejemplo.id}`
    : "/vendedor/catalogo"

  return (
    <div className="flex flex-col gap-9">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="max-w-[21ch] font-titular text-[clamp(1.9rem,5vw,2.75rem)] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance">
            {nombre.split(" ")[0]}, crea tu primer enlace en tres pasos.
          </h1>
          <p className="mt-3 max-w-[56ch] leading-relaxed opacity-70">
            Te tomará menos de dos minutos. Al final tendrás un producto real
            listo para compartir, sin comprarlo ni pedir permiso.
          </p>
        </div>
        <Link
          href="/vendedor/catalogo"
          className="inline-flex min-h-11 items-center text-sm font-semibold opacity-60 transition-opacity hover:opacity-100"
        >
          Explorar por mi cuenta
        </Link>
      </div>

      <div>
        <p className="tabular text-xs font-semibold tracking-[0.1em] uppercase opacity-55">
          Paso {actual + 1} de {PASOS.length}
        </p>
        <ol className="mt-3 grid grid-cols-3 gap-2">
          {PASOS.map((paso, indice) => (
            <li key={paso.titulo}>
              <button
                type="button"
                onClick={() => api?.scrollTo(indice)}
                aria-label={`Ir al paso ${indice + 1}: ${paso.titulo}`}
                aria-current={indice === actual ? "step" : undefined}
                className="group flex h-11 w-full items-center"
              >
                <span
                  className={cn(
                    "h-0.5 w-full transition-colors duration-300",
                    indice <= actual
                      ? "bg-senal"
                      : "bg-tinta/15 group-hover:bg-tinta/35"
                  )}
                />
              </button>
            </li>
          ))}
        </ol>
      </div>

      <Carousel
        setApi={setApi}
        opts={{ align: "start" }}
        aria-label="Cómo crear tu primer enlace"
      >
        <CarouselContent className="-ml-6">
          {PASOS.map((paso, indice) => (
            <CarouselItem key={paso.titulo} className="pl-6">
              <Diapositiva numero={indice + 1} paso={paso}>
                {indice === 0 ? (
                  <MuestraFiltros />
                ) : indice === 1 ? (
                  <MuestraProducto producto={ejemplo} />
                ) : (
                  <MuestraEnlace producto={ejemplo} />
                )}
              </Diapositiva>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-1 border-t-2 border-tinta bg-papel pt-4 pb-4 sm:static sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-6 sm:pb-0">
        <button
          type="button"
          onClick={() => api?.scrollPrev()}
          disabled={actual === 0}
          className="inline-flex min-h-12 items-center justify-center gap-2 text-sm font-semibold transition-colors hover:text-senal disabled:opacity-30 disabled:hover:text-tinta"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Anterior
        </button>

        {ultimo ? (
          <Link href={destino} className={cn(BOTON_PRIMARIO, "sm:px-8")}>
            <Check aria-hidden="true" className="size-4" />
            Elegir mi primer producto
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => api?.scrollNext()}
            className={cn(BOTON_PRIMARIO, "sm:px-8")}
          >
            Siguiente
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}

function Diapositiva({
  numero,
  paso,
  children,
}: {
  numero: number
  paso: Paso
  children: React.ReactNode
}) {
  const Icono = paso.icono
  return (
    <article className="grid min-h-[25rem] gap-8 border border-tinta/15 p-6 sm:p-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-12">
      <div className="flex items-start gap-5 lg:flex-col">
        <span className="tabular font-titular text-[clamp(3rem,10vw,5rem)] leading-none font-extrabold tracking-[-0.04em] text-senal">
          {String(numero).padStart(2, "0")}
        </span>
        <span
          aria-hidden="true"
          className="mt-2 flex size-12 items-center justify-center border border-tinta/20 lg:mt-0"
        >
          <Icono className="size-5 opacity-60" />
        </span>
      </div>
      <div className="min-w-0">
        <h2 className="max-w-[22ch] font-titular text-[clamp(1.5rem,4vw,2.25rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-balance">
          {paso.titulo}
        </h2>
        <p className="mt-4 max-w-[58ch] leading-relaxed opacity-75">
          {paso.detalle}
        </p>
        <div className="mt-8">{children}</div>
      </div>
    </article>
  )
}

function MuestraFiltros() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {["Categoría", "Precio", "Publicado", "Estado"].map((filtro) => (
        <div key={filtro} className="border-b border-tinta pb-2">
          <p className="text-xs font-semibold tracking-[0.1em] uppercase opacity-45">
            {filtro}
          </p>
          <p className="mt-1 flex min-h-7 items-center justify-between text-sm font-semibold">
            Todos
            <ChevronDown aria-hidden="true" className="size-3.5 opacity-35" />
          </p>
        </div>
      ))}
      <Link
        href="/vendedor/catalogo"
        className={cn(
          BOTON_SECUNDARIO,
          "col-span-2 mt-2 sm:col-span-4 sm:w-fit"
        )}
      >
        <Search aria-hidden="true" className="size-4" />
        Probar los filtros
      </Link>
    </div>
  )
}

function MuestraProducto({ producto }: { producto?: ProductoVitrina }) {
  if (!producto) {
    return (
      <Link href="/vendedor/catalogo" className={BOTON_SECUNDARIO}>
        Ver el catálogo
      </Link>
    )
  }

  return (
    <div className="grid max-w-2xl gap-5 border-y border-tinta/15 py-5 sm:grid-cols-[8rem_1fr_auto] sm:items-center">
      <FotoProducto
        src={producto.imageUrl}
        alt=""
        sizes="128px"
        className="aspect-[4/3] w-full sm:size-32"
      />
      <div>
        <p className="text-xs font-semibold tracking-[0.1em] uppercase opacity-50">
          {producto.storeName}
        </p>
        <p className="mt-1 font-titular text-lg font-bold tracking-[-0.02em]">
          {producto.name}
        </p>
        <p className="tabular mt-2 text-sm">
          Se publica a {formatMoney(producto.priceCents)}
        </p>
      </div>
      <div className="sm:text-right">
        <p className="text-xs font-semibold tracking-[0.1em] uppercase opacity-50">
          Tú ganas
        </p>
        <p className="tabular mt-1 font-titular text-2xl font-extrabold tracking-[-0.03em] text-senal">
          {formatMoney(producto.gananciaCents)}
        </p>
      </div>
    </div>
  )
}

function MuestraEnlace({ producto }: { producto?: ProductoVitrina }) {
  return (
    <div className="max-w-2xl border-y border-tinta/15 py-5">
      <p className="truncate border border-tinta/20 px-3 py-3 text-sm opacity-65">
        venduo.bo/producto/{producto?.id ?? "producto"}?ref=TU-CODIGO
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex min-h-11 items-center gap-2 bg-senal px-4 text-sm font-semibold text-white">
          <MessageCircle aria-hidden="true" className="size-4" />
          WhatsApp
        </span>
        <span className="inline-flex min-h-11 items-center gap-2 border border-tinta/25 px-4 text-sm font-semibold">
          <Copy aria-hidden="true" className="size-4" />
          Copiar
        </span>
      </div>
      <p className="mt-4 max-w-[54ch] text-sm leading-relaxed opacity-60">
        Si se te pierde, vuelve a Mis enlaces: tu código no cambia y no tienes
        que generarlo otra vez.
      </p>
    </div>
  )
}
