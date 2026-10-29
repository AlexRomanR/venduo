/**
 * Planillas de Excel (`.xlsx`) escritas a mano, sin dependencias.
 *
 * Un `.xlsx` es un ZIP con unos XML adentro. Se arma sin comprimir —el formato
 * lo permite— y con los textos en la misma celda (`inlineStr`): así alcanza con
 * unas pocas funciones, y Excel, Google Sheets y las apps del celular lo abren.
 * Se eligió `.xlsx` y no CSV porque un CSV con comas se abre en una sola
 * columna en un Excel en español, y "85.50" puede leerse como 8550.
 *
 * Neutral: sin servidor ni navegador. Lo usan las rutas de descarga.
 */

export type TipoDeColumna = "texto" | "entero" | "monto" | "fecha"

export interface Columna {
  titulo: string
  tipo?: TipoDeColumna
  /** El ancho en caracteres. */
  ancho?: number
}

/** Un monto va en bolivianos; una fecha, como `AAAA-MM-DD`. */
export type Celda = string | number | null

export interface Hoja {
  nombre: string
  columnas: Columna[]
  filas: Celda[][]
}

/** Centavos a bolivianos, para una celda de monto. */
export function montoParaPlanilla(cents: number): number {
  return Math.round(cents) / 100
}

/** El número de día de Excel: días desde el 30 de diciembre de 1899. */
export function diaDeExcel(dia: string): number | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dia)
  if (!partes) return null
  const [, anio, mes, numero] = partes.map(Number)
  return (Date.UTC(anio, mes - 1, numero) - Date.UTC(1899, 11, 30)) / 86_400_000
}

const ESTILO: Record<TipoDeColumna, number> = {
  texto: 0,
  entero: 0,
  monto: 2,
  fecha: 3,
}

export function crearXlsx(hojas: Hoja[]): Uint8Array {
  const archivos: [string, string][] = [
    ["[Content_Types].xml", tiposDeContenido(hojas.length)],
    ["_rels/.rels", RELACIONES],
    ["xl/workbook.xml", libro(hojas)],
    ["xl/_rels/workbook.xml.rels", relacionesDelLibro(hojas.length)],
    ["xl/styles.xml", ESTILOS],
    ...hojas.map((hoja, i): [string, string] => [
      `xl/worksheets/sheet${i + 1}.xml`,
      hojaXml(hoja),
    ]),
  ]
  const codificador = new TextEncoder()
  return zipSinComprimir(
    archivos.map(([nombre, xml]) => [nombre, codificador.encode(xml)])
  )
}

/* ---------------------------------------------------------------------------
 * Los XML
 * ------------------------------------------------------------------------ */

const CABECERA = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
const NS = "http://schemas.openxmlformats.org"

