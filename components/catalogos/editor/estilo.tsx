"use client"

import * as React from "react"
import { LayoutTemplate, RotateCcw } from "lucide-react"

import { HOJAS, type ClaveHoja } from "@/lib/catalogos/constantes"
import {
  acentoCercano,
  problemasDeEstilo,
  resolverEstilo,
} from "@/lib/catalogos/estilo"
import type { Catalogo, Estilo } from "@/lib/catalogos/modelo"
import {
  PLANTILLAS_DE_CATALOGO,
  type EstiloSugerido,
} from "@/lib/catalogos/plantillas"
import { COMBINACIONES, PALETAS } from "@/lib/editor/sugerencias"
import { BOTON_SECUNDARIO } from "@/lib/estilos"
import {
  CLAVES_FUENTE,
  FUENTES,
  familiaDe,
  type ClaveFuente,
} from "@/lib/plantillas/fuentes"
import { cn } from "@/lib/utils"
import { Aviso, Grupo, Opciones } from "@/components/editor/piezas"
import { Interruptor } from "@/components/catalogos/editor/campos"

/*
 * Cómo se ve el catálogo: parte de los colores y la letra de la tienda, y se
 * puede cambiar sin tocar la tienda.
 *
 * Las paletas y las parejas de letra son las del editor de la tienda: ya se
 * midieron para leerse. Lo que no se lee se dice acá, con el arreglo a mano,
 * y el PDF no se descarga hasta que se arregle.
 */

