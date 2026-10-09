import type { ReactElement } from "react"

import {
  type Contexto,
  type Hoja,
  type ProductoDelCatalogo,
} from "@/lib/catalogos/datos"
import type { BloqueDe, Campos } from "@/lib/catalogos/modelo"
import { formatMoney, formatNumber } from "@/lib/format"
import type { Primitivas } from "@/components/catalogos/primitivas"
import {
  Encabezado,
  Etiqueta,
  FotoDeProducto,
  Logo,
  Pagina,
  Precio,
  Remate,
  altoDeEncabezado,
  cuerpo,
  detalles,
  enFilas,
  fuerte,
  medidas,
  rebaja,
  rotulo,
  tamanoDeTitular,
  titular,
  vigencia,
  type Medidas,
} from "@/components/catalogos/piezas"

/*
 * Las páginas de productos. Cada variante recibe los productos de una hoja ya
 * contados —`porPagina` del bloque, el resto va a la hoja siguiente— y los
 * acomoda a su manera. El reparto se calcula con `porPagina` y no con los que
 * tocaron en la hoja: así la última se ve igual que las demás, con aire donde
 * faltan productos.
 */

type HojaDeProductos = Extract<Hoja, { clase: "productos" }>

interface Props {
  P: Primitivas
  ctx: Contexto
  hoja: HojaDeProductos
}

interface Base {
  P: Primitivas
  ctx: Contexto
}

/**
 * Cuántos productos reparte una hoja.
 *
 * Si el bloque entra entero en una hoja, los que hay: dos productos en una
 * grilla de seis se ven como dos fotos grandes y no como dos chicas en un
 * rincón. Si ocupa varias, `porPagina`: así la última hoja se ve igual que
 * las demás, con aire donde faltan productos.
 */
function porHoja(hoja: HojaDeProductos): number {
  return hoja.partes === 1
    ? Math.max(1, hoja.productos.length)
    : hoja.bloque.porPagina
}

/* ---------------------------------------------------------------------------
 * El reparto en grilla
 * ------------------------------------------------------------------------ */

interface Reparto {
  columnas: number
  celda: number
  foto: number
}

/**
 * Cuántas columnas y qué alto de foto para `n` productos en un espacio.
 *
 * Prueba de una a seis columnas y se queda con la que deja la foto más cerca
 * de la proporción buscada —alto sobre ancho—, castigando las celdas vacías y
 * el aire que sobra debajo de cada fila. `texto` es lo que ocupa lo que va
 * debajo de la foto.
 */
function repartir(
  n: number,
  ancho: number,
  alto: number,
  gap: number,
  texto: number,
  proporcion = 1.2,
  tope = 1.5
): Reparto {
  let mejor: Reparto | null = null
  let puntaje = Infinity

  for (let columnas = 1; columnas <= 6; columnas++) {
    const filas = Math.ceil(n / columnas)
    const celda = (ancho - gap * (columnas - 1)) / columnas
    const fila = (alto - gap * (filas - 1)) / filas
    const libre = fila - texto
    if (celda < 56 || libre < 36) continue

    const foto = Math.min(libre, celda * tope)
    const sobra = (libre - foto) / fila
    const vacias = columnas * filas - n
    const valor =
      Math.abs(Math.log(foto / celda / proporcion)) + vacias * 0.1 + sobra
    if (valor < puntaje) {
      puntaje = valor
      mejor = { columnas, celda, foto }
    }
  }

  if (mejor) return mejor

  // Demasiados para la hoja: entran igual, con fotos chicas.
  const columnas = Math.min(6, Math.ceil(Math.sqrt(n)))
  const filas = Math.ceil(n / columnas)
  const celda = (ancho - gap * (columnas - 1)) / columnas
  const fila = (alto - gap * (filas - 1)) / filas
  return { columnas, celda, foto: Math.max(fila - texto, 20) }
}

function hayDetalle(campos: Campos): boolean {
  return campos.categoria || campos.stock || campos.codigo
}

/** Lo que ocupa debajo de la foto una celda de grilla. */
function altoDeTexto(m: Medidas, campos: Campos): number {
  return (
    6 +
    m.nombre * 1.25 * 2 +
    (campos.descripcion ? m.cuerpo * 0.9 * 1.38 * 2 + 3 : 0) +
    (hayDetalle(campos) ? m.chico * 1.38 + 3 : 0) +
    (campos.precio ? m.precio * 1.15 + 5 : 0)
  )
}

/** Una grilla de filas con el reparto ya hecho. */
function Grilla({
  P,
  productos,
  reparto,
  gap,
  celda,
  centrar = false,
}: {
  P: Primitivas
  productos: ProductoDelCatalogo[]
  reparto: Reparto
  gap: number
  celda: (producto: ProductoDelCatalogo) => ReactElement
  centrar?: boolean
}) {
  return (
    <P.Caja estilo={{ rowGap: gap }}>
      {enFilas(productos, reparto.columnas).map((fila, indice) => (
        <P.Caja
          key={indice}
          estilo={{
            flexDirection: "row",
            columnGap: gap,
            justifyContent: centrar ? "center" : "flex-start",
          }}
        >
          {fila.map((producto) => (
            <P.Caja key={producto.id} estilo={{ width: reparto.celda }}>
              {celda(producto)}
            </P.Caja>
          ))}
        </P.Caja>
      ))}
    </P.Caja>
  )
}

