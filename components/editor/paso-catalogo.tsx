"use client"

import Link from "next/link"

import { useEditor } from "@/components/editor/contexto"
import {
  Aviso,
  EncabezadoDePaso,
  Grupo,
  Opciones,
  SiguientePaso,
} from "@/components/editor/piezas"

/** Un rectángulo con la proporción de la foto, para elegir sin leer. */
function Proporcion({ ancho, alto }: { ancho: number; alto: number }) {
  return (
    <span
      aria-hidden="true"
      className="block border-2 border-current"
      style={{ width: ancho, height: alto }}
    />
  )
}

/** Unas columnas dibujadas, para elegir cuántas sin contar. */
function Columnas({ cantidad }: { cantidad: number }) {
  return (
    <span aria-hidden="true" className="flex h-7 w-14 gap-[3px]">
      {Array.from({ length: cantidad }, (_, indice) => (
        <span key={indice} className="flex-1 bg-current opacity-80" />
      ))}
    </span>
  )
}

/**
 * Paso 3: cómo se muestran los productos en el catálogo y en las vitrinas de
 * la portada.
 */
export function PasoCatalogo() {
  const { borrador, apariencia, irAPaso, productos } = useEditor()

  return (
    <>
      <EncabezadoDePaso
        numero={3}
        titulo="Catálogo"
        bajada="Cómo se ven tus productos en la lista completa y en las vitrinas de tu portada."
      />

      <Grupo
        titulo="Foto de los productos"
        ayuda="Vertical luce la ropa puesta; cuadrada ordena mejor objetos y cajas."
      >
        <Opciones
          etiqueta="Foto de los productos"
          valor={apariencia.disposicion.tarjeta}
          opciones={[
            {
              valor: "cuadrada" as const,
              etiqueta: "Cuadrada",
              dibujo: <Proporcion ancho={30} alto={30} />,
            },
            {
              valor: "retrato" as const,
              etiqueta: "Vertical",
              dibujo: <Proporcion ancho={24} alto={32} />,
            },
          ]}
          alCambiar={(tarjeta) =>
            borrador.aplicar([
              { op: "apariencia", ruta: "disposicion.tarjeta", valor: tarjeta },
            ])
          }
        />
      </Grupo>

      <Grupo
        titulo="Columnas en la computadora"
        ayuda="En el celular siempre van de a dos, para que se lean."
      >
        <Opciones
          etiqueta="Columnas en la computadora"
          valor={apariencia.disposicion.columnas}
          opciones={([2, 3, 4] as const).map((cantidad) => ({
            valor: cantidad,
            etiqueta: `${cantidad} columnas`,
            dibujo: <Columnas cantidad={cantidad} />,
          }))}
          alCambiar={(columnas) =>
            borrador.aplicar([
              {
                op: "apariencia",
                ruta: "disposicion.columnas",
                valor: columnas,
              },
            ])
          }
        />
      </Grupo>

      {productos.length === 0 ? (
        <div className="px-5 pb-5">
          <Aviso>
            Todavía no cargaste productos: en la vista previa te mostramos unos
            de ejemplo para que veas cómo quedan.{" "}
            <Link
              href="/panel/productos/nuevo"
              className="font-semibold underline underline-offset-4"
            >
              Cargar los míos
            </Link>
          </Aviso>
        </div>
      ) : null}

      <SiguientePaso
        nombre="Ficha de producto"
        alIr={() => irAPaso("producto")}
      />
    </>
  )
}
