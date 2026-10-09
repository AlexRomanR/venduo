import type { ReactNode } from "react"

import type { Contexto, ProductoDelCatalogo } from "@/lib/catalogos/datos"
import { anchoEnEme, pesoDe } from "@/lib/catalogos/estilo"
import type { Campos } from "@/lib/catalogos/modelo"
import { formatMoney } from "@/lib/format"
import type {
  EstiloDibujo,
  Primitivas,
} from "@/components/catalogos/primitivas"

/*
 * Lo que comparten las variantes: medidas, letras, precio, etiquetas, foto,
 * encabezado y pie. Igual que las variantes, sin hooks ni contexto: se dibujan
 * en el navegador y en el PDF.
 */

interface Base {
  P: Primitivas
  ctx: Contexto
}

/* ---------------------------------------------------------------------------
 * Medidas
 * ------------------------------------------------------------------------ */

export interface Medidas {
  /** La hoja de historia: angosta y para verse a pantalla completa. */
  vertical: boolean
  margen: number
  /** El margen de abajo, con lugar para el pie. */
  abajo: number
  gap: number
  chico: number
  cuerpo: number
  nombre: number
  precio: number
  subtitulo: number
  titulo: number
  display: number
  /** Lo que queda adentro de los márgenes. */
  ancho: number
  alto: number
}

export function medidas(ctx: Contexto): Medidas {
  const vertical = ctx.hoja.alto / ctx.hoja.ancho > 1.6
  // La historia se mira en el celular sin ampliar: su letra es más grande
  // respecto de la hoja que la de un A4, que se imprime o se amplía.
  const k = vertical ? 1.3 : 1
  const margen = vertical ? 24 : 40
  const abajo = vertical ? 44 : 56

  return {
    vertical,
    margen,
    abajo,
    gap: vertical ? 10 : 14,
    chico: 8 * k,
    cuerpo: 10 * k,
    nombre: 11 * k,
    precio: 12 * k,
    subtitulo: 15 * k,
    titulo: 26 * k,
    display: vertical ? 46 : 64,
    ancho: ctx.hoja.ancho - margen * 2,
    alto: ctx.hoja.alto - margen - abajo,
  }
}

/* ---------------------------------------------------------------------------
 * Letras
 * ------------------------------------------------------------------------ */

export function titular(
  ctx: Contexto,
  tamano: number,
  extra: EstiloDibujo = {}
): EstiloDibujo {
  const { titular, colores } = ctx.estilo
  return {
    fuente: titular.fuente,
    fontWeight: titular.peso,
    fontSize: tamano,
    lineHeight: 1.04,
    letterSpacing: tamano * (titular.mayusculas ? 0.01 : -0.02),
    textTransform: titular.mayusculas ? "uppercase" : "none",
    color: colores.tinta,
    ...extra,
  }
}

/** El titular con un peso más liviano, para citas y bajadas grandes. */
export function titularLiviano(
  ctx: Contexto,
  tamano: number,
  extra: EstiloDibujo = {}
): EstiloDibujo {
  return titular(ctx, tamano, {
    fontWeight: pesoDe(ctx.estilo.titular.fuente, 500),
    lineHeight: 1.18,
    ...extra,
  })
}

export function cuerpo(
  ctx: Contexto,
  tamano: number,
  extra: EstiloDibujo = {}
): EstiloDibujo {
  return {
    fuente: ctx.estilo.cuerpo.fuente,
    fontWeight: ctx.estilo.cuerpo.peso,
    fontSize: tamano,
    lineHeight: 1.38,
    color: ctx.estilo.colores.tinta,
    ...extra,
  }
}

export function fuerte(
  ctx: Contexto,
  tamano: number,
  extra: EstiloDibujo = {}
): EstiloDibujo {
  return cuerpo(ctx, tamano, {
    fontWeight: ctx.estilo.cuerpo.pesoFuerte,
    lineHeight: 1.25,
    ...extra,
  })
}

/** Un rótulo chico en mayúsculas espaciadas: "CATÁLOGO", "WHATSAPP". */
export function rotulo(
  ctx: Contexto,
  tamano: number,
  extra: EstiloDibujo = {}
): EstiloDibujo {
  return fuerte(ctx, tamano, {
    textTransform: "uppercase",
    letterSpacing: tamano * 0.1,
    lineHeight: 1.2,
    color: ctx.estilo.colores.apagado,
    ...extra,
  })
}