/** Los productos de la hoja y huecos hasta completar `porPagina`. */
function conHuecos(
  productos: ProductoDelCatalogo[],
  total: number
): (ProductoDelCatalogo | null)[] {
  return [
    ...productos,
    ...Array.from(
      { length: Math.max(0, total - productos.length) },
      () => null
    ),
  ]
}

/* ---------------------------------------------------------------------------
 * Grilla
 * ------------------------------------------------------------------------ */

function CeldaDeGrilla({
  P,
  ctx,
  producto,
  campos,
  foto,
}: Base & { producto: ProductoDelCatalogo; campos: Campos; foto: number }) {
  const m = medidas(ctx)
  const { colores } = ctx.estilo
  const detalle = detalles(producto, campos)

  return (
    <P.Caja estilo={{ rowGap: 3 }}>
      <FotoDeProducto
        P={P}
        ctx={ctx}
        producto={producto}
        campos={campos}
        estilo={{ height: foto, marginBottom: 3 }}
      />
      <P.Texto estilo={fuerte(ctx, m.nombre)} lineas={2}>
        {producto.nombre}
      </P.Texto>
      {campos.descripcion && producto.descripcion ? (
        <P.Texto
          estilo={cuerpo(ctx, m.cuerpo * 0.9, { color: colores.apagado })}
          lineas={2}
        >
          {producto.descripcion}
        </P.Texto>
      ) : null}
      {detalle ? (
        <P.Texto
          estilo={cuerpo(ctx, m.chico, { color: colores.apagado })}
          lineas={1}
        >
          {detalle}
        </P.Texto>
      ) : null}
      <Precio
        P={P}
        ctx={ctx}
        producto={producto}
        campos={campos}
        tamano={m.precio}
        estilo={{ marginTop: 2 }}
      />
    </P.Caja>
  )
}

function VarianteGrilla({ P, ctx, hoja }: Props) {
  const m = medidas(ctx)
  const { bloque } = hoja
  const alto = m.alto - (bloque.titulo ? altoDeEncabezado(m) : 0)
  const reparto = repartir(
    porHoja(hoja),
    m.ancho,
    alto,
    m.gap,
    altoDeTexto(m, bloque.campos)
  )

  return (
    <Pagina P={P} ctx={ctx}>
      <Encabezado P={P} ctx={ctx} titulo={bloque.titulo} />
      <Grilla
        P={P}
        productos={hoja.productos}
        reparto={reparto}
        gap={m.gap}
        celda={(producto) => (
          <CeldaDeGrilla
            P={P}
            ctx={ctx}
            producto={producto}
            campos={bloque.campos}
            foto={reparto.foto}
          />
        )}
      />
    </Pagina>
  )
}

/* ---------------------------------------------------------------------------
 * Lista con detalle
 * ------------------------------------------------------------------------ */

function VarianteLista({ P, ctx, hoja }: Props) {
  const m = medidas(ctx)
  const { bloque } = hoja
  const { campos } = bloque
  const { colores } = ctx.estilo
  const n = porHoja(hoja)
  const separacion = m.gap
  const alto = m.alto - (bloque.titulo ? altoDeEncabezado(m) : 0)
  const fila = (alto - (n - 1) * (separacion * 2 + 0.75)) / n
  const lado = Math.max(40, Math.min(fila, m.ancho * 0.34))
  const nombre = m.subtitulo * 1.1
  const ocupado =
    nombre * 1.04 * 2 + m.chico * 1.38 + m.precio * 1.2 * 1.15 + 20
  const lineas = Math.max(
    0,
    Math.min(8, Math.floor((fila - ocupado) / (m.cuerpo * 1.38)))
  )

  return (
    <Pagina P={P} ctx={ctx}>
      <Encabezado P={P} ctx={ctx} titulo={bloque.titulo} />
      <P.Caja estilo={{ rowGap: separacion }}>
        {hoja.productos.map((producto, indice) => {
          const detalle = detalles(producto, campos)
          return (
            <P.Caja
              key={producto.id}
              estilo={{
                flexDirection: "row",
                columnGap: m.gap * 1.2,
                height: indice > 0 ? fila + separacion + 0.75 : fila,
                ...(indice > 0
                  ? {
                      borderTopWidth: 0.75,
                      borderColor: colores.linea,
                      paddingTop: separacion,
                    }
                  : {}),
              }}
            >
              <FotoDeProducto
                P={P}
                ctx={ctx}
                producto={producto}
                campos={campos}
                estilo={{ width: lado }}
              />
              <P.Caja estilo={{ flex: 1, rowGap: 4 }}>
                {detalle ? (
                  <P.Texto estilo={rotulo(ctx, m.chico)} lineas={1}>
                    {detalle}
                  </P.Texto>
                ) : null}
                <P.Texto estilo={titular(ctx, nombre)} lineas={2}>
                  {producto.nombre}
                </P.Texto>
                {campos.descripcion && producto.descripcion && lineas > 0 ? (
                  <P.Texto
                    estilo={cuerpo(ctx, m.cuerpo, { color: colores.apagado })}
                    lineas={lineas}
                  >
                    {producto.descripcion}
                  </P.Texto>
                ) : null}
                <P.Caja estilo={{ flex: 1 }} />
                <Precio
                  P={P}
                  ctx={ctx}
                  producto={producto}
                  campos={campos}
                  tamano={m.precio * 1.2}
                />
              </P.Caja>
            </P.Caja>
          )
        })}
      </P.Caja>
    </Pagina>
  )
}

