import type { ReactElement } from "react"

import { elegidos, fotoDeBloque, type Contexto } from "@/lib/catalogos/datos"
import type { BloqueDe } from "@/lib/catalogos/modelo"
import type { Primitivas } from "@/components/catalogos/primitivas"
import {
  Etiqueta,
  FotoSuelta,
  Logo,
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
 * La portada: la tienda, el título del catálogo y la fecha de sus precios.
 * Ninguna lleva pie: es la cara del catálogo, no una hoja más.
 */

interface Props {
  P: Primitivas
  ctx: Contexto
  bloque: BloqueDe<"portada">
}

function cantidad(ctx: Contexto): string {
  const total = elegidos(ctx.catalogo, ctx.datos).length
  return total === 1 ? "1 producto" : `${total} productos`
}

/** La foto a toda hoja, y abajo una franja de papel con el título. */
function Foto({ P, ctx, bloque }: Props) {
  const m = medidas(ctx)
  const { colores } = ctx.estilo
  const src = fotoDeBloque(bloque.foto, ctx.catalogo, ctx.datos)

  return (
    <Pagina P={P} ctx={ctx} pie={false} margenes={false}>
      <FotoSuelta
        P={P}
        ctx={ctx}
        src={src}
        estilo={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />
      {ctx.datos.tienda.logo ? (
        <P.Caja
          estilo={{
            position: "absolute",
            top: m.margen,
            left: m.margen,
            padding: 8,
            backgroundColor: colores.papel,
            borderRadius: ctx.estilo.radio,
          }}
        >
          <Logo P={P} ctx={ctx} lado={m.titulo * 1.3} />
        </P.Caja>
      ) : null}
      <P.Caja
        estilo={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colores.papel,
          paddingHorizontal: m.margen,
          paddingTop: m.margen * 0.8,
          paddingBottom: m.margen,
          rowGap: m.gap * 0.6,
        }}
      >
        <P.Caja
          estilo={{
            flexDirection: "row",
            justifyContent: "space-between",
            columnGap: m.gap,
          }}
        >
          <P.Texto estilo={rotulo(ctx, m.chico, { color: colores.acento })}>
            Catálogo
          </P.Texto>
          <P.Texto estilo={rotulo(ctx, m.chico)}>{ctx.datos.fecha}</P.Texto>
        </P.Caja>
        <P.Texto
          estilo={titular(
            ctx,
            tamanoDeTitular(ctx, bloque.titulo, m.ancho, m.display)
          )}
          lineas={2}
        >
          {bloque.titulo}
        </P.Texto>
        {bloque.bajada ? (
          <P.Texto
            estilo={cuerpo(ctx, m.subtitulo, { color: colores.apagado })}
            lineas={3}
          >
            {bloque.bajada}
          </P.Texto>
        ) : null}
      </P.Caja>
    </Pagina>
  )
}

/** Sin foto: el nombre en grande, una regla de color y la bajada. */
function Tipografica({ P, ctx, bloque }: Props) {
  const m = medidas(ctx)
  const { colores } = ctx.estilo

  return (
    <Pagina P={P} ctx={ctx} pie={false}>
      <P.Caja
        estilo={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          columnGap: m.gap,
        }}
      >
        <P.Caja
          estilo={{
            flexDirection: "row",
            alignItems: "center",
            columnGap: 10,
            flex: 1,
          }}
        >
          <Logo P={P} ctx={ctx} lado={m.titulo * 1.2} />
          <P.Texto estilo={rotulo(ctx, m.chico, { flex: 1 })} lineas={1}>
            {ctx.datos.tienda.enlace}
          </P.Texto>
        </P.Caja>
        <P.Texto estilo={rotulo(ctx, m.chico)}>{ctx.datos.fecha}</P.Texto>
      </P.Caja>

      <P.Caja
        estilo={{ flex: 1, justifyContent: "flex-end", rowGap: m.gap * 1.2 }}
      >
        <P.Texto estilo={rotulo(ctx, m.cuerpo, { color: colores.acento })}>
          Catálogo
        </P.Texto>
        <P.Texto
          estilo={titular(
            ctx,
            tamanoDeTitular(ctx, bloque.titulo, m.ancho, m.display * 1.2),
            { lineHeight: 0.98 }
          )}
          lineas={4}
        >
          {bloque.titulo}
        </P.Texto>
        <Remate
          P={P}
          ctx={ctx}
          ancho={m.ancho * 0.18}
          grosor={m.vertical ? 5 : 7}
        />
        {bloque.bajada ? (
          <P.Texto
            estilo={titularLiviano(ctx, m.subtitulo * 1.4, {
              color: colores.apagado,
              textTransform: "none",
            })}
            lineas={3}
          >
            {bloque.bajada}
          </P.Texto>
        ) : null}
      </P.Caja>

      <P.Caja
        estilo={{
          flexDirection: "row",
          justifyContent: "space-between",
          columnGap: m.gap,
          borderTopWidth: 1,
          borderColor: colores.tinta,
          paddingTop: m.gap * 0.7,
          marginTop: m.gap * 2.5,
        }}
      >
        <P.Texto estilo={rotulo(ctx, m.chico)}>{cantidad(ctx)}</P.Texto>
        <P.Texto
          estilo={rotulo(ctx, m.chico, { flex: 1, textAlign: "right" })}
          lineas={1}
        >
          {ctx.datos.tienda.nombre}
        </P.Texto>
      </P.Caja>
    </Pagina>
  )
}

