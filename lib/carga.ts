import type { Filas, Hoja } from "@/lib/planilla"
import {
  MAXIMO_DE_VALORES,
  MAXIMO_DE_VARIANTES,
  MUESTRAS_DE_COLOR,
  ordenarValores,
  tipoDe,
  type Opcion,
  type Valores,
} from "@/lib/variantes"

/**
 * Cargar varios productos de una vez, desde lo que la persona ya tenga: fotos,
 * una planilla con sus propias columnas o una lista escrita. La IA propone
 * borradores y la persona los revisa; nada se crea sin confirmar.
 *
 * Neutral: lo usan la pantalla, las acciones y el mock de la IA.
 */

export const LIMITES_DE_CARGA = {
  /** Fotos de productos en una carga, y por cada pedido a la IA. */
  fotos: 40,
  fotosPorPedido: 10,
  /** Páginas de cuaderno por pedido. */
  paginas: 3,
  /** Productos que se crean de una vez, y filas que se leen de una planilla. */
  productos: 200,
  /** El texto pegado de una lista. */
  caracteresDeLista: 6_000,
  /** El archivo de una planilla. */
  bytesDePlanilla: 2_000_000,
} as const

export type CampoDeCarga =
  | "nombre"
  | "precio"
  | "stock"
  | "categoria"
  | "talla"
  | "color"
  | "descripcion"
  | "codigo"
  | "costo"

/**
 * Los campos que se leen de una planilla, con las palabras con que suelen
 * empezar sus encabezados. Se compara sin tildes ni mayúsculas.
 */
export const CAMPOS_DE_CARGA: {
  campo: CampoDeCarga
  titulo: string
  palabras: string[]
}[] = [
  {
    campo: "nombre",
    titulo: "Nombre",
    palabras: ["nombre", "producto", "articulo", "item", "detalle", "modelo"],
  },
  {
    campo: "precio",
    titulo: "Precio",
    palabras: ["precio", "p/u", "pu", "p.u", "venta", "pvp", "valor", "bs"],
  },
  {
    campo: "stock",
    titulo: "Stock",
    palabras: [
      "stock",
      "cantidad",
      "cant",
      "unidades",
      "existencia",
      "inventario",
      "disponible",
    ],
  },
  {
    campo: "categoria",
    titulo: "Categoría",
    palabras: ["categoria", "rubro", "tipo", "linea", "familia", "seccion"],
  },
  {
    campo: "talla",
    titulo: "Talla",
    palabras: ["talla", "tallas", "size", "numero", "nro", "medida"],
  },
  {
    campo: "color",
    titulo: "Color",
    palabras: ["color", "colores"],
  },
  {
    campo: "descripcion",
    titulo: "Descripción",
    palabras: ["descripcion", "caracteristica", "observacion", "nota"],
  },
  {
    campo: "codigo",
    titulo: "Código",
    palabras: ["codigo", "cod", "sku", "ref", "referencia"],
  },
  {
    campo: "costo",
    titulo: "Costo",
    palabras: ["costo", "compra", "p. compra", "precio de compra"],
  },
]

export function tituloDeCampo(campo: CampoDeCarga): string {
  return CAMPOS_DE_CARGA.find((c) => c.campo === campo)?.titulo ?? campo
}

/** Lo que es una columna de la planilla, y si la lectura está segura. */
export interface ColumnaLeida {
  columna: number
  /** `null`: la columna no se usa. */
  campo: CampoDeCarga | null
  /** Sin seguridad, se le pregunta a la persona antes de seguir. */
  seguro: boolean
}

export interface Lectura {
  /** La fila de los encabezados, o `null` si la planilla no tiene. */
  filaDeEncabezado: number | null
  /** Una por columna con algún dato. */
  columnas: ColumnaLeida[]
}

export interface Mapeo {
  filaDeEncabezado: number | null
  columnas: Record<CampoDeCarga, number | null>
}

export interface VarianteDeBorrador {
  valores: Valores
  stock: number
  /** En bolivianos; `null`: la del producto. */
  precio: number | null
}

