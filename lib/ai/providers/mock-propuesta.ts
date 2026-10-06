import { COMBINACIONES, PALETAS, type Paleta } from "@/lib/editor/sugerencias"
import type { PropuestaDeDiseno } from "../schemas"

/**
 * La propuesta de diseño del modo demo.
 *
 * Sin proveedor configurado, derivar la respuesta del esquema daría siempre lo
 * mismo, y un asistente que contesta igual a todo se lee como roto. Esto lee
 * el pedido por palabras clave y arma operaciones sobre la tienda real —con
 * sus ids, que vienen en el contexto—, así que la demostración funciona sin
 * red y la propuesta pasa las mismas validaciones que la de un modelo.
 */

interface SeccionLeida {
  id: string
  tipo: string
  props: Record<string, unknown>
}

interface ContextoLeido {
  tienda: { nombre: string; descripcion: string | null; tieneWhatsapp: boolean }
  secciones: SeccionLeida[]
}

type Operacion = PropuestaDeDiseno["operaciones"][number]

function leerContexto(mensaje: string): ContextoLeido {
  const crudo = mensaje.match(/<<CONTEXTO>>\s*([\s\S]*?)\s*<<\/CONTEXTO>>/)?.[1]
  try {
    const leido = JSON.parse(crudo ?? "{}") as Partial<ContextoLeido>
    return {
      tienda: {
        nombre: leido.tienda?.nombre ?? "tu tienda",
        descripcion: leido.tienda?.descripcion ?? null,
        tieneWhatsapp: leido.tienda?.tieneWhatsapp === true,
      },
      secciones: Array.isArray(leido.secciones) ? leido.secciones : [],
    }
  } catch {
    return {
      tienda: { nombre: "tu tienda", descripcion: null, tieneWhatsapp: false },
      secciones: [],
    }
  }
}

/** La primera oración de un texto, cortada a un largo que entre en el campo. */
function primeraOracion(texto: string, largo: number): string {
  const oracion = texto.split(/(?<=[.!?])\s/)[0] ?? texto
  return oracion.length > largo
    ? `${oracion.slice(0, largo - 1).trimEnd()}…`
    : oracion
}

