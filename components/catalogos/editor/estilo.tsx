"use client"

import * as React from "react"
import { FileText, LayoutTemplate, Palette, Square, Type } from "lucide-react"

import { HOJAS, type ClaveHoja } from "@/lib/catalogos/constantes"
import {
  arregloDeEstilo,
  problemasDeEstilo,
  resolverEstilo,
} from "@/lib/catalogos/estilo"
import type { Catalogo, Estilo } from "@/lib/catalogos/modelo"
import {
  PLANTILLAS_DE_CATALOGO,
  type EstiloSugerido,
} from "@/lib/catalogos/plantillas"
import { COMBINACIONES, PALETAS } from "@/lib/editor/sugerencias"
import {
  CLAVES_FUENTE,
  FUENTES,
  familiaDe,
  type ClaveFuente,
} from "@/lib/plantillas/fuentes"
import { Fila } from "@/components/panel/ajustes"
import {
  AvisoDeLegibilidad,
  ElegirCadaUno,
  FilaDeColor,
  ListaDeLetras,
  ListaDePaletas,
  OpcionDeMayusculas,
} from "@/components/editor/marca"
import { AjusteAbierto, Opciones } from "@/components/editor/piezas"
import { Interruptor } from "@/components/catalogos/editor/campos"

/*
 * Tu marca en el catálogo: parte de los colores y la letra de la tienda, y se
 * puede cambiar sin tocar la tienda.
 *
 * Es la misma pantalla que Tu marca en el editor de la tienda, con sus mismas
 * piezas (`components/editor/marca.tsx`): una fila por ajuste, que se abre en
 * este panel para seguir viendo las hojas. Lo que no se lee se dice acá, con el
 * arreglo a mano, y el PDF no se descarga hasta que se arregle.
 */

const ROTULO = "mt-5 mb-2 text-xs font-semibold opacity-70"