/** Lo que ocupa un texto escrito con el titular, en puntos. */
export function anchoDeTitular(
  ctx: Contexto,
  texto: string,
  tamano: number
): number {
  const { fuente, mayusculas } = ctx.estilo.titular
  const escrito = mayusculas ? texto.toUpperCase() : texto
  const espaciado = mayusculas ? 0.01 : -0.02
  return (
    (anchoEnEme(fuente, escrito) + [...escrito].length * espaciado) * tamano
  )
}

/**
 * El tamaño de titular más grande con el que un texto entra en un renglón.
 *
 * Para lo que va en grande —"-20%", "Liquidación"— y no puede partirse: el
 * PDF no dibuja un texto que no entra en su caja. Se deja un margen porque
 * la medida es un promedio por clase de letra.
 */
export function tamanoQueEntra(
  ctx: Contexto,
  texto: string,
  ancho: number,
  maximo: number
): number {
  const enUno = anchoDeTitular(ctx, texto, 1)
  return enUno > 0 ? Math.min(maximo, (ancho * 0.92) / enUno) : maximo
}

/**
 * El tamaño de un titular para que su palabra más larga entre en el ancho.
 *
 * El PDF no parte palabras: una que no entra se sale de su caja. El navegador
 * sí la parte —«DEPORTE» arriba y «S» abajo—, así que la única forma de que
 * los dos se vean bien e iguales es achicar la letra hasta que entre.
 */
export function tamanoDeTitular(
  ctx: Contexto,
  texto: string,
  ancho: number,
  maximo: number
): number {
  const palabras = texto.split(/s+/).filter(Boolean)
  if (palabras.length === 0) return maximo
  const larga = palabras.reduce((mas, palabra) =>
    anchoDeTitular(ctx, palabra, 1) > anchoDeTitular(ctx, mas, 1)
      ? palabra
      : mas
  )
  return tamanoQueEntra(ctx, larga, ancho, maximo)
}

/* ---------------------------------------------------------------------------
 * Producto
 * ------------------------------------------------------------------------ */

/** El descuento en puntos porcentuales, si el precio anterior era mayor. */
export function rebaja(producto: ProductoDelCatalogo): number | null {
  const anterior = producto.precioAnteriorCents
  if (!anterior || anterior <= producto.precioCents) return null
  const porcentaje = Math.round((1 - producto.precioCents / anterior) * 100)
  return porcentaje > 0 ? porcentaje : null
}

/** La línea de detalle de un producto: categoría, stock, código. */
export function detalles(
  producto: ProductoDelCatalogo,
  campos: Campos
): string {
  const partes: string[] = []
  if (campos.categoria && producto.categoria) partes.push(producto.categoria)
  if (campos.stock && producto.stock > 0) {
    partes.push(producto.stock === 1 ? "Queda 1" : `Quedan ${producto.stock}`)
  }
  if (campos.codigo && producto.codigo) partes.push(`Cód. ${producto.codigo}`)
  return partes.join(" · ")
}

/** La primera letra del nombre, para una foto que falta. */
function inicial(nombre: string): string {
  return nombre.trim().charAt(0).toUpperCase() || "·"
}

export function Precio({
  P,
  ctx,
  producto,
  campos,
  tamano,
  estilo,
}: Base & {
  producto: ProductoDelCatalogo
  campos: Campos
  tamano: number
  estilo?: EstiloDibujo
}) {
  if (!campos.precio) return null
  const { colores, cuerpo: letra } = ctx.estilo
  const anterior =
    campos.precioAnterior && rebaja(producto)
      ? producto.precioAnteriorCents
      : null

  return (
    <P.Texto
      estilo={fuerte(ctx, tamano, {
        lineHeight: 1.15,
        color: anterior ? colores.acento : colores.tinta,
        ...estilo,
      })}
    >
      {formatMoney(producto.precioCents)}
      {anterior ? "  " : null}
      {anterior ? (
        <P.Tramo
          estilo={{
            fontWeight: letra.peso,
            fontSize: tamano * 0.78,
            color: colores.apagado,
            textDecoration: "line-through",
          }}
        >
          {formatMoney(anterior)}
        </P.Tramo>
      ) : null}
    </P.Texto>
  )
}