/** Un producto propuesto, todavía sin crear. Los montos van en bolivianos. */
export interface Borrador {
  id: string
  nombre: string
  precio: number | null
  /** Con variantes, la suma de las suyas. */
  stock: number
  categoria: string | null
  descripcion: string
  codigo: string | null
  costo: number | null
  /** URLs de fotos ya subidas a la carpeta de la tienda. */
  fotos: string[]
  /** Talla y color, si la planilla los traía. */
  opciones: Opcion[]
  variantes: VarianteDeBorrador[]
  /** Lo que propuso la IA sin haberlo leído: se marca hasta que se toque. */
  inventado: ("nombre" | "categoria" | "descripcion")[]
  /** Lo que la IA no pudo leer: "no se ve el precio". */
  duda: string | null
}

export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Un precio escrito como se escribe en Bolivia, a bolivianos: "Bs 1.250,50",
 * "85.-", "180 bs", "1,250.50", "12.5". `null` si no es un precio.
 *
 * Con punto y coma a la vez, el último es el decimal. Con uno solo, es de
 * miles si separa grupos de tres ("1.250"), y decimal si no ("85,50").
 */
export function leerPrecio(
  crudo: string | number | null | undefined
): number | null {
  if (crudo === null || crudo === undefined) return null
  if (typeof crudo === "number") {
    return Number.isFinite(crudo) && crudo >= 0
      ? Math.round(crudo * 100) / 100
      : null
  }
  let texto = normalizar(crudo)
    .replace(/^(bs\.?|bob|us\$|\$)\s*/, "")
    .replace(/\s*(bs\.?|bob|bolivianos?)$/, "")
    .replace(/\.-$|,-$|-$/, "")
    .replace(/\s/g, "")
  if (!/^\d[\d.,]*$/.test(texto)) return null

  const punto = texto.lastIndexOf(".")
  const coma = texto.lastIndexOf(",")
  if (punto >= 0 && coma >= 0) {
    const decimal = punto > coma ? "." : ","
    const miles = decimal === "." ? "," : "."
    texto = texto.split(miles).join("").replace(decimal, ".")
  } else if (coma >= 0 || punto >= 0) {
    const separador = coma >= 0 ? "," : "."
    const deMiles = new RegExp(`^\\d{1,3}(\\${separador}\\d{3})+$`)
    texto = deMiles.test(texto)
      ? texto.split(separador).join("")
      : texto.split(separador).length === 2
        ? texto.replace(separador, ".")
        : ""
  }
  const valor = Number(texto)
  return texto && Number.isFinite(valor) ? Math.round(valor * 100) / 100 : null
}

/** Un entero de stock: "12", "12 u", "12.0". `null` si no es un número. */
export function leerEntero(crudo: string | null | undefined): number | null {
  if (!crudo) return null
  const numero = /-?\d+(?:[.,]\d+)?/.exec(crudo.replace(/\s/g, ""))?.[0]
  if (!numero) return null
  const valor = Math.round(Number(numero.replace(",", ".")))
  return Number.isFinite(valor) && valor >= 0 ? Math.min(valor, 999_999) : null
}

/* ---------------------------------------------------------------------------
 * Leer qué es cada columna, por su encabezado y por su contenido
 * ------------------------------------------------------------------------ */

function campoDeEncabezado(celda: string): CampoDeCarga | null {
  const texto = normalizar(celda).replace(/[.:]/g, "")
  // Un número nunca es un encabezado: "Bs 85" empieza como "bs".
  if (!texto || leerPrecio(celda) !== null) return null
  // El costo antes que el precio: "precio de compra" es un costo.
  const orden = [...CAMPOS_DE_CARGA].sort((a, b) =>
    a.campo === "costo" ? -1 : b.campo === "costo" ? 1 : 0
  )
  for (const { campo, palabras } of orden) {
    if (
      palabras.some(
        (palabra) =>
          texto === palabra ||
          texto.startsWith(`${palabra} `) ||
          // Las palabras cortas —bs, pu, cod— solo enteras: "bsas" no.
          (palabra.length > 3 && texto.startsWith(palabra))
      )
    ) {
      return campo
    }
  }
  return null
}

const TALLAS = new Set([
  "xxs",
  "xs",
  "s",
  "m",
  "l",
  "xl",
  "xxl",
  "xxxl",
  "2xl",
  "3xl",
  "4xl",
  "unica",
  "talla unica",
  "estandar",
])
const COLORES = new Set(Object.keys(MUESTRAS_DE_COLOR).map(normalizar))

