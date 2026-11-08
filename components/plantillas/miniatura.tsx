import type { CSSProperties } from "react"
import Image from "next/image"

import {
  PLANTILLAS,
  plantillaDeTienda,
  type ClavePlantilla,
} from "@/lib/plantillas"
import { variablesEnLinea, type Apariencia } from "@/lib/plantillas/apariencia"
import { cn } from "@/lib/utils"

/** Un producto de la tienda, como se ve en el dibujo: su foto y su precio. */
export interface ProductoDeMiniatura {
  foto: string | null
  /** El precio ya escrito: "Bs 180", "Desde Bs 240". */
  precio: string
  /** El porcentaje de rebaja, si la tiene. */
  rebaja: number | null
}

/**
 * Lo de una tienda que se dibuja en la miniatura para que se reconozca: su
 * nombre o su logo, la foto de la portada y tres productos con su precio.
 */
export interface DatosDeMiniatura {
  nombre: string
  logoUrl: string | null
  portada: string | null
  productos: ProductoDeMiniatura[]
}

/**
 * Una tienda en miniatura, con la identidad de su plantilla.
 *
 * Se dibuja con los tokens reales —colores, letras, radio— puestos en línea
 * sobre el recuadro, así que no tiñe la página que la contiene: la galería del
 * alta muestra dos plantillas lado a lado dentro del mundo de Venduo. Cuando
 * cambia la base de una plantilla, su miniatura cambia sola.
 *
 * Las letras van en `cqw`, relativas al ancho del recuadro y no de la pantalla:
 * la misma miniatura se ve en una tarjeta de 300 px y en el panel a 450, y en
 * píxeles fijos el texto quedaba chico en la grande.
 *
 * Con `datos`, la tienda de la persona adentro: su nombre o su logo, su
 * portada y tres productos enteros con el precio en una etiqueta que se lee
 * a 343 px. Sin `datos` dibuja lo mismo de siempre: la usan también el alta,
 * `/admin` y las capturas de la app.
 *
 * No usa estado ni efectos: la importan tanto la galería, que es de cliente,
 * como el panel, que es de servidor.
 */
export function Miniatura({
  clave,
  apariencia,
  datos,
  className,
}: {
  clave: string | null | undefined
  /**
   * La apariencia de una tienda, para dibujarla con sus colores y su letra.
   * Sin decirlo, la base de la plantilla.
   */
  apariencia?: Apariencia | null
  datos?: DatosDeMiniatura | null
  className?: string
}) {
  const plantilla = plantillaDeTienda(clave)
  const Dibujo = DIBUJOS[plantilla]

  return (
    <div
      aria-hidden="true"
      data-miniatura={plantilla}
      style={
        variablesEnLinea(
          apariencia ?? PLANTILLAS[plantilla].apariencia
        ) as CSSProperties
      }
      className={cn(
        "@container relative aspect-[4/3] w-full overflow-hidden bg-papel text-tinta select-none",
        className
      )}
    >
      <Dibujo d={datos ?? undefined} />
    </div>
  )
}

type Props = { d?: DatosDeMiniatura }

/**
 * El nombre de la tienda: "Tu tienda" sin datos, y con datos su logo o su
 * nombre, en una línea, más grande para que se lea en la hoja.
 */
function Marca({
  d,
  className,
  centrada = false,
}: {
  d?: DatosDeMiniatura
  className: string
  centrada?: boolean
}) {
  if (!d) return <span className={className}>Tu tienda</span>
  if (d.logoUrl) {
    return (
      <span className="relative block h-[7cqw] w-[30cqw]">
        <Image
          src={d.logoUrl}
          alt=""
          fill
          unoptimized
          sizes="160px"
          className={cn(
            "object-contain",
            centrada ? "object-center" : "object-left"
          )}
        />
      </span>
    )
  }
  return (
    <span
      className={cn(
        className,
        "block max-w-[62cqw] truncate text-[length:5cqw] leading-tight"
      )}
    >
      {d.nombre}
    </span>
  )
}

