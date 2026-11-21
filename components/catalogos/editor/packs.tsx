"use client"

import * as React from "react"
import Image from "next/image"
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Gift,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import {
  agotadosDe,
  elegidos,
  preciosDe,
  precioSuelto,
  productosDelPack,
  type DatosDelCatalogo,
  type ProductoDelCatalogo,
} from "@/lib/catalogos/datos"
import type { Catalogo, Pack } from "@/lib/catalogos/modelo"
import {
  agregarPack,
  cambiarPack,
  ponerDescuentoAlPack,
  ponerPrecioAlPack,
  ponerProductosAlPack,
  quitarPack,
} from "@/lib/catalogos/operaciones"
import { CURRENCY_SYMBOL, formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Aviso } from "@/components/editor/piezas"
import {
  CampoArea,
  CampoTexto,
  ETIQUETA,
} from "@/components/catalogos/editor/campos"
import { ProductoConFoto } from "@/components/catalogos/editor/selector"

/*
 * Los combos: varios productos con un precio juntos.
 *
 * El precio del combo es el que se cobra: el PDF guardado lleva "Pedir este
 * combo", que abre su página en la tienda, y `create_order` lee el precio del
 * catálogo guardado. Lo que se cambia acá vale desde que se guarda.
 */

const TOPE_DE_PACKS = 12

