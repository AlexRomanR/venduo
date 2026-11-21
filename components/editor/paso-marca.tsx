"use client"

import * as React from "react"
import { ImageIcon, Palette, RectangleHorizontal, Type } from "lucide-react"

import {
  COMBINACIONES,
  esLaCombinacion,
  esLaPaleta,
  PALETAS,
  sinCambios,
} from "@/lib/editor/sugerencias"
import {
  colorLegibleCercano,
  problemasDeContraste,
  senalAltaDe,
  type Apariencia,
  type TokenDeColor,
} from "@/lib/plantillas/apariencia"
import type { Operacion } from "@/lib/plantillas/borrador"
import { Fila } from "@/components/panel/ajustes"
import { useEditor } from "@/components/editor/contexto"
import { Logo } from "@/components/editor/logo"
import {
  AvisoDeLegibilidad,
  ElegirCadaUno,
  FilaDeColor,
  ListaDeLetras,
  ListaDePaletas,
  OpcionDeMayusculas,
} from "@/components/editor/marca"
import {
  AjusteAbierto,
  EncabezadoDePaso,
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
    nombre: "Color destacado",
    para: "Ofertas, precios y algunos botones",
  },
]

const NOMBRE_DE_TOKEN: Record<TokenDeColor, string> = {
  papel: "el fondo",
  tinta: "el texto",
  senal: "el color destacado",
  senalAlta: "el color destacado",
}

const TODOS_LOS_COLORES = ["papel", "tinta", "senal", "senalAlta"] as const
const TODA_LA_LETRA = [
  "titular",
  "cuerpo",
  "pesoTitular",
  "espaciadoTitular",
  "mayusculas",
] as const

type Ajuste = "logo" | "colores" | "letra" | "botones"

const NOMBRE_DE_FORMA = {
  recto: "Rectos",
  suave: "Suaves",
  redondo: "Redondos",
} as const

/**
 * Tu marca: lo que hace reconocible a la tienda, en cuatro filas con lo que hoy
 * tiene cada una. Tocar una abre su ajuste en este mismo panel, como una sección
 * de la Página de inicio, y la tienda sigue a la vista.
 */
