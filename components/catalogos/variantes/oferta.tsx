import type { ReactElement } from "react"

import type { Contexto } from "@/lib/catalogos/datos"
import type { BloqueDe } from "@/lib/catalogos/modelo"
import type { Primitivas } from "@/components/catalogos/primitivas"
import {
  Pagina,
  anchoDeTitular,
  cuerpo,
  medidas,
  rotulo,
  tamanoDeTitular,
  tamanoQueEntra,
  titular,
} from "@/components/catalogos/piezas"

/*
 * Un aviso grande: un descuento, una temporada, una liquidación. Es la única
 * hoja que usa el acento de fondo entero, y por eso hay una sola por catálogo
 * en las plantillas: si todo grita, nada se oye.
 */

interface Props {
  P: Primitivas
  ctx: Contexto
  bloque: BloqueDe<"oferta">
}

/** La hoja entera en el color de acento. */
function Banner({ P, ctx, bloque }: Props) {
  const m = medidas(ctx)
  const { colores } = ctx.estilo
  const sobre = colores.sobreAcento
  const etiqueta = bloque.etiqueta || bloque.titulo

  return (
    <Pagina P={P} ctx={ctx} fondo={colores.acento} pie={false}>
      <P.Texto estilo={rotulo(ctx, m.chico, { color: sobre })}>
        {ctx.datos.tienda.nombre}
      </P.Texto>
      <P.Caja estilo={{ flex: 1, justifyContent: "center", rowGap: m.gap }}>
        {etiqueta ? (
          <P.Texto
            estilo={titular(
              ctx,
              tamanoQueEntra(ctx, etiqueta, m.ancho, m.display * 2.4),
              { color: sobre, lineHeight: 0.95 }
            )}
            lineas={1}
          >
            {etiqueta}
          </P.Texto>
        ) : null}
        {bloque.etiqueta && bloque.titulo ? (
          <P.Texto
            estilo={titular(
              ctx,
              tamanoDeTitular(ctx, bloque.titulo, m.ancho, m.titulo * 1.3),
              { color: sobre }
            )}
            lineas={2}
          >
            {bloque.titulo}
          </P.Texto>
        ) : null}
        {bloque.texto ? (
          <P.Texto
            estilo={cuerpo(ctx, m.subtitulo, { color: sobre })}
            lineas={5}
          >
            {bloque.texto}
          </P.Texto>
        ) : null}
      </P.Caja>
      <P.Texto estilo={rotulo(ctx, m.chico * 0.9, { color: sobre })}>
        {`Precios al ${ctx.datos.fecha}`}
      </P.Texto>
    </Pagina>
  )
}

/**
 * El aviso arriba, y abajo dos cintas con la etiqueta repetida.
 *
 * Las veces que se repite se calculan con lo que mide la etiqueta, y lo que
 * sobra se reparte entre ellas: una cinta que se corta en el borde no se
 * puede dibujar, porque el PDF no dibuja un texto que no entra en su caja.
 */
function Cinta({ P, ctx, bloque }: Props) {
  const m = medidas(ctx)
  const { colores } = ctx.estilo
  const etiqueta = bloque.etiqueta || bloque.titulo || "Oferta"
  const tamano = Math.min(
    m.subtitulo * 1.2,
    tamanoQueEntra(ctx, etiqueta, ctx.hoja.ancho * 0.6, m.subtitulo * 1.2)
  )
  const disponible = (ctx.hoja.ancho - m.margen) * 0.92
  const pieza = anchoDeTitular(ctx, etiqueta, tamano) + tamano * 1.6
  const veces = Math.max(1, Math.floor((disponible + tamano * 1.6) / pieza))

  const cinta = (fondo: string, texto: string) => (
    <P.Caja
      estilo={{
        flexDirection: "row",
        justifyContent: veces > 1 ? "space-between" : "center",
        alignItems: "center",
        backgroundColor: fondo,
        paddingHorizontal: m.margen * 0.5,
        paddingVertical: tamano * 0.45,
      }}
    >
      {Array.from({ length: veces }, (_, indice) => (
        <P.Texto
          key={indice}
          estilo={titular(ctx, tamano, { color: texto, lineHeight: 1.2 })}
          lineas={1}
        >
          {etiqueta}
        </P.Texto>
      ))}
    </P.Caja>
  )

  return (
    <Pagina P={P} ctx={ctx} margenes={false}>
      <P.Caja
        estilo={{
          flex: 1,
          padding: m.margen,
          justifyContent: "center",
          rowGap: m.gap,
        }}
      >
        <P.Texto estilo={rotulo(ctx, m.chico)}>
          {ctx.datos.tienda.nombre}
        </P.Texto>
        <P.Texto
          estilo={titular(
            ctx,
            tamanoQueEntra(ctx, etiqueta, m.ancho, m.display * 2.2),
            { color: colores.acento, lineHeight: 0.95 }
          )}
          lineas={1}
        >
          {etiqueta}
        </P.Texto>
        {bloque.etiqueta && bloque.titulo ? (
          <P.Texto
            estilo={titular(
              ctx,
              tamanoDeTitular(ctx, bloque.titulo, m.ancho, m.titulo * 1.2)
            )}
            lineas={2}
          >
            {bloque.titulo}
          </P.Texto>
        ) : null}
        {bloque.texto ? (
          <P.Texto
            estilo={cuerpo(ctx, m.subtitulo, { color: colores.apagado })}
            lineas={5}
          >
            {bloque.texto}
          </P.Texto>
        ) : null}
      </P.Caja>
      <P.Caja estilo={{ marginBottom: m.abajo }}>
        {cinta(colores.acento, colores.sobreAcento)}
        {cinta(colores.tinta, colores.papel)}
      </P.Caja>
    </Pagina>
  )
}

export const OFERTAS: Record<
  BloqueDe<"oferta">["variante"],
  (props: Props) => ReactElement
> = {
  banner: Banner,
  cinta: Cinta,
}