/** Los valores de una celda que puede traer varios: "S, M, L" o "S/M/L". */
export function valoresDeCelda(celda: string): string[] {
  return celda
    .split(/[,;/|]| y /)
    .map((valor) => valor.trim())
    .filter(Boolean)
}

const DEDUCCIONES_FLOJAS = new Set<CampoDeCarga>([
  "nombre",
  "categoria",
  "descripcion",
  "codigo",
])

const proporcion = (lista: string[], prueba: (valor: string) => boolean) =>
  lista.length ? lista.filter(prueba).length / lista.length : 0

/** Lo que dice el contenido de una columna, sin mirar su encabezado. */
function campoPorContenido(valores: string[]): {
  campo: CampoDeCarga | null
  seguro: boolean
} {
  if (valores.length === 0) return { campo: null, seguro: true }
  const sueltos = valores.flatMap(valoresDeCelda).map(normalizar)
  const distintos = new Set(valores.map(normalizar)).size
  const unicidad = distintos / valores.length

  const tallas = proporcion(sueltos, (v) => TALLAS.has(v))
  const numerosDeCalzado = proporcion(sueltos, (v) =>
    /^(1[6-9]|[2-4]\d)$/.test(v)
  )
  if (tallas >= 0.8) return { campo: "talla", seguro: valores.length >= 3 }
  // "M, L, 40": ropa y calzado en la misma columna.
  if (
    tallas >= 0.5 &&
    proporcion(sueltos, (v) => TALLAS.has(v) || /^(1[6-9]|[2-4]\d)$/.test(v)) >=
      0.8
  ) {
    return { campo: "talla", seguro: valores.length >= 3 }
  }
  // "38, 39, 40" puede ser un número de calzado o un stock: se pregunta.
  if (
    numerosDeCalzado === 1 &&
    valores.some((v) => valoresDeCelda(v).length > 1)
  ) {
    return { campo: "talla", seguro: true }
  }
  if (proporcion(sueltos, (v) => COLORES.has(v)) >= 0.8) {
    return { campo: "color", seguro: valores.length >= 3 }
  }

  const precios = valores.map(leerPrecio)
  if (precios.every((p) => p !== null)) {
    const conDecimales = valores.some((v) => /[.,]\d{1,2}$|bs|\$/i.test(v))
    const enteros = valores.every((v) => /^\d+$/.test(v.trim()))
    const mayor = Math.max(...(precios as number[]))
    if (conDecimales) return { campo: "precio", seguro: true }
    if (enteros && mayor <= 999 && numerosDeCalzado < 1) {
      return { campo: "stock", seguro: false }
    }
    return { campo: "precio", seguro: false }
  }

  const largo = valores.reduce((t, v) => t + v.length, 0) / valores.length
  if (largo > 45) return { campo: "descripcion", seguro: false }
  if (
    proporcion(valores, (v) => /^[a-z]{0,4}[-_ ]?\d{1,6}$/i.test(v.trim())) >=
    0.9
  ) {
    return { campo: "codigo", seguro: false }
  }
  // Textos todos distintos son nombres; que se repiten, categorías. Con
  // muchas filas se tolera alguno repetido.
  if (unicidad === 1 || (valores.length >= 10 && unicidad >= 0.9)) {
    return { campo: "nombre", seguro: valores.length >= 3 }
  }
  return { campo: "categoria", seguro: false }
}

/**
 * Qué es cada columna, sin IA: por la palabra del encabezado y, si no la hay
 * o no se reconoce, por lo que contienen sus celdas. Es lo que se usa con la
 * IA apagada, lo que contesta su modo demo y la red de seguridad si la IA
 * devuelve algo raro. Lo dudoso queda sin seguridad: se le pregunta a la
 * persona.
 */
