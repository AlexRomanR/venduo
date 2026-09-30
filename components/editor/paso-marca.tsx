"use client"

import * as React from "react"
import { Check, CircleCheck, RotateCcw } from "lucide-react"

import {
  COMBINACIONES,
  esLaCombinacion,
  esLaPaleta,
  PALETAS,
  sinCambios,
} from "@/lib/editor/sugerencias"
import {
  colorLegibleCercano,
  ESPACIADOS,
  problemasDeContraste,
  senalAltaDe,
  type Apariencia,
  type TokenDeColor,
} from "@/lib/plantillas/apariencia"
import type { Operacion } from "@/lib/plantillas/borrador"
import { familiaDe } from "@/lib/plantillas/fuentes"
import { cn } from "@/lib/utils"
import { useEditor } from "@/components/editor/contexto"
import { Logo } from "@/components/editor/logo"
import {
  Aviso,
  EncabezadoDePaso,
  Grupo,
  Opciones,
  SiguientePaso,
} from "@/components/editor/piezas"

const COLORES_EDITABLES: Array<{
  token: TokenDeColor
  nombre: string
  para: string
}> = [
  { token: "papel", nombre: "Fondo", para: "El fondo de toda la tienda" },
  { token: "tinta", nombre: "Texto", para: "Títulos, textos y líneas" },
  {
    token: "senal",
    nombre: "Botones",
    para: "Comprar, precios destacados y acentos",
  },
]

const NOMBRE_DE_TOKEN: Record<TokenDeColor, string> = {
  papel: "el fondo",
  tinta: "el texto",
  senal: "los botones",
  senalAlta: "los botones",
}

const TODOS_LOS_COLORES = ["papel", "tinta", "senal", "senalAlta"] as const
const TODA_LA_LETRA = [
  "titular",
  "cuerpo",
  "pesoTitular",
  "espaciadoTitular",
  "mayusculas",
] as const

/**
 * Paso 1: lo que hace reconocible a la tienda. Logo, colores, letra y forma
 * de los botones, que se aplican en todas las pantallas a la vez.
 */
export function PasoMarca() {
  const { irAPaso } = useEditor()

  return (
    <>
      <EncabezadoDePaso
        numero={1}
        titulo="Tu marca"
        bajada="Tu logo, tus colores y tu letra. Lo que elijas acá se aplica en toda tu tienda: la portada, el catálogo, cada producto y el carrito."
      />

      <Grupo titulo="Logo">
        <Logo />
      </Grupo>

      <Grupo
        titulo="Colores"
        ayuda="Toca una paleta para probarla, o elige cada color."
      >
        <Paletas />
        <ColoresPropios />
        <Legibilidad />
      </Grupo>

      <Grupo titulo="Letra" ayuda="Una para los títulos y otra para leer.">
        <Combinaciones />
        <div className="mt-5">
          <Mayusculas />
        </div>
      </Grupo>

      <Grupo titulo="Forma de los botones">
        <Forma />
      </Grupo>

      <SiguientePaso nombre="Portada" alIr={() => irAPaso("portada")} />
    </>
  )
}

function Paletas() {
  const { borrador, apariencia, base } = useEditor()
  const deLaPlantilla = sinCambios(borrador.presente.personalizacion, "colores")

  function usar(colores: Apariencia["colores"] | null) {
    const operaciones: Operacion[] = TODOS_LOS_COLORES.map((token) =>
      colores
        ? { op: "apariencia", ruta: `colores.${token}`, valor: colores[token] }
        : { op: "restablecer", ruta: `colores.${token}` }
    )
    borrador.aplicar(operaciones)
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
      <MuestraDePaleta
        nombre="La de tu plantilla"
        colores={base.colores}
        activa={deLaPlantilla}
        alElegir={() => usar(null)}
      />
      {PALETAS.map((paleta) => (
        <MuestraDePaleta
          key={paleta.nombre}
          nombre={paleta.nombre}
          colores={paleta.colores}
          activa={!deLaPlantilla && esLaPaleta(apariencia.colores, paleta)}
          alElegir={() => usar(paleta.colores)}
        />
      ))}
    </div>
  )
}