/* ---------------------------------------------------------------------------
 * Lista de precios
 * ------------------------------------------------------------------------ */

function VarianteMenu({ P, ctx, hoja }: Props) {
  const m = medidas(ctx)
  const { bloque } = hoja
  const { campos } = bloque
  const { colores } = ctx.estilo
  const fila = (m.alto - altoDeEncabezado(m, true)) / bloque.porPagina
  // Muchos renglones en una hoja angosta no entran con la letra de siempre: se
  // achica en vez de dejar que se pisen, porque el PDF no dibuja lo que no
  // entra en su renglón.
  const necesario =
    m.nombre * 1.25 +
    (hayDetalle(campos) || campos.descripcion ? m.chico * 1.38 + 1 : 0) +
    6
  const escala = Math.min(1, fila / necesario)

  return (
    <Pagina P={P} ctx={ctx}>
      <Encabezado
        P={P}
        ctx={ctx}
        titulo={bloque.titulo}
        derecha={`Precios al ${ctx.datos.fecha}`}
      />
      {hoja.productos.map((producto) => {
        const segunda = [
          detalles(producto, campos),
          campos.descripcion ? producto.descripcion : null,
        ]
          .filter(Boolean)
          .join(" · ")

        return (
          <P.Caja
            key={producto.id}
            estilo={{
              height: fila,
              flexDirection: "row",
              alignItems: "center",
              columnGap: m.gap,
              borderBottomWidth: 0.75,
              borderColor: colores.linea,
            }}
          >
            <P.Caja estilo={{ flex: 1, rowGap: 1 }}>
              <P.Texto estilo={fuerte(ctx, m.nombre * escala)} lineas={1}>
                {producto.nombre}
              </P.Texto>
              {segunda ? (
                <P.Texto
                  estilo={cuerpo(ctx, m.chico * escala, {
                    color: colores.apagado,
                  })}
                  lineas={1}
                >
                  {segunda}
                </P.Texto>
              ) : null}
            </P.Caja>
            {producto.stock <= 0 ? (
              <Etiqueta
                P={P}
                ctx={ctx}
                tamano={m.chico * 0.9 * escala}
                tono="tinta"
              >
                Agotado
              </Etiqueta>
            ) : null}
            <Precio
              P={P}
              ctx={ctx}
              producto={producto}
              campos={campos}
              tamano={m.precio * escala}
              estilo={{ textAlign: "right" }}
            />
          </P.Caja>
        )
      })}
    </Pagina>
  )
}

/* ---------------------------------------------------------------------------
 * Tabla
 * ------------------------------------------------------------------------ */

type ClaveDeColumna = "codigo" | "producto" | "categoria" | "stock" | "precio"

interface Columna {
  clave: ClaveDeColumna
  titulo: string
  ancho?: number
  derecha?: boolean
}

function columnasDeTabla(campos: Campos, angosta: boolean): Columna[] {
  const columnas: (Columna | false)[] = [
    campos.codigo && {
      clave: "codigo",
      titulo: "Código",
      ancho: angosta ? 50 : 66,
    },
    { clave: "producto", titulo: "Producto" },
    campos.categoria && {
      clave: "categoria",
      titulo: "Categoría",
      ancho: angosta ? 72 : 96,
    },
    campos.stock && {
      clave: "stock",
      titulo: "Stock",
      ancho: angosta ? 46 : 54,
      derecha: true,
    },
    campos.precio && {
      clave: "precio",
      titulo: "Precio",
      ancho: angosta ? 70 : 86,
      derecha: true,
    },
  ]
  return columnas.filter((columna): columna is Columna => Boolean(columna))
}

function CeldaDeTabla({
  P,
  ctx,
  columna,
  producto,
  campos,
  escala,
}: Base & {
  columna: Columna
  producto: ProductoDelCatalogo
  campos: Campos
  /** Cuánto se achica la letra para que el renglón entre. */
  escala: number
}) {
  const medida = medidas(ctx)
  const m = {
    chico: medida.chico * escala,
    cuerpo: medida.cuerpo * escala,
  }
  const { colores } = ctx.estilo
  const chico = cuerpo(ctx, m.chico, {
    color: colores.apagado,
    lineHeight: 1.25,
  })

  switch (columna.clave) {
    case "codigo":
      return (
        <P.Texto estilo={chico} lineas={1}>
          {producto.codigo ?? "—"}
        </P.Texto>
      )
    case "producto": {
      const segunda =
        campos.descripcion && producto.descripcion ? producto.descripcion : null
      return (
        <P.Caja estilo={{ rowGap: 1 }}>
          <P.Texto estilo={fuerte(ctx, m.cuerpo)} lineas={1}>
            {producto.nombre}
          </P.Texto>
          {segunda ? (
            <P.Texto estilo={chico} lineas={1}>
              {segunda}
            </P.Texto>
          ) : null}
        </P.Caja>
      )
    }
    case "categoria":
      return (
        <P.Texto estilo={chico} lineas={1}>
          {producto.categoria ?? "—"}
        </P.Texto>
      )
    case "stock":
      return (
        <P.Texto
          estilo={fuerte(ctx, m.cuerpo * 0.95, { textAlign: "right" })}
          lineas={1}
        >
          {producto.stock > 0 ? formatNumber(producto.stock) : "Agotado"}
        </P.Texto>
      )
    case "precio": {
      const anterior =
        campos.precioAnterior && rebaja(producto)
          ? producto.precioAnteriorCents
          : null
      return (
        <P.Caja estilo={{ alignItems: "flex-end", rowGap: 1 }}>
          <P.Texto
            estilo={fuerte(ctx, m.cuerpo * 1.05, {
              color: anterior ? colores.acento : colores.tinta,
              textAlign: "right",
            })}
          >
            {formatMoney(producto.precioCents)}
          </P.Texto>
          {anterior ? (
            <P.Texto
              estilo={{
                ...chico,
                textAlign: "right",
                textDecoration: "line-through",
              }}
            >
              {formatMoney(anterior)}
            </P.Texto>
          ) : null}
        </P.Caja>
      )
    }
  }
}

