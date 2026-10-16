import type { EstiloResuelto } from "@/lib/catalogos/estilo"
import { formatMoney } from "@/lib/format"
import {
  rebajaDe,
  type Diseno,
  type Formato,
  type ProductoParaPublicar,
} from "@/lib/publicar"

/*
 * La imagen de un producto para redes, dibujada en el servidor con `next/og`.
 *
 * Lleva la identidad de la tienda —sus colores, su letra, sus esquinas—, no la
 * de Venduo: es su publicidad, como el catálogo en PDF. `next/og` entiende un
 * subconjunto de CSS: todo es flex, todo `div` con más de un hijo declara
 * `display: flex`, y las letras son las que se le pasan. Por eso los estilos
 * van en línea y no con clases.
 */

export interface DatosDeLaImagen {
  producto: ProductoParaPublicar
  tienda: { nombre: string; enlace: string }
  estilo: EstiloResuelto
  /** La foto ya convertida a JPEG, o `null` si no tiene o no bajó. */
  foto: string | null
  /** El QR de la tienda, solo en la historia. */
  qr: string | null
  diseno: Diseno
  formato: Formato
}

/** El nombre más largo que entra con su letra grande; lo demás se corta. */
const LARGO_MAXIMO = 64

function nombreDelProducto(nombre: string): string {
  const limpio = nombre.trim()
  return limpio.length > LARGO_MAXIMO
    ? `${limpio.slice(0, LARGO_MAXIMO - 1).trimEnd()}…`
    : limpio
}

/** El tamaño del nombre según su largo: uno corto se luce, uno largo entra. */
function tamanoDelNombre(nombre: string, formato: Formato): number {
  const base = formato === "historia" ? 104 : 76
  if (nombre.length <= 14) return base
  if (nombre.length <= 24) return Math.round(base * 0.82)
  if (nombre.length <= 40) return Math.round(base * 0.66)
  return Math.round(base * 0.54)
}

export function ImagenDelProducto(datos: DatosDeLaImagen) {
  if (datos.diseno === "oferta" && rebajaDe(datos.producto)) {
    return <Oferta {...datos} />
  }
  if (datos.diseno === "color") return <Color {...datos} />
  return <FotoGrande {...datos} />
}

/* ---------------------------------------------------------------------------
 * Las piezas
 * ------------------------------------------------------------------------ */

function Foto({
  datos,
  radio,
  fondo,
}: {
  datos: DatosDeLaImagen
  radio: number
  fondo: string
}) {
  const { foto, producto, estilo } = datos
  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        width: "100%",
        borderRadius: radio,
        overflow: "hidden",
        backgroundColor: fondo,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element -- `next/og` dibuja con <img>, no con next/image.
        <img
          src={foto}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div
          style={{
            display: "flex",
            fontFamily: estilo.titular.fuente,
            fontWeight: estilo.titular.peso,
            fontSize: 240,
            color: estilo.colores.apagado,
          }}
        >
          {producto.nombre.trim().charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  )
}

function Nombre({ datos, color }: { datos: DatosDeLaImagen; color: string }) {
  const nombre = nombreDelProducto(datos.producto.nombre)
  const tamano = tamanoDelNombre(nombre, datos.formato)
  const { titular } = datos.estilo
  return (
    <div
      style={{
        display: "flex",
        fontFamily: titular.fuente,
        fontWeight: titular.peso,
        fontSize: tamano,
        lineHeight: 1.02,
        letterSpacing: titular.mayusculas ? "0.01em" : "-0.025em",
        textTransform: titular.mayusculas ? "uppercase" : "none",
        color,
      }}
    >
      {nombre}
    </div>
  )
}

/** El precio en su etiqueta, y el anterior tachado si hay rebaja. */
function Precio({
  datos,
  fondo,
  texto,
  tachado,
}: {
  datos: DatosDeLaImagen
  fondo: string
  texto: string
  tachado: string
}) {
  const { producto, estilo, formato } = datos
  const grande = formato === "historia" ? 76 : 58
  const rebaja = rebajaDe(producto)
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
      <div
        style={{
          display: "flex",
          backgroundColor: fondo,
          color: texto,
          fontFamily: estilo.titular.fuente,
          fontWeight: estilo.titular.peso,
          fontSize: grande,
          lineHeight: 1,
          padding: `${Math.round(grande * 0.26)}px ${Math.round(grande * 0.4)}px`,
          borderRadius: estilo.radio * 3,
        }}
      >
        {formatMoney(producto.precioCents)}
      </div>
      {rebaja && producto.precioAnteriorCents ? (
        <div
          style={{
            display: "flex",
            fontFamily: estilo.cuerpo.fuente,
            fontWeight: estilo.cuerpo.pesoFuerte,
            fontSize: Math.round(grande * 0.56),
            color: tachado,
            textDecoration: "line-through",
          }}
        >
          {formatMoney(producto.precioAnteriorCents)}
        </div>
      ) : null}
    </div>
  )
}

