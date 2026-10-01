"use client"

import * as React from "react"
import { ArrowLeft, ChevronRight, Gift, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  elegidos,
  precioSuelto,
  productosDelPack,
  type DatosDelCatalogo,
} from "@/lib/catalogos/datos"
import type { Catalogo, Pack } from "@/lib/catalogos/modelo"
import {
  agregarPack,
  cambiarPack,
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

/*
 * Los packs: varios productos con un precio juntos.
 *
 * El precio del pack se muestra en el catálogo y nada más: la tienda online
 * cobra cada producto por separado. Quien quiere el pack escribe por WhatsApp
 * y la venta se arma desde ahí, como hoy.
 */

const TOPE_DE_PACKS = 12

export function PanelDePacks({
  catalogo,
  datos,
  alCambiar,
}: {
  catalogo: Catalogo
  datos: DatosDelCatalogo
  alCambiar: (catalogo: Catalogo) => void
}) {
  const [abierto, setAbierto] = React.useState<string | null>(null)
  const pack = catalogo.packs.find((otro) => otro.id === abierto)
  const productos = elegidos(catalogo, datos)

  if (pack) {
    return (
      <EditorDePack
        key={pack.id}
        pack={pack}
        catalogo={catalogo}
        datos={datos}
        alCambiar={alCambiar}
        alVolver={() => setAbierto(null)}
      />
    )
  }

  function armar() {
    const precios = Object.fromEntries(
      Object.values(datos.productos).map((p) => [p.id, p.precioCents])
    )
    const resultado = agregarPack(catalogo, precios)
    alCambiar(resultado.catalogo)
    setAbierto(resultado.pack.id)
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-5 sm:px-5">
        <Aviso>
          El precio del pack se ve en el catálogo. En tu tienda online cada
          producto se sigue cobrando por separado: quien quiere el pack te
          escribe por WhatsApp.
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
                  <Gift aria-hidden="true" className="size-5 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {otro.nombre}
                    </span>
                    <span className="tabular block text-xs opacity-65">
                      {suyos.length} productos · {formatMoney(otro.precioCents)}
                      {ahorro > 0 ? ` · ahorran ${formatMoney(ahorro)}` : ""}
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
          Armar un pack
        </button>
        {productos.length < 2 ? (
          <p className="mt-2 text-xs leading-relaxed opacity-65">
            Un pack junta al menos dos productos del catálogo: elige otro más.
          </p>
        ) : null}
      </div>
    </div>
  )
}

function EditorDePack({
  pack,
  catalogo,
  datos,
  alCambiar,
  alVolver,
}: {
  pack: Pack
  catalogo: Catalogo
  datos: DatosDelCatalogo
  alCambiar: (catalogo: Catalogo) => void
  alVolver: () => void
}) {
  const productos = elegidos(catalogo, datos)
  const suyos = productosDelPack(pack, datos)
  const suelto = precioSuelto(suyos)
  const ahorro = suelto - pack.precioCents
  const marcados = new Set(pack.productos)
  const cambiar = (nuevo: Pack) => alCambiar(cambiarPack(catalogo, nuevo))

  function quitar() {
    const antes = catalogo
    alCambiar(quitarPack(catalogo, pack.id))
    alVolver()
    toast(`Quitaste el pack «${pack.nombre}» y sus hojas.`, {
      action: { label: "Deshacer", onClick: () => alCambiar(antes) },
    })
  }

  function alternar(id: string) {
    if (marcados.has(id)) {
      if (pack.productos.length <= 2) {
        toast.error("Un pack lleva al menos dos productos.")
        return
      }
      cambiar({
        ...pack,
        productos: pack.productos.filter((otro) => otro !== id),
      })
    } else {
      if (pack.productos.length >= 8) {
        toast.error("Un pack lleva hasta ocho productos.")
        return
      }
      cambiar({ ...pack, productos: [...pack.productos, id] })
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
          Todos los packs
        </button>
        <button
          type="button"
          aria-label="Quitar este pack"
          onClick={quitar}
          className="flex size-11 items-center justify-center opacity-70 transition-opacity hover:text-senal hover:opacity-100"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </button>
      </div>

      <div className="flex flex-col gap-6 px-4 py-5 sm:px-5">
        <CampoTexto
          id={`${pack.id}-nombre`}
          etiqueta="Nombre del pack"
          valor={pack.nombre}
          maximo={60}
          placeholder="Combo de la semana"
          alCambiar={(nombre) => cambiar({ ...pack, nombre })}
        />

        <fieldset className="min-w-0">
          <legend className={ETIQUETA}>Qué lleva · de 2 a 8</legend>
          <ul className="mt-2 border-y border-tinta/15">
            {productos.map((producto) => {
              const marcado = marcados.has(producto.id)
              return (
                <li
                  key={producto.id}
                  className="border-t border-tinta/15 first:border-t-0"
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={marcado}
                    onClick={() => alternar(producto.id)}
                    className="flex min-h-11 w-full items-center gap-3 text-left text-sm"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-4 shrink-0 border-2",
                        marcado ? "border-tinta bg-tinta" : "border-tinta/40"
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {producto.nombre}
                    </span>
                    <span className="tabular text-xs opacity-65">
                      {formatMoney(producto.precioCents)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </fieldset>

        <div>
          <label htmlFor={`${pack.id}-precio`} className={ETIQUETA}>
            Precio del pack
          </label>
          <div className="mt-1 flex items-center gap-2 border-b border-tinta/40 focus-within:border-senal">
            <span className="text-base opacity-65">{CURRENCY_SYMBOL}</span>
            <input
              id={`${pack.id}-precio`}
              inputMode="numeric"
              value={String(Math.round(pack.precioCents / 100))}
              onChange={(evento) => {
                const bolivianos = Number(
                  evento.target.value.replace(/\D/g, "")
                )
                cambiar({
                  ...pack,
                  precioCents: Math.min(bolivianos, 1_000_000) * 100,
                })
              }}
              className="tabular h-11 min-w-0 flex-1 border-0 bg-transparent text-base focus-visible:outline-none"
            />
          </div>
          <p
            className={cn(
              "tabular mt-1.5 text-xs leading-relaxed",
              ahorro > 0 ? "opacity-70" : "text-senal"
            )}
          >
            Por separado cuestan {formatMoney(suelto)}.{" "}
            {ahorro > 0
              ? `Quien lo compra ahorra ${formatMoney(ahorro)}.`
              : "El pack cuesta igual o más: así no conviene."}
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
      </div>
    </div>
  )
}