function VarianteTabla({ P, ctx, hoja }: Props) {
  const m = medidas(ctx)
  const { bloque } = hoja
  const { colores } = ctx.estilo
  const columnas = columnasDeTabla(bloque.campos, m.vertical)
  const cabecera = m.chico * 1.2 + 14
  const fila = Math.min(
    (m.alto - altoDeEncabezado(m, true) - cabecera) / bloque.porPagina,
    m.vertical ? 56 : 42
  )
  const segunda = bloque.campos.descripcion || bloque.campos.precioAnterior
  const necesario = m.cuerpo * 1.25 + (segunda ? m.chico * 1.25 + 1 : 0) + 6
  const escala = Math.min(1, fila / necesario)

  const celda = (columna: Columna) =>
    columna.ancho ? { width: columna.ancho } : { flex: 1 }

  return (
    <Pagina P={P} ctx={ctx}>
      <Encabezado
        P={P}
        ctx={ctx}
        titulo={bloque.titulo}
        derecha={`Precios al ${ctx.datos.fecha}`}
      />
      <P.Caja
        estilo={{
          flexDirection: "row",
          alignItems: "center",
          height: cabecera,
          backgroundColor: colores.tinta,
          paddingHorizontal: 4,
        }}
      >
        {columnas.map((columna) => (
          <P.Caja
            key={columna.clave}
            estilo={{ ...celda(columna), paddingHorizontal: 5 }}
          >
            <P.Texto
              estilo={rotulo(ctx, m.chico * 0.88, {
                color: colores.papel,
                letterSpacing: m.chico * 0.04,
                textAlign: columna.derecha ? "right" : "left",
              })}
              lineas={1}
            >
              {columna.titulo}
            </P.Texto>
          </P.Caja>
        ))}
      </P.Caja>
      {hoja.productos.map((producto, indice) => (
        <P.Caja
          key={producto.id}
          estilo={{
            flexDirection: "row",
            alignItems: "center",
            height: fila,
            paddingHorizontal: 4,
            backgroundColor: indice % 2 === 1 ? colores.suave : colores.papel,
            borderBottomWidth: 0.5,
            borderColor: colores.linea,
          }}
        >
          {columnas.map((columna) => (
            <P.Caja
              key={columna.clave}
              estilo={{ ...celda(columna), paddingHorizontal: 5 }}
            >
              <CeldaDeTabla
                P={P}
                ctx={ctx}
                columna={columna}
                producto={producto}
                campos={bloque.campos}
                escala={escala}
              />
            </P.Caja>
          ))}
        </P.Caja>
      ))}
    </Pagina>
  )
}

/* ---------------------------------------------------------------------------
 * Uno por página
 * ------------------------------------------------------------------------ */