function tiposDeContenido(hojas: number) {
  const tipo = "application/vnd.openxmlformats-officedocument"
  return (
    CABECERA +
    `<Types xmlns="${NS}/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="${tipo}.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/styles.xml" ContentType="${tipo}.spreadsheetml.styles+xml"/>` +
    Array.from(
      { length: hojas },
      (_, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="${tipo}.spreadsheetml.worksheet+xml"/>`
    ).join("") +
    `</Types>`
  )
}

const RELACIONES =
  CABECERA +
  `<Relationships xmlns="${NS}/package/2006/relationships">` +
  `<Relationship Id="rId1" Type="${NS}/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
  `</Relationships>`

function libro(hojas: Hoja[]) {
  return (
    CABECERA +
    `<workbook xmlns="${NS}/spreadsheetml/2006/main" xmlns:r="${NS}/officeDocument/2006/relationships"><sheets>` +
    hojas
      .map(
        (hoja, i) =>
          `<sheet name="${xml(nombreDeHoja(hoja.nombre))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`
      )
      .join("") +
    `</sheets></workbook>`
  )
}

function relacionesDelLibro(hojas: number) {
  const base = `${NS}/officeDocument/2006/relationships`
  return (
    CABECERA +
    `<Relationships xmlns="${NS}/package/2006/relationships">` +
    Array.from(
      { length: hojas },
      (_, i) =>
        `<Relationship Id="rId${i + 1}" Type="${base}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
    ).join("") +
    `<Relationship Id="rId${hojas + 1}" Type="${base}/styles" Target="styles.xml"/>` +
    `</Relationships>`
  )
}

/**
 * Cuatro estilos: normal, encabezado en negrita, monto con dos decimales y
 * fecha. Los separadores de miles y decimales los pone cada Excel según su
 * idioma: en español sale "1.250,50".
 */
const ESTILOS =
  CABECERA +
  `<styleSheet xmlns="${NS}/spreadsheetml/2006/main">` +
  `<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts>` +
  `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
  `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
  `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
  `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
  `<cellXfs count="4">` +
  `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
  `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
  `<xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
  `<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
  `</cellXfs>` +
  `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
  `</styleSheet>`

function hojaXml(hoja: Hoja) {
  const anchos = hoja.columnas
    .map(
      (columna, i) =>
        `<col min="${i + 1}" max="${i + 1}" width="${anchoDe(columna)}" customWidth="1"/>`
    )
    .join("")
  const encabezado = fila(
    1,
    hoja.columnas.map((c) => c.titulo),
    hoja.columnas.map(() => 1),
    hoja.columnas.map(() => "texto")
  )
  const cuerpo = hoja.filas
    .map((celdas, i) =>
      fila(
        i + 2,
        celdas,
        hoja.columnas.map((c) => ESTILO[c.tipo ?? "texto"]),
        hoja.columnas.map((c) => c.tipo ?? "texto")
      )
    )
    .join("")
  // La fila de encabezado queda fija al bajar.
  return (
    CABECERA +
    `<worksheet xmlns="${NS}/spreadsheetml/2006/main">` +
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    `<cols>${anchos}</cols><sheetData>${encabezado}${cuerpo}</sheetData></worksheet>`
  )
}

/** El ancho de una columna: el pedido, o lo que entra su título y su dato. */
function anchoDe(columna: Columna) {
  const minimo = { texto: 10, entero: 8, monto: 13, fecha: 12 }
  return (
    columna.ancho ??
    Math.max(minimo[columna.tipo ?? "texto"], columna.titulo.length + 2)
  )
}

function fila(
  numero: number,
  celdas: Celda[],
  estilos: number[],
  tipos: TipoDeColumna[]
) {
  return (
    `<row r="${numero}">` +
    celdas
      .map((valor, i) =>
        celda(
          `${letraDeColumna(i)}${numero}`,
          valor,
          estilos[i] ?? 0,
          tipos[i] ?? "texto"
        )
      )
      .join("") +
    `</row>`
  )
}

function celda(
  referencia: string,
  valor: Celda,
  estilo: number,
  tipo: TipoDeColumna
) {
  if (valor === null || valor === "") return ""
  const s = estilo ? ` s="${estilo}"` : ""
  if (tipo === "fecha" && typeof valor === "string") {
    const dia = diaDeExcel(valor)
    if (dia !== null) return `<c r="${referencia}"${s}><v>${dia}</v></c>`
  }
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return `<c r="${referencia}"${s}><v>${valor}</v></c>`
  }
  return `<c r="${referencia}" t="inlineStr"${s}><is><t xml:space="preserve">${xml(String(valor))}</t></is></c>`
}

/** A, B, …, Z, AA, AB… */
export function letraDeColumna(indice: number): string {
  let letras = ""
  for (let n = indice + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    letras = String.fromCharCode(65 + ((n - 1) % 26)) + letras
  }
  return letras
}

/** Excel no acepta en el nombre de una hoja `[]:*?/\` ni más de 31 letras. */
function nombreDeHoja(nombre: string) {
  return nombre.replace(/[[\]:*?/\\]/g, " ").slice(0, 31) || "Hoja"
}

/** Escapa para XML y quita los caracteres de control que lo invalidan. */
function xml(texto: string) {
  return texto
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/* ---------------------------------------------------------------------------
 * El ZIP, sin comprimir
 * ------------------------------------------------------------------------ */

const TABLA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

export function crc32(datos: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of datos) crc = TABLA_CRC[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function zipSinComprimir(archivos: [string, Uint8Array][]): Uint8Array {
  const codificador = new TextEncoder()
  const locales: Uint8Array[] = []
  const centrales: Uint8Array[] = []
  let desplazamiento = 0

  for (const [nombre, datos] of archivos) {
    const nombreEnBytes = codificador.encode(nombre)
    const crc = crc32(datos)

    const local = new Uint8Array(30 + nombreEnBytes.length)
    const l = new DataView(local.buffer)
    l.setUint32(0, 0x04034b50, true)
    l.setUint16(4, 20, true)
    l.setUint16(6, 0x0800, true) // nombres en UTF-8
    l.setUint16(8, 0, true) // sin comprimir
    l.setUint32(14, crc, true)
    l.setUint32(18, datos.length, true)
    l.setUint32(22, datos.length, true)
    l.setUint16(26, nombreEnBytes.length, true)
    local.set(nombreEnBytes, 30)

    const central = new Uint8Array(46 + nombreEnBytes.length)
    const c = new DataView(central.buffer)
    c.setUint32(0, 0x02014b50, true)
    c.setUint16(4, 20, true)
    c.setUint16(6, 20, true)
    c.setUint16(8, 0x0800, true)
    c.setUint16(10, 0, true)
    c.setUint32(16, crc, true)
    c.setUint32(20, datos.length, true)
    c.setUint32(24, datos.length, true)
    c.setUint16(28, nombreEnBytes.length, true)
    c.setUint32(42, desplazamiento, true)
    central.set(nombreEnBytes, 46)

    locales.push(local, datos)
    centrales.push(central)
    desplazamiento += local.length + datos.length
  }

  const tamanoCentral = centrales.reduce((t, c) => t + c.length, 0)
  const fin = new Uint8Array(22)
  const f = new DataView(fin.buffer)
  f.setUint32(0, 0x06054b50, true)
  f.setUint16(8, archivos.length, true)
  f.setUint16(10, archivos.length, true)
  f.setUint32(12, tamanoCentral, true)
  f.setUint32(16, desplazamiento, true)

  const partes = [...locales, ...centrales, fin]
  const total = new Uint8Array(partes.reduce((t, p) => t + p.length, 0))
  let posicion = 0
  for (const parte of partes) {
    total.set(parte, posicion)
    posicion += parte.length
  }
  return total
}

/* ---------------------------------------------------------------------------
 * Leer una planilla: Excel (.xlsx) o CSV, como la tenga quien vende
 * ------------------------------------------------------------------------ */

/** Las filas de una planilla, como texto, sin filas vacías. */
export type Filas = string[][]

/**
 * Los archivos de un ZIP. Lee sin comprimir y comprimido (deflate), con el
 * `DecompressionStream` del navegador y de Node: sin dependencias.
 */
export async function leerZip(
  datos: Uint8Array
): Promise<Map<string, Uint8Array>> {
  const vista = new DataView(datos.buffer, datos.byteOffset, datos.byteLength)
  let fin = -1
  for (
    let i = datos.length - 22;
    i >= Math.max(0, datos.length - 66_000);
    i--
  ) {
    if (vista.getUint32(i, true) === 0x06054b50) {
      fin = i
      break
    }
  }
  if (fin < 0) throw new Error("No es un archivo ZIP")

  const cuantos = vista.getUint16(fin + 10, true)
  let posicion = vista.getUint32(fin + 16, true)
  const decodificador = new TextDecoder()
  const archivos = new Map<string, Uint8Array>()

  for (let n = 0; n < cuantos; n++) {
    if (vista.getUint32(posicion, true) !== 0x02014b50) break
    const metodo = vista.getUint16(posicion + 10, true)
    const comprimido = vista.getUint32(posicion + 20, true)
    const largoNombre = vista.getUint16(posicion + 28, true)
    const largoExtra = vista.getUint16(posicion + 30, true)
    const largoComentario = vista.getUint16(posicion + 32, true)
    const local = vista.getUint32(posicion + 42, true)
    const nombre = decodificador.decode(
      datos.subarray(posicion + 46, posicion + 46 + largoNombre)
    )
    const inicio =
      local +
      30 +
      vista.getUint16(local + 26, true) +
      vista.getUint16(local + 28, true)
    const crudo = datos.subarray(inicio, inicio + comprimido)
    if (metodo === 0) archivos.set(nombre, crudo)
    else if (metodo === 8) archivos.set(nombre, await descomprimir(crudo))
    posicion += 46 + largoNombre + largoExtra + largoComentario
  }
  return archivos
}

async function descomprimir(datos: Uint8Array): Promise<Uint8Array> {
  const flujo = new Blob([datos as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"))
  return new Uint8Array(await new Response(flujo).arrayBuffer())
}

/** La primera hoja de un `.xlsx`, como filas de texto. */
export async function leerXlsx(datos: Uint8Array): Promise<Filas> {
  const archivos = await leerZip(datos)
  const texto = (nombre: string) => {
    const bytes = archivos.get(nombre)
    return bytes ? new TextDecoder().decode(bytes) : ""
  }

  const compartidos = [
    ...texto("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g),
  ].map(([, si]) => textoDeNodos(si))

  // La primera hoja según el libro; si no se encuentra, la primera que haya.
  const relaciones = texto("xl/_rels/workbook.xml.rels")
  const primera = /<sheet\b[^>]*r:id="([^"]+)"/.exec(
    texto("xl/workbook.xml")
  )?.[1]
  const destino = primera
    ? new RegExp(
        `Id="${primera}"[^>]*Target="([^"]+)"|Target="([^"]+)"[^>]*Id="${primera}"`
      ).exec(relaciones)
    : null
  const ruta = destino
    ? `xl/${(destino[1] ?? destino[2]).replace(/^\/?xl\//, "").replace(/^\//, "")}`
    : [...archivos.keys()]
        .filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
        .sort()[0]
  const hoja = ruta ? texto(ruta) : ""

  const filas: Filas = []
  for (const [, contenido] of hoja.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const fila: string[] = []
    for (const [, atributos, interior] of contenido.matchAll(
      /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g
    )) {
      const columna = /r="([A-Z]+)\d+"/.exec(atributos)?.[1]
      const indice = columna ? indiceDeColumna(columna) : fila.length
      const tipo = /t="([^"]+)"/.exec(atributos)?.[1]
      const valor = /<v>([\s\S]*?)<\/v>/.exec(interior ?? "")?.[1] ?? ""
      let celda = ""
      if (tipo === "s") celda = compartidos[Number(valor)] ?? ""
      else if (tipo === "inlineStr") celda = textoDeNodos(interior ?? "")
      else celda = desescapar(valor)
      while (fila.length < indice) fila.push("")
      fila[indice] = celda.trim()
    }
    if (fila.some((celda) => celda !== "")) filas.push(fila)
  }
  return filas
}

function textoDeNodos(xmlDeCelda: string) {
  return desescapar(
    [...xmlDeCelda.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
      .map(([, t]) => t)
      .join("")
  )
}

function desescapar(texto: string) {
  return texto
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&")
}

/** A → 0, B → 1, AA → 26. */
export function indiceDeColumna(letras: string): number {
  return (
    [...letras].reduce((n, letra) => n * 26 + letra.charCodeAt(0) - 64, 0) - 1
  )
}

/**
 * Un CSV como sale de Excel, Google Sheets o a mano: separado por coma, punto
 * y coma o tabulación —el que más aparezca en la primera línea—, con comillas
 * que pueden llevar el separador o saltos de línea adentro.
 */
export function leerCsv(texto: string): Filas {
  const limpio = texto.replace(/^\uFEFF/, "")
  const primera = limpio.split(/\r?\n/, 1)[0] ?? ""
  const separador = [";", ",", "\t"].reduce((mejor, s) =>
    primera.split(s).length > primera.split(mejor).length ? s : mejor
  )

  const filas: Filas = []
  let fila: string[] = []
  let celda = ""
  let entreComillas = false
  for (let i = 0; i < limpio.length; i++) {
    const letra = limpio[i]
    if (entreComillas) {
      if (letra === '"' && limpio[i + 1] === '"') {
        celda += '"'
        i++
      } else if (letra === '"') entreComillas = false
      else celda += letra
    } else if (letra === '"') entreComillas = true
    else if (letra === separador) {
      fila.push(celda.trim())
      celda = ""
    } else if (letra === "\n" || letra === "\r") {
      if (letra === "\r" && limpio[i + 1] === "\n") i++
      fila.push(celda.trim())
      if (fila.some((c) => c !== "")) filas.push(fila)
      fila = []
      celda = ""
    } else celda += letra
  }
  fila.push(celda.trim())
  if (fila.some((c) => c !== "")) filas.push(fila)
  return filas
}

/**
 * Un texto pegado que en realidad es una tabla —copiado de una planilla, o
 * escrito con comas—: sus filas, o `null` si es una lista suelta. Es tabla
 * con dos renglones o más, de tres columnas o más, y casi todos con las
 * mismas columnas: "Medias de algodón, pack de 3" no lo es.
 */
export function filasDeTexto(texto: string): Filas | null {
  const filas = leerCsv(texto)
  if (filas.length < 2) return null
  const cuantas = new Map<number, number>()
  for (const fila of filas) {
    cuantas.set(fila.length, (cuantas.get(fila.length) ?? 0) + 1)
  }
  const [columnas, veces] = [...cuantas].reduce((mejor, par) =>
    par[1] > mejor[1] ? par : mejor
  )
  return columnas >= 3 && veces / filas.length >= 0.8 ? filas : null
}