export function leerColumnas(filas: Filas): Lectura {
  // La fila de encabezados: entre las cinco primeras, la que más reconoce.
  let encabezado: number | null = null
  let aciertos = 0
  for (let f = 0; f < Math.min(filas.length, 5); f++) {
    const reconocidas = filas[f].filter((celda) =>
      campoDeEncabezado(celda)
    ).length
    if (reconocidas > aciertos) {
      aciertos = reconocidas
      encabezado = f
    }
  }

  const datos = filas
    .slice(encabezado === null ? 0 : encabezado + 1)
    .slice(0, 40)
  const ancho = Math.max(0, ...filas.slice(0, 40).map((fila) => fila.length))
  const columnas: (ColumnaLeida & { distintos: number; deTexto: boolean })[] =
    []

  for (let columna = 0; columna < ancho; columna++) {
    const valores = datos
      .map((fila) => (fila[columna] ?? "").trim())
      .filter(Boolean)
    if (valores.length === 0) continue
    const porEncabezado =
      encabezado === null
        ? null
        : campoDeEncabezado(filas[encabezado][columna] ?? "")
    const porContenido = campoPorContenido(valores)
    const distintos = new Set(valores.map(normalizar)).size
    const deTexto =
      !porEncabezado &&
      (porContenido.campo === "nombre" || porContenido.campo === "categoria")
    columnas.push(
      porEncabezado
        ? {
            columna,
            campo: porEncabezado,
            // El encabezado y el contenido se contradicen: se pregunta. Lo
            // que se deduce de un texto —nombre, categoría— es flojo: ahí
            // manda el encabezado.
            seguro:
              porContenido.campo === null ||
              porContenido.campo === porEncabezado ||
              !porContenido.seguro ||
              DEDUCCIONES_FLOJAS.has(porContenido.campo),
            distintos,
            deTexto,
          }
        : { columna, ...porContenido, distintos, deTexto }
    )
  }

  // Las columnas de texto se comparan entre sí: la de más valores distintos
  // es el nombre —aunque se repita, con una fila por talla—, las demás son
  // categorías. Si el nombre ya salió del encabezado, todas son categorías.
  const deTexto = columnas
    .filter((c) => c.deTexto)
    .sort((a, b) => b.distintos - a.distintos)
  const nombrePorEncabezado = columnas.some(
    (c) => !c.deTexto && c.campo === "nombre"
  )
  const conVariantes = columnas.some(
    (c) => c.campo === "talla" || c.campo === "color"
  )
  const palabras = (columna: number) => {
    const textos = datos.map((f) => (f[columna] ?? "").trim()).filter(Boolean)
    return (
      textos.reduce((t, v) => t + v.split(/\s+/).length, 0) /
      Math.max(textos.length, 1)
    )
  }
  // Entre dos columnas de textos todos distintos, la de frases más largas
  // es la descripción: "Algodón peinado de 220 g" al lado de "Polera".
  const [primera, segunda] = deTexto
  if (
    primera &&
    segunda &&
    !nombrePorEncabezado &&
    segunda.distintos === primera.distintos &&
    palabras(primera.columna) > palabras(segunda.columna) + 0.5
  ) {
    deTexto[0] = segunda
    deTexto[1] = primera
  }
  deTexto.forEach((c, indice) => {
    if (indice === 0 && !nombrePorEncabezado) {
      c.campo = "nombre"
      c.seguro = c.seguro || (conVariantes && c.distintos >= 2)
    } else {
      c.campo =
        c.distintos === datos.length && palabras(c.columna) >= 3
          ? "descripcion"
          : "categoria"
      c.seguro = false
    }
  })

  // Varias columnas de números sin encabezado: en cada fila el precio es el
  // mayor y el stock el menor; uno que siempre queda bajo el precio, el costo.
  // Siguen en duda, pero con lo más probable propuesto.
  const numericas = columnas.filter(
    (c) =>
      !c.seguro &&
      (c.campo === "stock" || c.campo === "precio") &&
      (encabezado === null ||
        !campoDeEncabezado(filas[encabezado][c.columna] ?? ""))
  )
  if (numericas.length >= 2) {
    const montos = (columna: number) =>
      datos.map((f) => leerPrecio(f[columna] ?? "") ?? 0)
    const siempreMayor = (a: number, b: number) =>
      montos(a).every((valor, fila) => valor >= montos(b)[fila])
    const precio = numericas.find((c) =>
      numericas.every(
        (otra) => otra === c || siempreMayor(c.columna, otra.columna)
      )
    )
    if (precio) {
      const resto = numericas
        .filter((c) => c !== precio)
        .sort(
          (a, b) =>
            Math.max(...montos(a.columna)) - Math.max(...montos(b.columna))
        )
      precio.campo = "precio"
      resto.forEach((c, indice) => {
        c.campo = indice === 0 ? "stock" : "costo"
      })
    }
  }

  // Un campo va en una sola columna: la segunda queda en duda.
  const usados = new Set<CampoDeCarga>()
  for (const c of columnas) {
    if (!c.campo) continue
    if (usados.has(c.campo)) c.seguro = false
    else usados.add(c.campo)
  }

  return {
    filaDeEncabezado: encabezado,
    columnas: columnas.map(({ columna, campo, seguro }) => ({
      columna,
      campo,
      seguro,
    })),
  }
}