function VarianteDestacado({ P, ctx, hoja }: Props) {
  const m = medidas(ctx)
  const { bloque } = hoja
  const { campos } = bloque
  const { colores } = ctx.estilo

  if (porHoja(hoja) === 1 && hoja.productos[0]) {
    const producto = hoja.productos[0]
    const detalle = detalles(producto, campos)
    return (
      <Pagina P={P} ctx={ctx} margenes={false}>
        <FotoDeProducto
          P={P}
          ctx={ctx}
          producto={producto}
          campos={campos}
          estilo={{
            height: ctx.hoja.alto * (m.vertical ? 0.56 : 0.58),
            borderRadius: 0,
          }}
        />
        <P.Caja
          estilo={{
            flex: 1,
            paddingHorizontal: m.margen,
            paddingTop: m.margen * 0.8,
            paddingBottom: m.abajo,
            rowGap: m.gap * 0.7,
          }}
        >
          {detalle ? (
            <P.Texto
              estilo={rotulo(ctx, m.chico, { color: colores.acento })}
              lineas={1}
            >
              {detalle}
            </P.Texto>
          ) : null}
          <P.Texto
            estilo={titular(
              ctx,
              tamanoDeTitular(ctx, producto.nombre, m.ancho, m.titulo * 1.2)
            )}
            lineas={2}
          >
            {producto.nombre}
          </P.Texto>
          {campos.descripcion && producto.descripcion ? (
            <P.Texto
              estilo={cuerpo(ctx, m.cuerpo * 1.1, { color: colores.apagado })}
              lineas={m.vertical ? 4 : 5}
            >
              {producto.descripcion}
            </P.Texto>
          ) : null}
          <P.Caja estilo={{ flex: 1 }} />
          <Precio
            P={P}
            ctx={ctx}
            producto={producto}
            campos={campos}
            tamano={m.titulo}
          />
        </P.Caja>
      </Pagina>
    )
  }

  // De a varios: franjas con la foto a un lado, como una revista abierta.
  return (
    <Pagina P={P} ctx={ctx} margenes={false}>
      <P.Caja estilo={{ flex: 1, paddingBottom: m.abajo - m.gap }}>
        {conHuecos(hoja.productos, porHoja(hoja)).map((producto, indice) =>
          producto ? (
            <P.Caja
              key={producto.id}
              estilo={{
                flex: 1,
                flexDirection: "row",
                borderTopWidth: indice > 0 ? 0.75 : 0,
                borderColor: colores.linea,
              }}
            >
              <FotoDeProducto
                P={P}
                ctx={ctx}
                producto={producto}
                campos={campos}
                estilo={{ width: m.vertical ? "46%" : "50%", borderRadius: 0 }}
              />
              <P.Caja
                estilo={{
                  flex: 1,
                  paddingHorizontal: m.margen * 0.8,
                  paddingVertical: m.gap * 1.4,
                  rowGap: m.gap * 0.5,
                }}
              >
                {detalles(producto, campos) ? (
                  <P.Texto
                    estilo={rotulo(ctx, m.chico, { color: colores.acento })}
                    lineas={1}
                  >
                    {detalles(producto, campos)}
                  </P.Texto>
                ) : null}
                <P.Texto estilo={titular(ctx, m.subtitulo * 1.4)} lineas={2}>
                  {producto.nombre}
                </P.Texto>
                {campos.descripcion && producto.descripcion ? (
                  <P.Texto
                    estilo={cuerpo(ctx, m.cuerpo, { color: colores.apagado })}
                    lineas={4}
                  >
                    {producto.descripcion}
                  </P.Texto>
                ) : null}
                <P.Caja estilo={{ flex: 1 }} />
                <Precio
                  P={P}
                  ctx={ctx}
                  producto={producto}
                  campos={campos}
                  tamano={m.precio * 1.4}
                />
              </P.Caja>
            </P.Caja>
          ) : (
            <P.Caja key={`hueco-${indice}`} estilo={{ flex: 1 }} />
          )
        )}
      </P.Caja>
    </Pagina>
  )
}

/* ---------------------------------------------------------------------------
 * Lookbook
 * ------------------------------------------------------------------------ */

function altoDeLeyenda(m: Medidas, campos: Campos): number {
  return (
    7 + m.chico * 1.2 * 2 + (campos.descripcion ? m.chico * 1.38 * 2 + 2 : 0)
  )
}

/** Lo que va debajo de una foto de lookbook: corto, para no taparla. */
function Leyenda({
  P,
  ctx,
  producto,
  campos,
}: Base & { producto: ProductoDelCatalogo; campos: Campos }) {
  const m = medidas(ctx)
  const { colores } = ctx.estilo
  return (
    <P.Caja estilo={{ rowGap: 2, paddingTop: 5 }}>
      <P.Caja
        estilo={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          columnGap: 8,
        }}
      >
        <P.Texto
          estilo={rotulo(ctx, m.chico, { color: colores.tinta, flex: 1 })}
          lineas={2}
        >
          {producto.nombre}
        </P.Texto>
        <Precio
          P={P}
          ctx={ctx}
          producto={producto}
          campos={campos}
          tamano={m.chico * 1.2}
          estilo={{ textAlign: "right" }}
        />
      </P.Caja>
      {campos.descripcion && producto.descripcion ? (
        <P.Texto
          estilo={cuerpo(ctx, m.chico, { color: colores.apagado })}
          lineas={2}
        >
          {producto.descripcion}
        </P.Texto>
      ) : null}
    </P.Caja>
  )
}

function VarianteLookbook({ P, ctx, hoja }: Props) {
  const m = medidas(ctx)
  const { bloque } = hoja
  const { campos } = bloque
  const alto = m.alto - (bloque.titulo ? altoDeEncabezado(m) : 0)
  const leyenda = altoDeLeyenda(m, campos)

  // De a dos en A4: una grande arriba a la izquierda y otra más chica abajo a
  // la derecha. La asimetría es lo que lo hace parecer una revista de moda.
  if (porHoja(hoja) === 2 && !m.vertical) {
    const [primero, segundo] = hoja.productos
    const separacion = m.gap * 1.4
    const anchoA = (m.ancho - separacion) * 0.58
    const anchoB = m.ancho - separacion - anchoA
    return (
      <Pagina P={P} ctx={ctx}>
        <Encabezado P={P} ctx={ctx} titulo={bloque.titulo} />
        <P.Caja
          estilo={{ flex: 1, flexDirection: "row", columnGap: separacion }}
        >
          <P.Caja estilo={{ width: anchoA }}>
            {primero ? (
              <>
                <FotoDeProducto
                  P={P}
                  ctx={ctx}
                  producto={primero}
                  campos={campos}
                  estilo={{ height: Math.min(alto - leyenda, anchoA * 1.5) }}
                />
                <Leyenda P={P} ctx={ctx} producto={primero} campos={campos} />
              </>
            ) : null}
          </P.Caja>
          <P.Caja estilo={{ width: anchoB, justifyContent: "flex-end" }}>
            {segundo ? (
              <>
                <FotoDeProducto
                  P={P}
                  ctx={ctx}
                  producto={segundo}
                  campos={campos}
                  estilo={{ height: Math.min(alto * 0.62, anchoB * 1.45) }}
                />
                <Leyenda P={P} ctx={ctx} producto={segundo} campos={campos} />
              </>
            ) : null}
          </P.Caja>
        </P.Caja>
      </Pagina>
    )
  }

  const reparto = repartir(
    porHoja(hoja),
    m.ancho,
    alto,
    m.gap * 1.2,
    leyenda,
    1.35,
    1.6
  )
  return (
    <Pagina P={P} ctx={ctx}>
      <Encabezado P={P} ctx={ctx} titulo={bloque.titulo} />
      <Grilla
        P={P}
        productos={hoja.productos}
        reparto={reparto}
        gap={m.gap * 1.2}
        celda={(producto) => (
          <>
            <FotoDeProducto
              P={P}
              ctx={ctx}
              producto={producto}
              campos={campos}
              estilo={{ height: reparto.foto }}
            />
            <Leyenda P={P} ctx={ctx} producto={producto} campos={campos} />
          </>
        )}
      />
    </Pagina>
  )
}

