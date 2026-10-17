"use client"

import * as React from "react"
import Image from "next/image"
import {
  Check,
  Copy,
  Download,
  LoaderCircle,
  MessageCircle,
  Package,
  RefreshCw,
  Search,
  Send,
  Share2,
  Sparkles,
  Type,
} from "lucide-react"
import { toast } from "sonner"

import { MENSAJE_SIN_RESPUESTA } from "@/lib/ai/mensajes"
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { formatMoney } from "@/lib/format"
import type { EstadoDeFuncion } from "@/lib/funciones"
import {
  armarTextos,
  CANALES,
  DISENOS,
  FORMATOS,
  rebajaDe,
  rutaDeImagen,
  textosSinIa,
  type Canal,
  type Diseno,
  type Formato,
  type ProductoParaPublicar,
  type Textos,
} from "@/lib/publicar"
import { cn } from "@/lib/utils"
import { ConFuncion } from "@/components/panel/funcion"
import { Seccion, SinDatos } from "@/components/panel/piezas"
import type { ResultadoDeTextos } from "@/app/(privado)/panel/marketing/acciones"

const FICHA_BASE =
  "flex min-h-11 shrink-0 items-center gap-1.5 border px-3 text-sm font-semibold whitespace-nowrap transition-colors"
const FICHA_SI = "border-tinta bg-tinta text-papel"
const FICHA_NO = "border-tinta/25 hover:border-tinta"
const FRANJA =
  "flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"

/**
 * Publicar un producto en redes: se elige uno y Venduo arma la imagen —con los
 * colores y la letra de la tienda— y el texto para cada red. Nada se publica
 * solo: la persona revisa, cambia lo que quiera y comparte.
 *
 * En el celular, "Compartir" manda la imagen y el texto juntos a la hoja de
 * compartir del teléfono —WhatsApp, Instagram, TikTok—, y copia el texto antes,
 * porque varias apps lo descartan al recibir una imagen.
 */
