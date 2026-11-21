"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  MessageCircle,
  ShoppingBag,
} from "lucide-react"
import { toast } from "sonner"

import {
  agotadosDelCombo,
  ahorroDelCombo,
  claveDeCombo,
  enumerar,
  idDeLineaDeCombo,
  topeDeCombos,
  type ComboDelCarrito,
} from "@/lib/combos"
import { formatMoney } from "@/lib/format"
import { enlaceDeWhatsApp } from "@/lib/pedidos"
import { cn } from "@/lib/utils"
import { textoDeVuelta } from "@/lib/vacaciones"
import {
  hayStockDe,
  leerOpciones,
  varianteDe,
  type Valores,
} from "@/lib/variantes"
import type { ComboPublico } from "@/lib/data/combos"
import { claveDeLinea, useCarrito } from "@/components/tienda/carrito"

/**
 * Un combo de un catálogo, en su tienda: se eligen las tallas de cada producto
 * y entra al carrito como una sola línea.
 *
 * Las tallas se eligen en la misma página, no en una hoja aparte: la página ya
 * habla solo de este combo, y una hoja encima sumaba un desplazamiento dentro
 * de otro. Es la misma elección de la ficha de un producto (`agregar.tsx`).
 * El precio que se ve es el del catálogo guardado; lo vuelve a leer
 * `create_order` al pedir.
 */
