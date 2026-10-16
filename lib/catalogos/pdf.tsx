import "server-only"

import * as React from "react"
import path from "node:path"
import {
  Document,
  Font,
  Image,
  Page,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer"
import type { Style } from "@react-pdf/types"

import { fotoEnBase64 } from "@/lib/fotos"
import type { Catalogo } from "@/lib/catalogos/modelo"
import {
  hojasDe,
  type DatosDelCatalogo,
  type ProductoDelCatalogo,
} from "@/lib/catalogos/datos"
import { METRICAS, PESOS, problemasDeEstilo } from "@/lib/catalogos/estilo"
import type { ClaveFuente } from "@/lib/plantillas/fuentes"
import { HojasDelCatalogo } from "@/components/catalogos/documento"
import {
  textoLimpio,
  type EstiloDibujo,
  type Primitivas,
} from "@/components/catalogos/primitivas"
import { slugify } from "@/lib/format"

/*
 * El catálogo en PDF, armado en el servidor.
 *
 * Se arma acá y no en el navegador por lo mismo que el informe de
 * estadísticas: la biblioteca y las tipografías pesan más que varias
 * pantallas, y quien edita está en datos móviles. Al teléfono llega solo el
 * archivo.
 */

/* ---------------------------------------------------------------------------
 * Tipografías
 * ------------------------------------------------------------------------ */

let registradas = false

/**
 * Todas las letras de las plantillas, leídas del disco y no de una URL: un
 * corte de red en mitad de una demostración devolvería un catálogo con otra
 * letra. Se registran con su clave, así el estilo de dibujo las nombra igual
 * en el PDF y en la vista previa.
 */
function registrarFuentes() {
  if (registradas) return
  const carpeta = path.join(process.cwd(), "public", "fuentes")

  for (const [fuente, pesos] of Object.entries(PESOS)) {
    Font.register({
      family: fuente,
      fonts: [
        ...pesos.map((peso) => ({
          src: path.join(carpeta, `${fuente}-${peso}.ttf`),
          fontWeight: peso,
        })),
        // La única cursiva que existe: la de la cita, con Cormorant.
        ...(fuente === "cormorant"
          ? [
              {
                src: path.join(carpeta, "cormorant-500-italica.ttf"),
                fontWeight: 500,
                fontStyle: "italic" as const,
              },
            ]
          : []),
      ],
    })
  }

  // El diccionario de cortes por defecto es inglés: sin esto una palabra
  // larga se parte por cualquier lado.
  Font.registerHyphenationCallback((palabra) => [palabra])
  registradas = true
}

/* ---------------------------------------------------------------------------
 * Las piezas, en @react-pdf
 * ------------------------------------------------------------------------ */

function aPdf(estilo: EstiloDibujo = {}): Style {
  const { fuente, gap, ...resto } = estilo
  const pdf: Record<string, unknown> = { ...resto }
  if (fuente) pdf.fontFamily = fuente satisfies ClaveFuente
  if (gap !== undefined) {
    pdf.rowGap ??= gap
    pdf.columnGap ??= gap
  }
  return pdf as Style
}

/**
 * Cuánto hay que bajar un párrafo para que sus renglones caigan donde los pone
 * el navegador.
 *
 * El navegador centra la letra en el alto del renglón: lo que sobra o falta se
 * reparte mitad arriba y mitad abajo. `@react-pdf` la apoya arriba y deja todo
 * abajo. Con un interlineado apretado —un titular en mayúsculas— la letra se
 * salía por debajo y pisaba lo siguiente. Correr el párrafo la mitad de esa
 * diferencia, sin cambiar lo que ocupa, deja los dos dibujos iguales.
 */
function corrimiento(estilo: EstiloDibujo): number {
  const { fuente, fontSize, lineHeight } = estilo
  if (!fuente || !fontSize || !lineHeight) return 0
  const { sube, baja } = METRICAS[fuente]
  return ((lineHeight - sube - baja) * fontSize) / 2
}

const pdf: Primitivas = {
  Hoja: ({ ancho, alto, estilo, children }) => {
    const { backgroundColor, ...resto } = aPdf(estilo)
    return (
      // La hoja entera va en una caja absoluta de su medida. Con
      // `wrap={false}`, la página toma el alto de lo que tiene adentro; sin
      // él, lo que no entra se pasa a otra hoja. Una caja absoluta no se
      // pagina: lo que no entra se recorta, igual que en la vista previa, y
      // las hojas siguen siendo las que se contaron.
      <Page size={[ancho, alto]} style={{ backgroundColor }}>
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: ancho,
            height: alto,
            overflow: "hidden",
            ...resto,
          }}
        >
          {children}
        </View>
      </Page>
    )
  },

  Caja: ({ estilo, children }) => <View style={aPdf(estilo)}>{children}</View>,

  Texto: ({ estilo = {}, lineas, children }) => {
    const corrido = corrimiento(estilo)
    return (
      <Text
        style={{
          ...aPdf(estilo),
          ...(corrido
            ? {
                marginTop: (estilo.marginTop ?? 0) + corrido,
                marginBottom: (estilo.marginBottom ?? 0) - corrido,
              }
            : {}),
          ...(lineas ? { maxLines: lineas, textOverflow: "ellipsis" } : {}),
        }}
      >
        {textoLimpio(children)}
      </Text>
    )
  },

  Tramo: ({ estilo, children }) => (
    <Text style={aPdf(estilo)}>{textoLimpio(children)}</Text>
  ),

  Foto: ({ src, estilo, ajuste = "cubrir" }) => (
    <View style={{ ...aPdf(estilo), overflow: "hidden" }}>
      {src ? (
        // eslint-disable-next-line jsx-a11y/alt-text -- un PDF no lleva alt
        <Image
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: ajuste === "cubrir" ? "cover" : "contain",
          }}
        />
      ) : null}
    </View>
  ),
}

