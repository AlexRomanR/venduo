import type { ReactElement } from "react"

import type { Contexto } from "@/lib/catalogos/datos"
import type { BloqueDe } from "@/lib/catalogos/modelo"
import type { Primitivas } from "@/components/catalogos/primitivas"
import {
  Logo,
  Pagina,
  Remate,
  cuerpo,
  fuerte,
  medidas,
  rotulo,
  tamanoDeTitular,
  titular,
  vigencia,
} from "@/components/catalogos/piezas"

/*
 * La contraportada dice cómo comprar. Es la hoja que más trabaja: un catálogo
 * que llega reenviado por WhatsApp a alguien que no conoce la tienda tiene que
 * decirle, sin nada más, dónde escribir y cómo pagar.
 */

interface Props {
  P: Primitivas
  ctx: Contexto
  bloque: BloqueDe<"contraportada">
}

interface Dato {
  rotulo: string
  valor: string
}

function datosDeContacto(ctx: Contexto, bloque: Props["bloque"]): Dato[] {
  const tienda = ctx.datos.tienda
  return [
    bloque.whatsapp && tienda.whatsapp
      ? { rotulo: "WhatsApp", valor: tienda.whatsapp }
      : null,
    { rotulo: "Tienda online", valor: tienda.enlace },
    bloque.redes ? { rotulo: "Redes", valor: bloque.redes } : null,
    bloque.pago ? { rotulo: "Cómo pagar", valor: bloque.pago } : null,
  ].filter((dato): dato is Dato => Boolean(dato))
}

function Contacto({ P, ctx, bloque }: Props) {
  const m = medidas(ctx)
  const { colores } = ctx.estilo
  const tienda = ctx.datos.tienda
  const qr = bloque.qr && tienda.qr ? tienda.qr : null

  return (
    <Pagina P={P} ctx={ctx}>
      <P.Caja estilo={{ rowGap: m.gap * 0.8 }}>
        <P.Texto
          estilo={titular(
            ctx,
            tamanoDeTitular(ctx, bloque.titulo, m.ancho, m.titulo * 1.4)
          )}
          lineas={3}
        >
          {bloque.titulo}
        </P.Texto>
        <Remate P={P} ctx={ctx} ancho={m.ancho * 0.14} grosor={5} />
        {bloque.texto ? (
          <P.Texto
            estilo={cuerpo(ctx, m.subtitulo, { color: colores.apagado })}
            lineas={4}
          >
            {bloque.texto}
          </P.Texto>
        ) : null}
      </P.Caja>

      <P.Caja
        estilo={{
          marginTop: m.gap * 2,
          borderTopWidth: 1,
          borderColor: colores.tinta,
        }}
      >
        {datosDeContacto(ctx, bloque).map((dato) => (
          <P.Caja
            key={dato.rotulo}
            estilo={{
              flexDirection: m.vertical ? "column" : "row",
              columnGap: m.gap,
              rowGap: 3,
              paddingVertical: m.gap * 0.8,
              borderBottomWidth: 0.75,
              borderColor: colores.linea,
            }}
          >
            <P.Texto
              estilo={rotulo(ctx, m.chico, m.vertical ? {} : { width: 110 })}
            >
              {dato.rotulo}
            </P.Texto>
            <P.Texto estilo={fuerte(ctx, m.nombre, { flex: 1 })} lineas={4}>
              {dato.valor}
            </P.Texto>
          </P.Caja>
        ))}
      </P.Caja>

      <P.Caja estilo={{ flex: 1 }} />

      <P.Caja
        estilo={{
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          columnGap: m.gap,
        }}
      >
        <P.Caja estilo={{ flex: 1, rowGap: m.gap * 0.5 }}>
          <Logo P={P} ctx={ctx} lado={m.titulo * 1.6} />
          <P.Texto estilo={titular(ctx, m.subtitulo * 1.2)} lineas={2}>
            {tienda.nombre}
          </P.Texto>
          <P.Texto estilo={rotulo(ctx, m.chico * 0.9)}>{vigencia(ctx)}</P.Texto>
        </P.Caja>
        {qr ? (
          <P.Caja estilo={{ alignItems: "center", rowGap: 4 }}>
            <P.Foto
              src={qr}
              ajuste="contener"
              estilo={{
                width: m.vertical ? 96 : 108,
                height: m.vertical ? 96 : 108,
              }}
            />
            <P.Texto estilo={rotulo(ctx, m.chico * 0.85)}>
              Escanea y compra
            </P.Texto>
          </P.Caja>
        ) : null}
      </P.Caja>
    </Pagina>
  )
}

/** El QR en grande, al centro: para imprimir y pegar en el puesto. */
function Qr({ P, ctx, bloque }: Props) {
  const m = medidas(ctx)
  const { colores } = ctx.estilo
  const tienda = ctx.datos.tienda
  const qr = bloque.qr && tienda.qr ? tienda.qr : null
  const lado = m.ancho * (m.vertical ? 0.72 : 0.5)

  return (
    <Pagina P={P} ctx={ctx}>
      <P.Caja
        estilo={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          rowGap: m.gap,
        }}
      >
        <P.Texto
          estilo={titular(
            ctx,
            tamanoDeTitular(ctx, bloque.titulo, m.ancho, m.titulo * 1.3),
            { textAlign: "center" }
          )}
          lineas={2}
        >
          {bloque.titulo}
        </P.Texto>
        {bloque.texto ? (
          <P.Texto
            estilo={cuerpo(ctx, m.subtitulo * 0.95, {
              color: colores.apagado,
              textAlign: "center",
            })}
            lineas={3}
          >
            {bloque.texto}
          </P.Texto>
        ) : null}
        {qr ? (
          <P.Foto
            src={qr}
            ajuste="contener"
            estilo={{ width: lado, height: lado, marginVertical: m.gap }}
          />
        ) : null}
        <P.Texto
          estilo={fuerte(ctx, m.subtitulo, { textAlign: "center" })}
          lineas={2}
        >
          {tienda.enlace}
        </P.Texto>
        {bloque.whatsapp && tienda.whatsapp ? (
          <P.Texto
            estilo={cuerpo(ctx, m.cuerpo * 1.1, { textAlign: "center" })}
          >
            {`WhatsApp ${tienda.whatsapp}`}
          </P.Texto>
        ) : null}
        {bloque.redes ? (
          <P.Texto
            estilo={cuerpo(ctx, m.cuerpo * 1.1, {
              color: colores.apagado,
              textAlign: "center",
            })}
            lineas={2}
          >
            {bloque.redes}
          </P.Texto>
        ) : null}
        {bloque.pago ? (
          <P.Texto
            estilo={cuerpo(ctx, m.chico * 1.1, {
              color: colores.apagado,
              textAlign: "center",
              maxWidth: m.ancho * 0.8,
            })}
            lineas={3}
          >
            {bloque.pago}
          </P.Texto>
        ) : null}
      </P.Caja>
    </Pagina>
  )
}

export const CONTRAPORTADAS: Record<
  BloqueDe<"contraportada">["variante"],
  (props: Props) => ReactElement
> = {
  contacto: Contacto,
  qr: Qr,
}