/* ---------------------------------------------------------------------------
 * Vitrina
 * ------------------------------------------------------------------------ */

function VariantePedestal({ P, ctx, hoja }: Props) {
  const m = medidas(ctx)
  const { bloque } = hoja
  const { campos } = bloque
  const { colores } = ctx.estilo
  const n = porHoja(hoja)
  const columnas = n === 1 ? 1 : n <= 4 ? 2 : 3
  const filas = Math.ceil(n / columnas)
  const gap = m.gap * 2
  const alto = m.alto - (bloque.titulo ? altoDeEncabezado(m) : 0)
  const celda = (m.ancho - gap * (columnas - 1)) / columnas
  const fila = (alto - gap * (filas - 1)) / filas
  const nombre = m.subtitulo * 1.15
  const texto =
    nombre * 1.04 * 2 +
    (campos.descripcion ? m.chico * 1.1 * 1.38 * 2 + 6 : 0) +
    (campos.precio ? m.precio * 1.15 + 6 : 0) +
    30
  const fotoAncho = Math.max(30, Math.min(celda * 0.88, (fila - texto) / 1.28))

  return (
    <Pagina P={P} ctx={ctx}>
      <Encabezado P={P} ctx={ctx} titulo={bloque.titulo} />
      <P.Caja estilo={{ flex: 1, rowGap: gap }}>
        {enFilas(hoja.productos, columnas).map((enFila, indice) => (
          <P.Caja
            key={indice}
            estilo={{
              flex: 1,
              flexDirection: "row",
              columnGap: gap,
              justifyContent: "center",
            }}
          >
            {enFila.map((producto) => (
              <P.Caja
                key={producto.id}
                estilo={{
                  width: celda,
                  alignItems: "center",
                  justifyContent: "center",
                  rowGap: m.gap * 0.55,
                }}
              >
                <FotoDeProducto
                  P={P}
                  ctx={ctx}
                  producto={producto}
                  campos={campos}
                  arco={fotoAncho / 2}
                  estilo={{ width: fotoAncho, height: fotoAncho * 1.28 }}
                />
                <Remate
                  P={P}
                  ctx={ctx}
                  ancho={fotoAncho * 0.42}
                  grosor={1.5}
                  estilo={{ marginBottom: 4 }}
                />
                <P.Texto
                  estilo={titular(ctx, nombre, { textAlign: "center" })}
                  lineas={2}
                >
                  {producto.nombre}
                </P.Texto>
                {campos.descripcion && producto.descripcion ? (
                  <P.Texto
                    estilo={cuerpo(ctx, m.chico * 1.1, {
                      color: colores.apagado,
                      textAlign: "center",
                    })}
                    lineas={2}
                  >
                    {producto.descripcion}
                  </P.Texto>
                ) : null}
                <Precio
                  P={P}
                  ctx={ctx}
                  producto={producto}
                  campos={campos}
                  tamano={m.precio}
                  estilo={{ textAlign: "center" }}
                />
              </P.Caja>
            ))}
          </P.Caja>
        ))}
      </P.Caja>
    </Pagina>
  )
}

/* ---------------------------------------------------------------------------
 * Historia
 * ------------------------------------------------------------------------ */

function Banda({
  P,
  ctx,
  producto,
  campos,
  unica,
}: Base & { producto: ProductoDelCatalogo; campos: Campos; unica: boolean }) {
  const m = medidas(ctx)
  const { colores, radio } = ctx.estilo
  const detalle = detalles(producto, campos)
  const anterior =
    campos.precioAnterior && rebaja(producto)
      ? producto.precioAnteriorCents
      : null

  return (
    <P.Caja estilo={{ flex: 1, position: "relative", overflow: "hidden" }}>
      <FotoDeProducto
        P={P}
        ctx={ctx}
        producto={producto}
        avisos={false}
        estilo={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          borderRadius: 0,
        }}
      />
      <P.Caja
        estilo={{
          position: "absolute",
          left: m.margen,
          right: m.margen,
          bottom: m.margen * (unica ? 1 : 0.6),
          backgroundColor: colores.papel,
          borderRadius: radio,
          padding: m.gap * 1.3,
          rowGap: m.gap * 0.5,
        }}
      >
        {detalle ? (
          <P.Texto estilo={rotulo(ctx, m.chico)} lineas={1}>
            {detalle}
          </P.Texto>
        ) : null}
        <P.Texto
          estilo={titular(ctx, unica ? m.titulo : m.subtitulo * 1.2)}
          lineas={unica ? 3 : 2}
        >
          {producto.nombre}
        </P.Texto>
        {unica && campos.descripcion && producto.descripcion ? (
          <P.Texto
            estilo={cuerpo(ctx, m.cuerpo, { color: colores.apagado })}
            lineas={3}
          >
            {producto.descripcion}
          </P.Texto>
        ) : null}
        <P.Caja
          estilo={{
            flexDirection: "row",
            alignItems: "center",
            columnGap: m.gap * 0.6,
          }}
        >
          {campos.precio ? (
            <Etiqueta
              P={P}
              ctx={ctx}
              tamano={m.precio * (unica ? 1.4 : 1.1)}
              mayusculas={false}
            >
              {formatMoney(producto.precioCents)}
            </Etiqueta>
          ) : null}
          {campos.precio && anterior ? (
            <P.Texto
              estilo={cuerpo(ctx, m.cuerpo, {
                color: colores.apagado,
                textDecoration: "line-through",
              })}
            >
              {formatMoney(anterior)}
            </P.Texto>
          ) : null}
          {producto.stock <= 0 ? (
            <Etiqueta P={P} ctx={ctx} tamano={m.chico} tono="tinta">
              Agotado
            </Etiqueta>
          ) : null}
        </P.Caja>
      </P.Caja>
    </P.Caja>
  )
}

