import type { ReactElement } from "react"

import type { Contexto } from "@/lib/catalogos/datos"
import type { BloqueDe } from "@/lib/catalogos/modelo"
import type { Primitivas } from "@/components/catalogos/primitivas"
import {
  Pagina,
  Remate,
  cuerpo,
  medidas,
  rotulo,
  tamanoDeTitular,
  titular,
  titularLiviano,
} from "@/components/catalogos/piezas"

/*
 * Una hoja con palabras de la tienda: condiciones de venta, su historia, una
 * frase. Los párrafos se separan con una línea en blanco.
 */

interface Props {
  P: Primitivas
  ctx: Contexto
  bloque: BloqueDe<"texto">
}

function Libre({ P, ctx, bloque }: Props) {
  const m = medidas(ctx)
  const { colores } = ctx.estilo
  const parrafos = bloque.texto
    .split(/\n\s*\n/)
    .map((parrafo) => parrafo.trim())
    .filter(Boolean)

  return (
    <Pagina P={P} ctx={ctx}>
      <P.Caja
        estilo={{
          flex: 1,
          justifyContent: "center",
          rowGap: m.gap,
          maxWidth: m.vertical ? m.ancho : m.ancho * 0.82,
        }}
      >
        {bloque.titulo ? (
          <P.Texto
            estilo={titular(
              ctx,
              tamanoDeTitular(ctx, bloque.titulo, m.ancho * 0.8, m.titulo * 1.3)
            )}
            lineas={3}
          >
            {bloque.titulo}
          </P.Texto>
        ) : null}
        <Remate P={P} ctx={ctx} ancho={m.ancho * 0.12} grosor={4} />
        {parrafos.map((parrafo, indice) => (
          <P.Texto
            key={indice}
            estilo={cuerpo(ctx, m.subtitulo * 0.85, {
              color: indice === 0 ? colores.tinta : colores.apagado,
              lineHeight: 1.5,
            })}
          >
            {parrafo}
          </P.Texto>
        ))}
      </P.Caja>
    </Pagina>
  )
}

function Cita({ P, ctx, bloque }: Props) {
  const m = medidas(ctx)
  const { colores, titular: letra } = ctx.estilo
  // Solo Cormorant trae su cursiva en el disco: a las demás el lector se la
  // inventaría inclinando la letra, y en el PDF no coincidiría con la vista.
  const cursiva = letra.fuente === "cormorant"

  return (
    <Pagina P={P} ctx={ctx}>
      <P.Caja
        estilo={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          rowGap: m.gap * 1.2,
          paddingHorizontal: m.vertical ? 0 : m.ancho * 0.06,
        }}
      >
        <P.Texto
          estilo={titular(ctx, m.display * 1.6, {
            color: colores.acento,
            lineHeight: 0.8,
            textAlign: "center",
            textTransform: "none",
          })}
        >
          “
        </P.Texto>
        <P.Texto
          estilo={titularLiviano(ctx, m.titulo * 0.95, {
            textAlign: "center",
            textTransform: "none",
            letterSpacing: 0,
            ...(cursiva ? { fontStyle: "italic" } : {}),
          })}
          lineas={9}
        >
          {bloque.texto}
        </P.Texto>
        <Remate P={P} ctx={ctx} ancho={28} grosor={1.5} />
        {bloque.titulo ? (
          <P.Texto
            estilo={rotulo(ctx, m.chico, {
              color: colores.tinta,
              textAlign: "center",
            })}
          >
            {bloque.titulo}
          </P.Texto>
        ) : null}
      </P.Caja>
    </Pagina>
  )
}

export const TEXTOS: Record<
  BloqueDe<"texto">["variante"],
  (props: Props) => ReactElement
> = {
  libre: Libre,
  cita: Cita,
}
