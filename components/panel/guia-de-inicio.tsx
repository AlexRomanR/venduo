"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  FileSpreadsheet,
  Loader2,
  MessageCircle,
  PackagePlus,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { formatMoney, formatNumber } from "@/lib/format"
import { construirPrecio, porcentaje, type Tramo } from "@/lib/precio"
import { cn } from "@/lib/utils"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"

/**
 * La guía del primer ingreso de un negocio.
 *
 * Es un carrusel y no una lista porque tiene un orden y un final: primero lo
 * que le toca hacer a él —cargar y agrupar lo que vende— y después cómo sigue
 * el circuito sin que haga nada. Una lista larga se lee en diagonal; un paso
 * por pantalla se lee entero, y en el celular se pasa con el pulgar.
 *
 * Los dos primeros pasos llevan a una acción y vuelven acá con `?paso=`, así el
 * negocio retoma donde estaba. Al terminar se marca la guía como vista y va a
 * su panel con estadísticas.
 */

interface Paso {
  icono: LucideIcon
  titulo: string
  detalle: string
  /** Lo resuelve la plataforma: no es tarea del negocio. */
  automatico?: boolean
}

const PASOS: Paso[] = [
  {
    icono: PackagePlus,
    titulo: "Carga lo que vendes",
    detalle:
      "Una foto, el nombre, cuántas unidades tienes y cuánto quieres recibir por cada una. El precio publicado lo calculamos nosotros: le sumamos la comisión de quien lo venda y nuestra parte.",
  },
  {
    icono: Tags,
    titulo: "Agrúpalos en categorías",
    detalle:
      "Opcional, pero ayuda: quien busca encuentra más rápido, y tus productos aparecen ordenados en el catálogo.",
  },
  {
    icono: Users,
    titulo: "Los promotores eligen tus productos",
    detalle:
      "No tienes que buscar a nadie ni pagar publicidad por adelantado. Tus productos entran al catálogo y cada promotor elige cuáles promociona en sus redes, con su propio enlace.",
    automatico: true,
  },
  {
    icono: Bell,
    titulo: "Te avisamos cuando vendas",
    detalle:
      "El pedido te llega con el detalle y el WhatsApp de quien compró. El pago queda retenido hasta que el producto llegue, así ninguno de los dos arriesga.",
    automatico: true,
  },
  {
    icono: MessageCircle,
    titulo: "Coordinas la entrega por WhatsApp",
    detalle:
      "Te abrimos la conversación con el pedido ya escrito. Marcas el pedido como enviado y, cuando el comprador confirma que lo recibió, se libera tu pago.",
    automatico: true,
  },
]

