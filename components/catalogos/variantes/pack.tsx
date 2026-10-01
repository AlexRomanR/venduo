import type { ReactElement } from "react"

import {
  precioSuelto,
  type Contexto,
  type Hoja,
  type ProductoDelCatalogo,
} from "@/lib/catalogos/datos"
import type { BloqueDe } from "@/lib/catalogos/modelo"
import { formatMoney } from "@/lib/format"
import type { Primitivas } from "@/components/catalogos/primitivas"
import {
  Etiqueta,
  FotoDeProducto,
  Pagina,
  cuerpo,
  enFilas,
  fuerte,
  medidas,
  rotulo,
  tamanoDeTitular,
  titular,
} from "@/components/catalogos/piezas"

/*
 * Un pack: varios productos con un precio juntos.
 *
 * El precio del pack lo pone la persona y se muestra solo en el catálogo: la
 * tienda online no lo cobra. Quien quiera el pack lo pide por WhatsApp, y la
 * venta se arma desde ahí. Lo que se ahorra se calcula siempre con los precios
 * de hoy, así que nunca promete un descuento que ya no existe.
 */

type HojaDePack = Extract<Hoja, { clase: "pack" }>

interface Props {
  P: Primitivas
  ctx: Contexto
  hoja: HojaDePack
}

function cuentas(hoja: HojaDePack) {
  const suelto = precioSuelto(hoja.productos)
  const ahorro = suelto - hoja.pack.precioCents
  return {
    suelto,
    ahorro: ahorro > 0 ? ahorro : 0,
    porcentaje: ahorro > 0 ? Math.round((ahorro / suelto) * 100) : 0,
  }
}

function cantidad(productos: ProductoDelCatalogo[]) {
  return productos.length === 1 ? "1 producto" : `${productos.length} productos`
}

function Tarjeta({ P, ctx, hoja }: Props) {
  const m = medidas(ctx)
  const { colores, radio } = ctx.estilo
  const { pack, productos } = hoja
  const { suelto, ahorro, porcentaje } = cuentas(hoja)
  const columnas =
    productos.length <= 3 ? productos.length : productos.length === 4 ? 2 : 4
  const gap = m.gap * 0.8

  return (
    <Pagina P={P} ctx={ctx}>
      <P.Caja estilo={{ rowGap: m.gap * 0.7 }}>
        <P.Caja
          estilo={{ flexDirection: "row", alignItems: "center", columnGap: 10 }}
        >
          <Etiqueta P={P} ctx={ctx} tamano={m.chico}>
            Pack
          </Etiqueta>
          <P.Texto estilo={rotulo(ctx, m.chico)}>{cantidad(productos)}</P.Texto>
        </P.Caja>
        <P.Texto
          estilo={titular(
            ctx,
            tamanoDeTitular(ctx, pack.nombre, m.ancho, m.titulo * 1.5)
          )}
          lineas={2}
        >
          {pack.nombre}
        </P.Texto>
        {pack.nota ? (
          <P.Texto
            estilo={cuerpo(ctx, m.subtitulo, { color: colores.apagado })}
            lineas={3}
          >
            {pack.nota}
          </P.Texto>
        ) : null}
      </P.Caja>

      <P.Caja
        estilo={{
          flex: 1,
          rowGap: gap,
          paddingVertical: m.gap * 1.4,
        }}
      >
        {enFilas(productos, columnas).map((fila, indice) => (
          <P.Caja
            key={indice}
            estilo={{ flex: 1, flexDirection: "row", columnGap: gap }}
          >
            {fila.map((producto) => (
              <P.Caja key={producto.id} estilo={{ flex: 1, rowGap: 4 }}>
                <FotoDeProducto
                  P={P}
                  ctx={ctx}
                  producto={producto}
                  estilo={{ flex: 1 }}
                />
                <P.Texto estilo={fuerte(ctx, m.cuerpo)} lineas={1}>
                  {producto.nombre}
                </P.Texto>
                <P.Texto
                  estilo={cuerpo(ctx, m.chico, { color: colores.apagado })}
                >
                  {formatMoney(producto.precioCents)}
                </P.Texto>
              </P.Caja>
            ))}
          </P.Caja>
        ))}
      </P.Caja>

      <P.Caja
        estilo={{
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          columnGap: m.gap,
          backgroundColor: colores.suave,
          borderRadius: radio,
          padding: m.gap * 1.2,
        }}
      >
        <P.Caja estilo={{ rowGap: 4, flex: 1 }}>
          <P.Texto estilo={rotulo(ctx, m.chico)}>Precio del pack</P.Texto>
          <P.Texto
            estilo={titular(ctx, m.titulo * 1.4, {
              textTransform: "none",
              lineHeight: 1,
            })}
          >
            {formatMoney(pack.precioCents)}
          </P.Texto>
        </P.Caja>
        {ahorro > 0 ? (
          <P.Caja estilo={{ alignItems: "flex-end", rowGap: 4 }}>
            <P.Texto
              estilo={cuerpo(ctx, m.cuerpo, {
                color: colores.apagado,
                textDecoration: "line-through",
                textAlign: "right",
              })}
            >
              {`Por separado ${formatMoney(suelto)}`}
            </P.Texto>
            <Etiqueta
              P={P}
              ctx={ctx}
              tamano={m.chico * 1.1}
              mayusculas={false}
              estilo={{ alignSelf: "flex-end" }}
            >
              {`Ahorras ${formatMoney(ahorro)} · ${porcentaje}%`}
            </Etiqueta>
          </P.Caja>
        ) : null}
      </P.Caja>
    </Pagina>
  )
}

