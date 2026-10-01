import type { ReactElement } from "react"

import { fotoDeSeparador, type Contexto } from "@/lib/catalogos/datos"
import type { BloqueDe } from "@/lib/catalogos/modelo"
import type { Primitivas } from "@/components/catalogos/primitivas"
import {
  FotoSuelta,
  Pagina,
  Remate,
  cuerpo,
  medidas,
  rotulo,
  tamanoDeTitular,
  titular,
} from "@/components/catalogos/piezas"

/*
 * El separador abre una categoría o un tema. Lleva su número de sección —el
 * orden entre los separadores del catálogo—, que es lo que deja decir "en la
 * sección 2 están las zapatillas" por WhatsApp.
 */

interface Props {
  P: Primitivas
  ctx: Contexto
  bloque: BloqueDe<"separador">
}

function numeroDeSeccion(ctx: Contexto, bloque: BloqueDe<"separador">) {
  const indice = ctx.catalogo.bloques
    .filter((otro) => otro.tipo === "separador")
    .findIndex((otro) => otro.id === bloque.id)
  return String(indice + 1).padStart(2, "0")
}

function Titulo({ P, ctx, bloque }: Props) {
  const m = medidas(ctx)
  const { colores } = ctx.estilo

  return (
    <Pagina P={P} ctx={ctx}>
      <P.Texto estilo={rotulo(ctx, m.chico)}>Sección</P.Texto>
      <P.Caja estilo={{ flex: 1, justifyContent: "flex-end", rowGap: m.gap }}>
        <P.Texto
          estilo={titular(ctx, m.display * 1.1, {
            color: colores.acento,
            lineHeight: 1,
          })}
        >
          {numeroDeSeccion(ctx, bloque)}
        </P.Texto>
        <P.Texto
          estilo={titular(
            ctx,
            tamanoDeTitular(ctx, bloque.titulo, m.ancho, m.display * 0.85)
          )}
          lineas={3}
        >
          {bloque.titulo}
        </P.Texto>
        <Remate P={P} ctx={ctx} ancho={m.ancho * 0.16} grosor={5} />
        {bloque.bajada ? (
          <P.Texto
            estilo={cuerpo(ctx, m.subtitulo, { color: colores.apagado })}
            lineas={4}
          >
            {bloque.bajada}
          </P.Texto>
        ) : null}
      </P.Caja>
    </Pagina>
  )
}

function Foto({ P, ctx, bloque }: Props) {
  const m = medidas(ctx)
  const { colores } = ctx.estilo
  const src = fotoDeSeparador(bloque, ctx.catalogo, ctx.datos)

  return (
    <Pagina P={P} ctx={ctx} margenes={false}>
      <FotoSuelta
        P={P}
        ctx={ctx}
        src={src}
        estilo={{ height: ctx.hoja.alto * 0.6 }}
      />
      <P.Caja
        estilo={{
          flex: 1,
          paddingHorizontal: m.margen,
          paddingTop: m.margen * 0.9,
          paddingBottom: m.abajo,
          rowGap: m.gap * 0.8,
        }}
      >
        <P.Caja
          estilo={{ flexDirection: "row", alignItems: "center", columnGap: 10 }}
        >
          <P.Texto
            estilo={titular(ctx, m.subtitulo * 1.3, { color: colores.acento })}
          >
            {numeroDeSeccion(ctx, bloque)}
          </P.Texto>
          <Remate P={P} ctx={ctx} ancho={36} grosor={2} />
        </P.Caja>
        <P.Texto
          estilo={titular(
            ctx,
            tamanoDeTitular(ctx, bloque.titulo, m.ancho, m.display * 0.75)
          )}
          lineas={2}
        >
          {bloque.titulo}
        </P.Texto>
        {bloque.bajada ? (
          <P.Texto
            estilo={cuerpo(ctx, m.subtitulo * 0.95, { color: colores.apagado })}
            lineas={3}
          >
            {bloque.bajada}
          </P.Texto>
        ) : null}
      </P.Caja>
    </Pagina>
  )
}

export const SEPARADORES: Record<
  BloqueDe<"separador">["variante"],
  (props: Props) => ReactElement
> = {
  titulo: Titulo,
  foto: Foto,
}