/**
 * La planilla modelo: las mismas columnas que se leen, con dos ejemplos. La
 * bajan el panel y la app.
 */
export const HOJA_MODELO: Hoja = {
  nombre: "Productos",
  columnas: [
    { titulo: "Nombre", ancho: 32 },
    { titulo: "Precio (Bs)", tipo: "monto" },
    { titulo: "Stock", tipo: "entero" },
    { titulo: "Categoría", ancho: 18 },
    { titulo: "Descripción", ancho: 40 },
  ],
  filas: [
    ["Polera básica blanca", 65, 12, "Poleras", "Algodón, tallas S a XL"],
    ["Short deportivo", 90, 5, "Shorts", null],
  ],
}

/** Una lectura en la forma de siempre: cada campo, en qué columna está. */
export function mapeoDeLectura(lectura: Lectura): Mapeo {
  const columnas = Object.fromEntries(
    CAMPOS_DE_CARGA.map(({ campo }) => [
      campo,
      lectura.columnas.find((c) => c.campo === campo)?.columna ?? null,
    ])
  ) as Mapeo["columnas"]
  return { filaDeEncabezado: lectura.filaDeEncabezado, columnas }
}

/**
 * Asigna un campo a una columna, decidido por la persona: queda seguro. Si
 * otra columna tenía ese campo, la deja sin usar.
 */
export function asignarCampo(
  lectura: Lectura,
  columna: number,
  campo: CampoDeCarga | null
): Lectura {
  return {
    ...lectura,
    columnas: lectura.columnas.map((c) =>
      c.columna === columna
        ? { ...c, campo, seguro: true }
        : campo && c.campo === campo
          ? { ...c, campo: null, seguro: true }
          : c
    ),
  }
}

/* ---------------------------------------------------------------------------
 * De las filas a los borradores
 * ------------------------------------------------------------------------ */

let siguiente = 0
/** Un identificador para un borrador, que no se repite en la pantalla. */
export function idDeBorrador(): string {
  siguiente += 1
  return `b${Date.now().toString(36)}${siguiente}`
}

/** El nombre de la opción según sus valores: "38, 39" es Número, no Talla. */
function opcionDeTalla(valores: string[]): string {
  return valores.every((v) => /^\d{2}$/.test(v)) ? "Número" : "Talla"
}

/**
 * Las filas de una planilla, ya con su mapeo, a borradores. Con talla o color,
 * las filas del mismo nombre se juntan en un producto con sus variantes —una
 * fila por talla, con su stock—, y una celda "S, M, L" da esas tres tallas:
 * el stock de la fila va a la primera.
 */