/** Como un recibo: cada producto en su renglón y el total del pack al pie. */
function Lista({ P, ctx, hoja }: Props) {
  const m = medidas(ctx)
  const { colores } = ctx.estilo
  const { pack, productos } = hoja
  const { suelto, ahorro, porcentaje } = cuentas(hoja)
  const lado = m.vertical ? 52 : 58

  return (
    <Pagina P={P} ctx={ctx}>
      <P.Caja estilo={{ rowGap: m.gap * 0.7, marginBottom: m.gap * 1.6 }}>
        <Etiqueta P={P} ctx={ctx} tamano={m.chico}>
          Pack
        </Etiqueta>
        <P.Texto
          estilo={titular(
            ctx,
            tamanoDeTitular(ctx, pack.nombre, m.ancho, m.titulo * 1.5)
          )}
          lineas={2}
        >
          {pack.nombre}
        </P.Texto>
        {pack.nota ? (
          <P.Texto
            estilo={cuerpo(ctx, m.subtitulo, { color: colores.apagado })}
            lineas={3}
          >
            {pack.nota}
          </P.Texto>
        ) : null}
      </P.Caja>

      <P.Caja estilo={{ borderTopWidth: 1, borderColor: colores.tinta }}>
        {productos.map((producto) => (
          <P.Caja
            key={producto.id}
            estilo={{
              flexDirection: "row",
              alignItems: "center",
              columnGap: m.gap,
              paddingVertical: m.gap * 0.6,
              borderBottomWidth: 0.75,
              borderColor: colores.linea,
            }}
          >
            <FotoDeProducto
              P={P}
              ctx={ctx}
              producto={producto}
              avisos={false}
              estilo={{ width: lado, height: lado }}
            />
            <P.Texto estilo={fuerte(ctx, m.nombre, { flex: 1 })} lineas={2}>
              {producto.nombre}
            </P.Texto>
            <P.Texto estilo={cuerpo(ctx, m.cuerpo, { color: colores.apagado })}>
              {formatMoney(producto.precioCents)}
            </P.Texto>
          </P.Caja>
        ))}
      </P.Caja>

      <P.Caja estilo={{ flex: 1 }} />

      <P.Caja
        estilo={{
          rowGap: m.gap * 0.5,
          alignItems: "flex-end",
          borderTopWidth: 1,
          borderColor: colores.tinta,
          paddingTop: m.gap,
        }}
      >
        {ahorro > 0 ? (
          <P.Texto
            estilo={cuerpo(ctx, m.cuerpo, {
              color: colores.apagado,
              textDecoration: "line-through",
            })}
          >
            {`Por separado ${formatMoney(suelto)}`}
          </P.Texto>
        ) : null}
        <P.Texto estilo={rotulo(ctx, m.chico)}>Precio del pack</P.Texto>
        <P.Texto
          estilo={titular(ctx, m.display * 0.8, {
            textTransform: "none",
            lineHeight: 1,
          })}
        >
          {formatMoney(pack.precioCents)}
        </P.Texto>
        {ahorro > 0 ? (
          <Etiqueta
            P={P}
            ctx={ctx}
            tamano={m.chico * 1.1}
            mayusculas={false}
            estilo={{ alignSelf: "flex-end" }}
          >
            {`Ahorras ${formatMoney(ahorro)} · ${porcentaje}%`}
          </Etiqueta>
        ) : null}
      </P.Caja>
    </Pagina>
  )
}

export const PACKS: Record<
  BloqueDe<"pack">["variante"],
  (props: Props) => ReactElement
> = {
  tarjeta: Tarjeta,
  lista: Lista,
}