export function GuiaDeInicio({
  nombre,
  pasoInicial,
  productos,
  categorias,
  tramos,
  terminar,
}: {
  nombre: string
  /** Desde qué paso empezar, contando desde 1. */
  pasoInicial: number
  /** Cuántos productos ya cargó: el paso 1 lo reconoce. */
  productos: number
  categorias: number
  tramos: Tramo[]
  terminar: () => Promise<{ ok: boolean; error?: string }>
}) {
  const router = useRouter()
  const [api, setApi] = React.useState<CarouselApi>()
  const inicio = Math.min(Math.max(pasoInicial, 1), PASOS.length) - 1
  const [actual, setActual] = React.useState(inicio)
  const [terminando, setTerminando] = React.useState(false)

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

  async function finalizar() {
    setTerminando(true)
    const resultado = await terminar()
    if (!resultado.ok) {
      setTerminando(false)
      toast.error(resultado.error ?? "No pudimos guardar.")
      return
    }
    router.push("/panel")
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
            Bienvenido a Venduo
          </p>
          <h1 className="mt-3 max-w-[22ch] font-titular text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.02] font-extrabold tracking-[-0.03em] text-balance">
            {nombre}, así funciona tu negocio acá.
          </h1>
        </div>

        <button
          type="button"
          onClick={finalizar}
          disabled={terminando}
          className="inline-flex min-h-11 items-center text-sm opacity-60 transition-opacity hover:opacity-100"
        >
          Saltar la guía
        </button>
      </div>

      {/* Progreso: el mismo trazo de 2 px que marca el avance en todo el
          sistema. Cada tramo lleva al paso, para volver sin pasar por todos. */}
      <div>
        <p className="tabular text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
          Paso {actual + 1} de {PASOS.length}
        </p>
        <ol className="mt-3 grid grid-cols-5 gap-2">
          {PASOS.map((paso, i) => (
            <li key={paso.titulo}>
              <button
                type="button"
                onClick={() => api?.scrollTo(i)}
                aria-label={`Ir al paso ${i + 1}: ${paso.titulo}`}
                aria-current={i === actual ? "step" : undefined}
                className="group flex h-11 w-full items-center"
              >
                <span
                  className={cn(
                    "h-0.5 w-full transition-colors duration-300",
                    i <= actual
                      ? paso.automatico
                        ? "bg-tinta"
                        : "bg-senal"
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
        opts={{ startIndex: inicio, align: "start" }}
        aria-label="Primeros pasos"
      >
        <CarouselContent className="-ml-6">
          {PASOS.map((paso, i) => (
            <CarouselItem key={paso.titulo} className="pl-6">
              <Diapositiva numero={i + 1} paso={paso} activa={i === actual}>
                {i === 0 ? (
                  <AccionesDeCarga productos={productos} tramos={tramos} />
                ) : i === 1 ? (
                  <AccionesDeCategorias categorias={categorias} />
                ) : null}
              </Diapositiva>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* En el móvil queda pegada al pie: las diapositivas miden lo que la más
          alta, y en una corta el botón quedaba a media pantalla de distancia. */}
      <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-1 border-t-2 border-tinta bg-papel pt-4 pb-4 sm:static sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-6 sm:pb-0">
        <button
          type="button"
          onClick={() => api?.scrollPrev()}
          disabled={actual === 0}
          className={cn(
            "inline-flex min-h-12 items-center justify-center gap-2 text-sm font-semibold transition-colors hover:text-senal disabled:opacity-30 disabled:hover:text-tinta"
          )}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Anterior
        </button>

        {ultimo ? (
          <button
            type="button"
            onClick={finalizar}
            disabled={terminando}
            className={cn(BOTON_PRIMARIO, "sm:px-8")}
          >
            {terminando ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Check aria-hidden="true" className="size-4" />
            )}
            Finalizar e ir a mi panel
          </button>
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
  activa,
  children,
}: {
  numero: number
  paso: Paso
  activa: boolean
  children?: React.ReactNode
}) {
  const Icono = paso.icono

  return (
    <article
      aria-current={activa ? "step" : undefined}
      className="grid min-h-[22rem] gap-8 border border-tinta/15 p-6 sm:p-10 lg:grid-cols-[auto_1fr] lg:gap-12"
    >
      <div className="flex items-start gap-5 lg:flex-col">
        <span
          className={cn(
            "tabular font-titular text-[clamp(3rem,10vw,5rem)] leading-none font-extrabold tracking-[-0.04em]",
            paso.automatico ? "opacity-25" : "text-senal"
          )}
        >
          {String(numero).padStart(2, "0")}
        </span>
        <span
          aria-hidden="true"
          className="mt-2 flex size-12 items-center justify-center border border-tinta/20 lg:mt-0"
        >
          <Icono className="size-5 opacity-60" />
        </span>
      </div>

      <div className="flex flex-col">
        {paso.automatico ? (
          <span className="mb-4 w-fit rounded-full border border-tinta/25 px-3 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase opacity-65">
            Lo hacemos nosotros
          </span>
        ) : null}
        <h2 className="max-w-[22ch] font-titular text-[clamp(1.5rem,4vw,2.25rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-balance">
          {paso.titulo}
        </h2>
        <p className="mt-4 max-w-[58ch] leading-relaxed opacity-75">
          {paso.detalle}
        </p>

        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </article>
  )
}

/** El paso 1: las dos formas de cargar, y a cuánto queda un ejemplo. */
function AccionesDeCarga({
  productos,
  tramos,
}: {
  productos: number
  tramos: Tramo[]
}) {
  const ejemplo = construirPrecio(15000, tramos)

  return (
    <div className="flex flex-col gap-6">
      {productos > 0 ? (
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Check aria-hidden="true" className="size-4 text-senal" />
          Ya cargaste {formatNumber(productos)}{" "}
          {productos === 1 ? "producto" : "productos"}.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/panel/productos/nuevo?desde=guia"
          className={cn(BOTON_PRIMARIO, "sm:w-auto")}
        >
          <PackagePlus aria-hidden="true" className="size-4" />
          {productos > 0 ? "Cargar otro producto" : "Cargar un producto"}
        </Link>
        <Link
          href="/panel/productos/importar?desde=guia"
          className={cn(BOTON_SECUNDARIO, "sm:w-auto")}
        >
          <FileSpreadsheet aria-hidden="true" className="size-4" />
          Cargar desde un Excel
        </Link>
      </div>

      <p className="max-w-[58ch] border-l-2 border-tinta/15 pl-4 text-sm leading-relaxed opacity-65">
        Por ejemplo: si quieres recibir {formatMoney(ejemplo.baseCents)}, le
        sumamos {formatMoney(ejemplo.comisionCents)} para el promotor (
        {porcentaje(ejemplo.comisionBps)}) y {formatMoney(ejemplo.takeCents)}{" "}
        nuestros, y se publica en{" "}
        <span className="tabular font-semibold opacity-100">
          {formatMoney(ejemplo.precioCents)}
        </span>
        . Tú recibes tus {formatMoney(ejemplo.baseCents)} completos.
      </p>
    </div>
  )
}

function AccionesDeCategorias({ categorias }: { categorias: number }) {
  return (
    <div className="flex flex-col gap-4">
      {categorias > 0 ? (
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Check aria-hidden="true" className="size-4 text-senal" />
          Tienes {formatNumber(categorias)}{" "}
          {categorias === 1 ? "categoría" : "categorías"}.
        </p>
      ) : null}
      <Link
        href="/panel/productos/categorias?desde=guia"
        className={cn(BOTON_SECUNDARIO, "w-full sm:w-auto sm:self-start")}
      >
        <Tags aria-hidden="true" className="size-4" />
        {categorias > 0 ? "Ver mis categorías" : "Crear categorías"}
      </Link>
      <p className="text-sm opacity-55">
        Si cargaste desde Excel, las categorías de tu planilla ya se crearon
        solas.
      </p>
    </div>
  )
}