export function PasoMarca() {
  const { irAPaso, apariencia, borrador } = useEditor()
  const [abierto, setAbierto] = React.useState<Ajuste | null>(null)
  const { personalizacion, logoUrl } = borrador.presente
  const volver = () => setAbierto(null)

  if (abierto === "logo") {
    return (
      <AjusteAbierto volver="Marca" titulo="Logo" principal alVolver={volver}>
        <Logo />
      </AjusteAbierto>
    )
  }
  if (abierto === "colores") {
    return (
      <AjusteAbierto
        volver="Marca"
        principal
        titulo="Colores"
        ayuda="Toca una paleta para probarla en tu tienda."
        alVolver={volver}
      >
        <Paletas />
        <Legibilidad />
        <ColorExacto />
      </AjusteAbierto>
    )
  }
  if (abierto === "letra") {
    return (
      <AjusteAbierto
        volver="Marca"
        principal
        titulo="Letra"
        ayuda="Una para los títulos y otra para leer."
        alVolver={volver}
      >
        <Combinaciones />
        <div className="mt-5">
          <Mayusculas />
        </div>
      </AjusteAbierto>
    )
  }
  if (abierto === "botones") {
    return (
      <AjusteAbierto
        volver="Marca"
        principal
        titulo="Forma de los botones"
        ayuda="También cambia los filtros y el buscador."
        alVolver={volver}
      >
        <Forma />
      </AjusteAbierto>
    )
  }

  const paleta = PALETAS.find((p) => esLaPaleta(apariencia.colores, p))
  const colores = sinCambios(personalizacion, "colores")
    ? "De tu plantilla"
    : (paleta?.nombre ?? "A tu gusto")
  const combinacion = COMBINACIONES.find((c) =>
    esLaCombinacion(apariencia.tipografia, c)
  )
  const letra = sinCambios(personalizacion, "tipografia")
    ? "De tu plantilla"
    : (combinacion?.nombre ?? "A tu gusto")
  const noSeLee = problemasDeContraste(apariencia.colores).length > 0

  return (
    <>
      <EncabezadoDePaso
        titulo="Marca"
        bajada="Lo que elijas aquí se aplica en toda tu tienda."
      />
      <div className="px-5 pb-5">
        <ul className="pieza-tarjeta border border-tinta">
          <Fila
            icono={ImageIcon}
            titulo="Logo"
            valor={logoUrl ? "Agregado" : "Sin logo"}
            apagado={!logoUrl}
            alTocar={() => setAbierto("logo")}
          />
          <Fila
            icono={Palette}
            titulo="Colores"
            valor={colores}
            error={noSeLee ? "Algo no se lee bien" : undefined}
            alTocar={() => setAbierto("colores")}
          />
          <Fila
            icono={Type}
            titulo="Letra"
            valor={letra}
            alTocar={() => setAbierto("letra")}
          />
          <Fila
            icono={RectangleHorizontal}
            titulo="Botones"
            valor={NOMBRE_DE_FORMA[apariencia.forma.radio]}
            alTocar={() => setAbierto("botones")}
          />
        </ul>
      </div>

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

  const muestra = (colores: Apariencia["colores"]) => ({
    papel: colores.papel,
    tinta: colores.tinta,
    destacado: colores.senal,
  })

  return (
    <ListaDePaletas
      opciones={[
        {
          nombre: "De tu plantilla",
          colores: muestra(base.colores),
          activa: deLaPlantilla,
          alElegir: () => usar(null),
        },
        ...PALETAS.map((paleta) => ({
          nombre: paleta.nombre,
          colores: muestra(paleta.colores),
          activa: !deLaPlantilla && esLaPaleta(apariencia.colores, paleta),
          alElegir: () => usar(paleta.colores),
        })),
      ]}
    />
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

/** Cada color por separado, para quien ya tiene los de su marca. */
function ColorExacto() {
  const { apariencia, borrador } = useEditor()
  const cambiar = useCambiarColor()
  const propios = borrador.presente.personalizacion.colores ?? {}

  return (
    <ElegirCadaUno
      titulo="Elegir cada color"
      abiertoAlInicio={
        Object.keys(propios).length > 0 &&
        !PALETAS.some((paleta) => esLaPaleta(apariencia.colores, paleta))
      }
    >
      <ul className="mt-2 border-t border-tinta/15">
        {COLORES_EDITABLES.map(({ token, nombre, para }) => (
          <FilaDeColor
            key={token}
            nombre={nombre}
            para={para}
            valor={apariencia.colores[token]}
            alCambiar={(hex, escribiendo) => cambiar(token, hex, !escribiendo)}
            volver={
              token in propios
                ? {
                    titulo: "Volver al de tu plantilla",
                    alTocar: () =>
                      borrador.aplicar(
                        token === "senal"
                          ? [
                              { op: "restablecer", ruta: "colores.senal" },
                              { op: "restablecer", ruta: "colores.senalAlta" },
                            ]
                          : [{ op: "restablecer", ruta: `colores.${token}` }]
                      ),
                  }
                : null
            }
          />
        ))}
      </ul>
    </ElegirCadaUno>
  )
}

/**
 * Si la paleta se lee, y si no, con qué color se arregla.
 *
 * La sugerencia cambia el color que la persona tocó último, que es el que
 * está eligiendo; si ese no alcanza, prueba con los otros del problema.
 */
function Legibilidad() {
  const { apariencia, ultimoColor } = useEditor()
  const cambiar = useCambiarColor()
  const problemas = problemasDeContraste(apariencia.colores)

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
  const elegido = arreglo

  return (
    <AvisoDeLegibilidad
      problemas={problemas.map((problema) => problema.mensaje)}
      arreglo={
        elegido
          ? {
              hex: elegido.hex,
              texto: `Usar este tono para ${NOMBRE_DE_TOKEN[elegido.token]}`,
              alUsar: () => cambiar(elegido.token, elegido.hex, false),
            }
          : null
      }
      sinArreglo="Prueba con un fondo más claro: los botones llevan letra blanca."
      consecuencia="Mientras no se lea, no se puede publicar."
    />
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

  return (
    <ListaDeLetras
      opciones={[
        {
          nombre: "De tu plantilla",
          ideal: "La que trae tu plantilla",
          tipografia: base.tipografia,
          activa: deLaPlantilla,
          alElegir: () => usar(null),
        },
        ...COMBINACIONES.map((combinacion) => ({
          nombre: combinacion.nombre,
          ideal: combinacion.ideal,
          tipografia: combinacion.tipografia,
          activa:
            !deLaPlantilla &&
            esLaCombinacion(apariencia.tipografia, combinacion),
          alElegir: () => usar(combinacion.tipografia),
        })),
      ]}
    />
  )
}

function Mayusculas() {
  const { borrador, apariencia } = useEditor()

  return (
    <OpcionDeMayusculas
      valor={apariencia.tipografia.mayusculas}
      alCambiar={(mayusculas) =>
        borrador.aplicar([
          {
            op: "apariencia",
            ruta: "tipografia.mayusculas",
            valor: mayusculas,
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