export function Publicador({
  productos,
  tienda,
  ia,
  tiktok,
  inicial,
  escribir,
}: {
  productos: ProductoParaPublicar[]
  tienda: { nombre: string; url: string }
  /** La IA de publicaciones en esta tienda: sin ella, el texto se arma solo. */
  ia: EstadoDeFuncion
  /** Publicar directo en TikTok. `null` si la integración no está configurada. */
  tiktok: EstadoDeFuncion | null
  inicial: string | null
  escribir: (productoId: string, vuelta: number) => Promise<ResultadoDeTextos>
}) {
  const [elegido, setElegido] = React.useState<string | null>(inicial)
  const producto = productos.find((p) => p.id === elegido) ?? null

  function elegir(id: string | null) {
    setElegido(id)
    // La dirección guarda el producto: volver atrás o recargar no lo pierde.
    const url = new URL(window.location.href)
    if (id) url.searchParams.set("producto", id)
    else url.searchParams.delete("producto")
    window.history.replaceState(null, "", url)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (productos.length === 0) {
    return (
      <Seccion
        id="elegir"
        icono={Package}
        titulo="Elige qué publicar"
        bajada="Toca un producto."
      >
        <SinDatos
          icono={Package}
          titulo="Todavía no tienes productos a la vista"
          texto="Carga uno, o publica alguno de los ocultos, y vuelve: la imagen se arma con su foto."
        />
      </Seccion>
    )
  }

  return producto ? (
    <Publicacion
      key={producto.id}
      producto={producto}
      tienda={tienda}
      ia={ia}
      tiktok={tiktok}
      escribir={escribir}
      alCambiar={() => elegir(null)}
    />
  ) : (
    <ElegirProducto productos={productos} alElegir={elegir} />
  )
}

/* ---------------------------------------------------------------------------
 * Elegir el producto
 * ------------------------------------------------------------------------ */

type Filtro = "todos" | "oferta" | `cat:${string}`

function ElegirProducto({
  productos,
  alElegir,
}: {
  productos: ProductoParaPublicar[]
  alElegir: (id: string) => void
}) {
  const [buscar, setBuscar] = React.useState("")
  const [filtro, setFiltro] = React.useState<Filtro>("todos")

  const categorias = [
    ...new Set(productos.map((p) => p.categoria).filter(Boolean)),
  ] as string[]
  const conOferta = productos.some((p) => rebajaDe(p))
  const texto = buscar.trim().toLowerCase()
  const visibles = productos.filter(
    (p) =>
      (filtro === "todos" ||
        (filtro === "oferta" && rebajaDe(p)) ||
        p.categoria === filtro.slice(4)) &&
      (!texto || p.nombre.toLowerCase().includes(texto))
  )

  const fichas: { valor: Filtro; nombre: string }[] = [
    { valor: "todos", nombre: "Todos" },
    ...(conOferta ? [{ valor: "oferta" as Filtro, nombre: "En oferta" }] : []),
    ...categorias.map((c) => ({ valor: `cat:${c}` as Filtro, nombre: c })),
  ]

  return (
    <Seccion
      id="elegir"
      icono={Package}
      titulo="Elige qué publicar"
      bajada="Toca un producto."
    >
      <div className="flex flex-col gap-3 border-b border-tinta/15 px-4 py-4 sm:px-5">
        <label className="flex min-h-12 items-center gap-3 border border-tinta px-3">
          <Search aria-hidden="true" className="size-5 shrink-0 opacity-60" />
          <span className="sr-only">Buscar un producto</span>
          <input
            type="search"
            value={buscar}
            onChange={(evento) => setBuscar(evento.target.value)}
            placeholder="Buscar"
            className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-tinta/45 [&::-webkit-search-cancel-button]:hidden"
          />
        </label>
        {fichas.length > 1 ? (
          <div className={cn(FRANJA, "-mx-4 px-4 sm:-mx-5 sm:px-5")}>
            {fichas.map((ficha) => (
              <button
                key={ficha.valor}
                type="button"
                aria-pressed={filtro === ficha.valor}
                onClick={() => setFiltro(ficha.valor)}
                className={cn(
                  FICHA_BASE,
                  filtro === ficha.valor ? FICHA_SI : FICHA_NO
                )}
              >
                {ficha.nombre}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {visibles.length === 0 ? (
        <p className="px-4 py-6 text-sm opacity-70 sm:px-5">
          Nada coincide con esa búsqueda. Prueba con otra palabra.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-4 sm:p-5 lg:grid-cols-6">
          {visibles.map((p) => {
            const rebaja = rebajaDe(p)
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => alElegir(p.id)}
                  className="group flex w-full flex-col gap-1 text-left"
                >
                  <span className="relative flex aspect-square w-full items-center justify-center overflow-hidden border border-tinta/15 bg-tinta/[0.05] transition-colors group-hover:border-tinta">
                    {p.foto ? (
                      <Image
                        src={p.foto}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 16vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transform-none"
                      />
                    ) : (
                      <Package
                        aria-hidden="true"
                        className="size-6 opacity-35"
                      />
                    )}
                    {rebaja ? (
                      <span className="tabular absolute top-1.5 left-1.5 bg-senal px-1.5 py-0.5 text-xs font-bold text-white">
                        −{rebaja}%
                      </span>
                    ) : null}
                  </span>
                  <span className="truncate text-sm">{p.nombre}</span>
                  <span className="tabular -mt-1 text-sm font-semibold">
                    {formatMoney(p.precioCents)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Seccion>
  )
}

/* ---------------------------------------------------------------------------
 * La publicación: imagen y texto
 * ------------------------------------------------------------------------ */

function Publicacion({
  producto,
  tienda,
  ia,
  tiktok,
  escribir,
  alCambiar,
}: {
  producto: ProductoParaPublicar
  tienda: { nombre: string; url: string }
  ia: EstadoDeFuncion
  tiktok: EstadoDeFuncion | null
  escribir: (productoId: string, vuelta: number) => Promise<ResultadoDeTextos>
  alCambiar: () => void
}) {
  const conRebaja = rebajaDe(producto) !== null
  const [diseno, setDiseno] = React.useState<Diseno>(
    conRebaja ? "oferta" : "foto"
  )
  const [formato, setFormato] = React.useState<Formato>("historia")
  const [canal, setCanal] = React.useState<Canal>("whatsapp")

  // El texto sin IA está al instante: siempre hay algo listo para compartir,
  // aunque la IA tarde o no esté.
  const [textos, setTextos] = React.useState<Textos>(() =>
    armarTextos(
      textosSinIa(producto, tienda.nombre),
      producto,
      `${tienda.url}/p/${producto.id}`
    )
  )
  const [conIa, setConIa] = React.useState(false)
  const [escribiendo, setEscribiendo] = React.useState(false)
  const vuelta = React.useRef(0)

  const pedirTextos = React.useCallback(async () => {
    setEscribiendo(true)
    const resultado = await escribir(producto.id, vuelta.current).catch(
      (): ResultadoDeTextos => ({ ok: false, error: MENSAJE_SIN_RESPUESTA })
    )
    setEscribiendo(false)
    vuelta.current += 1
    if (!resultado.ok) {
      toast.error(resultado.error)
      return
    }
    setTextos(resultado.textos)
    setConIa(resultado.conIa)
  }, [escribir, producto.id])

  // Con la IA activa, la escribe apenas se elige el producto. Una sola vez:
  // en desarrollo React monta dos veces, y serían dos pedidos al modelo.
  const pedido = React.useRef(false)
  React.useEffect(() => {
    if (ia !== "activa" || pedido.current) return
    pedido.current = true
    void pedirTextos()
  }, [ia, pedirTextos])

  const ruta = rutaDeImagen(producto.id, diseno, formato)
  const medida = FORMATOS.find((f) => f.clave === formato) ?? FORMATOS[0]
  const texto = textos[canal]

  return (
    <div className="flex flex-col gap-6 max-lg:pb-32 md:gap-8">
      <ProductoElegido producto={producto} alCambiar={alCambiar} />

      <div className="grid grid-cols-1 items-start gap-6 md:gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Seccion
          id="imagen"
          icono={Sparkles}
          titulo="La imagen"
          bajada="Con los colores y la letra de tu tienda."
          className="lg:sticky lg:top-6"
        >
          <div className="flex flex-col gap-3 border-b border-tinta/15 px-4 py-3 sm:px-5">
            <div
              role="radiogroup"
              aria-label="Formato"
              className="grid grid-cols-2 border border-tinta"
            >
              {FORMATOS.map((opcion) => (
                <button
                  key={opcion.clave}
                  type="button"
                  role="radio"
                  aria-checked={formato === opcion.clave}
                  onClick={() => setFormato(opcion.clave)}
                  className={cn(
                    "flex min-h-12 flex-col items-center justify-center px-2 py-1.5 transition-colors first:border-r first:border-tinta",
                    formato === opcion.clave
                      ? "bg-tinta text-papel"
                      : "hover:bg-tinta/[0.05]"
                  )}
                >
                  <span className="text-sm font-semibold">{opcion.nombre}</span>
                  <span
                    className={cn(
                      "text-xs",
                      formato === opcion.clave ? "opacity-75" : "opacity-65"
                    )}
                  >
                    {opcion.detalle}
                  </span>
                </button>
              ))}
            </div>
            <div
              role="radiogroup"
              aria-label="Diseño"
              className={cn(FRANJA, "-mx-4 px-4 sm:-mx-5 sm:px-5")}
            >
              {DISENOS.filter((d) => d.clave !== "oferta" || conRebaja).map(
                (opcion) => (
                  <button
                    key={opcion.clave}
                    type="button"
                    role="radio"
                    aria-checked={diseno === opcion.clave}
                    onClick={() => setDiseno(opcion.clave)}
                    className={cn(
                      FICHA_BASE,
                      diseno === opcion.clave ? FICHA_SI : FICHA_NO
                    )}
                  >
                    {opcion.nombre}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="flex justify-center bg-tinta/[0.04] px-4 py-6 sm:px-5">
            <Vista
              ruta={ruta}
              ancho={medida.ancho}
              alto={medida.alto}
              nombre={producto.nombre}
            />
          </div>

          <a
            href={rutaDeImagen(producto.id, diseno, formato, true)}
            download
            className="group flex min-h-12 items-center justify-between gap-3 border-t border-tinta/15 px-4 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel sm:px-5"
          >
            Descargar la imagen
            <Download aria-hidden="true" className="size-4" />
          </a>
        </Seccion>

        <Seccion
          id="texto"
          icono={Type}
          titulo="El texto"
          bajada={
            conIa
              ? "Lo escribió la IA: cámbialo si quieres."
              : "Con el precio y el enlace: cámbialo si quieres."
          }
          extra={
            ia === "oculta" ? null : (
              <ConFuncion estado={ia}>
                <button
                  type="button"
                  onClick={() => void pedirTextos()}
                  disabled={escribiendo}
                  className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold underline underline-offset-4 transition-colors hover:text-senal disabled:opacity-50"
                >
                  {escribiendo ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  ) : (
                    <RefreshCw aria-hidden="true" className="size-4" />
                  )}
                  {conIa ? "Otra versión" : "Escribir con IA"}
                </button>
              </ConFuncion>
            )
          }
        >
          <div
            role="tablist"
            aria-label="Para qué red"
            className={cn(FRANJA, "border-b border-tinta/15 px-4 py-3 sm:px-5")}
          >
            {CANALES.map((opcion) => (
              <button
                key={opcion.clave}
                type="button"
                role="tab"
                aria-selected={canal === opcion.clave}
                onClick={() => setCanal(opcion.clave)}
                className={cn(
                  FICHA_BASE,
                  canal === opcion.clave ? FICHA_SI : FICHA_NO
                )}
              >
                {opcion.nombre}
              </button>
            ))}
          </div>

          <div className="relative px-4 py-4 sm:px-5">
            <label htmlFor="texto-de-la-publicacion" className="sr-only">
              Texto para {CANALES.find((c) => c.clave === canal)?.nombre}
            </label>
            <textarea
              id="texto-de-la-publicacion"
              value={texto}
              onChange={(evento) =>
                setTextos((antes) => ({
                  ...antes,
                  [canal]: evento.target.value,
                }))
              }
              rows={canal === "whatsapp" ? 8 : 11}
              maxLength={2200}
              aria-busy={escribiendo}
              className={cn(
                "w-full resize-y border border-tinta/25 bg-papel p-3 text-base leading-relaxed transition-opacity outline-none focus-visible:border-tinta",
                escribiendo && "opacity-40"
              )}
            />
            {escribiendo ? (
              <p
                aria-live="polite"
                className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 items-center justify-center gap-2 text-sm font-semibold sm:inset-x-5"
              >
                <Sparkles aria-hidden="true" className="size-4 animate-pulse" />
                Escribiendo tu publicación…
              </p>
            ) : null}
          </div>

          {tiktok && tiktok !== "oculta" ? (
            <ConFuncion estado={tiktok} className="block">
              <a
                href={`/panel/marketing/tiktok?${new URLSearchParams({
                  producto: producto.id,
                  diseno,
                  formato,
                }).toString()}`}
                onClick={() => {
                  // El texto que se está escribiendo viaja a la pantalla de
                  // TikTok, que le quita los enlaces.
                  try {
                    sessionStorage.setItem(
                      "venduo:publicar:texto",
                      textos.instagram
                    )
                  } catch {
                    // Sin almacenamiento, allá se arma uno.
                  }
                }}
                className="group flex min-h-12 items-center justify-between gap-3 border-t border-tinta/15 px-4 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel sm:px-5"
              >
                Publicar directo en TikTok
                <Send aria-hidden="true" className="size-4" />
              </a>
            </ConFuncion>
          ) : null}

          <Compartir ruta={ruta} producto={producto} texto={texto} />
        </Seccion>
      </div>
    </div>
  )
}

/** El producto elegido, con la salida para elegir otro. */
function ProductoElegido({
  producto,
  alCambiar,
}: {
  producto: ProductoParaPublicar
  alCambiar: () => void
}) {
  return (
    <div className="flex items-center gap-3 border border-tinta p-3 sm:px-5">
      <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden border border-tinta/15 bg-tinta/[0.05]">
        {producto.foto ? (
          <Image
            src={producto.foto}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <Package aria-hidden="true" className="size-5 opacity-35" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-titular text-lg leading-tight font-bold tracking-[-0.01em]">
          {producto.nombre}
        </span>
        <span className="tabular text-sm opacity-70">
          {formatMoney(producto.precioCents)}
        </span>
      </span>
      <button
        type="button"
        onClick={alCambiar}
        className={cn(BOTON_SECUNDARIO, "min-h-11 shrink-0 px-4 text-sm")}
      >
        Cambiar
      </button>
    </div>
  )
}

/**
 * La imagen tal como sale, achicada. Se dibuja en el servidor: mientras llega
 * se ve su silueta, del mismo tamaño, para que nada salte.
 */
function Vista({
  ruta,
  ancho,
  alto,
  nombre,
}: {
  ruta: string
  ancho: number
  alto: number
  nombre: string
}) {
  const [lista, setLista] = React.useState<string | null>(null)
  const cargada = lista === ruta
  const vertical = alto > ancho

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden border border-tinta/15 bg-tinta/[0.06]",
        vertical ? "max-w-[18rem]" : "max-w-[24rem]"
      )}
      style={{ aspectRatio: `${ancho} / ${alto}` }}
    >
      {cargada ? null : (
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center"
        >
          <LoaderCircle className="size-6 animate-spin opacity-40" />
        </span>
      )}
      <Image
        key={ruta}
        src={ruta}
        alt={`Imagen para publicar ${nombre}`}
        fill
        unoptimized
        sizes="(min-width: 1024px) 24rem, 80vw"
        onLoad={() => setLista(ruta)}
        className={cn(
          "object-cover transition-opacity duration-300",
          cargada ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  )
}

/**
 * Compartir, copiar y WhatsApp. En el celular, "Compartir" va fijo abajo:
 * es lo que se vino a hacer.
 */
function Compartir({
  ruta,
  producto,
  texto,
}: {
  ruta: string
  producto: ProductoParaPublicar
  texto: string
}) {
  const [compartible, setCompartible] = React.useState(false)
  const [archivo, setArchivo] = React.useState<File | null>(null)
  const [copiado, setCopiado] = React.useState(false)
  const [compartiendo, setCompartiendo] = React.useState(false)

  React.useEffect(() => {
    setCompartible(
      typeof navigator !== "undefined" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({
          files: [new File([""], "prueba.png", { type: "image/png" })],
        })
    )
  }, [])

  // El archivo se baja antes de tocar "Compartir": si se bajara al tocar, el
  // navegador ya no lo cuenta como un toque y no abre la hoja de compartir.
  React.useEffect(() => {
    if (!compartible) return
    let vigente = true
    setArchivo(null)
    fetch(ruta)
      .then((respuesta) => (respuesta.ok ? respuesta.blob() : null))
      .then((blob) => {
        if (!vigente || !blob) return
        setArchivo(
          new File([blob], `${producto.nombre.slice(0, 40)}.png`, {
            type: "image/png",
          })
        )
      })
      .catch(() => {})
    return () => {
      vigente = false
    }
  }, [ruta, compartible, producto.nombre])

  async function copiar(avisar = true) {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 1800)
      if (avisar) toast.success("Texto copiado.")
    } catch {
      if (avisar)
        toast.error("No pudimos copiarlo. Selecciónalo y cópialo a mano.")
    }
  }

  async function compartir() {
    if (!archivo) return
    setCompartiendo(true)
    // Muchas apps descartan el texto cuando reciben una imagen: se deja
    // copiado para pegarlo.
    await copiar(false)
    try {
      await navigator.share({ files: [archivo], text: texto })
      toast.success("Si el texto no aparece, pégalo: ya está copiado.")
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        toast.error(
          "No pudimos abrir la hoja de compartir. Descarga la imagen."
        )
      }
    } finally {
      setCompartiendo(false)
    }
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(texto)}`

  return (
    <>
      <div className="grid grid-cols-2 border-t border-tinta/15">
        <button
          type="button"
          onClick={() => void copiar()}
          className="flex min-h-12 items-center justify-center gap-2 border-r border-tinta/15 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"
        >
          {copiado ? (
            <Check aria-hidden="true" className="size-4" />
          ) : (
            <Copy aria-hidden="true" className="size-4" />
          )}
          {copiado ? "Copiado" : "Copiar el texto"}
        </button>
        <a
          href={whatsapp}
          target="_blank"
          rel="noreferrer noopener"
          className="flex min-h-12 items-center justify-center gap-2 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"
        >
          <MessageCircle aria-hidden="true" className="size-4" />
          Por WhatsApp
        </a>
      </div>

      {compartible ? (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-tinta bg-papel px-4 py-3 lg:static lg:border-t lg:border-tinta/15 lg:px-5">
          <button
            type="button"
            onClick={() => void compartir()}
            disabled={!archivo || compartiendo}
            className={cn(BOTON_PRIMARIO, "w-full")}
          >
            {!archivo || compartiendo ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-5 animate-spin"
              />
            ) : (
              <Share2 aria-hidden="true" className="size-5" />
            )}
            {archivo ? "Compartir imagen y texto" : "Preparando la imagen…"}
          </button>
          {/* El navegador no puede elegir la app por la persona: se le dice
              qué va a encontrar en la hoja de compartir del teléfono. */}
          <p className="mt-2 text-center text-xs opacity-70">
            A tu estado, chats, grupos, Instagram o TikTok.
          </p>
        </div>
      ) : null}
    </>
  )
}