/* ---------------------------------------------------------------------------
 * Fotos
 * ------------------------------------------------------------------------ */

/** Lado mayor de una foto en el PDF: nítida a toda hoja y liviana para WhatsApp. */
const LADO_MAXIMO = 1000

function fotoParaPdf(url: string, formato: "jpeg" | "png" = "jpeg") {
  return fotoEnBase64(url, { formato, lado: LADO_MAXIMO })
}

/** Convierte de a pocas para no abrir treinta conexiones a la vez. */
async function enTandas<T, R>(
  lista: T[],
  tamano: number,
  hacer: (item: T) => Promise<R>
): Promise<R[]> {
  const resultado: R[] = []
  for (let i = 0; i < lista.length; i += tamano) {
    resultado.push(
      ...(await Promise.all(lista.slice(i, i + tamano).map(hacer)))
    )
  }
  return resultado
}

/**
 * Los datos del catálogo con sus fotos convertidas. Solo se bajan las de los
 * productos que el catálogo usa, no las de toda la tienda.
 */
async function conFotos(
  catalogo: Catalogo,
  datos: DatosDelCatalogo
): Promise<DatosDelCatalogo> {
  const usados = new Set<string>(catalogo.productos)
  for (const pack of catalogo.packs)
    pack.productos.forEach((id) => usados.add(id))
  for (const bloque of catalogo.bloques) {
    if (bloque.tipo === "productos" && bloque.cuales.tipo === "elegidos") {
      bloque.cuales.productos.forEach((id) => usados.add(id))
    }
  }

  const productos = [...usados]
    .map((id) => datos.productos[id])
    .filter((producto): producto is ProductoDelCatalogo => Boolean(producto))

  const convertidos = await enTandas(productos, 6, async (producto) => ({
    ...producto,
    foto: producto.foto ? await fotoParaPdf(producto.foto) : null,
  }))

  const logo = datos.tienda.logo
    ? await fotoParaPdf(datos.tienda.logo, "png")
    : null

  return {
    ...datos,
    tienda: { ...datos.tienda, logo },
    productos: Object.fromEntries(convertidos.map((p) => [p.id, p])),
  }
}

/* ---------------------------------------------------------------------------
 * El archivo
 * ------------------------------------------------------------------------ */

export async function catalogoEnPdf(
  catalogo: Catalogo,
  datos: DatosDelCatalogo
): Promise<Buffer> {
  registrarFuentes()
  const listos = await conFotos(catalogo, datos)

  return renderToBuffer(
    <Document
      title={catalogo.nombre}
      author={datos.tienda.nombre}
      creator="Venduo"
      producer="Venduo"
    >
      <HojasDelCatalogo P={pdf} catalogo={catalogo} datos={listos} />
    </Document>
  )
}

/** Un nombre de archivo que sobreviva a cualquier sistema de archivos. */
export function nombreDeArchivo(texto: string): string {
  return `${slugify(texto) || "catalogo"}.pdf`
}

/**
 * El PDF de un catálogo como respuesta, o por qué no se puede armar.
 *
 * Las tres rutas que lo sirven —el borrador del editor, uno guardado y el
 * enlace compartido— pasan por acá, así que las tres exigen lo mismo: que se
 * lea y que tenga al menos una hoja.
 */
export async function respuestaDePdf(
  catalogo: Catalogo,
  datos: DatosDelCatalogo,
  {
    descarga = null,
  }: {
    /**
     * Si viene, el PDF se baja como archivo en vez de abrirse en el visor. Si
     * además es una marca, vuelve en una cookie para que el editor sepa que
     * la descarga ya empezó.
     */
    descarga?: string | null
  } = {}
): Promise<Response> {
  const [problema] = problemasDeEstilo(catalogo.estilo)
  if (problema) return aviso(problema, 422)

  if (hojasDe(catalogo, datos).length === 0) {
    return aviso(
      "El catálogo no tiene hojas todavía: elige productos o agrega una portada.",
      422
    )
  }

  const cuerpo = await catalogoEnPdf(catalogo, datos)
  const archivo = nombreDeArchivo(catalogo.nombre)
  const cabeceras = new Headers({
    "Content-Type": "application/pdf",
    // `inline` abre el visor del navegador, que trae su propio botón de
    // descarga. `attachment` lo guarda como archivo: es lo que hace que el
    // navegador lo deje en Descargas, con su nombre y su `.pdf`. Un enlace a
    // un blob, en cambio, algunos navegadores lo guardaban sin extensión y
    // en una carpeta temporal.
    "Content-Disposition": `${descarga ? "attachment" : "inline"}; filename="${archivo}"; filename*=UTF-8''${encodeURIComponent(archivo)}`,
    // Los precios y el stock son los del momento: nunca de una memoria.
    "Cache-Control": "no-store",
  })
  if (descarga && /^[a-z0-9]{8,64}$/.test(descarga)) {
    cabeceras.append(
      "Set-Cookie",
      `descarga=${descarga}; Path=/; Max-Age=120; SameSite=Lax`
    )
  }

  return new Response(new Uint8Array(cuerpo), { headers: cabeceras })
}

/** Un aviso en texto, para que el editor lo muestre tal cual. */
export function aviso(texto: string, estado: number): Response {
  return new Response(texto, {
    status: estado,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