function MuestraDePaleta({
  nombre,
  colores,
  activa,
  alElegir,
}: {
  nombre: string
  colores: Apariencia["colores"]
  activa: boolean
  alElegir: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={activa}
      onClick={alElegir}
      className={cn(
        "group flex flex-col border text-left transition-colors",
        activa
          ? "border-tinta outline-2 outline-offset-2 outline-tinta"
          : "border-tinta/20 hover:border-tinta/60"
      )}
    >
      {/* La muestra se pinta con los colores de la paleta, no con los del
          editor: es un pedacito de la tienda como quedaría. */}
      <span
        className="flex h-16 items-end justify-between gap-2 p-2.5"
        style={{ background: colores.papel, color: colores.tinta }}
      >
        <span className="font-titular text-xl leading-none font-extrabold">
          Aa
        </span>
        <span
          aria-hidden="true"
          className="h-5 w-10 rounded-sm transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:transform-none"
          style={{ background: colores.senal }}
        />
      </span>
      <span className="flex min-h-9 items-center justify-between gap-2 border-t border-tinta/15 px-2.5 text-xs font-semibold">
        {nombre}
        {activa ? <Check aria-hidden="true" className="size-3.5" /> : null}
      </span>
    </button>
  )
}

/** Aplicar un color, y si es el de los botones, su tono al pasar el cursor. */
function useCambiarColor() {
  const { borrador, setUltimoColor } = useEditor()

  return React.useCallback(
    (token: TokenDeColor, hex: string, agrupar = true) => {
      const operaciones: Operacion[] = [
        { op: "apariencia", ruta: `colores.${token}`, valor: hex },
      ]
      if (token === "senal") {
        operaciones.push({
          op: "apariencia",
          ruta: "colores.senalAlta",
          valor: senalAltaDe(hex),
        })
      }
      borrador.aplicar(operaciones, {
        agrupar: agrupar ? `color.${token}` : undefined,
      })
      setUltimoColor(token)
    },
    [borrador, setUltimoColor]
  )
}