export function PanelDeEstilo({
  catalogo,
  estiloDeTienda,
  sugeridos,
  alCambiar,
  alCambiarPlantilla,
}: {
  catalogo: Catalogo
  estiloDeTienda: Estilo
  /** Los estilos que salen de la tienda: se aplican sin tocar las hojas. */
  sugeridos: EstiloSugerido[]
  alCambiar: (catalogo: Catalogo) => void
  alCambiarPlantilla: () => void
}) {
  const estilo = catalogo.estilo
  const poner = (cambios: Partial<Estilo>) =>
    alCambiar({ ...catalogo, estilo: { ...estilo, ...cambios } })
  const problemas = problemasDeEstilo(estilo)
  const arreglo = problemas.length > 0 ? acentoCercano(estilo) : null
  const comoLaTienda =
    JSON.stringify({ ...estilo, invertido: false }) ===
    JSON.stringify({ ...estiloDeTienda, invertido: false })

  return (
    <div className="flex flex-col">
      <Grupo
        titulo="Plantilla"
        className="border-t-0"
        ayuda="Cambiarla arma las hojas de nuevo. Tus productos, packs y colores se quedan."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-titular text-lg leading-tight font-bold tracking-[-0.02em]">
            {PLANTILLAS_DE_CATALOGO[catalogo.plantilla].nombre}
          </p>
          <button
            type="button"
            onClick={alCambiarPlantilla}
            className={cn(BOTON_SECUNDARIO, "min-h-11 px-4 text-sm")}
          >
            <LayoutTemplate aria-hidden="true" className="size-4" />
            Ver las 12
          </button>
        </div>
      </Grupo>

      {sugeridos.length > 0 ? (
        <Grupo
          titulo="Con el estilo de tu tienda"
          ayuda="Cambian los colores y el fondo; las hojas quedan como están."
        >
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {sugeridos.map((sugerido) => {
              const activo =
                JSON.stringify(sugerido.estilo) === JSON.stringify(estilo)
              const colores = resolverEstilo(sugerido.estilo).colores
              return (
                <li key={sugerido.clave}>
                  <button
                    type="button"
                    aria-pressed={activo}
                    onClick={() =>
                      alCambiar({ ...catalogo, estilo: sugerido.estilo })
                    }
                    className={cn(
                      "flex min-h-14 w-full items-center gap-3 border px-3 py-2 text-left transition-colors",
                      activo
                        ? "border-tinta bg-tinta/[0.06]"
                        : "border-tinta/20 hover:border-tinta"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-12 shrink-0 overflow-hidden border border-tinta/20"
                    >
                      <span
                        className="flex-[2]"
                        style={{ backgroundColor: colores.papel }}
                      />
                      <span
                        className="flex-1"
                        style={{ backgroundColor: colores.tinta }}
                      />
                      <span
                        className="flex-1"
                        style={{ backgroundColor: colores.acento }}
                      />
                    </span>
                    <span className="text-sm font-semibold">
                      {sugerido.nombre}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Grupo>
      ) : null}

      <Grupo titulo="Hoja">
        <Opciones<ClaveHoja>
          etiqueta="Tamaño de hoja"
          valor={catalogo.hoja}
          opciones={(Object.keys(HOJAS) as ClaveHoja[]).map((clave) => ({
            valor: clave,
            etiqueta: HOJAS[clave].nombre,
          }))}
          alCambiar={(hoja) => alCambiar({ ...catalogo, hoja })}
        />
        <p className="mt-2 text-xs leading-relaxed opacity-65">
          {HOJAS[catalogo.hoja].detalle}
        </p>
      </Grupo>

      <Grupo
        titulo="Colores"
        accion={
          comoLaTienda ? null : (
            <button
              type="button"
              onClick={() =>
                poner({
                  colores: estiloDeTienda.colores,
                  letras: estiloDeTienda.letras,
                  esquinas: estiloDeTienda.esquinas,
                })
              }
              className="flex min-h-11 shrink-0 items-center gap-1.5 text-xs font-semibold underline-offset-4 hover:underline"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
              Los de tu tienda
            </button>
          )
        }
      >
        {problemas.length > 0 ? (
          <div className="mb-5 flex flex-col gap-2">
            {problemas.map((problema) => (
              <Aviso key={problema} tono="problema">
                {problema}
              </Aviso>
            ))}
            {arreglo ? (
              <button
                type="button"
                onClick={() =>
                  poner({ colores: { ...estilo.colores, acento: arreglo } })
                }
                className="flex min-h-11 w-fit items-center gap-2 border-2 border-tinta px-3 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"
              >
                <span
                  aria-hidden="true"
                  className="size-4 border border-tinta/30"
                  style={{ backgroundColor: arreglo }}
                />
                Usar un acento que se lea
              </button>
            ) : null}
          </div>
        ) : null}

        <ul className="grid grid-cols-5 gap-2" aria-label="Paletas">
          {PALETAS.map((paleta) => {
            const activa =
              paleta.colores.papel === estilo.colores.papel &&
              paleta.colores.tinta === estilo.colores.tinta &&
              paleta.colores.senal === estilo.colores.acento
            return (
              <li key={paleta.nombre}>
                <button
                  type="button"
                  aria-pressed={activa}
                  aria-label={`Paleta ${paleta.nombre}`}
                  title={paleta.nombre}
                  onClick={() =>
                    poner({
                      colores: {
                        papel: paleta.colores.papel,
                        tinta: paleta.colores.tinta,
                        acento: paleta.colores.senal,
                      },
                    })
                  }
                  className={cn(
                    "flex h-11 w-full overflow-hidden border-2 transition-colors",
                    activa
                      ? "border-tinta"
                      : "border-tinta/15 hover:border-tinta/50"
                  )}
                >
                  <span
                    className="flex-[2]"
                    style={{ backgroundColor: paleta.colores.papel }}
                  />
                  <span
                    className="flex-1"
                    style={{ backgroundColor: paleta.colores.tinta }}
                  />
                  <span
                    className="flex-1"
                    style={{ backgroundColor: paleta.colores.senal }}
                  />
                </button>
              </li>
            )
          })}
        </ul>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CampoDeColor
            etiqueta="Fondo"
            valor={estilo.colores.papel}
            alCambiar={(papel) =>
              poner({ colores: { ...estilo.colores, papel } })
            }
          />
          <CampoDeColor
            etiqueta="Texto"
            valor={estilo.colores.tinta}
            alCambiar={(tinta) =>
              poner({ colores: { ...estilo.colores, tinta } })
            }
          />
          <CampoDeColor
            etiqueta="Acento"
            valor={estilo.colores.acento}
            alCambiar={(acento) =>
              poner({ colores: { ...estilo.colores, acento } })
            }
          />
        </div>

        <div className="mt-4">
          <Interruptor
            etiqueta="Fondo oscuro"
            detalle="El fondo toma el color del texto y el texto, el del fondo."
            activo={estilo.invertido}
            alCambiar={(invertido) => poner({ invertido })}
          />
        </div>
      </Grupo>

      <Grupo titulo="Letras">
        <ul className="flex flex-wrap gap-2" aria-label="Parejas de letra">
          {COMBINACIONES.map((combinacion) => {
            const t = combinacion.tipografia
            const activa =
              t.titular === estilo.letras.titular &&
              t.cuerpo === estilo.letras.cuerpo &&
              t.mayusculas === estilo.letras.mayusculas
            return (
              <li key={combinacion.nombre}>
                <button
                  type="button"
                  aria-pressed={activa}
                  onClick={() =>
                    poner({
                      letras: {
                        titular: t.titular,
                        cuerpo: t.cuerpo,
                        mayusculas: t.mayusculas,
                      },
                    })
                  }
                  className={cn(
                    "flex min-h-11 items-center border px-3 text-sm transition-colors",
                    activa
                      ? "border-tinta bg-tinta text-papel"
                      : "border-tinta/25 hover:border-tinta"
                  )}
                  style={{ fontFamily: familiaDe(t.titular) }}
                >
                  {combinacion.nombre}
                </button>
              </li>
            )
          })}
        </ul>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectorDeLetra
            etiqueta="Titulares"
            valor={estilo.letras.titular}
            alCambiar={(titular) =>
              poner({ letras: { ...estilo.letras, titular } })
            }
          />
          <SelectorDeLetra
            etiqueta="Texto"
            valor={estilo.letras.cuerpo}
            alCambiar={(cuerpo) =>
              poner({ letras: { ...estilo.letras, cuerpo } })
            }
          />
        </div>
        <div className="mt-4">
          <Interruptor
            etiqueta="Titulares en mayúsculas"
            activo={estilo.letras.mayusculas}
            alCambiar={(mayusculas) =>
              poner({ letras: { ...estilo.letras, mayusculas } })
            }
          />
        </div>
      </Grupo>

      <Grupo titulo="Esquinas">
        <Opciones<Estilo["esquinas"]>
          etiqueta="Esquinas de fotos y etiquetas"
          valor={estilo.esquinas}
          opciones={[
            { valor: "rectas", etiqueta: "Rectas" },
            { valor: "suaves", etiqueta: "Suaves" },
          ]}
          alCambiar={(esquinas) => poner({ esquinas })}
        />
      </Grupo>
    </div>
  )
}

const HEX = /^#[0-9a-fA-F]{6}$/

/**
 * Un color: el selector del sistema y su código, para quien lo tiene anotado.
 * El código se acepta recién cuando está completo, así la vista previa no
 * parpadea con colores a medio escribir.
 */
function CampoDeColor({
  etiqueta,
  valor,
  alCambiar,
}: {
  etiqueta: string
  valor: string
  alCambiar: (valor: string) => void
}) {
  const id = React.useId()
  const [texto, setTexto] = React.useState(valor)
  React.useEffect(() => setTexto(valor), [valor])

  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65"
      >
        {etiqueta}
      </label>
      <div className="mt-1 flex items-center gap-2 border-b border-tinta/40 focus-within:border-senal">
        <input
          type="color"
          aria-label={`${etiqueta}: elegir en la paleta`}
          value={valor}
          onChange={(evento) => alCambiar(evento.target.value)}
          className="size-9 shrink-0 cursor-pointer border-0 bg-transparent p-0"
        />
        <input
          id={id}
          value={texto}
          maxLength={7}
          spellCheck={false}
          onChange={(evento) => {
            const nuevo = evento.target.value.trim()
            setTexto(nuevo)
            if (HEX.test(nuevo)) alCambiar(nuevo.toLowerCase())
          }}
          className="tabular h-11 min-w-0 flex-1 border-0 bg-transparent font-mono text-sm uppercase focus-visible:outline-none"
        />
      </div>
    </div>
  )
}

function SelectorDeLetra({
  etiqueta,
  valor,
  alCambiar,
}: {
  etiqueta: string
  valor: ClaveFuente
  alCambiar: (valor: ClaveFuente) => void
}) {
  const id = React.useId()
  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65"
      >
        {etiqueta}
      </label>
      <select
        id={id}
        value={valor}
        onChange={(evento) => alCambiar(evento.target.value as ClaveFuente)}
        className="mt-1 h-11 w-full cursor-pointer border-0 border-b border-tinta/40 bg-transparent text-base focus-visible:border-senal focus-visible:outline-none"
        style={{ fontFamily: familiaDe(valor) }}
      >
        {CLAVES_FUENTE.map((clave) => (
          <option key={clave} value={clave}>
            {FUENTES[clave].nombre}
          </option>
        ))}
      </select>
    </div>
  )
}