/** Mitad de color con el título, mitad foto. En la historia, una sobre otra. */
function Dividida({ P, ctx, bloque }: Props) {
  const m = medidas(ctx)
  const { colores } = ctx.estilo
  const src = fotoDeBloque(bloque.foto, ctx.catalogo, ctx.datos)
  const sobre = colores.sobreAcento

  const texto = (
    <P.Caja
      estilo={{
        ...(m.vertical ? { height: "42%" } : { width: "46%" }),
        backgroundColor: colores.acento,
        padding: m.margen,
        justifyContent: "space-between",
        rowGap: m.gap,
      }}
    >
      <P.Caja estilo={{ rowGap: m.gap * 0.5 }}>
        <Logo P={P} ctx={ctx} lado={m.titulo * 1.2} />
        <P.Texto estilo={rotulo(ctx, m.chico, { color: sobre })}>
          Catálogo
        </P.Texto>
      </P.Caja>
      <P.Caja estilo={{ rowGap: m.gap * 0.8 }}>
        <P.Texto
          estilo={titular(
            ctx,
            tamanoDeTitular(
              ctx,
              bloque.titulo,
              m.vertical ? m.ancho : ctx.hoja.ancho * 0.46 - m.margen * 2,
              m.display * (m.vertical ? 0.9 : 0.78)
            ),
            { color: sobre }
          )}
          lineas={4}
        >
          {bloque.titulo}
        </P.Texto>
        {bloque.bajada ? (
          <P.Texto
            estilo={cuerpo(ctx, m.subtitulo * 0.95, { color: sobre })}
            lineas={4}
          >
            {bloque.bajada}
          </P.Texto>
        ) : null}
        <P.Texto estilo={rotulo(ctx, m.chico * 0.9, { color: sobre })}>
          {ctx.datos.fecha}
        </P.Texto>
      </P.Caja>
    </P.Caja>
  )

  return (
    <Pagina P={P} ctx={ctx} pie={false} margenes={false}>
      <P.Caja
        estilo={{ flex: 1, flexDirection: m.vertical ? "column" : "row" }}
      >
        {m.vertical ? null : texto}
        <FotoSuelta P={P} ctx={ctx} src={src} estilo={{ flex: 1 }} />
        {m.vertical ? texto : null}
      </P.Caja>
    </Pagina>
  )
}