/** Una foto que llena su recuadro, que tiene que ser `relative`. */
function Foto({ src }: { src: string | null | undefined }) {
  if (!src) return null
  return (
    <Image
      src={src}
      alt=""
      fill
      unoptimized
      sizes="240px"
      className="object-cover"
    />
  )
}

/** Los productos del dibujo: tres de la tienda, o los huecos de siempre. */
function huecos(d: DatosDeMiniatura | undefined, cuantos: number) {
  return d
    ? Array.from({ length: 3 }, (_, i) => d.productos[i] ?? null)
    : Array.from({ length: cuantos }, () => undefined)
}

/** El precio en su etiqueta, con el estilo de cada plantilla. */
function Precio({
  producto,
  className,
}: {
  producto: ProductoDeMiniatura | null | undefined
  className?: string
}) {
  if (!producto) return null
  return (
    <span
      className={cn(
        "absolute bottom-[1.5cqw] left-[1.5cqw] max-w-[90%] truncate bg-papel px-[1.2cqw] text-[length:3.5cqw] leading-snug font-bold text-tinta",
        className
      )}
    >
      {producto.precio}
    </span>
  )
}

/** La rebaja real con datos; sin datos, la de muestra en su lugar de siempre. */
function rebajaDe(
  producto: ProductoDeMiniatura | null | undefined,
  indice: number,
  deMuestra: number,
  textoDeMuestra: string
) {
  if (producto === undefined)
    return indice === deMuestra ? textoDeMuestra : null
  return producto?.rebaja ? `−${producto.rebaja}%` : null
}

function DibujoClasico({ d }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-tinta/15 px-3 py-2">
        <Marca
          d={d}
          className="font-titular text-[length:3.438cqw] font-extrabold tracking-[-0.02em]"
        />
        <span className="size-2 rounded-full bg-tinta/30" />
      </div>
      <div className="px-3 pt-4">
        <p className="max-w-[14ch] font-titular text-[length:6.25cqw] leading-[0.98] font-extrabold tracking-[-0.04em]">
          Lo que vendes, a la vista.
        </p>
        <span className="mt-2.5 inline-block rounded-[3px] bg-senal px-2 py-[3px] text-[length:1.875cqw] font-semibold text-white">
          Ver el catálogo
        </span>
      </div>
      <div
        className={cn(
          "mt-4 grid gap-1.5 border-t-2 border-tinta px-3 pt-2.5",
          d ? "grid-cols-3" : "grid-cols-4"
        )}
      >
        {huecos(d, 8).map((producto, i) => (
          <div key={i}>
            <div className="relative aspect-square overflow-hidden border border-tinta/15 bg-tinta/5">
              <Foto src={producto?.foto} />
              <Precio producto={producto} className="rounded-[2px]" />
            </div>
            {d ? null : <div className="mt-1 h-[3px] w-3/4 bg-tinta/40" />}
          </div>
        ))}
      </div>
    </div>
  )
}

