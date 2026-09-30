"use client"

import Image from "next/image"
import Link from "next/link"
import { ImageOff } from "lucide-react"
import { toast } from "sonner"

import type { Apariencia } from "@/lib/plantillas/apariencia"
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
    nombre: "Dividida",
    texto: "La foto grande y el texto al costado. Luce la foto.",
  },
  vitrina: {
    nombre: "Vitrina",
    texto:
      "La foto al centro, más chica, y todo centrado debajo, como en un mostrador.",
  },
}

/** La ficha dibujada: el bloque lleno es la foto; las rayas, el texto. */
function EsquemaDeFicha({ diseno }: { diseno: Ficha["diseno"] }) {
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
 * Paso 4: la ficha de producto.
 *
 * Toma los colores, la letra y los botones de Tu marca; acá se elige cómo se
 * ordena y qué la acompaña. Son formas que las tres plantillas saben dibujar,
 * cada una con su estilo.
 */
export function PasoProducto() {
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
      <EncabezadoDePaso
        numero={4}
        titulo="Ficha de producto"
        bajada="Lo que ve tu cliente al tocar un producto. Elige cómo se ordena y qué lo acompaña."
      />

      <Grupo titulo="Diseño de la ficha">
        <Opciones
          etiqueta="Diseño de la ficha"
          valor={ficha.diseno}
          opciones={(["dividida", "vitrina"] as const).map((diseno) => ({
            valor: diseno,
            etiqueta: DISENOS[diseno].nombre,
            dibujo: <EsquemaDeFicha diseno={diseno} />,
          }))}
          alCambiar={(diseno) => ajustar("diseno", diseno)}
        />
        <p className="mt-3 text-xs leading-relaxed opacity-65">
          {DISENOS[ficha.diseno].texto}
        </p>
      </Grupo>

      <Grupo titulo="Qué la acompaña">
        <div className="border-t border-tinta/15">
          <Interruptor
            etiqueta="Botón de compra siempre a mano"
            ayuda="En el celular, una barra con el precio y «Agregar» que sigue a tu cliente mientras mira la foto."
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
            etiqueta="Preguntar por WhatsApp"
            ayuda={
              tienda.whatsapp
                ? "Un enlace para que te escriban sobre ese producto, con el mensaje ya escrito."
                : "Necesita el WhatsApp de tu tienda. Agrégalo en Cuenta y vuelve."
            }
            activo={ficha.consulta && Boolean(tienda.whatsapp)}
            deshabilitado={!tienda.whatsapp}
            alCambiar={(activo) => ajustar("consulta", activo)}
          />
          <Interruptor
            etiqueta="Productos parecidos"
            ayuda="«También te puede gustar» al pie: cuatro productos más para seguir mirando."
            activo={ficha.relacionados}
            alCambiar={(activo) => ajustar("relacionados", activo)}
          />
        </div>
        {!tienda.whatsapp ? (
          <Link
            href="/cuenta"
            className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4 hover:text-senal"
          >
            Agregar mi WhatsApp
          </Link>
        ) : null}
      </Grupo>

      {productos.length === 0 ? (
        <div className="px-5 pb-5">
          <Aviso>
            Todavía no cargaste productos: la vista previa usa uno de ejemplo
            para que veas cómo queda la ficha.{" "}
            <Link
              href="/panel/productos/nuevo"
              className="font-semibold underline underline-offset-4"
            >
              Cargar el primero
            </Link>
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

      <Grupo titulo="De dónde sale lo demás">
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