export function FichaDelCombo({
  combo,
  slug,
  nombreTienda,
  whatsapp,
}: {
  combo: ComboPublico
  slug: string
  nombreTienda: string
  whatsapp: string | null
}) {
  const router = useRouter()
  const { agregar, lineas, vacaciones } = useCarrito()
  const [recien, setRecien] = React.useState(false)
  const [marcado, setMarcado] = React.useState<number | null>(null)
  const [vista, setVista] = React.useState(0)
  const filas = React.useRef<(HTMLLIElement | null)[]>([])
  const galeria = React.useRef<HTMLDivElement>(null)
  const compra = React.useRef<HTMLDivElement>(null)
  // El botón de compra está a la vista: la barra de abajo se esconde. Empieza
  // en true para que no aparezca un instante en una pantalla donde no hace falta.
  const [compraALaVista, setCompraALaVista] = React.useState(true)

  const productos = React.useMemo(
    () =>
      combo.productos.map((producto) => {
        const variantes = producto.variantes ?? []
        return {
          producto,
          variantes,
          opciones: variantes.length ? leerOpciones(producto.opciones) : [],
        }
      }),
    [combo.productos]
  )

  // Una opción con un solo valor ya viene elegida: no hay nada que decidir.
  const [elegidos, setElegidos] = React.useState<Valores[]>(() =>
    productos.map(({ opciones }) =>
      Object.fromEntries(
        opciones
          .filter((o) => o.valores.length === 1)
          .map((o) => [o.nombre, o.valores[0]])
      )
    )
  )

  React.useEffect(() => {
    if (!recien) return
    const id = window.setTimeout(() => setRecien(false), 2200)
    return () => window.clearTimeout(id)
  }, [recien])

  // Lo elegido de cada producto, y lo que falta.
  const partes = productos.map(({ producto, variantes, opciones }, indice) => {
    const faltan = opciones.filter((o) => !elegidos[indice]?.[o.nombre])
    const variante =
      opciones.length && faltan.length === 0
        ? varianteDe(variantes, elegidos[indice] ?? {})
        : null
    return {
      producto,
      variantes,
      opciones,
      faltan,
      variante,
      stock: opciones.length ? (variante?.stock ?? 0) : producto.stock,
    }
  })

  // Agotado entero: un producto que no tiene nada, en ninguna talla.
  const agotados = agotadosDelCombo(
    productos.map(({ producto }) => ({
      productoId: producto.id,
      nombre: producto.name,
      stock: producto.stock,
    }))
  )
  const primeraIncompleta = partes.findIndex((p) => p.faltan.length > 0)
  const completo = primeraIncompleta === -1
  const sinStockElegido = partes.find(
    (p) => p.opciones.length > 0 && p.variante && p.stock === 0
  )

  const delCarrito: ComboDelCarrito = {
    catalogo: combo.catalogo,
    id: combo.id,
    partes: partes.map((p) => ({
      productoId: p.producto.id,
      varianteId: p.variante?.id ?? null,
      nombre: p.producto.name,
      variante: p.variante?.nombre ?? null,
      imagen: p.variante?.imagen ?? p.producto.image_url,
    })),
  }
  const tope = completo
    ? topeDeCombos(
        partes.map((p) => ({
          productoId: p.producto.id,
          varianteId: p.variante?.id ?? null,
          nombre: p.producto.name,
          stock: p.stock,
        }))
      )
    : 0
  const yaEnCarrito =
    lineas.find((l) => claveDeLinea(l) === claveDeCombo(delCarrito))
      ?.cantidad ?? 0
  const disponible = Math.max(tope - yaEnCarrito, 0)
  const enAlguna = lineas.some(
    (l) => l.combo?.catalogo === combo.catalogo && l.combo.id === combo.id
  )

  const suelto = combo.productos.reduce((t, p) => t + p.price_cents, 0)
  const ahorro = ahorroDelCombo(combo.precioCents, suelto)
  const fotos = combo.productos
    .map((p) => p.image_url)
    .filter((f): f is string => Boolean(f))

  // La galería: primero todo el combo junto, si hay al menos dos fotos, y
  // después cada producto, con la foto de la talla elegida si tiene una.
  const conTodo = fotos.length >= 2
  const vistas: Vista[] = [
    ...(conTodo
      ? [{ tipo: "todo" as const, fotos, nombre: combo.nombre }]
      : []),
    ...partes.map((p) => ({
      tipo: "producto" as const,
      foto: p.variante?.imagen ?? p.producto.image_url,
      nombre: p.producto.name,
    })),
  ]

  // Cuánto tapa la cabecera de la plantilla, si queda fija arriba: la
  // galería se pega justo debajo. Se vuelve a medir si la cabecera cambia.
  React.useEffect(() => {
    const cabecera = document.querySelector("header")
    const caja = galeria.current
    if (!cabecera || !caja) return
    const medir = () => {
      const { position } = getComputedStyle(cabecera)
      const fija = position === "sticky" || position === "fixed"
      caja.style.setProperty(
        "--alto-cabecera",
        `${fija ? cabecera.getBoundingClientRect().height : 0}px`
      )
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(cabecera)
    return () => observador.disconnect()
  }, [])

  // La barra de abajo aparece solo mientras el botón no se ve: nunca dos
  // botones a la vez, y nunca una pantalla sin ninguno.
  React.useEffect(() => {
    const caja = compra.current
    if (!caja) return
    const observador = new IntersectionObserver(([entrada]) =>
      setCompraALaVista(entrada.isIntersecting)
    )
    observador.observe(caja)
    return () => observador.disconnect()
  }, [])

  /** Muestra en la galería la foto de un producto de la lista. */
  function verFoto(indice: number) {
    setVista(indice + (conTodo ? 1 : 0))
    galeria.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "nearest",
    })
  }

  function elegir(indice: number, opcion: string, valor: string) {
    setElegidos((antes) =>
      antes.map((v, i) => (i === indice ? { ...v, [opcion]: valor } : v))
    )
    if (marcado === indice) setMarcado(null)
  }

  /** Lo elegido de cada producto que tenía algo que elegir: "Blusa (M)". */
  const elegido = partes
    .filter((p) => p.opciones.length > 0 && p.variante)
    .map((p) => `${p.producto.name} (${p.variante?.nombre})`)

  /** Lo que dice el botón cuando falta algo: "Elige talla de Short". */
  const falta =
    primeraIncompleta === -1
      ? null
      : `${partes[primeraIncompleta].faltan
          .map((o) => o.nombre.toLowerCase())
          .join(" y ")} de ${partes[primeraIncompleta].producto.name}`

  function alAgregar() {
    // Con algo pendiente, el botón lleva hasta ahí en vez de quedar apagado.
    if (!completo) {
      setMarcado(primeraIncompleta)
      filas.current[primeraIncompleta]?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
      })
      return
    }
    if (disponible === 0) return

    agregar(
      {
        productoId: idDeLineaDeCombo(combo),
        nombre: combo.nombre,
        precioCents: combo.precioCents,
        imagen: fotos[0] ?? null,
        stock: tope,
        combo: delCarrito,
      },
      1
    )
    setRecien(true)
    toast.success(`${combo.nombre} está en tu carrito.`)
  }

  const consulta = whatsapp
    ? enlaceDeWhatsApp(
        whatsapp,
        agotados.length
          ? `Hola ${nombreTienda}, quiero el ${combo.nombre}. ¿Cuándo vuelve ${enumerar(agotados)}?`
          : `Hola ${nombreTienda}, quisiera saber más sobre ${combo.nombre}.`
      )
    : null

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pt-6 pb-36 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-12 lg:pb-16">
      {/* En computadora la galería acompaña la lista, justo debajo de la
          cabecera de la plantilla, que mide distinto en cada una. */}
      <div
        ref={galeria}
        className="scroll-mt-28 lg:sticky lg:top-[calc(var(--alto-cabecera,0px)+1.5rem)]"
      >
        <Galeria vistas={vistas} activa={vista} alCambiar={setVista} />
      </div>

      <div className="mt-7 lg:mt-0">
        <h1 className="font-titular text-[clamp(1.75rem,6vw,2.75rem)] leading-[1.05] font-extrabold tracking-[-0.03em]">
          {combo.nombre}
        </h1>
        {combo.nota ? (
          <p className="mt-3 max-w-[52ch] leading-relaxed opacity-70">
            {combo.nota}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <p className="tabular font-titular text-3xl font-extrabold tracking-[-0.03em]">
            {formatMoney(combo.precioCents)}
          </p>
          {ahorro ? (
            <>
              <p className="tabular text-sm opacity-60">
                Por separado{" "}
                <span className="line-through">{formatMoney(suelto)}</span>
              </p>
              <span className="tabular rounded-plantilla bg-senal px-2.5 py-1 text-xs font-bold tracking-[0.08em] text-white uppercase">
                Ahorras {formatMoney(ahorro.cents)} · {ahorro.porcentaje}%
              </span>
            </>
          ) : null}
        </div>

        <div className="mt-8 flex items-baseline justify-between border-t-2 border-tinta pt-5">
          <h2 className="font-titular text-lg font-bold tracking-[-0.02em]">
            Qué incluye
          </h2>
          <span className="text-sm opacity-60">
            {combo.productos.length}{" "}
            {combo.productos.length === 1 ? "producto" : "productos"}
          </span>
        </div>

        {/* Desde sm, en dos columnas: siete productos entran sin una lista
            larga. Uno con talla para elegir ocupa el ancho entero. */}
        <ul className="mt-2 sm:grid sm:grid-cols-2 sm:gap-x-6">
          {partes.map((parte, indice) => (
            <li
              key={`${parte.producto.id}-${indice}`}
              ref={(fila) => {
                filas.current[indice] = fila
              }}
              className={cn(
                "min-w-0 scroll-mt-28 border-t border-tinta/15 py-3 first:border-t-0 sm:first:border-t",
                parte.opciones.length > 0 &&
                  !vacaciones &&
                  !agotados.length &&
                  "sm:col-span-2"
              )}
            >
              <div className="flex items-center gap-4 sm:gap-3">
                {/* Tocarla la muestra grande en la galería. */}
                <button
                  type="button"
                  onClick={() => verFoto(indice)}
                  aria-label={`Ver la foto de ${parte.producto.name}`}
                  className="size-16 shrink-0 overflow-hidden rounded-plantilla border border-tinta/15 bg-tinta/5 transition-opacity hover:opacity-80 sm:size-14"
                >
                  {(parte.variante?.imagen ?? parte.producto.image_url) ? (
                    <Image
                      src={
                        (parte.variante?.imagen ??
                          parte.producto.image_url) as string
                      }
                      alt=""
                      width={160}
                      height={160}
                      sizes="80px"
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center">
                      <ImageOff
                        aria-hidden="true"
                        className="size-5 opacity-25"
                      />
                    </span>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{parte.producto.name}</p>
                  <p className="tabular text-sm opacity-60">
                    {formatMoney(parte.producto.price_cents)}
                  </p>
                </div>
              </div>

              {/* Agotado o de vacaciones no hay nada que elegir. */}
              {parte.opciones.length && !vacaciones && !agotados.length ? (
                <div className="mt-4 flex flex-col gap-4 sm:mt-3">
                  {parte.opciones.map((opcion) => {
                    const valor = elegidos[indice]?.[opcion.nombre]
                    const pendiente = marcado === indice && !valor
                    return (
                      <fieldset key={opcion.nombre}>
                        <legend
                          className={cn(
                            "text-xs font-semibold tracking-[0.12em] uppercase",
                            pendiente ? "text-senal" : "opacity-60"
                          )}
                        >
                          {opcion.nombre}
                          {valor ? (
                            <span className="ml-1.5 normal-case">
                              · {valor}
                            </span>
                          ) : pendiente ? (
                            <span className="ml-1.5 normal-case">
                              · Falta elegir {opcion.nombre.toLowerCase()}
                            </span>
                          ) : null}
                        </legend>
                        <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-2">
                          {opcion.valores.map((v) => {
                            const elegido = valor === v
                            const conStock = hayStockDe(
                              parte.variantes,
                              opcion.nombre,
                              v,
                              elegidos[indice] ?? {}
                            )
                            return (
                              <button
                                key={v}
                                type="button"
                                aria-pressed={elegido}
                                aria-label={`${parte.producto.name}, ${opcion.nombre} ${v}${conStock ? "" : ", sin stock"}`}
                                onClick={() => elegir(indice, opcion.nombre, v)}
                                className={cn(
                                  "flex min-h-11 w-full min-w-0 items-center justify-center rounded-plantilla border px-2 font-semibold transition-colors",
                                  elegido
                                    ? "border-tinta bg-tinta text-papel"
                                    : "border-tinta/30 hover:border-tinta",
                                  !conStock &&
                                    "line-through decoration-2 opacity-45"
                                )}
                              >
                                <span className="truncate">{v}</span>
                              </button>
                            )
                          })}
                        </div>
                      </fieldset>
                    )
                  })}
                </div>
              ) : null}
            </li>
          ))}
        </ul>

        {vacaciones ? (
          <div className="border-t-2 border-tinta pt-7">
            <p className="font-titular text-lg font-bold tracking-[-0.02em]">
              {textoDeVuelta(vacaciones.hasta).replace(/\.$/, "")}
            </p>
            <p className="mt-2 max-w-[48ch] leading-relaxed opacity-70">
              Puedes ver todo el catálogo; recibimos tu pedido cuando
              regresemos.
            </p>
          </div>
        ) : agotados.length ? (
          <div className="border-t-2 border-tinta pt-7">
            <p className="font-titular text-lg font-bold tracking-[-0.02em]">
              Sin stock por ahora
            </p>
            <p className="mt-2 max-w-[48ch] leading-relaxed opacity-70">
              {agotados.length === 1 ? "Se agotó" : "Se agotaron"}{" "}
              {enumerar(agotados)}. Escríbenos para saber cuándo vuelve.
            </p>
            {consulta ? (
              <a
                href={consulta}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-plantilla border-2 border-tinta px-5 font-semibold transition-colors hover:bg-tinta hover:text-papel"
              >
                <MessageCircle aria-hidden="true" className="size-4" />
                Escríbenos por WhatsApp
              </a>
            ) : null}
          </div>
        ) : (
          <div ref={compra} className="border-t-2 border-tinta pt-5">
            {/* En computadora el botón vive acá; en el celular, en la barra
                de abajo, que dice también lo que falta. */}
            <div className="hidden lg:block">
              {/* En qué va: lo que falta, o lo elegido para confirmarlo. */}
              {sinStockElegido ? (
                <p className="mb-4 text-sm font-semibold text-senal">
                  Esta opción se agotó. Elige otra o escríbenos.
                </p>
              ) : falta ? (
                <p
                  className={cn(
                    "mb-4 flex items-center gap-2 text-sm font-semibold",
                    marcado === null && "opacity-70",
                    marcado !== null && "text-senal"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="size-1.5 shrink-0 rounded-full bg-current"
                  />
                  <span className="min-w-0">Falta elegir {falta}.</span>
                </p>
              ) : elegido.length ? (
                <p className="mb-4 flex items-start gap-2 text-sm">
                  <Check
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-senal"
                  />
                  <span className="min-w-0">
                    <span className="font-semibold">Listo:</span>{" "}
                    {enumerar(elegido)}.
                  </span>
                </p>
              ) : null}

              <div
                className={cn(
                  "grid gap-3",
                  enAlguna && "sm:grid-cols-[minmax(0,1fr)_auto]"
                )}
              >
                <button
                  type="button"
                  onClick={alAgregar}
                  disabled={completo && disponible === 0}
                  className={cn(
                    "flex min-h-13 min-w-0 items-center justify-center gap-2 rounded-plantilla px-5 font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.98] motion-reduce:active:scale-100",
                    recien
                      ? "bg-tinta text-papel"
                      : "bg-senal text-white hover:bg-senal-alta",
                    completo && disponible === 0 && "opacity-50"
                  )}
                >
                  {recien ? (
                    <Check aria-hidden="true" className="size-4 shrink-0" />
                  ) : falta ? null : (
                    <ShoppingBag
                      aria-hidden="true"
                      className="size-4 shrink-0"
                    />
                  )}
                  <span className="truncate">
                    {recien
                      ? "Agregado a tu carrito"
                      : falta
                        ? `Elige ${falta}`
                        : completo && disponible === 0
                          ? "No queda más stock"
                          : `Agregar al carrito · ${formatMoney(combo.precioCents)}`}
                  </span>
                </button>
                {enAlguna ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/t/${slug}/carrito`)}
                    className="flex min-h-13 items-center justify-center rounded-plantilla border-2 border-tinta px-5 font-semibold transition-colors hover:bg-tinta hover:text-papel"
                  >
                    Ver mi carrito
                  </button>
                ) : null}
              </div>
            </div>

            {sinStockElegido ? (
              <p className="mb-4 text-sm font-semibold text-senal lg:hidden">
                Esta opción se agotó. Elige otra o escríbenos.
              </p>
            ) : null}
            {yaEnCarrito > 0 ? (
              <p className="text-sm opacity-65 lg:mt-3">
                Ya tienes {yaEnCarrito} en tu carrito.
                {disponible === 0
                  ? " Es todo el stock disponible."
                  : ` Puedes agregar ${disponible} más.`}
              </p>
            ) : null}
            {consulta ? (
              <a
                href={consulta}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4 transition-opacity hover:opacity-60"
              >
                <MessageCircle aria-hidden="true" className="size-4" />
                ¿Tienes dudas? Pregúntanos por WhatsApp
              </a>
            ) : null}
          </div>
        )}
      </div>

      {/* La barra de abajo. En el celular, siempre. En computadora, solo
          mientras el botón de compra no se ve: sube al alejarse de él y se va
          al llegar. Escondida, no se puede tocar ni enfocar. */}
      {!vacaciones && !agotados.length ? (
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-30 border-t border-tinta/15 bg-papel px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] motion-reduce:transition-none lg:shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.18)] lg:transition-[translate,visibility] lg:duration-300 lg:ease-[cubic-bezier(0.16,1,0.3,1)]",
            compraALaVista && "lg:invisible lg:translate-y-full"
          )}
        >
          <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate text-sm font-semibold",
                  falta && marcado !== null && "text-senal"
                )}
              >
                {falta ? `Falta: ${falta}` : combo.nombre}
              </p>
              <p className="tabular font-titular text-lg font-extrabold">
                {formatMoney(combo.precioCents)}
              </p>
            </div>
            {enAlguna ? (
              <button
                type="button"
                onClick={() => router.push(`/t/${slug}/carrito`)}
                aria-label="Ver mi carrito"
                className="flex size-12 items-center justify-center gap-2 rounded-plantilla border-2 border-tinta font-semibold transition-colors hover:bg-tinta hover:text-papel md:w-auto md:px-5"
              >
                <ShoppingBag aria-hidden="true" className="size-5 md:hidden" />
                <span className="hidden md:inline">Ver mi carrito</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={alAgregar}
              disabled={completo && disponible === 0}
              className={cn(
                "flex min-h-12 items-center justify-center gap-2 rounded-plantilla px-5 font-semibold transition-colors md:min-w-56",
                recien
                  ? "bg-tinta text-papel"
                  : "bg-senal text-white hover:bg-senal-alta",
                completo && disponible === 0 && "opacity-50"
              )}
            >
              {recien ? (
                <Check aria-hidden="true" className="size-4" />
              ) : falta ? null : (
                <ShoppingBag
                  aria-hidden="true"
                  className="hidden size-4 md:block"
                />
              )}
              <span className="md:hidden">
                {recien ? "Agregado" : falta ? "Elegir" : "Agregar"}
              </span>
              <span className="hidden md:inline">
                {recien
                  ? "Agregado"
                  : falta
                    ? "Elegir lo que falta"
                    : "Agregar al carrito"}
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

type Vista =
  | { tipo: "todo"; fotos: string[]; nombre: string }
  | { tipo: "producto"; foto: string | null; nombre: string }

/**
 * Las fotos del combo: una grande que se desliza con el dedo, y debajo una
 * franja con todas, que se tocan para verlas. La primera es el combo entero.
 *
 * El índice se lee al terminar de deslizar, no en cada paso: si no, un toque
 * en la franja que desliza varias fotos se frenaba en la del medio.
 */
function Galeria({
  vistas,
  activa,
  alCambiar,
}: {
  vistas: Vista[]
  activa: number
  alCambiar: (indice: number) => void
}) {
  const pista = React.useRef<HTMLDivElement>(null)
  const espera = React.useRef<number | undefined>(undefined)
  const actual = Math.min(activa, vistas.length - 1)

  React.useEffect(() => {
    const el = pista.current
    if (!el) return
    const destino = actual * el.clientWidth
    if (Math.abs(el.scrollLeft - destino) < 4) return
    el.scrollTo({
      left: destino,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    })
  }, [actual])

  React.useEffect(() => () => window.clearTimeout(espera.current), [])

  function alDeslizar() {
    window.clearTimeout(espera.current)
    espera.current = window.setTimeout(() => {
      const el = pista.current
      if (!el) return
      const indice = Math.round(el.scrollLeft / el.clientWidth)
      if (indice !== actual) alCambiar(indice)
    }, 120)
  }

  const flecha =
    "absolute top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-papel/90 text-tinta shadow-sm transition-opacity hover:bg-papel disabled:opacity-0 md:flex"

  return (
    <div>
      <div className="relative">
        <div
          ref={pista}
          onScroll={alDeslizar}
          className="flex aspect-square snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overflow-y-hidden rounded-plantilla border border-tinta/15 bg-tinta/5 lg:aspect-[5/4] [&::-webkit-scrollbar]:hidden"
        >
          {vistas.map((v, indice) => (
            <div
              key={indice}
              className="relative size-full shrink-0 snap-center"
              aria-hidden={indice !== actual}
            >
              {v.tipo === "todo" ? (
                <Mosaico fotos={v.fotos} nombre={v.nombre} />
              ) : v.foto ? (
                <Image
                  src={v.foto}
                  alt={v.nombre}
                  fill
                  sizes="(min-width: 1024px) 560px, 100vw"
                  priority={indice === 0}
                  className="object-cover"
                />
              ) : (
                <span className="flex size-full flex-col items-center justify-center gap-2">
                  <ImageOff aria-hidden="true" className="size-8 opacity-25" />
                  <span className="text-sm opacity-60">Sin foto</span>
                </span>
              )}
            </div>
          ))}
        </div>

        <span className="pointer-events-none absolute top-3 left-3 rounded-plantilla bg-tinta px-2.5 py-1 text-xs font-bold tracking-[0.12em] text-papel uppercase">
          Combo
        </span>
        <span className="pointer-events-none absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-plantilla bg-papel/90 px-2.5 py-1 text-sm font-semibold">
          {vistas[actual]?.tipo === "todo"
            ? `Todo el combo · ${vistas.length - 1} productos`
            : vistas[actual]?.nombre}
        </span>

        {vistas.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => alCambiar(actual - 1)}
              disabled={actual === 0}
              aria-label="Foto anterior"
              className={cn(flecha, "left-3")}
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => alCambiar(actual + 1)}
              disabled={actual === vistas.length - 1}
              aria-label="Foto siguiente"
              className={cn(flecha, "right-3")}
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </>
        ) : null}
      </div>

      {/* Una franja que se desliza, nunca dos renglones. */}
      {vistas.length > 1 ? (
        <div className="-mx-5 mt-3 flex [scrollbar-width:none] gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          {vistas.map((v, indice) => (
            <button
              key={indice}
              type="button"
              onClick={() => alCambiar(indice)}
              aria-label={
                v.tipo === "todo" ? "Ver todo el combo" : `Ver ${v.nombre}`
              }
              aria-current={indice === actual}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-plantilla border-2 bg-tinta/5 transition-opacity md:size-20",
                indice === actual
                  ? "border-tinta"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              {v.tipo === "todo" ? (
                <Mosaico fotos={v.fotos} nombre="" chico />
              ) : v.foto ? (
                <Image
                  src={v.foto}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center">
                  <ImageOff aria-hidden="true" className="size-5 opacity-25" />
                </span>
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Las fotos del combo juntas: dos lado a lado, tres con una alta, cuatro o más
 * en cuadrícula con "+N" en la última.
 */
function Mosaico({
  fotos,
  nombre,
  chico = false,
}: {
  fotos: string[]
  nombre: string
  chico?: boolean
}) {
  const visibles = fotos.slice(0, 4)
  const resto = fotos.length - visibles.length

  return (
    <div
      className={cn(
        "grid size-full",
        chico ? "gap-px" : "gap-1",
        visibles.length >= 2 && "grid-cols-2",
        visibles.length >= 3 && "grid-rows-2"
      )}
    >
      {visibles.map((foto, indice) => (
        <div
          key={`${foto}-${indice}`}
          className={cn(
            "relative overflow-hidden",
            visibles.length === 3 && indice === 0 && "row-span-2"
          )}
        >
          <Image
            src={foto}
            alt={indice === 0 ? nombre : ""}
            fill
            sizes={chico ? "40px" : "(min-width: 1024px) 280px, 50vw"}
            className="object-cover"
          />
          {indice === 3 && resto > 0 ? (
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center bg-tinta/60 font-titular font-bold text-papel",
                chico ? "text-xs" : "text-2xl"
              )}
            >
              +{resto}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  )
}