/** Una etiqueta de color: "-20%", "Agotado", "Pack". */
export function Etiqueta({
  P,
  ctx,
  children,
  tamano,
  tono = "acento",
  mayusculas = true,
  estilo,
}: Base & {
  children: ReactNode
  tamano: number
  tono?: "acento" | "tinta" | "papel"
  /** Un precio no va en mayúsculas: "BS" no es la moneda. */
  mayusculas?: boolean
  estilo?: EstiloDibujo
}) {
  const { colores, radio } = ctx.estilo
  const [fondo, texto] =
    tono === "acento"
      ? [colores.acento, colores.sobreAcento]
      : tono === "tinta"
        ? [colores.tinta, colores.papel]
        : [colores.papel, colores.tinta]

  return (
    <P.Caja
      estilo={{
        backgroundColor: fondo,
        borderRadius: Math.min(radio, 3),
        paddingHorizontal: tamano * 0.55,
        paddingVertical: tamano * 0.32,
        alignSelf: "flex-start",
        ...estilo,
      }}
    >
      <P.Texto
        estilo={fuerte(ctx, tamano, {
          color: texto,
          textTransform: mayusculas ? "uppercase" : "none",
          letterSpacing: mayusculas ? tamano * 0.06 : 0,
          lineHeight: 1.1,
        })}
      >
        {children}
      </P.Texto>
    </P.Caja>
  )
}

/**
 * La foto de un producto, con sus avisos encima: agotado o rebajado.
 *
 * Sin foto, el lugar queda con su campo y la inicial del nombre: un hueco
 * vacío parece un error de impresión.
 */
