"use client"

import Image from "next/image"
import Link from "next/link"
import { ImageOff } from "lucide-react"
import { toast } from "sonner"

import { GUIA_DE_AJUSTES as GUIA } from "@/lib/editor/guia-de-ajustes"
import { NOMBRES_DE_AJUSTE, type Apariencia } from "@/lib/plantillas/apariencia"
import { cn } from "@/lib/utils"
import { useEditor } from "@/components/editor/contexto"
import {
  Aviso,
  EncabezadoDePaso,
  Grupo,
  Interruptor,
  Opciones,
  SiguientePaso,
} from "@/components/editor/piezas"

type Ficha = Apariencia["ficha"]

const DISENOS: Record<Ficha["diseno"], { nombre: string; texto: string }> = {
  dividida: {
    nombre: "Foto al lado",
    texto: "La foto grande y el texto al costado. Luce la foto.",
  },
  vitrina: {
    nombre: "Foto al centro",
    texto: "La foto al centro, más chica, y todo centrado debajo.",
  },
}

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

/** El producto abierto, dibujado: el bloque lleno es la foto. */
function EsquemaDeProducto({ diseno }: { diseno: Ficha["diseno"] }) {
  if (diseno === "dividida") {
    return (
      <span aria-hidden="true" className="flex h-11 w-16 gap-1.5">
        <span className="w-8 bg-current opacity-80" />
        <span className="flex flex-1 flex-col justify-center gap-1">
          <span className="h-1 w-full bg-current opacity-80" />
          <span className="h-1 w-3/4 bg-current opacity-45" />
          <span className="mt-1 h-2 w-full bg-current opacity-80" />
        </span>
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-16 flex-col items-center gap-1"
    >
      <span className="h-5 w-5 bg-current opacity-80" />
      <span className="h-1 w-10 bg-current opacity-80" />
      <span className="h-1 w-7 bg-current opacity-45" />
      <span className="h-2 w-10 bg-current opacity-80" />
    </span>
  )
}

/**
 * Cómo se ven los productos en la tienda: en la lista y al abrir uno.
 *
 * Un solo paso con dos vistas, y la vista previa va a la que se está ajustando.
 * Eran dos pasos, "Catálogo" y "Producto", y los dos prometían otra cosa: el
 * primero se confundía con los catálogos en PDF y el segundo parecía el lugar
 * para cambiar un producto.
 */
export function PasoProductos() {
  const { vistaForzada, setVistaForzada, irAPaso } = useEditor()
  const abierto = vistaForzada === "producto"

  return (
    <>
      <EncabezadoDePaso
        titulo="Productos"
        bajada="Cómo se ven tus productos en tu tienda: en la lista y al abrir uno."
      />
      <p className="-mt-2 px-5 pb-4 text-sm leading-relaxed opacity-80 [@media(max-height:700px)]:max-lg:mt-3">
        El nombre, el precio y las fotos se cambian en{" "}
        <Link
          href="/panel/productos"
          className="font-semibold underline underline-offset-4 hover:opacity-60"
        >
          Productos
        </Link>
        .
      </p>

      <div className="px-5 pb-5">
        <Opciones
          etiqueta="Qué quieres ajustar"
          valor={abierto ? "abierto" : "lista"}
          opciones={[
            { valor: "lista" as const, etiqueta: "En la lista" },
            { valor: "abierto" as const, etiqueta: "Al abrir uno" },
          ]}
          alCambiar={(valor) =>
            setVistaForzada(valor === "abierto" ? "producto" : "catalogo")
          }
        />
      </div>

      {abierto ? <AlAbrirUno /> : <EnLaLista />}

      <SiguientePaso nombre="Carrito" alIr={() => irAPaso("carrito")} />
    </>
  )
}

function EnLaLista() {
  const { borrador, apariencia, productos, dispositivo, setDispositivo } =
    useEditor()

  return (
    <>
      <Grupo
        titulo="Forma de las fotos"
        ayuda="Vertical luce la ropa puesta; cuadrada ordena mejor objetos y cajas."
      >
        <Opciones
          etiqueta="Forma de las fotos"
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
        className="max-lg:hidden"
        titulo="Productos por fila"
        ayuda="Solo en computadora. En el celular siempre van dos."
      >
        <Opciones
          etiqueta="Productos por fila en la computadora"
          valor={apariencia.disposicion.columnas}
          opciones={([2, 3, 4] as const).map((cantidad) => ({
            valor: cantidad,
            etiqueta: `${cantidad} por fila`,
            dibujo: <Columnas cantidad={cantidad} />,
          }))}
          alCambiar={(columnas) => {
            borrador.aplicar([
              {
                op: "apariencia",
                ruta: "disposicion.columnas",
                valor: columnas,
              },
            ])
            // En el modo celular siempre van dos: no se vería nada.
            if (dispositivo === "celular") {
              setDispositivo("computadora")
              toast("Te mostramos la computadora", {
                description: "Los productos por fila cambian solo ahí.",
              })
            }
          }}
        />
      </Grupo>

      {productos.length === 0 ? <SinProductos /> : null}
    </>
  )
}

function AlAbrirUno() {
  const {
    productos,
    productoId,
    setProductoId,
    irAPaso,
    apariencia,
    borrador,
    tienda,
    dispositivo,
    setDispositivo,
  } = useEditor()
  const { ficha } = apariencia

  function ajustar<C extends keyof Ficha>(clave: C, valor: Ficha[C]) {
    borrador.aplicar([{ op: "apariencia", ruta: `ficha.${clave}`, valor }])
  }

  return (
    <>
      <Grupo titulo="Diseño">
        <Opciones
          etiqueta="Diseño del producto abierto"
          valor={ficha.diseno}
          opciones={(["dividida", "vitrina"] as const).map((diseno) => ({
            valor: diseno,
            etiqueta: DISENOS[diseno].nombre,
            dibujo: <EsquemaDeProducto diseno={diseno} />,
          }))}
          alCambiar={(diseno) => ajustar("diseno", diseno)}
        />
        <p className="mt-3 text-xs leading-relaxed opacity-70">
          {DISENOS[ficha.diseno].texto}
        </p>
      </Grupo>

      <Grupo titulo="Qué lo acompaña">
        <div className="border-t border-tinta/15">
          <Interruptor
            etiqueta={NOMBRES_DE_AJUSTE["ficha.barraFija"]}
            ayuda={GUIA["ficha.barraFija"]?.ayuda}
            activo={ficha.barraFija}
            alCambiar={(activo) => {
              ajustar("barraFija", activo)
              // La barra es del celular: en la computadora no se vería nada.
              if (activo && dispositivo === "computadora") {
                setDispositivo("celular")
                toast("Te mostramos el celular", {
                  description: "La barra de compra aparece solo ahí.",
                })
              }
            }}
          />
          <Interruptor
            etiqueta={NOMBRES_DE_AJUSTE["ficha.consulta"]}
            ayuda={
              tienda.whatsapp
                ? GUIA["ficha.consulta"]?.ayuda
                : "Necesita el WhatsApp de tu tienda. Agrégalo en Datos de la tienda y vuelve."
            }
            activo={ficha.consulta && Boolean(tienda.whatsapp)}
            deshabilitado={!tienda.whatsapp}
            alCambiar={(activo) => ajustar("consulta", activo)}
          />
          <Interruptor
            etiqueta={NOMBRES_DE_AJUSTE["ficha.relacionados"]}
            ayuda={GUIA["ficha.relacionados"]?.ayuda}
            activo={ficha.relacionados}
            alCambiar={(activo) => ajustar("relacionados", activo)}
          />
        </div>
        {!tienda.whatsapp ? (
          <Link
            href="/cuenta"
            className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4 hover:opacity-60"
          >
            Agregar mi WhatsApp
          </Link>
        ) : null}
      </Grupo>

      {productos.length === 0 ? (
        <SinProductos />
      ) : (
        <Grupo titulo="Ver con" ayuda="Elige con qué producto ver el ejemplo.">
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
                      <span className="size-2 shrink-0 rounded-full bg-tinta" />
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </Grupo>
      )}

      <p className="border-t border-tinta/15 px-5 py-4 text-sm">
        Colores, letra y botones:{" "}
        <button
          type="button"
          onClick={() => irAPaso("marca")}
          className="min-h-11 font-semibold underline underline-offset-4 hover:opacity-60"
        >
          Marca
        </button>
      </p>
    </>
  )
}

function SinProductos() {
  return (
    <div className="px-5 pb-5">
      <Aviso>
        Todavía no cargaste productos: en la vista previa te mostramos unos de
        ejemplo para que veas cómo quedan.{" "}
        <Link
          href="/panel/productos/nuevo"
          className="font-semibold underline underline-offset-4"
        >
          Cargar los míos
        </Link>
      </Aviso>
    </div>
  )
}
