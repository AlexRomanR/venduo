"use client"

import Image from "next/image"
import Link from "next/link"
import { ImageOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { useEditor } from "@/components/editor/contexto"
import {
  Aviso,
  EncabezadoDePaso,
  Grupo,
  SiguientePaso,
} from "@/components/editor/piezas"

/**
 * Paso 4: la ficha de producto. No tiene nada propio que ajustar —toma la
 * marca y la foto del catálogo—, y eso se dice: la persona tiene que ver que
 * sus cambios llegaron hasta acá, no buscar un control que no existe.
 */
export function PasoProducto() {
  const { productos, productoId, setProductoId, irAPaso } = useEditor()

  return (
    <>
      <EncabezadoDePaso
        numero={4}
        titulo="Ficha de producto"
        bajada="Lo que ve tu cliente al tocar un producto. Toma tus colores, tu letra y la forma de tus botones."
      />

      {productos.length === 0 ? (
        <div className="px-5 pb-5">
          <Aviso>
            Todavía no cargaste productos.{" "}
            <Link
              href="/panel/productos/nuevo"
              className="font-semibold underline underline-offset-4"
            >
              Carga el primero
            </Link>{" "}
            y vuelve para ver su ficha.
          </Aviso>
        </div>
      ) : (
        <Grupo titulo="Mirar con" ayuda="Elige con qué producto ver la ficha.">
          <ul
            role="radiogroup"
            aria-label="Producto para la vista previa"
            className="max-h-80 overflow-y-auto border-t border-tinta/15"
          >
            {productos.slice(0, 40).map((producto) => {
              const elegido = producto.id === productoId
              return (
                <li key={producto.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={elegido}
                    onClick={() => setProductoId(producto.id)}
                    className={cn(
                      "flex min-h-14 w-full items-center gap-3 border-b border-tinta/15 px-1 text-left transition-colors",
                      elegido ? "bg-tinta/[0.06]" : "hover:bg-tinta/[0.03]"
                    )}
                  >
                    <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden bg-tinta/[0.06]">
                      {producto.foto ? (
                        <Image
                          src={producto.foto}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <ImageOff
                          aria-hidden="true"
                          className="size-4 opacity-35"
                        />
                      )}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-sm",
                        elegido && "font-semibold"
                      )}
                    >
                      {producto.nombre}
                    </span>
                    {elegido ? (
                      <span className="size-2 shrink-0 rounded-full bg-senal" />
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </Grupo>
      )}

      <Grupo titulo="De dónde sale lo que ves">
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            Colores, letra y botones:{" "}
            <button
              type="button"
              onClick={() => irAPaso("marca")}
              className="min-h-11 font-semibold underline underline-offset-4 hover:text-senal"
            >
              Tu marca
            </button>
          </li>
          <li>
            La forma de las fotos:{" "}
            <button
              type="button"
              onClick={() => irAPaso("catalogo")}
              className="min-h-11 font-semibold underline underline-offset-4 hover:text-senal"
            >
              Catálogo
            </button>
          </li>
          <li className="opacity-70">
            El nombre, el precio y las fotos de cada producto se cambian en
            Productos, en tu panel.
          </li>
        </ul>
      </Grupo>

      <SiguientePaso nombre="Carrito" alIr={() => irAPaso("carrito")} />
    </>
  )
}