function VarianteHistoria({ P, ctx, hoja }: Props) {
  const m = medidas(ctx)
  const { bloque } = hoja

  return (
    <Pagina P={P} ctx={ctx} pie={false} margenes={false}>
      <P.Caja estilo={{ flex: 1 }}>
        {conHuecos(hoja.productos, porHoja(hoja)).map((producto, indice) =>
          producto ? (
            <Banda
              key={producto.id}
              P={P}
              ctx={ctx}
              producto={producto}
              campos={bloque.campos}
              unica={porHoja(hoja) === 1}
            />
          ) : (
            <P.Caja key={`hueco-${indice}`} estilo={{ flex: 1 }} />
          )
        )}
      </P.Caja>
      <P.Caja
        estilo={{
          position: "absolute",
          top: m.margen * 0.7,
          left: m.margen,
          right: m.margen,
          flexDirection: "row",
          justifyContent: "space-between",
          columnGap: m.gap,
        }}
      >
        <Etiqueta P={P} ctx={ctx} tamano={m.chico} tono="papel">
          {ctx.datos.tienda.nombre}
        </Etiqueta>
        <Etiqueta P={P} ctx={ctx} tamano={m.chico} tono="papel">
          {`${ctx.numero} / ${ctx.total}`}
        </Etiqueta>
      </P.Caja>
    </Pagina>
  )
}

/* ---------------------------------------------------------------------------
 * Etiquetas de feria
 * ------------------------------------------------------------------------ */

function VarianteEtiquetas({ P, ctx, hoja }: Props) {
  const m = medidas(ctx)
  const { bloque } = hoja
  const { campos } = bloque
  const { colores, radio } = ctx.estilo
  const alto = m.alto - (bloque.titulo ? altoDeEncabezado(m) : 0)
  const texto =
    8 + m.nombre * 1.25 * 2 + (hayDetalle(campos) ? m.chico * 1.38 + 3 : 0)
  const reparto = repartir(porHoja(hoja), m.ancho, alto, m.gap, texto, 1, 1.25)

  return (
    <Pagina P={P} ctx={ctx}>
      <Encabezado P={P} ctx={ctx} titulo={bloque.titulo} />
      <Grilla
        P={P}
        productos={hoja.productos}
        reparto={reparto}
        gap={m.gap}
        celda={(producto) => {
          const anterior =
            campos.precioAnterior && rebaja(producto)
              ? producto.precioAnteriorCents
              : null
          const estado = producto.stock <= 0 ? "Agotado" : null
          const detalle = detalles(producto, campos)

          return (
            <P.Caja estilo={{ rowGap: 4 }}>
              <P.Caja estilo={{ height: reparto.foto, position: "relative" }}>
                <FotoDeProducto
                  P={P}
                  ctx={ctx}
                  producto={producto}
                  avisos={false}
                  estilo={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                  }}
                />
                {estado ? (
                  <Etiqueta
                    P={P}
                    ctx={ctx}
                    tamano={m.chico * 0.9}
                    tono="tinta"
                    estilo={{ position: "absolute", top: 6, left: 6 }}
                  >
                    {estado}
                  </Etiqueta>
                ) : null}
                {campos.precio ? (
                  <P.Caja
                    estilo={{
                      position: "absolute",
                      right: 6,
                      bottom: 6,
                      backgroundColor: colores.acento,
                      borderRadius: Math.min(radio, 4),
                      paddingHorizontal: 8,
                      paddingVertical: 5,
                      alignItems: "flex-end",
                    }}
                  >
                    {anterior ? (
                      <P.Texto
                        estilo={cuerpo(ctx, m.chico, {
                          color: colores.sobreAcento,
                          textDecoration: "line-through",
                          lineHeight: 1.1,
                        })}
                      >
                        {formatMoney(anterior)}
                      </P.Texto>
                    ) : null}
                    <P.Texto
                      estilo={titular(ctx, m.precio * 1.5, {
                        color: colores.sobreAcento,
                        textTransform: "none",
                        letterSpacing: 0,
                        lineHeight: 1,
                      })}
                    >
                      {formatMoney(producto.precioCents)}
                    </P.Texto>
                  </P.Caja>
                ) : null}
              </P.Caja>
              <P.Texto estilo={fuerte(ctx, m.nombre)} lineas={2}>
                {producto.nombre}
              </P.Texto>
              {detalle ? (
                <P.Texto
                  estilo={cuerpo(ctx, m.chico, { color: colores.apagado })}
                  lineas={1}
                >
                  {detalle}
                </P.Texto>
              ) : null}
            </P.Caja>
          )
        }}
      />
    </Pagina>
  )
}