type Ajuste = "colores" | "letra" | "esquinas" | "tamano"

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
  const [abierto, setAbierto] = React.useState<Ajuste | null>(null)
  const estilo = catalogo.estilo
  const poner = (cambios: Partial<Estilo>) =>
    alCambiar({ ...catalogo, estilo: { ...estilo, ...cambios } })
  const ponerColor = (color: Partial<Estilo["colores"]>) =>
    poner({ colores: { ...estilo.colores, ...color } })
  const volver = () => setAbierto(null)

  const problemas = problemasDeEstilo(estilo)
  const arreglo = problemas.length > 0 ? arregloDeEstilo(estilo) : null
  const coloresDeTienda =
    JSON.stringify(estilo.colores) === JSON.stringify(estiloDeTienda.colores)
  const letrasDeTienda =
    JSON.stringify(estilo.letras) === JSON.stringify(estiloDeTienda.letras)

  const esLaPaleta = (paleta: (typeof PALETAS)[number]) =>
    paleta.colores.papel === estilo.colores.papel &&
    paleta.colores.tinta === estilo.colores.tinta &&
    paleta.colores.senal === estilo.colores.acento
  const esLaPareja = ({ tipografia: t }: (typeof COMBINACIONES)[number]) =>
    t.titular === estilo.letras.titular &&
    t.cuerpo === estilo.letras.cuerpo &&
    t.mayusculas === estilo.letras.mayusculas

  if (abierto === "colores") {
    const colores: Array<{
      clave: keyof Estilo["colores"]
      nombre: string
      para: string
    }> = [
      { clave: "papel", nombre: "Fondo", para: "El fondo de las hojas" },
      { clave: "tinta", nombre: "Texto", para: "Títulos, textos y líneas" },
      {
        clave: "acento",
        nombre: "Color destacado",
        para: "Ofertas y etiquetas",
      },
    ]

    return (
      <AjusteAbierto
        volver="Marca"
        titulo="Colores"
        ayuda="Toca una paleta para probarla en tu catálogo."
        alVolver={volver}
      >
        <ListaDePaletas
          opciones={[
            {
              nombre: "De tu tienda",
              colores: {
                papel: estiloDeTienda.colores.papel,
                tinta: estiloDeTienda.colores.tinta,
                destacado: estiloDeTienda.colores.acento,
              },
              activa: coloresDeTienda,
              alElegir: () => poner({ colores: estiloDeTienda.colores }),
            },
            ...PALETAS.map((paleta) => ({
              nombre: paleta.nombre,
              colores: {
                papel: paleta.colores.papel,
                tinta: paleta.colores.tinta,
                destacado: paleta.colores.senal,
              },
              activa: !coloresDeTienda && esLaPaleta(paleta),
              alElegir: () =>
                poner({
                  colores: {
                    papel: paleta.colores.papel,
                    tinta: paleta.colores.tinta,
                    acento: paleta.colores.senal,
                  },
                }),
            })),
          ]}
        />
        <AvisoDeLegibilidad
          problemas={problemas}
          arreglo={
            arreglo
              ? {
                  hex: arreglo.hex,
                  texto: `Usar este tono para ${arreglo.nombre}`,
                  alUsar: () => ponerColor({ [arreglo.color]: arreglo.hex }),
                }
              : null
          }
          sinArreglo="Prueba con otro fondo o con otro color de texto."
          consecuencia="Mientras no se lea, no se puede guardar ni descargar."
        />

        {sugeridos.length > 0 ? (
          <>
            <p className={ROTULO}>Con el estilo de tu tienda</p>
            <ListaDePaletas
              opciones={sugeridos.map((sugerido) => {
                const resueltos = resolverEstilo(sugerido.estilo).colores
                return {
                  nombre: sugerido.nombre,
                  colores: {
                    papel: resueltos.papel,
                    tinta: resueltos.tinta,
                    destacado: resueltos.acento,
                  },
                  activa:
                    JSON.stringify(sugerido.estilo) === JSON.stringify(estilo),
                  alElegir: () =>
                    alCambiar({ ...catalogo, estilo: sugerido.estilo }),
                }
              })}
            />
          </>
        ) : null}

        <div className="mt-5">
          <Interruptor
            etiqueta="Fondo oscuro"
            detalle="El fondo toma el color del texto y el texto, el del fondo."
            activo={estilo.invertido}
            alCambiar={(invertido) => poner({ invertido })}
          />
        </div>

        <ElegirCadaUno
          titulo="Elegir cada color"
          abiertoAlInicio={!coloresDeTienda && !PALETAS.some(esLaPaleta)}
        >
          <ul className="mt-2 border-t border-tinta/15">
            {colores.map(({ clave, nombre, para }) => (
              <FilaDeColor
                key={clave}
                nombre={nombre}
                para={para}
                valor={estilo.colores[clave]}
                alCambiar={(hex) => ponerColor({ [clave]: hex })}
                volver={
                  estilo.colores[clave] === estiloDeTienda.colores[clave]
                    ? null
                    : {
                        titulo: "Volver al de tu tienda",
                        alTocar: () =>
                          ponerColor({
                            [clave]: estiloDeTienda.colores[clave],
                          }),
                      }
                }
              />
            ))}
          </ul>
        </ElegirCadaUno>
      </AjusteAbierto>
    )
  }

  if (abierto === "letra") {
    return (
      <AjusteAbierto
        volver="Marca"
        titulo="Letra"
        ayuda="Una para los títulos y otra para leer."
        alVolver={volver}
      >
        <ListaDeLetras
          opciones={[
            {
              nombre: "De tu tienda",
              ideal: "Como en tu tienda",
              tipografia: estiloDeTienda.letras,
              activa: letrasDeTienda,
              alElegir: () => poner({ letras: estiloDeTienda.letras }),
            },
            ...COMBINACIONES.map((combinacion) => ({
              nombre: combinacion.nombre,
              ideal: combinacion.ideal,
              tipografia: combinacion.tipografia,
              activa: !letrasDeTienda && esLaPareja(combinacion),
              alElegir: () =>
                poner({
                  letras: {
                    titular: combinacion.tipografia.titular,
                    cuerpo: combinacion.tipografia.cuerpo,
                    mayusculas: combinacion.tipografia.mayusculas,
                  },
                }),
            })),
          ]}
        />
        <div className="mt-5">
          <OpcionDeMayusculas
            valor={estilo.letras.mayusculas}
            alCambiar={(mayusculas) =>
              poner({ letras: { ...estilo.letras, mayusculas } })
            }
          />
        </div>
        <ElegirCadaUno titulo="Elegir cada letra">
          <div className="grid grid-cols-1 gap-4 pt-2">
            <SelectorDeLetra
              etiqueta="Títulos"
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
        </ElegirCadaUno>
      </AjusteAbierto>
    )
  }

  if (abierto === "esquinas") {
    return (
      <AjusteAbierto
        volver="Marca"
        titulo="Esquinas"
        ayuda="Las de las fotos y las etiquetas."
        alVolver={volver}
      >
        <Opciones<Estilo["esquinas"]>
          etiqueta="Esquinas de fotos y etiquetas"
          valor={estilo.esquinas}
          opciones={[
            { valor: "rectas", etiqueta: "Rectas" },
            { valor: "suaves", etiqueta: "Suaves" },
          ]}
          alCambiar={(esquinas) => poner({ esquinas })}
        />
      </AjusteAbierto>
    )
  }

  if (abierto === "tamano") {
    return (
      <AjusteAbierto
        volver="Marca"
        titulo="Tamaño de hoja"
        ayuda={HOJAS[catalogo.hoja].detalle}
        alVolver={volver}
      >
        <Opciones<ClaveHoja>
          etiqueta="Tamaño de hoja"
          valor={catalogo.hoja}
          opciones={(Object.keys(HOJAS) as ClaveHoja[]).map((clave) => ({
            valor: clave,
            etiqueta: HOJAS[clave].nombre,
          }))}
          alCambiar={(hoja) => alCambiar({ ...catalogo, hoja })}
        />
      </AjusteAbierto>
    )
  }

  const sugerido = sugeridos.find(
    (otro) => JSON.stringify(otro.estilo) === JSON.stringify(estilo)
  )
  const colores = coloresDeTienda
    ? "De tu tienda"
    : (sugerido?.nombre ?? PALETAS.find(esLaPaleta)?.nombre ?? "A tu gusto")
  const letra = letrasDeTienda
    ? "De tu tienda"
    : (COMBINACIONES.find(esLaPareja)?.nombre ?? "A tu gusto")

  return (
    <div className="p-4 sm:p-5">
      <p className="mb-4 text-sm leading-relaxed opacity-70">
        Lo que elijas aquí se aplica solo a este catálogo. Tu tienda no cambia.
      </p>
      <ul className="pieza-tarjeta border border-tinta">
        <Fila
          icono={Palette}
          titulo="Colores"
          valor={colores}
          error={problemas.length > 0 ? "Algo no se lee bien" : undefined}
          alTocar={() => setAbierto("colores")}
        />
        <Fila
          icono={Type}
          titulo="Letra"
          valor={letra}
          alTocar={() => setAbierto("letra")}
        />
        <Fila
          icono={Square}
          titulo="Esquinas"
          valor={estilo.esquinas === "rectas" ? "Rectas" : "Suaves"}
          alTocar={() => setAbierto("esquinas")}
        />
      </ul>
      <p className={ROTULO}>Diseño del catálogo</p>
      <ul className="pieza-tarjeta border border-tinta">
        <Fila
          icono={LayoutTemplate}
          titulo="Plantilla"
          valor={PLANTILLAS_DE_CATALOGO[catalogo.plantilla].nombre}
          alTocar={alCambiarPlantilla}
        />
        <Fila
          icono={FileText}
          titulo="Tamaño"
          valor={HOJAS[catalogo.hoja].nombre}
          alTocar={() => setAbierto("tamano")}
        />
      </ul>
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
        className="text-xs font-semibold tracking-[0.12em] uppercase opacity-70"
      >
        {etiqueta}
      </label>
      <select
        id={id}
        value={valor}
        onChange={(evento) => alCambiar(evento.target.value as ClaveFuente)}
        className="mt-1 h-11 w-full cursor-pointer border-0 border-b border-tinta/40 bg-transparent text-base focus-visible:border-tinta focus-visible:bg-tinta/[0.04] focus-visible:outline-none"
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