function ColoresPropios() {
  const { apariencia, borrador } = useEditor()
  const cambiar = useCambiarColor()
  const propios = borrador.presente.personalizacion.colores ?? {}

  return (
    <ul className="mt-5 border-t border-tinta/15">
      {COLORES_EDITABLES.map(({ token, nombre, para }) => {
        const valor = apariencia.colores[token]
        return (
          <li
            key={token}
            className="flex items-center gap-3 border-b border-tinta/15 py-2"
          >
            <label
              className="relative size-11 shrink-0 cursor-pointer border border-tinta/25 transition-transform hover:scale-105 motion-reduce:transform-none"
              style={{ background: valor }}
            >
              <span className="sr-only">Elegir el color de {nombre}</span>
              <input
                type="color"
                value={valor}
                onChange={(evento) => cambiar(token, evento.target.value)}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
            </label>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{nombre}</span>
              <span className="block truncate text-xs opacity-55">{para}</span>
            </span>
            <CampoHex
              etiqueta={`Código del color de ${nombre}`}
              valor={valor}
              alCambiar={(hex) => cambiar(token, hex, false)}
            />
            {token in propios ? (
              <button
                type="button"
                aria-label={`Volver al color de ${nombre} de la plantilla`}
                title="Volver al de la plantilla"
                onClick={() =>
                  borrador.aplicar(
                    token === "senal"
                      ? [
                          { op: "restablecer", ruta: "colores.senal" },
                          { op: "restablecer", ruta: "colores.senalAlta" },
                        ]
                      : [{ op: "restablecer", ruta: `colores.${token}` }]
                  )
                }
                className="-mr-2 flex size-11 shrink-0 items-center justify-center opacity-60 transition-opacity hover:opacity-100"
              >
                <RotateCcw aria-hidden="true" className="size-4" />
              </button>
            ) : (
              <span aria-hidden="true" className="-mr-2 size-11 shrink-0" />
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** El código del color, para quien ya tiene el de su marca. */
function CampoHex({
  etiqueta,
  valor,
  alCambiar,
}: {
  etiqueta: string
  valor: string
  alCambiar: (hex: string) => void
}) {
  const [texto, setTexto] = React.useState(valor)
  React.useEffect(() => setTexto(valor), [valor])

  function confirmar() {
    const limpio = texto.trim().replace(/^#?/, "#").toLowerCase()
    if (/^#[0-9a-f]{6}$/.test(limpio)) {
      if (limpio !== valor) alCambiar(limpio)
      setTexto(limpio)
    } else {
      setTexto(valor)
    }
  }

  return (
    <input
      aria-label={etiqueta}
      value={texto}
      onChange={(evento) => setTexto(evento.target.value)}
      onBlur={confirmar}
      onKeyDown={(evento) => {
        if (evento.key === "Enter") {
          evento.preventDefault()
          confirmar()
        }
      }}
      maxLength={7}
      spellCheck={false}
      className="tabular h-11 w-[5.5rem] shrink-0 border-0 border-b border-tinta/30 bg-transparent px-0 font-mono text-sm uppercase transition-colors focus-visible:border-senal focus-visible:outline-none"
    />
  )
}

/**
 * Si la paleta se lee, y si no, qué no se lee y con qué color se arregla.
 *
 * La sugerencia cambia el color que la persona tocó último, que es el que
 * está eligiendo; si ese no alcanza, prueba con los otros del problema.
 */
function Legibilidad() {
  const { apariencia, ultimoColor } = useEditor()
  const cambiar = useCambiarColor()
  const problemas = problemasDeContraste(apariencia.colores)

  if (problemas.length === 0) {
    return (
      <p className="mt-4 flex items-center gap-2 text-sm opacity-70">
        <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
        Todo se lee bien.
      </p>
    )
  }

  const candidatos = [
    ...(ultimoColor ? [ultimoColor] : []),
    ...problemas.flatMap((problema) => problema.colores),
  ].filter((token, indice, lista) => lista.indexOf(token) === indice)

  let arreglo: { token: TokenDeColor; hex: string } | null = null
  for (const token of candidatos) {
    const hex = colorLegibleCercano(apariencia.colores, token)
    if (hex) {
      arreglo = { token, hex }
      break
    }
  }

  return (
    <Aviso tono="problema" className="mt-4">
      <p className="font-semibold">Así no se va a leer bien.</p>
      <ul className="mt-1 opacity-80">
        {problemas.map((problema) => (
          <li key={problema.mensaje}>{problema.mensaje}</li>
        ))}
      </ul>
      {arreglo ? (
        <button
          type="button"
          onClick={() => arreglo && cambiar(arreglo.token, arreglo.hex, false)}
          className="mt-2 inline-flex min-h-11 items-center gap-2 font-semibold text-senal transition-colors hover:text-senal-alta"
        >
          <span
            aria-hidden="true"
            className="size-5 border border-tinta/25"
            style={{ background: arreglo.hex }}
          />
          Usar este tono para {NOMBRE_DE_TOKEN[arreglo.token]}
        </button>
      ) : (
        <p className="mt-2 opacity-80">
          Prueba con un fondo más claro: los botones llevan letra blanca.
        </p>
      )}
      <p className="mt-1 text-xs opacity-60">
        Mientras no se lea, no se puede publicar.
      </p>
    </Aviso>
  )
}

function Combinaciones() {
  const { borrador, apariencia, base } = useEditor()
  const deLaPlantilla = sinCambios(
    borrador.presente.personalizacion,
    "tipografia"
  )

  function usar(tipografia: Apariencia["tipografia"] | null) {
    borrador.aplicar(
      TODA_LA_LETRA.map((campo): Operacion =>
        tipografia
          ? {
              op: "apariencia",
              ruta: `tipografia.${campo}`,
              valor: tipografia[campo],
            }
          : { op: "restablecer", ruta: `tipografia.${campo}` }
      )
    )
  }

  const opciones = [
    {
      nombre: "La de tu plantilla",
      ideal: "Como vino",
      tipografia: base.tipografia,
      activa: deLaPlantilla,
      usar: () => usar(null),
    },
    ...COMBINACIONES.map((combinacion) => ({
      nombre: combinacion.nombre,
      ideal: combinacion.ideal,
      tipografia: combinacion.tipografia,
      activa:
        !deLaPlantilla && esLaCombinacion(apariencia.tipografia, combinacion),
      usar: () => usar(combinacion.tipografia),
    })),
  ]

  return (
    <div className="grid grid-cols-2 gap-2">
      {opciones.map((opcion) => (
        <button
          key={opcion.nombre}
          type="button"
          aria-pressed={opcion.activa}
          onClick={opcion.usar}
          className={cn(
            "flex flex-col border text-left transition-colors",
            opcion.activa
              ? "border-tinta bg-tinta text-papel"
              : "border-tinta/20 hover:border-tinta/60"
          )}
        >
          <span
            className="block px-3 pt-3 text-[1.9rem] leading-none"
            style={{
              fontFamily: familiaDe(opcion.tipografia.titular),
              fontWeight: opcion.tipografia.pesoTitular ?? 700,
              letterSpacing:
                ESPACIADOS[opcion.tipografia.espaciadoTitular ?? "normal"],
              textTransform: opcion.tipografia.mayusculas
                ? "uppercase"
                : "none",
            }}
          >
            Aa
          </span>
          <span
            className="block px-3 pt-2 text-sm font-semibold"
            style={{ fontFamily: familiaDe(opcion.tipografia.cuerpo) }}
          >
            {opcion.nombre}
          </span>
          <span
            className="block px-3 pb-3 text-xs leading-snug opacity-60"
            style={{ fontFamily: familiaDe(opcion.tipografia.cuerpo) }}
          >
            {opcion.ideal}
          </span>
        </button>
      ))}
    </div>
  )
}

function Mayusculas() {
  const { borrador, apariencia } = useEditor()

  return (
    <Opciones
      etiqueta="Títulos"
      valor={apariencia.tipografia.mayusculas ? "si" : "no"}
      opciones={[
        { valor: "no", etiqueta: "Títulos normales" },
        { valor: "si", etiqueta: "TÍTULOS EN MAYÚSCULAS" },
      ]}
      alCambiar={(valor) =>
        borrador.aplicar([
          {
            op: "apariencia",
            ruta: "tipografia.mayusculas",
            valor: valor === "si",
          },
        ])
      }
    />
  )
}

function Forma() {
  const { borrador, apariencia } = useEditor()

  const radios = { recto: "0px", suave: "6px", redondo: "9999px" } as const

  return (
    <Opciones
      etiqueta="Forma de los botones"
      valor={apariencia.forma.radio}
      opciones={(["recto", "suave", "redondo"] as const).map((radio) => ({
        valor: radio,
        etiqueta: { recto: "Rectos", suave: "Suaves", redondo: "Redondos" }[
          radio
        ],
        dibujo: (
          <span
            aria-hidden="true"
            className="block h-6 w-14 bg-current"
            style={{ borderRadius: radios[radio] }}
          />
        ),
      }))}
      alCambiar={(radio) =>
        borrador.aplicar([
          { op: "apariencia", ruta: "forma.radio", valor: radio },
        ])
      }
    />
  )
}