export function PanelDePacks({
  catalogo,
  datos,
  alCambiar,
  alMostrar,
  alIrA,
  abrir,
}: {
  catalogo: Catalogo
  datos: DatosDelCatalogo
  alCambiar: (catalogo: Catalogo) => void
  /** Lleva la vista previa a la hoja del combo que se edita. */
  alMostrar: (pack: string | null) => void
  alIrA: (panel: "productos") => void
  /** Un combo que hay que abrir desde afuera: el que no tiene precio. */
  abrir?: { id: string; vez: number } | null
}) {
  const [abierto, setAbierto] = React.useState<string | null>(abrir?.id ?? null)
  React.useEffect(() => {
    if (abrir) setAbierto(abrir.id)
  }, [abrir])
  const pack = catalogo.packs.find((otro) => otro.id === abierto)
  const productos = elegidos(catalogo, datos)

  // Cuando la hoja ya existe: la de un combo recién armado llega con él.
  React.useEffect(() => {
    if (abierto) alMostrar(abierto)
  }, [abierto, alMostrar])

  if (pack) {
    return (
      <EditorDePack
        key={pack.id}
        pack={pack}
        catalogo={catalogo}
        datos={datos}
        alCambiar={alCambiar}
        enfocarPrecio={abrir?.id === pack.id}
        alVolver={() => {
          setAbierto(null)
          alMostrar(null)
        }}
      />
    )
  }

  function armar() {
    const resultado = agregarPack(catalogo, preciosDe(datos), agotadosDe(datos))
    alCambiar(resultado.catalogo)
    setAbierto(resultado.pack.id)
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-5 sm:px-5">
        <Aviso>
          Cada combo lleva «Pedir este combo» en el catálogo: quien te compra lo
          suma a su carrito a este precio. Los cambios valen desde que guardas.
        </Aviso>
      </div>

      {catalogo.packs.length > 0 ? (
        <ul className="mt-5 border-t border-tinta/15">
          {catalogo.packs.map((otro) => {
            const suyos = productosDelPack(otro, datos)
            const ahorro = precioSuelto(suyos) - otro.precioCents
            return (
              <li
                key={otro.id}
                className="border-t border-tinta/15 first:border-t-0"
              >
                <button
                  type="button"
                  onClick={() => setAbierto(otro.id)}
                  className="flex min-h-16 w-full items-center gap-3 px-4 py-2 text-left sm:px-5"
                >
                  <FotosDelCombo productos={suyos} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {otro.nombre}
                    </span>
                    <span className="tabular block text-xs opacity-65">
                      {suyos.length}{" "}
                      {suyos.length === 1 ? "producto" : "productos"} ·{" "}
                      {otro.precioCents > 0
                        ? formatMoney(otro.precioCents)
                        : "sin precio"}
                      {otro.precioCents > 0 && ahorro > 0
                        ? ` · ahorran ${formatMoney(ahorro)}`
                        : ""}
                    </span>
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className="size-4 opacity-45"
                  />
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}

      <div className="px-4 py-5 sm:px-5">
        <button
          type="button"
          onClick={armar}
          disabled={
            productos.length < 2 || catalogo.packs.length >= TOPE_DE_PACKS
          }
          className="flex min-h-12 w-full items-center justify-center gap-2 border-2 border-dashed border-tinta/40 font-semibold transition-colors hover:border-tinta hover:bg-tinta/[0.03] disabled:opacity-50"
        >
          <Plus aria-hidden="true" className="size-5" />
          Armar un combo
        </button>
        {productos.length < 2 ? (
          <div className="mt-2 text-sm leading-relaxed">
            <p className="opacity-70">
              Un combo junta al menos dos productos del catálogo.
            </p>
            <button
              type="button"
              onClick={() => alIrA("productos")}
              className="min-h-11 font-semibold underline underline-offset-4 hover:opacity-60"
            >
              Elegir más productos
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

/** Las primeras fotos del combo, una sobre otra. */
function FotosDelCombo({ productos }: { productos: ProductoDelCatalogo[] }) {
  const conFoto = productos.filter((producto) => producto.foto).slice(0, 3)
  if (conFoto.length === 0) {
    return <Gift aria-hidden="true" className="size-5 shrink-0" />
  }
  return (
    <span aria-hidden="true" className="flex shrink-0 -space-x-3">
      {conFoto.map((producto) => (
        <span
          key={producto.id}
          className="relative size-10 overflow-hidden rounded-[10px] border-2 border-papel bg-tinta/[0.05]"
        >
          <Image
            src={producto.foto as string}
            alt=""
            fill
            sizes="40px"
            className="object-cover"
          />
        </span>
      ))}
    </span>
  )
}

function EditorDePack({
  pack,
  catalogo,
  datos,
  alCambiar,
  enfocarPrecio = false,
  alVolver,
}: {
  pack: Pack
  catalogo: Catalogo
  datos: DatosDelCatalogo
  alCambiar: (catalogo: Catalogo) => void
  /** Llega desde un aviso de "ponle precio": el campo, listo para escribir. */
  enfocarPrecio?: boolean
  alVolver: () => void
}) {
  const productos = elegidos(catalogo, datos)
  const precio = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    if (!enfocarPrecio || pack.precioCents > 0) return
    precio.current?.scrollIntoView({ block: "center" })
    precio.current?.focus({ preventScroll: true })
    // Solo al abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const suyos = productosDelPack(pack, datos)
  const suelto = precioSuelto(suyos)
  const ahorro = suelto - pack.precioCents
  const marcados = new Set(pack.productos)
  const agotados = suyos.filter((producto) => producto.stock <= 0)
  const cambiar = (nuevo: Pack) => alCambiar(cambiarPack(catalogo, nuevo))

  function quitar() {
    const antes = catalogo
    alCambiar(quitarPack(catalogo, pack.id))
    alVolver()
    toast(`Quitaste el combo «${pack.nombre}» y sus hojas.`, {
      action: { label: "Deshacer", onClick: () => alCambiar(antes) },
    })
  }

  function alternar(id: string) {
    if (marcados.has(id)) {
      if (pack.productos.length <= 2) {
        toast.error("Un combo lleva al menos dos productos.")
        return
      }
      cambiar(
        ponerProductosAlPack(
          pack,
          pack.productos.filter((otro) => otro !== id),
          preciosDe(datos)
        )
      )
    } else {
      if (pack.productos.length >= 8) {
        toast.error("Un combo lleva hasta ocho productos.")
        return
      }
      cambiar(
        ponerProductosAlPack(pack, [...pack.productos, id], preciosDe(datos))
      )
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-tinta/15 px-2 py-1">
        <button
          type="button"
          onClick={alVolver}
          className="flex min-h-11 items-center gap-2 px-2 text-sm font-semibold"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Todos los combos
        </button>
        <button
          type="button"
          aria-label="Quitar este combo"
          onClick={quitar}
          className="flex size-11 items-center justify-center opacity-70 transition-opacity hover:opacity-100"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </button>
      </div>

      <div className="flex flex-col gap-6 px-4 py-5 sm:px-5">
        <CampoTexto
          id={`${pack.id}-nombre`}
          etiqueta="Nombre del combo"
          valor={pack.nombre}
          maximo={60}
          placeholder="Combo de la semana"
          alCambiar={(nombre) => cambiar({ ...pack, nombre })}
        />

        <fieldset className="min-w-0">
          <legend className={ETIQUETA}>Qué lleva · de 2 a 8</legend>
          <ul className="mt-2 grid grid-cols-3 gap-2">
            {productos.map((producto) => (
              <li key={producto.id}>
                <ProductoConFoto
                  producto={producto}
                  marcado={marcados.has(producto.id)}
                  sizes="(min-width: 1024px) 7rem, 33vw"
                  alTocar={() => alternar(producto.id)}
                />
              </li>
            ))}
          </ul>
          {agotados.length > 0 ? (
            <Aviso className="mt-3">
              {agotados.length === 1
                ? `«${agotados[0].nombre}» está agotado.`
                : `${agotados.length} productos de este combo están agotados.`}{" "}
              Revisa si quieres ofrecerlo así.
            </Aviso>
          ) : null}
        </fieldset>

        {/* El descuento y el precio, uno al lado del otro: cambiar uno
            mueve el otro. Con descuento, el precio sigue a los productos;
            escrito a mano, queda fijo. */}
        <div>
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4">
            <div>
              <label htmlFor={`${pack.id}-descuento`} className={ETIQUETA}>
                Descuento
              </label>
              <div className="mt-1 flex items-center gap-2 border-b border-tinta/40 focus-within:border-tinta focus-within:bg-tinta/[0.04]">
                <input
                  id={`${pack.id}-descuento`}
                  inputMode="numeric"
                  value={
                    pack.descuentoBps != null
                      ? String(Math.round(pack.descuentoBps / 100))
                      : ""
                  }
                  placeholder={
                    suelto > 0 && pack.precioCents > 0
                      ? String(
                          Math.max(
                            Math.round((1 - pack.precioCents / suelto) * 100),
                            0
                          )
                        )
                      : "10"
                  }
                  onChange={(evento) => {
                    const porcentaje = Number(
                      evento.target.value.replace(/\D/g, "").slice(0, 2)
                    )
                    cambiar(
                      ponerDescuentoAlPack(
                        pack,
                        porcentaje * 100,
                        preciosDe(datos)
                      )
                    )
                  }}
                  className="tabular h-11 min-w-0 flex-1 border-0 bg-transparent text-base placeholder:text-tinta/65 focus-visible:outline-none"
                />
                <span className="text-base opacity-65">%</span>
              </div>
            </div>
            <div>
              <label htmlFor={`${pack.id}-precio`} className={ETIQUETA}>
                Precio del combo
              </label>
              <div className="mt-1 flex items-center gap-2 border-b border-tinta/40 focus-within:border-tinta focus-within:bg-tinta/[0.04]">
                <span className="text-base opacity-65">{CURRENCY_SYMBOL}</span>
                <input
                  ref={precio}
                  id={`${pack.id}-precio`}
                  inputMode="numeric"
                  // Vacío y no "0": borrar el precio para escribir otro.
                  value={
                    pack.precioCents === 0
                      ? ""
                      : String(Math.round(pack.precioCents / 100))
                  }
                  placeholder="0"
                  onChange={(evento) => {
                    const bolivianos = Number(
                      evento.target.value.replace(/\D/g, "")
                    )
                    cambiar(
                      ponerPrecioAlPack(
                        pack,
                        Math.min(bolivianos, 1_000_000) * 100
                      )
                    )
                  }}
                  className="tabular h-11 min-w-0 flex-1 border-0 bg-transparent text-base placeholder:text-tinta/65 focus-visible:outline-none"
                />
              </div>
            </div>
          </div>
          <p
            className={cn(
              "tabular mt-1.5 text-xs leading-relaxed",
              pack.precioCents > 0 && ahorro > 0 ? "opacity-70" : "text-senal"
            )}
          >
            Por separado cuestan {formatMoney(suelto)}.{" "}
            {pack.precioCents <= 0
              ? "Ponle el precio del combo."
              : ahorro > 0
                ? `Quien lo compra ahorra ${formatMoney(ahorro)}.`
                : "El combo cuesta igual o más: así no conviene."}
            {pack.precioCents <= 0
              ? ""
              : pack.descuentoBps != null
                ? " Se actualiza solo al sumar o quitar productos."
                : " Precio a mano: no cambia al sumar productos. Pon un descuento para que se actualice solo."}
          </p>
        </div>

        <CampoArea
          id={`${pack.id}-nota`}
          etiqueta="Una línea para venderlo"
          valor={pack.nota}
          maximo={160}
          filas={2}
          placeholder="Llévalos juntos y ahorra."
          alCambiar={(nota) => cambiar({ ...pack, nota })}
        />

        {/* Un cierre, como "Listo" en la portada de la tienda: sin esto, para
            terminar había que adivinar que se volvía con la flecha. */}
        <button
          type="button"
          onClick={() => {
            alVolver()
            toast.success(`Combo «${pack.nombre || "sin nombre"}» listo.`, {
              description: "Se guarda junto con el catálogo.",
            })
          }}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-plantilla border-2 border-tinta font-semibold transition-colors hover:bg-tinta hover:text-papel"
        >
          <Check aria-hidden="true" className="size-5" />
          Listo
        </button>
      </div>
    </div>
  )
}