export function propuestaDeDemostracion(mensaje: string): PropuestaDeDiseno {
  const pedido = (mensaje.match(/pide: «([\s\S]*?)»/)?.[1] ?? "").toLowerCase()
  const contexto = leerContexto(mensaje)
  const operaciones: Operacion[] = []
  const partes: string[] = []
  /** Lo que no se pudo hacer, dicho al final del resumen. */
  let nota: string | null = null

  const quiere = (...raices: string[]) =>
    raices.some((raiz) => pedido.includes(raiz))
  const seccion = (tipo: string) =>
    contexto.secciones.find((s) => s.tipo === tipo)

  let conColores = false
  function colores(nombre: string, texto: string) {
    const paleta = PALETAS.find((p) => p.nombre === nombre) as Paleta
    for (const token of ["papel", "tinta", "senal", "senalAlta"] as const) {
      operaciones.push({
        op: "apariencia",
        ruta: `colores.${token}`,
        valor: paleta.colores[token],
      })
    }
    partes.push(texto)
    conColores = true
  }

  function letra(nombre: string, texto: string) {
    const combinacion = COMBINACIONES.find((c) => c.nombre === nombre)
    if (!combinacion) return
    for (const campo of [
      "titular",
      "cuerpo",
      "pesoTitular",
      "espaciadoTitular",
      "mayusculas",
    ] as const) {
      operaciones.push({
        op: "apariencia",
        ruta: `tipografia.${campo}`,
        valor: combinacion.tipografia[campo],
      })
    }
    partes.push(texto)
  }

  // Colores
  if (quiere("oscur", "negr", "dark")) {
    colores(
      "Blanco y negro",
      "uso blanco y negro, porque con un fondo oscuro la letra blanca de los botones no se leería"
    )
  } else if (quiere("cálid", "calid", "terracota", "tierra", "naranja")) {
    colores("Terracota", "paso a una paleta terracota, más cálida")
  } else if (quiere("verde", "natural", "bosque", "planta")) {
    colores("Bosque", "paso a verdes de bosque")
  } else if (quiere("azul", "océano", "oceano", "fresc")) {
    colores("Océano", "paso a azules de océano, más frescos")
  } else if (quiere("rosa", "femenin")) {
    colores("Rosa", "paso a una paleta rosa")
  } else if (quiere("lavanda", "morad", "lila", "violeta")) {
    colores("Lavanda", "paso a una paleta lavanda")
  } else if (quiere("alegre", "colorid", "amarill", "mostaza")) {
    colores("Mostaza", "paso a una paleta mostaza, más alegre")
  }

  // Letra
  if (quiere("elegant", "lujo", "premium", "sofistic", "fino", "fina")) {
    if (!conColores) colores("Vino", "uso tonos vino")
    letra("Elegante", "uso una letra antigua y elegante para los títulos")
  } else if (quiere("modern", "minimal", "limpi", "sobri")) {
    if (!conColores) colores("Blanco y negro", "uso blanco y negro")
    letra("Moderna", "uso una letra moderna y firme")
  }
  if (quiere("mayúscula", "mayuscula")) {
    operaciones.push({
      op: "apariencia",
      ruta: "tipografia.mayusculas",
      valor: true,
    })
    partes.push("pongo los títulos en mayúsculas")
  }
  if (quiere("redond")) {
    operaciones.push({
      op: "apariencia",
      ruta: "forma.radio",
      valor: "redondo",
    })
    partes.push("redondeo los botones")
  }

  // Catálogo
  if (quiere("cuadrad") && !quiere("botón", "boton")) {
    operaciones.push({
      op: "apariencia",
      ruta: "disposicion.tarjeta",
      valor: "cuadrada",
    })
    partes.push("muestro las fotos de los productos cuadradas")
  }
  if (quiere("vertical", "retrato")) {
    operaciones.push({
      op: "apariencia",
      ruta: "disposicion.tarjeta",
      valor: "retrato",
    })
    partes.push("muestro las fotos de los productos en vertical")
  }
  const columnas = pedido.match(/([234])\s*columna/)?.[1]
  if (columnas) {
    operaciones.push({
      op: "apariencia",
      ruta: "disposicion.columnas",
      valor: Number(columnas),
    })
    partes.push(`ordeno el catálogo en ${columnas} columnas`)
  } else if (quiere("más grande", "mas grande", "grandes")) {
    operaciones.push({
      op: "apariencia",
      ruta: "disposicion.columnas",
      valor: 2,
    })
    partes.push("dejo dos columnas para que los productos se vean más grandes")
  }

  // Ficha de producto
  const sin = quiere("sin ", "quita", "saca", "no ")
  if (quiere("vitrina") || (quiere("centrad") && quiere("ficha", "producto"))) {
    operaciones.push({
      op: "apariencia",
      ruta: "ficha.diseno",
      valor: "vitrina",
    })
    partes.push("centro la ficha de producto, como una vitrina")
  } else if (quiere("dividida", "al costado", "al lado")) {
    operaciones.push({
      op: "apariencia",
      ruta: "ficha.diseno",
      valor: "dividida",
    })
    partes.push("pongo la foto al lado del texto en la ficha")
  }
  if (quiere("siempre a la vista", "siempre a mano", "barra", "botón fijo")) {
    operaciones.push({
      op: "apariencia",
      ruta: "ficha.barraFija",
      valor: true,
    })
    partes.push("dejo el botón de compra siempre a la vista en el celular")
  }
  if (quiere("parecid", "relacionad")) {
    operaciones.push({
      op: "apariencia",
      ruta: "ficha.relacionados",
      valor: !sin,
    })
    partes.push(
      sin
        ? "saco los productos parecidos del pie de la ficha"
        : "muestro productos parecidos al pie de la ficha"
    )
  }
  if (quiere("whatsapp") && !quiere("contacto")) {
    if (contexto.tienda.tieneWhatsapp) {
      operaciones.push({
        op: "apariencia",
        ruta: "ficha.consulta",
        valor: true,
      })
      partes.push("agrego un enlace para que te pregunten por WhatsApp")
    } else {
      nota =
        "Para que te pregunten por WhatsApp, primero agrega el número de tu tienda en Cuenta."
    }
  }

  // Carrito
  if (quiere("boleta", "recibo", "nota de")) {
    operaciones.push({
      op: "apariencia",
      ruta: "carrito.diseno",
      valor: "boleta",
    })
    partes.push("armo el carrito como una boleta")
  } else if (quiere("por pasos", "paso a paso")) {
    operaciones.push({
      op: "apariencia",
      ruta: "carrito.diseno",
      valor: "pasos",
    })
    partes.push("ordeno el carrito en tres pasos numerados")
  } else if (quiere("carrito") && quiere("columna")) {
    operaciones.push({
      op: "apariencia",
      ruta: "carrito.diseno",
      valor: "columnas",
    })
    partes.push("pongo el carrito en dos columnas")
  }
  if (quiere("sugier", "sugerenc", "otros productos")) {
    operaciones.push({
      op: "apariencia",
      ruta: "carrito.sugerencias",
      valor: true,
    })
    partes.push("sugiero otros productos en el carrito")
  }

  // Secciones
  if (quiere("pregunta", "faq")) {
    const faq = seccion("faq")
    if (faq) {
      operaciones.push({ op: "mover", seccion: faq.id, posicion: 1 })
      partes.push("subo las preguntas frecuentes, justo después de la portada")
    } else {
      operaciones.push({ op: "agregar", tipo: "faq", posicion: 1, props: {} })
      partes.push("agrego preguntas frecuentes después de la portada")
    }
  }
  if (quiere("testimonio", "opinion", "opinión", "reseña", "resena")) {
    if (!seccion("testimonials")) {
      operaciones.push({
        op: "agregar",
        tipo: "testimonials",
        posicion: contexto.secciones.length,
        props: {},
      })
      partes.push("agrego una sección de testimonios")
    }
  }
  if (quiere("contacto", "horario", "dirección", "direccion")) {
    if (!seccion("contact")) {
      operaciones.push({
        op: "agregar",
        tipo: "contact",
        posicion: contexto.secciones.length,
        props: {},
      })
      partes.push("agrego tus datos de contacto al final")
    }
  }

  // Textos de la portada
  const portada = seccion("hero")
  const descripcion = contexto.tienda.descripcion?.trim()
  if (portada && quiere("madre", "mamá", "mama")) {
    operaciones.push({
      op: "editar",
      seccion: portada.id,
      props: {
        title: "Para mamá, lo mejor",
        subtitle:
          "Regalos que se quedan en el recuerdo. Pide hoy y lo cerramos contigo por WhatsApp.",
        ctaLabel: "Ver regalos",
      },
    })
    partes.push("preparo la portada para el Día de la Madre")
  } else if (portada && quiere("navidad")) {
    operaciones.push({
      op: "editar",
      seccion: portada.id,
      props: {
        title: "Regalos para esta Navidad",
        subtitle: "Elige con tiempo: te ayudamos a elegir por WhatsApp.",
        ctaLabel: "Ver regalos",
      },
    })
    partes.push("preparo la portada para Navidad")
  } else if (portada && quiere("oferta", "descuento", "rebaja", "liquidaci")) {
    operaciones.push({
      op: "editar",
      seccion: portada.id,
      props: {
        title: "Ofertas de temporada",
        subtitle:
          "Precios especiales por pocos días. Pide antes de que se acaben.",
        ctaLabel: "Ver ofertas",
      },
    })
    partes.push("pongo la portada en modo ofertas")
  } else if (
    portada &&
    descripcion &&
    quiere("escrib", "texto", "redact", "portada")
  ) {
    operaciones.push({
      op: "editar",
      seccion: portada.id,
      props: {
        title: contexto.tienda.nombre.slice(0, 120),
        subtitle: primeraOracion(descripcion, 240),
      },
    })
    const sobre = seccion("about")
    if (sobre) {
      operaciones.push({
        op: "editar",
        seccion: sobre.id,
        props: { body: descripcion.slice(0, 1200) },
      })
    }
    partes.push(
      "escribo los textos de tu portada con lo que contaste de tu negocio"
    )
  }

  if (operaciones.length === 0) {
    return {
      resumen:
        nota ??
        "No encontré qué cambiar en tu pedido. Prueba con algo como «colores más cálidos», «hazla más elegante» o «sube las preguntas frecuentes».",
      operaciones: [],
    }
  }

  const texto =
    partes.length > 1
      ? `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}`
      : partes[0]
  return {
    resumen: `${texto.charAt(0).toUpperCase()}${texto.slice(1)}.${nota ? ` ${nota}` : ""}`,
    operaciones,
  }
}