function DibujoFashion({ d }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="bg-tinta py-[3px] text-center text-[length:1.562cqw] font-semibold tracking-[0.2em] text-papel uppercase">
        Pedidos por WhatsApp
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-tinta px-2.5 py-1.5">
        <span className="text-[length:1.562cqw] font-semibold tracking-[0.16em] uppercase">
          Catálogo
        </span>
        <Marca
          d={d}
          centrada
          className="font-titular text-[length:3.438cqw] font-semibold tracking-[0.08em] uppercase"
        />
        <span className="size-2 justify-self-end border border-tinta" />
      </div>
      <div className="flex justify-center gap-2.5 border-b border-tinta/15 py-1 text-[length:1.406cqw] font-semibold tracking-[0.14em] uppercase opacity-70">
        <span>Todo</span>
        <span>Ropa</span>
        <span>Calzado</span>
        <span>Carteras</span>
      </div>
      <div
        className={cn(
          "relative flex shrink-0 flex-col justify-end overflow-hidden bg-gradient-to-t from-tinta to-tinta/75 px-2.5 pb-2.5",
          // Con datos, más bajo: arriba van la cinta, la cabecera y el menú, y
          // la fila de productos tiene que entrar entera.
          d ? "h-[26%]" : "h-[42%]"
        )}
      >
        {d?.portada ? (
          <>
            <Foto src={d.portada} />
            <span className="absolute inset-0 bg-gradient-to-t from-tinta/85 to-tinta/10" />
          </>
        ) : null}
        <p
          className={cn(
            "relative font-titular leading-[0.88] font-semibold tracking-[0.02em] text-papel uppercase",
            d ? "text-[length:6cqw]" : "text-[length:7.5cqw]"
          )}
        >
          Nueva
          {d ? " " : <br />}
          temporada
        </p>
        <span className="relative mt-1.5 w-fit bg-papel px-1.5 py-[2px] text-[length:1.562cqw] font-semibold tracking-[0.14em] uppercase">
          Ver la colección
        </span>
      </div>
      <div className="mx-2.5 mt-2 border-b-2 border-tinta pb-[2px] font-titular text-[length:2.812cqw] font-semibold tracking-[0.02em] uppercase">
        Lo nuevo
      </div>
      <div
        className={cn(
          "grid gap-1 px-2.5 pt-1.5",
          d ? "grid-cols-3" : "grid-cols-4"
        )}
      >
        {huecos(d, 4).map((producto, i) => {
          const rebaja = rebajaDe(producto, i, 1, "−20%")
          return (
            <div key={i}>
              <div
                className={cn(
                  "relative overflow-hidden bg-tinta/[0.12]",
                  // Cuadradas con datos: en retrato no entraban y la
                  // etiqueta del precio quedaba fuera del dibujo.
                  d ? "aspect-[5/4]" : "aspect-[3/4]"
                )}
              >
                <Foto src={producto?.foto} />
                {rebaja ? (
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 bg-senal px-[2px] text-white",
                      d ? "text-[length:2.5cqw]" : "text-[length:1.25cqw]"
                    )}
                  >
                    {rebaja}
                  </span>
                ) : null}
                <Precio
                  producto={producto}
                  className="tracking-[0.04em] uppercase"
                />
              </div>
              {d ? null : <div className="mt-1 h-[3px] w-3/4 bg-tinta/45" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DibujoPerfume({ d }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-tinta/10 py-[3px] text-center text-[length:1.562cqw] tracking-[0.28em] uppercase opacity-60">
        Asesoría por WhatsApp
      </div>
      <div className="flex justify-center py-1.5 text-center">
        <Marca
          d={d}
          centrada
          className="font-titular text-[length:4.062cqw] leading-none italic"
        />
      </div>
      <div
        className={cn(
          "flex shrink-0 items-center gap-3 bg-tinta px-4 text-papel",
          d ? "h-[32%]" : "h-[40%]"
        )}
      >
        <div className="flex-1">
          <span className="block h-px w-4 bg-senal-alta" />
          <p className="mt-1.5 font-titular text-[length:5cqw] leading-[1.02] font-medium italic">
            Aromas que se quedan contigo
          </p>
          <span className="mt-2 inline-block rounded-full border border-papel/50 px-2 py-[2px] text-[length:1.406cqw] tracking-[0.2em] uppercase">
            Descubrir
          </span>
        </div>
        <div className="relative h-[78%] w-[26%] overflow-hidden rounded-t-full border border-papel/25 bg-papel/10">
          <Foto src={d?.portada} />
        </div>
      </div>
      <div className="pt-2.5 text-center font-titular text-[length:3.438cqw] leading-none font-medium italic">
        Los favoritos
      </div>
      <span className="mx-auto mt-1.5 block h-px w-3 bg-senal" />
      <div className="grid grid-cols-3 gap-2.5 px-4 pt-2">
        {huecos(d, 3).map((producto, i) => (
          <div key={i} className="text-center">
            <div
              className={cn(
                "relative overflow-hidden bg-tinta/[0.07]",
                d ? "aspect-square" : "aspect-[4/5]"
              )}
            >
              <Foto src={producto?.foto} />
              <span className="absolute inset-[3px] border border-papel/70" />
              <Precio
                producto={producto}
                className="left-1/2 -translate-x-1/2 font-semibold italic"
              />
            </div>
            {d ? null : (
              <>
                <div className="mx-auto mt-1 h-[3px] w-2/3 bg-tinta/35" />
                <div className="mx-auto mt-[2px] h-[2px] w-1/3 bg-tinta/20" />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function DibujoCalle({ d }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex overflow-hidden bg-tinta py-[3px] font-titular text-[length:1.719cqw] whitespace-nowrap text-papel uppercase">
        {[
          "Pedidos por WhatsApp",
          "Buzos",
          "Poleras",
          "Gorras",
          "Pedidos por WhatsApp",
        ].map((frase, i) => (
          <span key={i} className="flex items-center gap-2 pl-2">
            {frase}
            <span className="size-[3px] bg-senal-alta" />
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between border-b-2 border-tinta px-2.5 py-1.5">
        <Marca
          d={d}
          className="font-titular text-[length:3.75cqw] leading-none uppercase"
        />
        <span className="border-2 border-tinta px-1 text-[length:1.406cqw] font-bold uppercase">
          Catálogo
        </span>
      </div>
      <div
        className={cn(
          "grid shrink-0 grid-cols-[1.15fr_1fr] items-center gap-2 px-2.5 py-2",
          d ? "h-[33%]" : "h-[44%]"
        )}
      >
        <div>
          <p className="font-titular text-[length:8.75cqw] leading-[0.84] uppercase">
            Drop
            <br />
            nuevo
          </p>
          <span className="mt-1.5 inline-block bg-tinta px-1.5 py-[2px] text-[length:1.406cqw] font-bold text-papel uppercase">
            Ver lo nuevo
          </span>
        </div>
        <div className="relative h-full border-2 border-tinta bg-tinta/15">
          <span className="absolute inset-0 overflow-hidden">
            <Foto src={d?.portada} />
          </span>
          <span className="absolute -bottom-1 -left-1.5 -rotate-3 border border-tinta bg-senal px-1 font-titular text-[length:1.562cqw] text-white uppercase">
            Por WhatsApp
          </span>
        </div>
      </div>
      <div className="mx-2.5 border-t-[3px] border-tinta pt-[2px] font-titular text-[length:3.125cqw] leading-none uppercase">
        Lo nuevo
      </div>
      <div className="grid grid-cols-3 gap-1.5 px-2.5 pt-1.5">
        {huecos(d, 3).map((producto, i) => {
          const rebaja = rebajaDe(producto, i, 1, "−20%")
          return (
            <div key={i} className="border-2 border-tinta">
              <div
                className={cn(
                  "relative aspect-square overflow-hidden bg-tinta/[0.12]",
                  !d && "border-b-2 border-tinta"
                )}
              >
                <Foto src={producto?.foto} />
                {rebaja ? (
                  <span
                    className={cn(
                      "absolute top-0.5 right-0.5 -rotate-6 bg-senal px-[2px] font-titular text-white",
                      d ? "text-[length:2.5cqw]" : "text-[length:1.406cqw]"
                    )}
                  >
                    {rebaja}
                  </span>
                ) : null}
                <Precio
                  producto={producto}
                  className="border-2 border-tinta font-titular font-normal uppercase"
                />
              </div>
              {d ? null : <div className="m-[3px] h-[3px] w-2/3 bg-tinta/50" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DibujoAtelier({ d }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b-[3px] border-double border-tinta/40 px-3 py-1.5">
        <Marca
          d={d}
          className="font-titular text-[length:3.75cqw] leading-none font-medium italic"
        />
        <span className="text-[length:1.406cqw] tracking-[0.22em] uppercase opacity-70">
          Colección
        </span>
      </div>
      <div className="flex gap-3 px-3 py-[3px] text-[length:1.25cqw] tracking-[0.22em] uppercase opacity-70">
        <span className="text-senal">Todo</span>
        <span>Carteras</span>
        <span>Billeteras</span>
      </div>
      <div
        className={cn(
          "grid shrink-0 grid-cols-[1fr_1.1fr] items-end gap-3 px-3 pt-1.5",
          d ? "h-[33%]" : "h-[44%]"
        )}
      >
        <div className="pb-1">
          <p className="font-titular text-[length:6.25cqw] leading-[0.95] font-medium tracking-[-0.03em]">
            Piezas para todos los días
          </p>
          <span className="mt-2 inline-block rounded-[3px] bg-tinta px-2 py-[2px] text-[length:1.25cqw] tracking-[0.2em] text-papel uppercase">
            Ver la colección
          </span>
        </div>
        <div className="relative h-full overflow-hidden bg-tinta/[0.06] p-2.5">
          {d?.portada ? (
            <Foto src={d.portada} />
          ) : (
            <div className="mx-auto mt-[22%] h-[52%] w-[70%] rounded-t-[40%] rounded-b-md bg-senal/80" />
          )}
          <span className="absolute inset-1 border border-tinta/20" />
        </div>
      </div>
      <div className="mt-2.5 flex items-end gap-2 px-3">
        <span className="font-titular text-[length:3.125cqw] leading-none font-medium tracking-[-0.03em]">
          La colección
        </span>
        <span className="mb-[3px] h-px flex-1 bg-tinta/30" />
      </div>
      <div className="grid grid-cols-3 gap-2.5 px-3 pt-1.5">
        {huecos(d, 3).map((producto, i) => (
          <div key={i} className="text-center">
            <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-tinta/[0.06]">
              {producto === undefined ? (
                <div className="h-[46%] w-[58%] rounded-t-[40%] rounded-b-sm bg-tinta/25" />
              ) : (
                <>
                  <Foto src={producto?.foto} />
                  <Precio
                    producto={producto}
                    className="left-1/2 -translate-x-1/2 font-medium tracking-[0.02em]"
                  />
                </>
              )}
            </div>
            {d ? null : (
              <div className="mx-auto mt-1 h-[3px] w-2/3 bg-tinta/40" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function DibujoPisada({ d }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between bg-tinta px-2.5 py-1.5 text-papel">
        <Marca
          d={d}
          className="font-titular text-[length:3.75cqw] leading-none font-extrabold uppercase italic"
        />
        <span className="size-2 rounded-full border border-papel" />
      </div>
      <div className="flex gap-1 px-2.5 py-1">
        {["Todo", "Urbanas", "Running", "Botas"].map((ficha, i) => (
          <span
            key={ficha}
            className={cn(
              "rounded-full border px-1.5 py-[1px] text-[length:1.25cqw] font-bold uppercase",
              i === 0 ? "border-tinta bg-tinta text-papel" : "border-tinta/20"
            )}
          >
            {ficha}
          </span>
        ))}
      </div>
      <div className="mx-2 grid grid-cols-[1.05fr_1fr] items-center gap-2 overflow-hidden rounded-[0.6rem] bg-tinta p-2 text-papel">
        <div>
          <p className="font-titular text-[length:7.5cqw] leading-[0.84] font-extrabold uppercase italic">
            Nuevos
            <br />
            pares
          </p>
          <span className="mt-1.5 inline-block rounded-full bg-senal px-1.5 py-[2px] text-[length:1.25cqw] font-bold text-white uppercase">
            Ver los modelos
          </span>
        </div>
        <div
          className={cn(
            "relative overflow-hidden rounded-[0.45rem] bg-papel/15",
            d ? "aspect-[5/3]" : "aspect-square"
          )}
        >
          <Foto src={d?.portada} />
        </div>
      </div>
      <div className="mx-2.5 mt-2 flex items-center font-titular text-[length:3.125cqw] leading-none font-extrabold uppercase italic">
        <span className="mr-1 inline-block h-[0.72em] w-[0.28em] -skew-x-[14deg] bg-senal" />
        Modelos
      </div>
      <div
        className={cn(
          "grid gap-1 px-2.5 pt-1.5",
          d ? "grid-cols-3" : "grid-cols-4"
        )}
      >
        {huecos(d, 4).map((producto, i) => {
          const rebaja = rebajaDe(producto, i, 2, "−15%")
          return (
            <div key={i}>
              <div className="relative aspect-square overflow-hidden rounded-[0.35rem] bg-tinta/[0.08]">
                <Foto src={producto?.foto} />
                {rebaja ? (
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 rounded-full bg-senal px-[3px] text-white",
                      d ? "text-[length:2.5cqw]" : "text-[length:1.25cqw]"
                    )}
                  >
                    {rebaja}
                  </span>
                ) : null}
                <Precio
                  producto={producto}
                  className="rounded-full font-extrabold italic"
                />
              </div>
              {d ? null : <div className="mt-1 h-[3px] w-3/4 bg-tinta/50" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DibujoFormula({ d }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-tinta px-3 py-1.5">
        <Marca
          d={d}
          className="font-titular text-[length:3.75cqw] leading-none"
        />
        <span className="font-mono text-[length:1.406cqw] uppercase">
          Catálogo
        </span>
      </div>
      <div className="grid grid-cols-[1.25fr_1fr] border-b border-tinta">
        <div className="border-r border-tinta px-3 py-2">
          <p className="flex justify-between font-mono text-[length:1.25cqw] uppercase opacity-70">
            <span className="max-w-[60%] truncate">
              {d?.nombre ?? "Tu tienda"}
            </span>
            <span>12 frascos</span>
          </p>
          <p className="mt-2 font-titular text-[length:7.5cqw] leading-[0.88] tracking-[-0.03em]">
            Aromas de autor
          </p>
          <span className="mt-2 inline-block bg-tinta px-1.5 py-[2px] font-mono text-[length:1.25cqw] text-papel uppercase">
            Ver los frascos
          </span>
        </div>
        <div className="relative m-1.5 overflow-hidden bg-tinta/[0.1]">
          <Foto src={d?.portada} />
          <span className="absolute bottom-1 left-1 border border-tinta bg-papel px-1 font-mono text-[length:1.094cqw] uppercase">
            Te asesoramos
          </span>
        </div>
      </div>
      <div className="mx-3 mt-2 border-b border-tinta pb-[2px] font-titular text-[length:3.125cqw] leading-none">
        Frascos
      </div>
      <div className="grid grid-cols-3 gap-2 px-3 pt-1.5">
        {(d ? huecos(d, 3) : (["Amaderado", "Cítrico", "Floral"] as const)).map(
          (item, i) => {
            const producto = typeof item === "string" ? undefined : item
            return (
              <div key={i}>
                <div
                  className={cn(
                    "relative overflow-hidden bg-tinta/[0.08]",
                    // Con datos, más altas: en 4:3 dejaban un hueco vacío abajo.
                    d ? "aspect-square" : "aspect-[4/3]"
                  )}
                >
                  <Foto src={producto?.foto} />
                </div>
                <div className="relative mx-1 -mt-1.5 border border-tinta bg-papel px-1 py-[2px]">
                  {typeof item === "string" ? (
                    <>
                      <div className="font-mono text-[length:1.094cqw] uppercase opacity-70">
                        {item}
                      </div>
                      <div className="mt-[2px] h-[3px] w-2/3 bg-tinta/50" />
                    </>
                  ) : producto ? (
                    <div className="truncate font-mono text-[length:3.5cqw] leading-tight font-bold">
                      {producto.precio}
                    </div>
                  ) : (
                    <div className="h-[3.5cqw]" />
                  )}
                </div>
              </div>
            )
          }
        )}
      </div>
    </div>
  )
}

function DibujoBazar({ d }: Props) {
  const collage = d
    ? [
        d.productos[1]?.foto ?? null,
        d.portada ?? d.productos[0]?.foto ?? null,
        d.productos[2]?.foto ?? null,
      ]
    : [null, null, null]
  return (
    <div className="flex h-full flex-col">
      <div className="bg-senal py-[3px] text-center text-[length:1.406cqw] font-semibold text-white">
        Arma tu pedido y envíanoslo por WhatsApp
      </div>
      <div className="flex items-center gap-2 border-b-2 border-tinta/10 px-2.5 py-1.5">
        <Marca
          d={d}
          className="font-titular text-[length:3.75cqw] leading-none font-extrabold tracking-[-0.03em]"
        />
        <span className="ml-auto h-3 w-[38%] shrink-0 rounded-full bg-tinta/[0.08]" />
      </div>
      <div className="grid grid-cols-[1.1fr_1fr] items-center gap-2 px-2.5 py-2">
        <div>
          <p className="font-titular text-[length:6.875cqw] leading-[0.92] font-extrabold tracking-[-0.03em]">
            De todo un poco
          </p>
          <span className="mt-1.5 inline-block rounded-full bg-tinta px-2 py-[2px] text-[length:1.406cqw] font-semibold text-papel">
            Ver todo lo que hay
          </span>
        </div>
        <div className={cn("relative", d ? "aspect-[2/1]" : "aspect-[5/4]")}>
          <span className="absolute top-0 right-0 h-[54%] w-[40%] rotate-6 overflow-hidden rounded-[0.4rem] border-2 border-papel bg-tinta/20">
            <Foto src={collage[0]} />
          </span>
          <span className="absolute top-[4%] left-[14%] h-[78%] w-[56%] -rotate-3 overflow-hidden rounded-[0.4rem] border-2 border-papel bg-tinta/30">
            <Foto src={collage[1]} />
          </span>
          <span className="absolute bottom-0 left-0 h-[44%] w-[34%] -rotate-6 overflow-hidden rounded-[0.4rem] border-2 border-papel bg-senal/70">
            <Foto src={collage[2]} />
          </span>
        </div>
      </div>
      <div
        className={cn(
          "grid gap-1 px-2.5 pt-0.5",
          d ? "grid-cols-3" : "grid-cols-4"
        )}
      >
        {huecos(d, 4).map((producto, i) => (
          <div
            key={i}
            className="rounded-[0.35rem] border border-tinta/10 p-[2px]"
          >
            <div className="relative aspect-square overflow-hidden rounded-[0.25rem] bg-tinta/[0.08]">
              <Foto src={producto?.foto} />
              {producto === undefined ? (
                <span
                  className={cn(
                    "absolute right-0.5 bottom-0.5 -rotate-6 rounded-full px-[3px] font-titular text-[length:1.25cqw] leading-tight font-extrabold",
                    i === 1
                      ? "bg-senal text-white"
                      : "border border-tinta bg-papel"
                  )}
                >
                  Bs 45
                </span>
              ) : producto ? (
                <span
                  className={cn(
                    "absolute right-[1.5cqw] bottom-[1.5cqw] max-w-[90%] -rotate-6 truncate rounded-full px-[1.2cqw] font-titular text-[length:3.5cqw] leading-snug font-extrabold",
                    producto.rebaja
                      ? "bg-senal text-white"
                      : "border border-tinta bg-papel"
                  )}
                >
                  {producto.precio}
                </span>
              ) : null}
            </div>
            {d ? null : <div className="mt-[3px] h-[3px] w-3/4 bg-tinta/45" />}
          </div>
        ))}
      </div>
    </div>
  )
}

const DIBUJOS: Record<ClavePlantilla, (props: Props) => React.JSX.Element> = {
  clasica: DibujoClasico,
  fashion: DibujoFashion,
  perfume: DibujoPerfume,
  calle: DibujoCalle,
  atelier: DibujoAtelier,
  pisada: DibujoPisada,
  formula: DibujoFormula,
  bazar: DibujoBazar,
}
