"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Check,
  ChevronLeft,
  CircleAlert,
  Loader2,
  Package,
  Plus,
  Search,
  ShoppingBag,
} from "lucide-react"
import { toast } from "sonner"

import {
  BOTON_PRIMARIO,
  FICHA,
  FICHA_ELEGIDA,
  FICHA_LIBRE,
  GRILLA_DE_FICHAS,
} from "@/lib/estilos"
import { aCentavos, formatMoney, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { VentaInput } from "@/lib/validation/venta"
import { CampoMonto, Cantidad, HojaDeAjuste } from "@/components/panel/ajustes"
import { useFestejo } from "@/components/panel/festejo"
import { Miniatura, Seccion, SinDatos } from "@/components/panel/piezas"
import type { ResultadoDeVenta } from "@/app/(privado)/panel/pedidos/acciones"

/** Lo que hace falta de un producto para venderlo. */
export interface ProductoParaVender {
  id: string
  nombre: string
  foto: string | null
  precioCents: number
  stock: number
  categoria: string | null
  /** Talla, color: con opciones, se elige cuál se vendió. */
  variantes: OpcionParaVender[]
}

export interface OpcionParaVender {
  id: string
  nombre: string
  stock: number
  /** `null`: cuesta lo mismo que el producto. */
  precioCents: number | null
}

interface Linea {
  /** Una por producto, o una por opción si las tiene. */
  clave: string
  productoId: string
  varianteId: string | null
  cantidad: number
  /** En bolivianos. `null` mientras se borra el campo: al cerrar, vuelve al de lista. */
  precio: number | null
}

/** Donde queda la venta a medio armar si se sale a corregir un stock. */
const BORRADOR = "venduo:nueva-venta"

/**
 * Registrar una venta directa: lo que se vendió en el chat o en persona.
 *
 * Por filas, como el producto: arriba lo vendido —foto, nombre, "1 × Bs 240" y
 * más y menos—, y "Agregar producto" abre la grilla en una hoja. Una venta de
 * uno o dos productos cabe entera en la primera pantalla. Tocar una línea abre
 * su hoja, para una rebaja o para quitarla. Queda pagada y el stock baja en el
 * acto; si el stock dice que no hay, la línea se pinta de rojo antes de
 * registrar, porque el servidor la rechazaría.
 */
export function NuevaVenta({
  productos,
  registrar,
  soloLectura,
}: {
  productos: ProductoParaVender[]
  registrar: (venta: VentaInput) => Promise<ResultadoDeVenta>
  soloLectura: boolean
}) {
  const router = useRouter()
  const { festejo, festejar } = useFestejo()
  const [lineas, setLineas] = React.useState<Linea[]>([])
  const [registrando, setRegistrando] = React.useState(false)
  const [agregando, setAgregando] = React.useState(false)
  // Cada vez que se abre, la hoja se monta de nuevo: empieza sin nada marcado,
  // en todos los productos y sin filtros.
  const [aperturas, setAperturas] = React.useState(0)
  const [abierta, setAbierta] = React.useState<string | null>(null)
  const [recien, setRecien] = React.useState<string | null>(null)
  // Hasta leer el borrador no se dibuja la venta: se veía un instante vacía
  // y después aparecían las líneas guardadas.
  const [restaurado, setRestaurado] = React.useState(false)

  const porId = React.useMemo(
    () => new Map(productos.map((p) => [p.id, p])),
    [productos]
  )

  // La venta a medio armar sobrevive a "Corregir el stock", que lleva a otra
  // pantalla: se guarda en esta pestaña y se recupera al volver.
  React.useEffect(() => {
    try {
      const guardado = sessionStorage.getItem(BORRADOR)
      if (guardado) {
        const leidas = (JSON.parse(guardado) as Linea[]).filter((l) =>
          porId.has(l.productoId)
        )
        if (leidas.length) setLineas(leidas)
      }
    } catch {
      // Sin almacenamiento, la venta empieza vacía: no es un error.
    }
    setRestaurado(true)
  }, [porId])

  React.useEffect(() => {
    if (!restaurado) return
    try {
      if (lineas.length)
        sessionStorage.setItem(BORRADOR, JSON.stringify(lineas))
      else sessionStorage.removeItem(BORRADOR)
    } catch {
      // Igual que arriba: sin almacenamiento, no se guarda.
    }
  }, [lineas, restaurado])

  React.useEffect(() => {
    if (!recien) return
    const id = window.setTimeout(() => setRecien(null), 600)
    return () => window.clearTimeout(id)
  }, [recien])

  function sumar(
    producto: ProductoParaVender,
    variante: OpcionParaVender | null
  ) {
    const clave = variante ? `${producto.id}:${variante.id}` : producto.id
    setLineas((antes) => {
      const ya = antes.find((l) => l.clave === clave)
      if (ya) {
        return antes.map((l) =>
          l.clave === clave
            ? { ...l, cantidad: Math.min(l.cantidad + 1, 999) }
            : l
        )
      }
      return [
        ...antes,
        {
          clave,
          productoId: producto.id,
          varianteId: variante?.id ?? null,
          cantidad: 1,
          precio: (variante?.precioCents ?? producto.precioCents) / 100,
        },
      ]
    })
    setRecien(clave)
  }

  function abrirAgregar() {
    setAperturas((n) => n + 1)
    setAgregando(true)
  }

  function cambiar(clave: string, cambio: Partial<Linea>) {
    setLineas((antes) =>
      antes.map((l) => (l.clave === clave ? { ...l, ...cambio } : l))
    )
  }

  function quitar(clave: string) {
    setLineas((antes) => antes.filter((l) => l.clave !== clave))
    setAbierta(null)
  }

  /** El stock y el precio de una línea: los de su opción, si la tiene. */
  function datosDe(linea: Linea) {
    const producto = porId.get(linea.productoId)
    const variante = linea.varianteId
      ? producto?.variantes.find((v) => v.id === linea.varianteId)
      : undefined
    return {
      producto,
      variante,
      stock: variante?.stock ?? producto?.stock ?? 0,
      precioCents: variante?.precioCents ?? producto?.precioCents ?? 0,
    }
  }

  /** El precio que se cobra: el escrito, o el de lista si el campo quedó vacío. */
  function precioDe(linea: Linea) {
    return linea.precio === null
      ? datosDe(linea).precioCents
      : aCentavos(linea.precio)
  }

  function cerrarLinea() {
    // Abrir el precio y dejarlo vacío no es un error: vuelve al de lista.
    const linea = lineas.find((l) => l.clave === abierta)
    if (linea && linea.precio === null) {
      cambiar(linea.clave, { precio: datosDe(linea).precioCents / 100 })
    }
    setAbierta(null)
  }

  const totalCents = lineas.reduce(
    (total, l) => total + precioDe(l) * l.cantidad,
    0
  )
  const unidades = lineas.reduce((total, l) => total + l.cantidad, 0)
  const faltaStock = lineas.some((l) => l.cantidad > datosDe(l).stock)

  async function enviar() {
    if (lineas.length === 0 || registrando) return
    if (faltaStock) {
      toast.error("Revisa lo que quedó en rojo.")
      return
    }
    if (soloLectura) {
      toast.info("Es una tienda de ejemplo: la venta no se guarda.")
      return
    }
    setRegistrando(true)
    const resultado = await registrar({
      lineas: lineas.map((l) => ({
        productoId: l.productoId,
        varianteId: l.varianteId,
        cantidad: l.cantidad,
        precio: precioDe(l) / 100,
      })),
    }).catch((): ResultadoDeVenta => ({
      ok: false,
      error: "No pudimos registrar la venta. Revisa tu conexión.",
    }))
    setRegistrando(false)

    if (!resultado.ok) {
      toast.error(resultado.error)
      // Si alguien vendió entre medio, el stock nuevo pinta de rojo la línea
      // que ya no alcanza: el error queda donde se corrige.
      router.refresh()
      return
    }

    festejar()
    toast.success(
      `Venta #${resultado.numero} registrada: ${formatMoney(resultado.totalCents)}. Ya se descontó del stock.`,
      {
        action: {
          label: "Ver",
          onClick: () => router.push(`/panel/pedidos/${resultado.id}`),
        },
      }
    )
    setLineas([])
    // El stock de cada producto cambió: la grilla lo vuelve a leer.
    router.refresh()
  }

  if (productos.length === 0) {
    return (
      <Seccion
        id="productos"
        icono={ShoppingBag}
        titulo="Qué vendiste"
        bajada="Toca un producto para sumarlo."
      >
        <SinDatos
          icono={Package}
          titulo="Todavía no tienes productos"
          texto="Carga los que vendes y vuelve: cada venta descuenta de su stock."
        >
          <Link
            href="/panel/productos/nuevo"
            className={cn(BOTON_PRIMARIO, "min-h-11 px-4 text-sm")}
          >
            <Plus aria-hidden="true" className="size-4" />
            Nuevo producto
          </Link>
        </SinDatos>
      </Seccion>
    )
  }

  const lineaAbierta = lineas.find((l) => l.clave === abierta) ?? null
  const enLaVenta = lineas.reduce(
    (mapa, l) => mapa.set(l.clave, l.cantidad),
    new Map<string, number>()
  )

  return (
    <div className={cn("flex flex-col", lineas.length > 0 && "max-lg:pb-28")}>
      {festejo}

      {!restaurado ? null : lineas.length === 0 ? (
        <div className="flex flex-col items-start gap-2 border border-tinta p-5">
          <ShoppingBag aria-hidden="true" className="size-7 opacity-30" />
          <p className="font-titular text-xl leading-tight font-extrabold tracking-[-0.02em]">
            ¿Qué vendiste?
          </p>
          <p className="text-sm text-tinta/70">
            Elige los productos de tu catálogo y registra la venta.
          </p>
          <button
            type="button"
            onClick={abrirAgregar}
            className={cn(BOTON_PRIMARIO, "mt-3 w-full")}
          >
            <Plus aria-hidden="true" className="size-5" />
            Agregar producto
          </button>
        </div>
      ) : (
        <div className="border border-tinta">
          <ul>
            {lineas.map((linea) => {
              const { producto, variante, stock, precioCents } = datosDe(linea)
              if (!producto) return null
              return (
                <LineaDeVenta
                  key={linea.clave}
                  producto={producto}
                  variante={variante?.nombre ?? null}
                  cantidad={linea.cantidad}
                  precioCents={precioDe(linea)}
                  precioDeLista={precioCents}
                  stock={stock}
                  recien={recien === linea.clave}
                  desactivada={registrando}
                  alAbrir={() => setAbierta(linea.clave)}
                  alCambiarCantidad={(cantidad) =>
                    cambiar(linea.clave, { cantidad })
                  }
                />
              )
            })}
          </ul>
          <button
            type="button"
            onClick={abrirAgregar}
            disabled={registrando}
            className="flex min-h-14 w-full items-center gap-3 border-t border-tinta/15 px-4 text-left font-semibold transition-colors hover:bg-tinta/[0.04] active:bg-tinta/[0.07] disabled:opacity-50"
          >
            <Plus aria-hidden="true" className="size-5" />
            Agregar producto
          </button>

          {/* En el celular, el total y el botón van fijos sobre las pestañas:
              es lo que se vino a hacer. En una pantalla ancha, al pie de la
              venta, como un recibo. */}
          <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 flex items-center gap-3 border-t border-tinta bg-papel px-4 py-3 lg:static lg:border-tinta/15 lg:py-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
                Total · {formatNumber(unidades)}{" "}
                {unidades === 1 ? "unidad" : "unidades"}
              </p>
              <p className="tabular font-titular text-2xl leading-tight font-extrabold tracking-[-0.03em]">
                {formatMoney(totalCents)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void enviar()}
              disabled={registrando}
              className={cn(BOTON_PRIMARIO, "min-h-12 shrink-0 px-5")}
            >
              {registrando ? (
                <Loader2 aria-hidden="true" className="size-5 animate-spin" />
              ) : null}
              {registrando ? "Registrando…" : "Registrar venta"}
            </button>
          </div>
        </div>
      )}

      <HojaParaAgregar
        key={aperturas}
        abierta={agregando}
        productos={productos}
        enLaVenta={enLaVenta}
        alCerrar={() => setAgregando(false)}
        alAgregar={(marcados) => {
          marcados.forEach((m) => sumar(m.producto, m.variante))
          setAgregando(false)
        }}
      />

      {lineaAbierta ? (
        <HojaDeLinea
          linea={lineaAbierta}
          datos={datosDe(lineaAbierta)}
          alCambiar={(cambio) => cambiar(lineaAbierta.clave, cambio)}
          alQuitar={() => quitar(lineaAbierta.clave)}
          alCerrar={cerrarLinea}
        />
      ) : null}
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Una línea de la venta
 * ------------------------------------------------------------------------ */

/**
 * Lo vendido de un producto: foto, nombre, "2 × Bs 100" y más y menos. Tocar
 * la fila abre su hoja; el más y menos va al lado, no dentro, porque serían
 * dos botones uno dentro del otro.
 */
function LineaDeVenta({
  producto,
  variante,
  cantidad,
  precioCents,
  precioDeLista,
  stock,
  recien,
  desactivada,
  alAbrir,
  alCambiarCantidad,
}: {
  producto: ProductoParaVender
  /** La opción que se vendió, si el producto las tiene. */
  variante: string | null
  cantidad: number
  precioCents: number
  precioDeLista: number
  stock: number
  /** Recién sumada: se marca un instante, para ver dónde cayó. */
  recien: boolean
  desactivada: boolean
  alAbrir: () => void
  alCambiarCantidad: (cantidad: number) => void
}) {
  const sinStock = cantidad > stock
  const rebaja = precioCents < precioDeLista
  return (
    <li
      className={cn(
        "flex items-center gap-2 border-t border-tinta/15 pr-3 transition-colors duration-500 first:border-t-0 motion-reduce:transition-none",
        recien && "bg-tinta/[0.06]"
      )}
    >
      <button
        type="button"
        onClick={alAbrir}
        disabled={desactivada}
        aria-label={`${producto.nombre}${variante ? `, ${variante}` : ""}: ${cantidad} por ${formatMoney(precioCents)}. Cambiar el precio o quitar`}
        className="flex min-h-16 min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left transition-colors hover:bg-tinta/[0.04] disabled:opacity-60"
      >
        <Miniatura foto={producto.foto} icono={Package} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span
            className={cn(
              "line-clamp-2 leading-snug font-semibold",
              sinStock && "text-senal"
            )}
          >
            {producto.nombre}
          </span>
          {variante ? (
            <span className="text-sm font-semibold">{variante}</span>
          ) : null}
          <span className="tabular text-sm whitespace-nowrap">
            {cantidad} × {formatMoney(precioCents)}
          </span>
          {rebaja ? (
            <span className="tabular text-sm text-tinta/65 line-through">
              {formatMoney(precioDeLista)}
            </span>
          ) : null}
          {sinStock ? (
            <span className="text-sm font-semibold text-senal">
              {stock === 0
                ? "No te queda stock."
                : `Solo te quedan ${formatNumber(stock)}.`}
            </span>
          ) : null}
        </span>
      </button>
      <Cantidad
        etiqueta={`Unidades de ${producto.nombre}`}
        valor={cantidad}
        alCambiar={alCambiarCantidad}
        minimo={1}
        maximo={999}
        error={sinStock}
        angosta
      />
    </li>
  )
}

/* ---------------------------------------------------------------------------
 * La hoja de una línea: precio y quitar
 * ------------------------------------------------------------------------ */

function HojaDeLinea({
  linea,
  datos,
  alCambiar,
  alQuitar,
  alCerrar,
}: {
  linea: Linea
  datos: {
    producto: ProductoParaVender | undefined
    variante: OpcionParaVender | undefined
    stock: number
    precioCents: number
  }
  alCambiar: (cambio: Partial<Linea>) => void
  alQuitar: () => void
  alCerrar: () => void
}) {
  const { producto, variante, stock, precioCents: deLista } = datos
  if (!producto) return null
  const precioCents = linea.precio === null ? null : aCentavos(linea.precio)
  const sinStock = linea.cantidad > stock

  return (
    <HojaDeAjuste
      abierta
      titulo={`${producto.nombre}${variante ? ` · ${variante.nombre}` : ""}`}
      descripcion="Cambia el precio si hiciste una rebaja."
      alCerrar={alCerrar}
    >
      {sinStock ? (
        <div role="alert" className="flex flex-col items-start gap-1">
          <p className="flex items-start gap-2 text-sm font-semibold text-senal">
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            {stock === 0
              ? "Tu stock dice que no te queda."
              : `Tu stock dice que te quedan ${formatNumber(stock)}.`}
          </p>
          <Link
            href={`/panel/productos/${producto.id}${variante ? "#variantes" : ""}`}
            className="inline-flex min-h-11 items-center pl-6 text-sm font-semibold text-senal underline underline-offset-4"
          >
            Corregir el stock
          </Link>
        </div>
      ) : null}
      <CampoMonto
        id={`precio-${linea.clave}`}
        etiqueta="Precio por unidad"
        valor={linea.precio}
        alCambiar={(precio) => alCambiar({ precio })}
        enfocar
      />
      {precioCents !== null && precioCents < deLista ? (
        <p className="text-sm font-semibold">
          Rebaja de {formatMoney(deLista - precioCents)} por unidad.
        </p>
      ) : null}
      {precioCents !== null && precioCents !== deLista ? (
        <button
          type="button"
          onClick={() => alCambiar({ precio: deLista / 100 })}
          className="min-h-11 self-start text-sm font-semibold underline underline-offset-4"
        >
          Volver a {formatMoney(deLista)}
        </button>
      ) : null}
      <button
        type="button"
        onClick={alQuitar}
        className="min-h-11 self-start text-sm font-semibold underline underline-offset-4 transition-colors hover:text-senal"
      >
        Quitar de la venta
      </button>
    </HojaDeAjuste>
  )
}

/* ---------------------------------------------------------------------------
 * La hoja para agregar: productos y, si tiene, su talla
 * ------------------------------------------------------------------------ */

/** Lo que se marcó en la hoja para agregar: un producto, o una de sus tallas. */
interface Marcado {
  producto: ProductoParaVender
  variante: OpcionParaVender | null
}

const claveDe = (m: Marcado) =>
  m.variante ? `${m.producto.id}:${m.variante.id}` : m.producto.id

/**
 * La grilla de productos en una hoja. Se marcan varios —tocar otra vez
 * desmarca— y "Agregar" los suma de una vez: para dos del mismo está el más de
 * su fila. Un producto con tallas no abre otra ventana encima: la misma hoja
 * pasa a "¿Cuál vendiste?", donde también se marcan.
 */
function HojaParaAgregar({
  abierta,
  productos,
  enLaVenta,
  alCerrar,
  alAgregar,
}: {
  abierta: boolean
  productos: ProductoParaVender[]
  /** Cuántas van de cada línea, por su clave. */
  enLaVenta: Map<string, number>
  alCerrar: () => void
  alAgregar: (marcados: Marcado[]) => void
}) {
  const [eligiendo, setEligiendo] = React.useState<ProductoParaVender | null>(
    null
  )
  const [buscar, setBuscar] = React.useState("")
  const [categoria, setCategoria] = React.useState<string | null>(null)
  const [marcados, setMarcados] = React.useState<Map<string, Marcado>>(
    () => new Map()
  )

  function alternar(marcado: Marcado) {
    const clave = claveDe(marcado)
    setMarcados((antes) => {
      const despues = new Map(antes)
      if (despues.has(clave)) despues.delete(clave)
      else despues.set(clave, marcado)
      return despues
    })
  }

  const categorias = [
    ...new Set(productos.map((p) => p.categoria).filter(Boolean)),
  ] as string[]
  const texto = buscar.trim().toLowerCase()
  const visibles = productos.filter(
    (p) =>
      (!categoria || p.categoria === categoria) &&
      (!texto || p.nombre.toLowerCase().includes(texto))
  )
  const marcadosDe = (p: ProductoParaVender) =>
    p.variantes.length
      ? p.variantes.filter((v) => marcados.has(`${p.id}:${v.id}`)).length
      : Number(marcados.has(p.id))
  const yaVan = (p: ProductoParaVender) =>
    p.variantes.length
      ? p.variantes.reduce(
          (suma, v) => suma + (enLaVenta.get(`${p.id}:${v.id}`) ?? 0),
          0
        )
      : (enLaVenta.get(p.id) ?? 0)
  const total = marcados.size

  return (
    <HojaDeAjuste
      abierta={abierta}
      titulo={eligiendo ? eligiendo.nombre : "Agregar producto"}
      descripcion={
        eligiendo
          ? "Marca las que vendiste."
          : "Marca los que vendiste. Tocar otra vez lo desmarca."
      }
      alCerrar={alCerrar}
      pie={
        <button
          type="button"
          onClick={() => alAgregar([...marcados.values()])}
          disabled={total === 0}
          className={cn(BOTON_PRIMARIO, "w-full")}
        >
          {total === 0
            ? "Marca los que vendiste"
            : `Agregar ${total} ${total === 1 ? "producto" : "productos"}`}
        </button>
      }
    >
      {eligiendo ? (
        <div className="-mx-4 -mt-5 flex flex-col">
          <button
            type="button"
            onClick={() => setEligiendo(null)}
            className="flex min-h-12 items-center gap-2 border-b border-tinta/15 px-4 text-sm font-semibold transition-colors hover:bg-tinta/[0.04]"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            Todos los productos
          </button>
          <ul>
            {eligiendo.variantes.map((variante) => {
              const marcado = marcados.has(`${eligiendo.id}:${variante.id}`)
              const ya = enLaVenta.get(`${eligiendo.id}:${variante.id}`) ?? 0
              const propio =
                variante.precioCents !== null &&
                variante.precioCents !== eligiendo.precioCents
              return (
                <li
                  key={variante.id}
                  className="border-b border-tinta/15 last:border-b-0"
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={marcado}
                    onClick={() => alternar({ producto: eligiendo, variante })}
                    className="flex min-h-14 w-full items-center gap-3 px-4 text-left transition-colors hover:bg-tinta/[0.04] active:bg-tinta/[0.07]"
                  >
                    <Casilla marcada={marcado} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-semibold">{variante.nombre}</span>
                      {ya ? (
                        <span className="text-xs text-tinta/65">
                          Ya van {formatNumber(ya)} en la venta
                        </span>
                      ) : null}
                    </span>
                    {propio ? (
                      <span className="tabular text-sm">
                        {formatMoney(variante.precioCents ?? 0)}
                      </span>
                    ) : null}
                    <span className="tabular w-20 text-right text-sm text-tinta/65">
                      {variante.stock === 0
                        ? "Sin stock"
                        : `Quedan ${formatNumber(variante.stock)}`}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <>
          <div className="sticky -top-5 z-10 -mx-4 -mt-5 flex flex-col gap-3 border-b border-tinta/15 bg-papel px-4 pt-5 pb-3">
            <label className="flex min-h-12 items-center gap-3 border border-tinta px-3">
              <Search
                aria-hidden="true"
                className="size-5 shrink-0 opacity-60"
              />
              <span className="sr-only">Buscar un producto</span>
              <input
                type="search"
                value={buscar}
                onChange={(evento) => setBuscar(evento.target.value)}
                placeholder="Buscar"
                className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-tinta/45 [&::-webkit-search-cancel-button]:hidden"
              />
            </label>
            {categorias.length > 1 ? (
              // En columnas iguales: una franja que se desliza se veía cortada
              // en la hoja, y bajando de renglón a su ancho, desalineada.
              <div
                role="group"
                aria-label="Filtrar por categoría"
                className={GRILLA_DE_FICHAS}
              >
                {[null, ...categorias].map((valor) => (
                  <button
                    key={valor ?? "todas"}
                    type="button"
                    aria-pressed={categoria === valor}
                    onClick={() => setCategoria(valor)}
                    className={cn(
                      FICHA,
                      "w-full justify-center",
                      categoria === valor ? FICHA_ELEGIDA : FICHA_LIBRE
                    )}
                  >
                    <span className="truncate">{valor ?? "Todas"}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {visibles.length === 0 ? (
            <p className="text-sm text-tinta/70">
              Nada coincide con «{buscar.trim()}». Prueba con otra palabra.
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-2">
              {visibles.map((p) => {
                const marcadas = marcadosDe(p)
                const ya = yaVan(p)
                const conTallas = p.variantes.length > 0
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      role={conTallas ? undefined : "checkbox"}
                      aria-checked={conTallas ? undefined : marcadas > 0}
                      onClick={() =>
                        conTallas
                          ? setEligiendo(p)
                          : alternar({ producto: p, variante: null })
                      }
                      aria-label={`${p.nombre}, ${formatMoney(p.precioCents)}${conTallas ? ". Elegir la talla" : ""}${ya ? `. Ya van ${ya} en la venta` : ""}`}
                      className="group flex w-full flex-col gap-1 text-left"
                    >
                      <span
                        className={cn(
                          "relative flex aspect-square w-full items-center justify-center overflow-hidden border bg-tinta/[0.05] transition-colors",
                          marcadas > 0
                            ? "border-2 border-tinta"
                            : "border-tinta/15 group-hover:border-tinta"
                        )}
                      >
                        {p.foto ? (
                          <Image
                            src={p.foto}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 140px, 33vw"
                            className={cn(
                              "object-cover transition-transform duration-300 group-active:scale-[0.97] motion-reduce:transform-none",
                              p.stock === 0 && "opacity-45"
                            )}
                          />
                        ) : (
                          <Package
                            aria-hidden="true"
                            className="size-6 opacity-35"
                          />
                        )}
                        {marcadas > 0 ? (
                          <span className="tabular absolute top-1.5 right-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-tinta px-1.5 text-xs font-bold text-papel">
                            {conTallas && marcadas > 1 ? (
                              marcadas
                            ) : (
                              <Check aria-hidden="true" className="size-3.5" />
                            )}
                          </span>
                        ) : null}
                      </span>
                      <span className="truncate text-sm">{p.nombre}</span>
                      <span className="tabular -mt-1 text-sm font-semibold">
                        {formatMoney(p.precioCents)}
                      </span>
                      <span className="tabular -mt-1 truncate text-xs text-tinta/65">
                        {p.stock === 0
                          ? "Sin stock"
                          : `Quedan ${formatNumber(p.stock)}`}
                        {ya ? ` · van ${formatNumber(ya)}` : ""}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </HojaDeAjuste>
  )
}

/** La casilla de una talla marcada: cuadrada, como el resto del panel. */
function Casilla({ marcada }: { marcada: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-5 shrink-0 items-center justify-center border-2 border-tinta",
        marcada ? "bg-tinta text-papel" : "bg-transparent"
      )}
    >
      {marcada ? <Check className="size-3.5" /> : null}
    </span>
  )
}