export function aplicarMapeo(filas: Filas, mapeo: Mapeo): Borrador[] {
  const celda = (fila: string[], campo: CampoDeCarga) => {
    const indice = mapeo.columnas[campo]
    return indice === null ? "" : (fila[indice] ?? "").trim()
  }
  const desde = mapeo.filaDeEncabezado === null ? 0 : mapeo.filaDeEncabezado + 1
  const conOpciones =
    mapeo.columnas.talla !== null || mapeo.columnas.color !== null

  const borradores: Borrador[] = []
  const porNombre = new Map<string, Borrador>()

  for (const fila of filas.slice(desde)) {
    const nombre = celda(fila, "nombre").slice(0, 120)
    if (!nombre) continue
    const precio = leerPrecio(celda(fila, "precio"))
    const stock = leerEntero(celda(fila, "stock")) ?? 1

    const tallas = valoresDeCelda(celda(fila, "talla")).map(normalizarTalla)
    const colores = valoresDeCelda(celda(fila, "color")).map(capitalizar)

    const existente = conOpciones
      ? porNombre.get(normalizar(nombre))
      : undefined
    const borrador: Borrador = existente ?? {
      id: idDeBorrador(),
      nombre,
      precio,
      stock: 0,
      categoria: celda(fila, "categoria").slice(0, 60) || null,
      descripcion: celda(fila, "descripcion").slice(0, 600),
      codigo: celda(fila, "codigo").slice(0, 40) || null,
      costo: leerPrecio(celda(fila, "costo")),
      fotos: [],
      opciones: [],
      variantes: [],
      inventado: [],
      duda: null,
    }
    if (!existente) {
      borradores.push(borrador)
      if (conOpciones) porNombre.set(normalizar(nombre), borrador)
    }

    if (!tallas.length && !colores.length) {
      borrador.stock += stock
      continue
    }

    // Cada combinación de la fila; el stock de la fila va a la primera.
    const combinaciones = (tallas.length ? tallas : [null]).flatMap((talla) =>
      (colores.length ? colores : [null]).map((color) => ({ talla, color }))
    )
    combinaciones.forEach(({ talla, color }, indice) => {
      const valores: Valores = {}
      if (talla) valores[opcionDeTalla(tallas)] = talla
      if (color) valores.Color = color
      const ya = borrador.variantes.find((v) =>
        Object.keys(valores).every((k) => v.valores[k] === valores[k])
      )
      const unidades = indice === 0 ? stock : 0
      if (ya) {
        ya.stock += unidades
      } else if (borrador.variantes.length < MAXIMO_DE_VARIANTES) {
        borrador.variantes.push({
          valores,
          stock: unidades,
          precio: precio !== null && precio !== borrador.precio ? precio : null,
        })
      }
    })
    if (borrador.precio === null && precio !== null) borrador.precio = precio
  }

  for (const borrador of borradores) {
    if (!borrador.variantes.length) {
      // Una fila suelta sin stock escrito vale 1.
      if (borrador.stock === 0) borrador.stock = 1
      continue
    }
    borrador.opciones = opcionesDe(borrador.variantes)
    borrador.stock = borrador.variantes.reduce((t, v) => t + v.stock, 0)
  }
  return borradores.slice(0, LIMITES_DE_CARGA.productos)
}

/** Las opciones —Talla, Color— que salen de las variantes, en orden. */
function opcionesDe(variantes: VarianteDeBorrador[]): Opcion[] {
  const nombres = [...new Set(variantes.flatMap((v) => Object.keys(v.valores)))]
  return nombres.slice(0, 2).map((nombre) => ({
    nombre,
    valores: ordenarValores(tipoDe({ nombre }), [
      ...new Set(variantes.map((v) => v.valores[nombre]).filter(Boolean)),
    ]).slice(0, MAXIMO_DE_VALORES),
  }))
}

function normalizarTalla(valor: string): string {
  const limpio = normalizar(valor)
  if (limpio === "unica" || limpio === "talla unica") return "Única"
  return /^[a-z0-9]{1,4}$/.test(limpio)
    ? limpio.toUpperCase()
    : capitalizar(valor)
}

function capitalizar(texto: string): string {
  const limpio = texto.trim()
  return limpio.charAt(0).toUpperCase() + limpio.slice(1).toLowerCase()
}

/** Los borradores que se llaman igual que un producto que ya existe. */
export function repetidos(
  borradores: Borrador[],
  existentes: string[]
): Set<string> {
  const nombres = new Set(existentes.map(normalizar))
  return new Set(
    borradores.filter((b) => nombres.has(normalizar(b.nombre))).map((b) => b.id)
  )
}

/** Lo que le falta a un borrador para poder crearse. */
export function faltaEn(borrador: Borrador): "nombre" | "precio" | null {
  if (borrador.nombre.trim().length < 2) return "nombre"
  if (borrador.precio === null) return "precio"
  return null
}

/**
 * Si una foto está en la carpeta de la tienda, en el bucket de productos. La
 * acción baja cada foto antes de mandársela a la IA: sin esto se le podría
 * pedir que baje cualquier dirección, o la foto de otra tienda.
 */
export function esFotoDeMiTienda(
  url: string,
  baseDeSupabase: string,
  tiendaId: string
): boolean {
  try {
    const foto = new URL(url)
    const base = new URL(baseDeSupabase)
    return (
      foto.origin === base.origin &&
      foto.pathname.startsWith(
        `/storage/v1/object/public/product-images/${tiendaId}/`
      ) &&
      !foto.pathname.includes("..")
    )
  } catch {
    return false
  }
}