/* ---------------------------------------------------------------------------
 * Flyer
 * ------------------------------------------------------------------------ */

function VarianteFlyer({ P, ctx, hoja }: Props) {
  const m = medidas(ctx)
  const { bloque } = hoja
  const { campos } = bloque
  const { colores, radio } = ctx.estilo
  const tienda = ctx.datos.tienda
  const titulo = bloque.titulo || tienda.nombre

  const tamanoTitulo = m.titulo * 1.5
  const cabecera = m.chico * 1.2 + tamanoTitulo * 1.04 * 2 + m.gap * 2.4 + 1.5
  const qr = m.vertical ? 70 : 62
  const franja = qr + m.gap * 1.8 + m.gap
  const alto = ctx.hoja.alto - m.margen * 2 - cabecera - franja
  const texto =
    5 + m.nombre * 1.25 * 2 + (campos.precio ? m.precio * 1.15 + 3 : 0)
  const reparto = repartir(
    porHoja(hoja),
    m.ancho,
    alto,
    m.gap * 0.8,
    texto,
    1.15,
    1.45
  )

  return (
    <Pagina P={P} ctx={ctx} pie={false}>
      <P.Caja
        estilo={{
          flexDirection: "row",
          alignItems: "flex-start",
          columnGap: m.gap,
          paddingBottom: m.gap,
          marginBottom: m.gap,
          borderBottomWidth: 1.5,
          borderColor: colores.tinta,
        }}
      >
        <P.Caja estilo={{ flex: 1, rowGap: m.gap * 0.4 }}>
          <P.Texto
            estilo={rotulo(ctx, m.chico, { color: colores.acento })}
            lineas={1}
          >
            {tienda.nombre}
          </P.Texto>
          <P.Texto
            estilo={titular(
              ctx,
              tamanoDeTitular(ctx, titulo, m.ancho - m.titulo * 2, tamanoTitulo)
            )}
            lineas={2}
          >
            {titulo}
          </P.Texto>
        </P.Caja>
        <Logo P={P} ctx={ctx} lado={m.titulo * 1.8} />
      </P.Caja>

      <P.Caja estilo={{ flex: 1 }}>
        <Grilla
          P={P}
          productos={hoja.productos}
          reparto={reparto}
          gap={m.gap * 0.8}
          celda={(producto) => (
            <P.Caja estilo={{ rowGap: 3 }}>
              <FotoDeProducto
                P={P}
                ctx={ctx}
                producto={producto}
                campos={campos}
                estilo={{ height: reparto.foto, marginBottom: 2 }}
              />
              <P.Texto estilo={fuerte(ctx, m.nombre)} lineas={2}>
                {producto.nombre}
              </P.Texto>
              <Precio
                P={P}
                ctx={ctx}
                producto={producto}
                campos={campos}
                tamano={m.precio}
              />
            </P.Caja>
          )}
        />
      </P.Caja>

      <P.Caja
        estilo={{
          flexDirection: "row",
          alignItems: "center",
          columnGap: m.gap,
          backgroundColor: colores.acento,
          borderRadius: radio,
          padding: m.gap * 0.9,
          marginTop: m.gap,
        }}
      >
        {tienda.qr ? (
          <P.Foto
            src={tienda.qr}
            ajuste="contener"
            estilo={{ width: qr, height: qr, borderRadius: Math.min(radio, 3) }}
          />
        ) : null}
        <P.Caja estilo={{ flex: 1, rowGap: 2 }}>
          <P.Texto
            estilo={rotulo(ctx, m.chico, { color: colores.sobreAcento })}
          >
            {tienda.whatsapp
              ? "Pide por WhatsApp"
              : "Compra en la tienda online"}
          </P.Texto>
          <P.Texto
            estilo={titular(ctx, m.subtitulo * 1.3, {
              color: colores.sobreAcento,
              textTransform: "none",
            })}
            lineas={1}
          >
            {tienda.whatsapp ?? tienda.enlace}
          </P.Texto>
          {tienda.whatsapp ? (
            <P.Texto
              estilo={cuerpo(ctx, m.chico, { color: colores.sobreAcento })}
              lineas={1}
            >
              {tienda.enlace}
            </P.Texto>
          ) : null}
          <P.Texto
            estilo={cuerpo(ctx, m.chico * 0.9, { color: colores.sobreAcento })}
            lineas={1}
          >
            {vigencia(ctx)}
          </P.Texto>
        </P.Caja>
      </P.Caja>
    </Pagina>
  )
}

export const PRODUCTOS: Record<
  BloqueDe<"productos">["variante"],
  (props: Props) => ReactElement
> = {
  grilla: VarianteGrilla,
  lista: VarianteLista,
  menu: VarianteMenu,
  tabla: VarianteTabla,
  destacado: VarianteDestacado,
  lookbook: VarianteLookbook,
  pedestal: VariantePedestal,
  historia: VarianteHistoria,
  etiquetas: VarianteEtiquetas,
  flyer: VarianteFlyer,
}