export function FotoDeProducto({
  P,
  ctx,
  producto,
  campos,
  estilo,
  ajuste = "cubrir",
  avisos = true,
  arco,
}: Base & {
  producto: ProductoDelCatalogo
  campos?: Campos
  estilo?: EstiloDibujo
  ajuste?: "cubrir" | "contener"
  avisos?: boolean
  /** El radio de un arco arriba, en puntos: la foto de una vitrina. */
  arco?: number
}) {
  const m = medidas(ctx)
  const { colores, radio } = ctx.estilo
  const descuento = campos?.precioAnterior ? rebaja(producto) : null
  const agotado = producto.stock <= 0

  return (
    <P.Caja
      estilo={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: colores.suave,
        ...(arco
          ? { borderTopLeftRadius: arco, borderTopRightRadius: arco }
          : { borderRadius: radio }),
        ...estilo,
      }}
    >
      {producto.foto ? (
        <P.Foto
          src={producto.foto}
          ajuste={ajuste}
          estilo={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />
      ) : (
        <P.Caja
          estilo={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <P.Texto estilo={titular(ctx, m.titulo, { color: colores.linea })}>
            {inicial(producto.nombre)}
          </P.Texto>
        </P.Caja>
      )}
      {avisos && (agotado || descuento) ? (
        // En un arco, arriba la esquina está recortada: el aviso va abajo.
        <P.Caja
          estilo={{
            position: "absolute",
            left: 6,
            ...(arco ? { bottom: 6 } : { top: 6 }),
          }}
        >
          {agotado ? (
            <Etiqueta P={P} ctx={ctx} tamano={m.chico} tono="tinta">
              Agotado
            </Etiqueta>
          ) : (
            <Etiqueta P={P} ctx={ctx} tamano={m.chico}>
              {`-${descuento}%`}
            </Etiqueta>
          )}
        </P.Caja>
      ) : null}
    </P.Caja>
  )
}

/** Una foto suelta —la de una portada o un separador—, o su campo si no hay. */
export function FotoSuelta({
  P,
  ctx,
  src,
  estilo,
}: Base & { src: string | null; estilo?: EstiloDibujo }) {
  return src ? (
    <P.Foto
      src={src}
      estilo={{ backgroundColor: ctx.estilo.colores.suave, ...estilo }}
    />
  ) : (
    <P.Caja estilo={{ backgroundColor: ctx.estilo.colores.suave, ...estilo }} />
  )
}

/* ---------------------------------------------------------------------------
 * La hoja
 * ------------------------------------------------------------------------ */

/** El pie de una hoja: la tienda y el número de hoja. */
export function Pie({
  P,
  ctx,
  color,
}: Base & {
  /** Para un pie sobre otro fondo que el papel. */
  color?: string
}) {
  const m = medidas(ctx)
  const estilo = rotulo(ctx, m.chico * 0.9, color ? { color } : {})

  return (
    <P.Caja
      estilo={{
        position: "absolute",
        left: m.margen,
        right: m.margen,
        bottom: m.margen * 0.55,
        flexDirection: "row",
        justifyContent: "space-between",
        columnGap: m.gap,
      }}
    >
      <P.Texto estilo={{ ...estilo, flex: 1 }} lineas={1}>
        {ctx.datos.tienda.nombre}
      </P.Texto>
      <P.Texto estilo={estilo}>{`${ctx.numero} / ${ctx.total}`}</P.Texto>
    </P.Caja>
  )
}

/**
 * Una hoja con márgenes y pie: el marco de casi todas las variantes. Lo de
 * adentro se acomoda en columna, y lo que lleve `flex: 1` ocupa lo que sobra.
 */
export function Pagina({
  P,
  ctx,
  children,
  fondo,
  pie = true,
  margenes = true,
}: Base & {
  children: ReactNode
  fondo?: string
  pie?: boolean
  margenes?: boolean
}) {
  const m = medidas(ctx)
  return (
    <P.Hoja
      ancho={ctx.hoja.ancho}
      alto={ctx.hoja.alto}
      estilo={{
        backgroundColor: fondo ?? ctx.estilo.colores.papel,
        ...(margenes
          ? {
              paddingTop: m.margen,
              paddingHorizontal: m.margen,
              paddingBottom: pie ? m.abajo : m.margen,
            }
          : {}),
      }}
    >
      {children}
      {pie ? <Pie P={P} ctx={ctx} /> : null}
    </P.Hoja>
  )
}

/** Lo que mide el encabezado de una hoja de productos, para repartir el resto. */
export function altoDeEncabezado(m: Medidas, conDerecha = false): number {
  const base = m.subtitulo * 1.25 * 1.1 + m.gap * 1.7 + 1
  // En la hoja angosta, lo de la derecha baja a un renglón propio.
  return m.vertical && conDerecha ? base + m.chico * 1.2 + 4 : base
}

/** El título de una hoja de productos, con una regla debajo. */
export function Encabezado({
  P,
  ctx,
  titulo,
  derecha,
}: Base & { titulo: string; derecha?: string }) {
  const m = medidas(ctx)
  if (!titulo && !derecha) return null

  return (
    <P.Caja
      estilo={{
        flexDirection: m.vertical ? "column" : "row",
        alignItems: m.vertical ? "stretch" : "flex-end",
        justifyContent: "space-between",
        columnGap: m.gap,
        rowGap: 4,
        paddingBottom: m.gap * 0.7,
        marginBottom: m.gap,
        borderBottomWidth: 1,
        borderColor: ctx.estilo.colores.tinta,
      }}
    >
      <P.Texto
        estilo={titular(ctx, m.subtitulo * 1.25, m.vertical ? {} : { flex: 1 })}
        lineas={1}
      >
        {titulo}
      </P.Texto>
      {derecha ? (
        <P.Texto estilo={rotulo(ctx, m.chico)}>{derecha}</P.Texto>
      ) : null}
    </P.Caja>
  )
}

/** Una regla de color, corta: el remate de un titular. */
export function Remate({
  P,
  ctx,
  ancho = 48,
  grosor = 4,
  color,
  estilo,
}: Base & {
  ancho?: number
  grosor?: number
  color?: string
  estilo?: EstiloDibujo
}) {
  return (
    <P.Caja
      estilo={{
        width: ancho,
        height: grosor,
        backgroundColor: color ?? ctx.estilo.colores.acento,
        ...estilo,
      }}
    />
  )
}

/** El logo de la tienda, si tiene, en un cuadro. */
export function Logo({
  P,
  ctx,
  lado,
  estilo,
}: Base & { lado: number; estilo?: EstiloDibujo }) {
  const logo = ctx.datos.tienda.logo
  if (!logo) return null
  return (
    <P.Foto
      src={logo}
      ajuste="contener"
      estilo={{ width: lado, height: lado, ...estilo }}
    />
  )
}

/** "Precios y stock al 1 de octubre de 2026". */
export function vigencia(ctx: Contexto): string {
  return `Precios y stock al ${ctx.datos.fecha}`
}

/** Reparte una lista en filas de `columnas`. */
export function enFilas<T>(lista: T[], columnas: number): T[][] {
  const filas: T[][] = []
  for (let i = 0; i < lista.length; i += columnas) {
    filas.push(lista.slice(i, i + columnas))
  }
  return filas
}