/** La tienda y su dirección, y en la historia su QR: a dónde ir a comprar. */
function Pie({
  datos,
  color,
  suave,
}: {
  datos: DatosDeLaImagen
  color: string
  suave: string
}) {
  const { tienda, estilo, qr, formato } = datos
  const historia = formato === "historia"
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 32,
      }}
    >
      {/* El texto toma lo que sobra y se parte si no entra: un enlace largo
          —el de una vista previa, un subdominio— empujaba el QR afuera. */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: estilo.cuerpo.fuente,
            fontWeight: estilo.cuerpo.pesoFuerte,
            fontSize: historia ? 38 : 30,
            color,
          }}
        >
          {tienda.nombre}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: estilo.cuerpo.fuente,
            fontWeight: estilo.cuerpo.peso,
            fontSize: historia ? 32 : 26,
            lineHeight: 1.25,
            color: suave,
          }}
        >
          {/* Se parte después de una barra o un punto, nunca a media palabra. */}
          {tienda.enlace.replace(/([/.])/g, "$1\u200b")}
        </div>
      </div>
      {historia && qr ? (
        // eslint-disable-next-line @next/next/no-img-element -- `next/og` dibuja con <img>.
        <img
          src={qr}
          alt=""
          width={168}
          height={168}
          style={{ flexShrink: 0, borderRadius: estilo.radio * 2 }}
        />
      ) : null}
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Los diseños
 * ------------------------------------------------------------------------ */

/** La foto manda, a todo lo ancho; abajo, el nombre, el precio y la tienda. */
function FotoGrande(datos: DatosDeLaImagen) {
  const { estilo, formato } = datos
  const c = estilo.colores
  const margen = formato === "historia" ? 80 : 64
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: c.papel,
      }}
    >
      <Foto datos={datos} radio={0} fondo={c.suave} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: formato === "historia" ? 36 : 24,
          padding: `${formato === "historia" ? 64 : 44}px ${margen}px ${margen}px`,
        }}
      >
        <Nombre datos={datos} color={c.tinta} />
        <Precio
          datos={datos}
          fondo={c.acento}
          texto={c.sobreAcento}
          tachado={c.apagado}
        />
        <div style={{ display: "flex", height: 2, backgroundColor: c.linea }} />
        <Pie datos={datos} color={c.tinta} suave={c.apagado} />
      </div>
    </div>
  )
}

/** El color de la tienda de fondo y la foto enmarcada en el papel. */
function Color(datos: DatosDeLaImagen) {
  const { estilo, formato } = datos
  const c = estilo.colores
  const margen = formato === "historia" ? 80 : 60
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: margen,
        gap: formato === "historia" ? 48 : 30,
        backgroundColor: c.acento,
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          padding: 16,
          backgroundColor: c.papel,
          borderRadius: estilo.radio * 3,
        }}
      >
        <Foto datos={datos} radio={estilo.radio * 2} fondo={c.suave} />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: formato === "historia" ? 32 : 20,
        }}
      >
        <Nombre datos={datos} color={c.sobreAcento} />
        <Precio
          datos={datos}
          fondo={c.papel}
          texto={c.tinta}
          tachado={c.sobreAcento}
        />
        <Pie datos={datos} color={c.sobreAcento} suave={c.sobreAcento} />
      </div>
    </div>
  )
}

/** El descuento en grande, en una franja del color de la tienda. */
function Oferta(datos: DatosDeLaImagen) {
  const { estilo, formato, producto } = datos
  const c = estilo.colores
  const historia = formato === "historia"
  const margen = historia ? 80 : 60
  const rebaja = rebajaDe(producto) ?? 0
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: c.papel,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 24,
          padding: `${historia ? 56 : 36}px ${margen}px`,
          backgroundColor: c.acento,
          color: c.sobreAcento,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: estilo.titular.fuente,
            fontWeight: estilo.titular.peso,
            fontSize: historia ? 220 : 150,
            lineHeight: 0.9,
            letterSpacing: "-0.04em",
          }}
        >
          {`−${rebaja}%`}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: estilo.cuerpo.fuente,
            fontWeight: estilo.cuerpo.pesoFuerte,
            fontSize: historia ? 44 : 34,
          }}
        >
          de descuento
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          padding: `${historia ? 48 : 32}px ${margen}px 0`,
        }}
      >
        <Foto datos={datos} radio={estilo.radio * 3} fondo={c.suave} />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: historia ? 32 : 20,
          padding: `${historia ? 48 : 30}px ${margen}px ${margen}px`,
        }}
      >
        <Nombre datos={datos} color={c.tinta} />
        <Precio
          datos={datos}
          fondo={c.acento}
          texto={c.sobreAcento}
          tachado={c.apagado}
        />
        <Pie datos={datos} color={c.tinta} suave={c.apagado} />
      </div>
    </div>
  )
}