/** Un mosaico con las fotos de los primeros productos, y el título abajo. */
function Collage({ P, ctx, bloque }: Props) {
  const m = medidas(ctx)
  const { colores, radio } = ctx.estilo
  const fotos = elegidos(ctx.catalogo, ctx.datos)
    .map((producto) => producto.foto)
    .filter((foto): foto is string => Boolean(foto))
  const separacion = m.vertical ? 5 : 7

  const celda = (indice: number, flex: number) => (
    <FotoSuelta
      P={P}
      ctx={ctx}
      src={fotos[indice] ?? null}
      estilo={{ flex, borderRadius: radio }}
    />
  )

  return (
    <Pagina P={P} ctx={ctx} pie={false}>
      <P.Caja estilo={{ flex: 1, flexDirection: "row", columnGap: separacion }}>
        <P.Caja estilo={{ flex: 1.25, rowGap: separacion }}>
          {celda(0, 1.6)}
          {celda(1, 1)}
        </P.Caja>
        <P.Caja estilo={{ flex: 1, rowGap: separacion }}>
          {celda(2, 1)}
          {celda(3, 1.3)}
          {celda(4, 0.8)}
        </P.Caja>
      </P.Caja>

      <P.Caja estilo={{ paddingTop: m.gap * 1.6, rowGap: m.gap * 0.7 }}>
        <P.Caja
          estilo={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            columnGap: m.gap,
          }}
        >
          <Etiqueta P={P} ctx={ctx} tamano={m.chico}>
            Catálogo
          </Etiqueta>
          <P.Texto estilo={rotulo(ctx, m.chico)}>{ctx.datos.fecha}</P.Texto>
        </P.Caja>
        <P.Texto
          estilo={titular(
            ctx,
            tamanoDeTitular(ctx, bloque.titulo, m.ancho, m.display * 0.9)
          )}
          lineas={2}
        >
          {bloque.titulo}
        </P.Texto>
        {bloque.bajada ? (
          <P.Texto
            estilo={cuerpo(ctx, m.subtitulo, { color: colores.apagado })}
            lineas={2}
          >
            {bloque.bajada}
          </P.Texto>
        ) : null}
      </P.Caja>
    </Pagina>
  )
}

/** Un marco fino, la foto en arco y todo centrado: la de una vitrina. */
function Marco({ P, ctx, bloque }: Props) {
  const m = medidas(ctx)
  const { colores } = ctx.estilo
  const src = fotoDeBloque(bloque.foto, ctx.catalogo, ctx.datos)
  const marco = m.margen * 0.55
  const interior = ctx.hoja.ancho - marco * 2 - m.margen * 2
  const fotoAncho = interior * (m.vertical ? 0.78 : 0.6)

  return (
    <Pagina P={P} ctx={ctx} pie={false} margenes={false}>
      <P.Caja
        estilo={{
          position: "absolute",
          top: marco,
          left: marco,
          right: marco,
          bottom: marco,
          borderWidth: 0.75,
          borderColor: colores.linea,
        }}
      />
      <P.Caja
        estilo={{
          flex: 1,
          padding: marco + m.margen,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <P.Texto
          estilo={rotulo(ctx, m.chico, {
            letterSpacing: m.chico * 0.3,
            color: colores.tinta,
            textAlign: "center",
          })}
          lineas={1}
        >
          {ctx.datos.tienda.nombre}
        </P.Texto>
        <FotoSuelta
          P={P}
          ctx={ctx}
          src={src}
          estilo={{
            width: fotoAncho,
            height: fotoAncho * 1.28,
            borderTopLeftRadius: fotoAncho / 2,
            borderTopRightRadius: fotoAncho / 2,
          }}
        />
        <P.Caja estilo={{ alignItems: "center", rowGap: m.gap * 0.6 }}>
          <P.Texto
            estilo={titular(
              ctx,
              tamanoDeTitular(ctx, bloque.titulo, interior, m.titulo * 1.35),
              { textAlign: "center" }
            )}
            lineas={2}
          >
            {bloque.titulo}
          </P.Texto>
          <Remate P={P} ctx={ctx} ancho={28} grosor={1.5} />
          {bloque.bajada ? (
            <P.Texto
              estilo={titularLiviano(ctx, m.subtitulo, {
                color: colores.apagado,
                textAlign: "center",
                textTransform: "none",
              })}
              lineas={3}
            >
              {bloque.bajada}
            </P.Texto>
          ) : null}
          <P.Texto estilo={rotulo(ctx, m.chico * 0.9, { textAlign: "center" })}>
            {ctx.datos.fecha}
          </P.Texto>
        </P.Caja>
      </P.Caja>
    </Pagina>
  )
}

export const PORTADAS: Record<
  BloqueDe<"portada">["variante"],
  (props: Props) => ReactElement
> = {
  foto: Foto,
  tipografica: Tipografica,
  dividida: Dividida,
  collage: Collage,
  marco: Marco,
}
