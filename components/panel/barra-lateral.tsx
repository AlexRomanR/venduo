"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChartColumn,
  Compass,
  Copy,
  ExternalLink,
  Handshake,
  IdCard,
  LayoutGrid,
  LogOut,
  Megaphone,
  Menu,
  Package,
  Plus,
  Receipt,
  Search,
  Settings,
  Store,
  Tags,
  Ticket,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { BarraLateral } from "@/lib/data/barra"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface Item {
  href: string
  nombre: string
  icono: LucideIcon
  /** Coincidencia exacta: `/panel` coincidiría con todas sus secciones. */
  exacto?: boolean
  contador?: { valor: number; urgente: boolean; etiqueta: string }
  pronto?: boolean
  hijos?: Array<{ href: string; nombre: string; icono: LucideIcon }>
}

function estaActivo(
  pathname: string,
  item: { href: string; exacto?: boolean }
) {
  const ruta = item.href.split("?")[0]
  return item.exacto ? pathname === ruta : pathname.startsWith(ruta)
}

/**
 * Lo que hay adentro de la barra, igual en escritorio y en el cajón del móvil.
 *
 * Las secciones las arman los datos: quien tiene tienda ve "Tu tienda", quien
 * vende para otras ve "Como vendedor", y quien hace las dos cosas ve las dos.
 * `primary_role` no interviene — es una intención, no un permiso.
 *
 * El rojo aparece solo donde algo pide una acción: un pedido que ya trajo su
 * comprobante, un producto que se quedó sin stock. Un contador que no exige
 * nada va en tinta. Si todo fuera rojo, el acento dejaría de avisar.
 */
function Contenido({
  datos,
  alNavegar,
}: {
  datos: BarraLateral
  alNavegar?: () => void
}) {
  const pathname = usePathname()
  const { tienda, vendedor, contadores: c, persona } = datos

  const reposicion = c.productosSinStock + c.productosPocoStock

  const deTienda: Item[] = tienda
    ? [
        { href: "/panel", nombre: "Resumen", icono: LayoutGrid, exacto: true },
        {
          href: "/panel/pedidos",
          nombre: "Pedidos",
          icono: Receipt,
          contador:
            c.pedidosPendientes > 0
              ? {
                  valor: c.pedidosPendientes,
                  urgente: c.pedidosConComprobante > 0,
                  etiqueta:
                    c.pedidosConComprobante > 0
                      ? `${c.pedidosPendientes} pendientes, ${c.pedidosConComprobante} con comprobante`
                      : `${c.pedidosPendientes} pendientes`,
                }
              : undefined,
        },
        {
          href: "/panel/productos",
          nombre: "Productos",
          icono: Package,
          contador:
            reposicion > 0
              ? {
                  valor: reposicion,
                  urgente: c.productosSinStock > 0,
                  etiqueta: `${reposicion} por reponer`,
                }
              : undefined,
          hijos: [
            {
              href: "/panel/productos/categorias",
              nombre: "Categorías",
              icono: Tags,
            },
          ],
        },
        {
          href: "/panel/vendedores",
          nombre: "Vendedores",
          icono: Users,
          contador:
            c.vendedoresPendientes > 0
              ? {
                  valor: c.vendedoresPendientes,
                  urgente: true,
                  etiqueta: `${c.vendedoresPendientes} solicitudes`,
                }
              : undefined,
        },
        {
          href: "/panel/estadisticas",
          nombre: "Estadísticas",
          icono: ChartColumn,
        },
        {
          href: "/panel/marketing",
          nombre: "Marketing",
          icono: Megaphone,
          pronto: true,
        },
      ]
    : []

  const deVendedor: Item[] = vendedor
    ? [
        {
          href: "/vendedor",
          nombre: "Lo que vendo",
          icono: Wallet,
          exacto: true,
        },
        { href: "/explorar/tiendas", nombre: "Buscar tiendas", icono: Compass },
        {
          href: "/explorar/productos",
          nombre: "Buscar productos",
          icono: Search,
        },
        ...(vendedor.perfilSlug
          ? [
              {
                href: `/v/${vendedor.perfilSlug}`,
                nombre: "Mi perfil público",
                icono: IdCard,
              },
            ]
          : []),
        { href: "/sumarme", nombre: "Entrar con un código", icono: Ticket },
      ]
    : []

  async function copiarEnlace() {
    if (!tienda) return
    try {
      await navigator.clipboard.writeText(tienda.url)
      toast.success("Enlace de tu tienda copiado.")
    } catch {
      toast.error("No pudimos copiarlo. Cópialo desde tu resumen.")
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Marca */}
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
        <Link
          href="/auth/destino"
          onClick={alNavegar}
          className="flex min-h-11 items-center font-titular text-xl font-extrabold tracking-[-0.03em]"
        >
          Venduo
        </Link>
        <div className="flex items-center gap-2">
          {datos.esDemo ? (
            <span className="border border-senal px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-senal uppercase">
              Demo
            </span>
          ) : null}

          {/* Solo en el cajón. El cierre que trae shadcn mide 28 px y dice
              "Close": se apaga y va este, en la misma fila que la marca. */}
          {alNavegar ? (
            <button
              type="button"
              onClick={alNavegar}
              aria-label="Cerrar el menú"
              className="-mr-2 flex size-11 items-center justify-center transition-colors hover:text-senal"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* El desplazamiento de la página es rojo por sistema; acá sería un segundo
          trazo rojo pegado al contenido, así que se apaga a tinta. */}
      <div className="flex-1 [scrollbar-width:thin] [scrollbar-color:color-mix(in_oklab,var(--tinta)_20%,transparent)_transparent] overflow-y-auto px-3 pb-6">
        {/* La tienda: lo primero que se reconoce, y su enlace a mano */}
        {tienda ? (
          <div className="mx-2 border-t-2 border-tinta pt-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden border border-tinta/20 bg-tinta/5">
                {tienda.logoUrl ? (
                  <Image
                    src={tienda.logoUrl}
                    alt=""
                    width={80}
                    height={80}
                    unoptimized
                    className="size-full object-cover"
                  />
                ) : (
                  <Store aria-hidden="true" className="size-4 opacity-45" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-titular text-base font-bold tracking-[-0.01em]">
                  {tienda.nombre}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-1.5 rounded-full",
                      tienda.publicada ? "bg-tinta" : "bg-senal"
                    )}
                  />
                  <span
                    className={tienda.publicada ? "opacity-55" : "text-senal"}
                  >
                    {tienda.publicada ? "Publicada" : "Sin publicar"}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={tienda.url}
                target="_blank"
                rel="noreferrer noopener"
                className="flex min-h-11 items-center justify-center gap-1.5 border border-tinta/25 text-xs font-semibold transition-colors hover:border-tinta"
              >
                <ExternalLink aria-hidden="true" className="size-3.5" />
                Ver tienda
              </a>
              <button
                type="button"
                onClick={copiarEnlace}
                className="flex min-h-11 items-center justify-center gap-1.5 border border-tinta/25 text-xs font-semibold transition-colors hover:border-tinta"
              >
                <Copy aria-hidden="true" className="size-3.5" />
                Copiar enlace
              </button>
            </div>

            <Link
              href="/panel/productos/nuevo"
              onClick={alNavegar}
              className="mt-2 flex min-h-11 items-center justify-center gap-2 rounded-sm border-2 border-tinta text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"
            >
              <Plus aria-hidden="true" className="size-4" />
              Nuevo producto
            </Link>
          </div>
        ) : null}

        {deTienda.length > 0 ? (
          <Grupo titulo="Tu tienda">
            {deTienda.map((item) => (
              <Entrada
                key={item.href}
                item={item}
                pathname={pathname}
                alNavegar={alNavegar}
              />
            ))}
          </Grupo>
        ) : null}

        {deVendedor.length > 0 && vendedor ? (
          <Grupo
            titulo="Como vendedor"
            detalle={
              c.comisionesPorCobrarCents > 0
                ? `Te deben ${formatMoney(c.comisionesPorCobrarCents)}`
                : `${vendedor.tiendas} ${vendedor.tiendas === 1 ? "tienda activa" : "tiendas activas"}${
                    vendedor.pendientes > 0
                      ? ` · ${vendedor.pendientes} esperando`
                      : ""
                  }`
            }
            detalleUrgente={c.comisionesPorCobrarCents > 0}
          >
            {deVendedor.map((item) => (
              <Entrada
                key={item.href}
                item={item}
                pathname={pathname}
                alNavegar={alNavegar}
              />
            ))}
          </Grupo>
        ) : null}

        {/* La otra mitad del producto, para quien todavía no la usa */}
        {tienda && !vendedor ? (
          <Grupo titulo="Gana extra">
            <Entrada
              item={{
                href: "/sumarme",
                nombre: "Vender para otras tiendas",
                icono: Handshake,
              }}
              pathname={pathname}
              alNavegar={alNavegar}
            />
          </Grupo>
        ) : null}

        {!tienda && vendedor ? (
          <Grupo titulo="Tu propio negocio">
            <Entrada
              item={{
                href: "/crear?abrir=1",
                nombre: "Abrir mi tienda",
                icono: Store,
              }}
              pathname={pathname}
              alNavegar={alNavegar}
            />
          </Grupo>
        ) : null}
      </div>

      {/* Quién está adentro, y la salida */}
      <div className="border-t border-tinta/15 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-tinta/20 bg-tinta/5 font-titular text-sm font-bold">
            {persona.avatarUrl ? (
              <Image
                src={persona.avatarUrl}
                alt=""
                width={72}
                height={72}
                unoptimized
                className="size-full object-cover"
              />
            ) : (
              persona.nombre.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{persona.nombre}</p>
            {persona.correo ? (
              <p className="truncate text-xs opacity-45">{persona.correo}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href="/cuenta"
            onClick={alNavegar}
            aria-current={pathname.startsWith("/cuenta") ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center justify-center gap-1.5 border text-xs font-semibold transition-colors",
              pathname.startsWith("/cuenta")
                ? "border-senal text-senal"
                : "border-tinta/25 hover:border-tinta"
            )}
          >
            <Settings aria-hidden="true" className="size-3.5" />
            Mi cuenta
          </Link>

          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="flex min-h-11 w-full items-center justify-center gap-1.5 border border-tinta/25 text-xs font-semibold transition-colors hover:border-senal hover:text-senal"
            >
              <LogOut aria-hidden="true" className="size-3.5" />
              Salir
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function Grupo({
  titulo,
  detalle,
  detalleUrgente = false,
  children,
}: {
  titulo: string
  detalle?: string
  detalleUrgente?: boolean
  children: React.ReactNode
}) {
  return (
    <nav aria-label={titulo} className="mt-7">
      <p className="px-2 text-[11px] font-semibold tracking-[0.14em] text-senal uppercase">
        {titulo}
      </p>
      {detalle ? (
        <p
          className={cn(
            "tabular mt-1 px-2 text-xs",
            detalleUrgente ? "font-semibold" : "opacity-45"
          )}
        >
          {detalle}
        </p>
      ) : null}
      <ul className="mt-2 flex flex-col">{children}</ul>
    </nav>
  )
}

function Entrada({
  item,
  pathname,
  alNavegar,
}: {
  item: Item
  pathname: string
  alNavegar?: () => void
}) {
  const activo = estaActivo(pathname, item)
  const Icono = item.icono
  // Los hijos se abren solo dentro de su sección: listados siempre, la barra
  // crecería hasta obligar a desplazarla para llegar a "Salir".
  const abierto = activo && item.hijos && item.hijos.length > 0

  return (
    <li>
      <Link
        href={item.href}
        onClick={alNavegar}
        aria-current={
          activo && pathname === item.href.split("?")[0] ? "page" : undefined
        }
        className={cn(
          // La regla de 2 px a la izquierda es el mismo trazo que abre un tema
          // en el resto del sistema, girado para una columna.
          "flex min-h-11 items-center gap-3 border-l-2 px-3 text-sm transition-colors",
          activo
            ? "border-senal font-semibold text-senal"
            : "border-transparent hover:border-tinta/25"
        )}
      >
        <Icono
          aria-hidden="true"
          className={cn("size-4 shrink-0", activo ? "" : "opacity-55")}
        />
        <span className={cn("flex-1 truncate", activo ? "" : "opacity-80")}>
          {item.nombre}
        </span>

        {item.pronto ? (
          <span className="text-[10px] font-semibold tracking-[0.1em] uppercase opacity-40">
            Pronto
          </span>
        ) : null}

        {item.contador ? (
          <span
            aria-label={item.contador.etiqueta}
            title={item.contador.etiqueta}
            className={cn(
              "tabular flex h-5 min-w-5 items-center justify-center px-1.5 text-[11px] font-bold",
              item.contador.urgente
                ? "bg-senal text-white"
                : "border border-tinta/25 text-tinta/70"
            )}
          >
            {item.contador.valor > 99 ? "99+" : item.contador.valor}
          </span>
        ) : null}
      </Link>

      {abierto ? (
        <ul className="mb-1 ml-5 border-l border-tinta/15">
          {item.hijos!.map((hijo) => {
            const Hijo = hijo.icono
            const hijoActivo = pathname === hijo.href
            return (
              <li key={hijo.href}>
                <Link
                  href={hijo.href}
                  onClick={alNavegar}
                  aria-current={hijoActivo ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-2.5 pl-4 text-xs transition-colors",
                    hijoActivo
                      ? "font-semibold text-senal"
                      : "opacity-60 hover:opacity-100"
                  )}
                >
                  <Hijo aria-hidden="true" className="size-3.5 shrink-0" />
                  {hijo.nombre}
                </Link>
              </li>
            )
          })}
        </ul>
      ) : null}
    </li>
  )
}

/** La barra fija de escritorio. */
export function BarraLateralEscritorio({ datos }: { datos: BarraLateral }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[17rem] shrink-0 border-r border-tinta/15 bg-papel lg:block">
      <Contenido datos={datos} />
    </aside>
  )
}

/**
 * En el celular, una barra delgada arriba y la navegación en un cajón.
 *
 * Una columna fija de 272 px en una pantalla de 375 deja 100 px para trabajar,
 * así que no hay sidebar permanente por debajo de `lg`. El botón del menú lleva
 * un punto rojo si adentro hay algo urgente: si no, lo pendiente quedaría
 * escondido detrás de un ícono que nadie tiene motivo para tocar.
 */
export function BarraLateralMovil({ datos }: { datos: BarraLateral }) {
  const [abierta, setAbierta] = React.useState(false)
  const pathname = usePathname()

  React.useEffect(() => {
    setAbierta(false)
  }, [pathname])

  const c = datos.contadores
  const urgente =
    c.pedidosConComprobante > 0 ||
    c.productosSinStock > 0 ||
    c.vendedoresPendientes > 0

  return (
    <header className="sticky top-0 z-30 border-b border-tinta/15 bg-papel/92 backdrop-blur lg:hidden">
      <div className="flex items-center gap-3 px-5 py-2">
        <Sheet open={abierta} onOpenChange={setAbierta}>
          <SheetTrigger
            aria-label={
              urgente ? "Abrir el menú, hay pendientes" : "Abrir el menú"
            }
            className="relative -ml-2 flex size-11 items-center justify-center transition-colors hover:text-senal"
          >
            <Menu aria-hidden="true" className="size-5" />
            {urgente ? (
              <span
                aria-hidden="true"
                className="absolute top-2 right-2 size-2 rounded-full bg-senal"
              />
            ) : null}
          </SheetTrigger>

          <SheetContent
            side="left"
            showCloseButton={false}
            className="w-[85vw] max-w-[20rem] gap-0 rounded-none border-r border-tinta/15 bg-papel p-0 text-tinta shadow-none"
          >
            <SheetTitle className="sr-only">Menú de Venduo</SheetTitle>
            <SheetDescription className="sr-only">
              Las secciones de tu panel y tu cuenta.
            </SheetDescription>
            <Contenido datos={datos} alNavegar={() => setAbierta(false)} />
          </SheetContent>
        </Sheet>

        <Link
          href="/auth/destino"
          className="flex min-h-11 flex-1 items-center font-titular text-lg font-extrabold tracking-[-0.02em]"
        >
          {datos.tienda?.nombre ?? "Venduo"}
        </Link>

        {datos.tienda ? (
          <Link
            href="/panel/pedidos"
            aria-label={`Pedidos, ${c.pedidosPendientes} pendientes`}
            className="relative flex size-11 items-center justify-center transition-colors hover:text-senal"
          >
            <Receipt aria-hidden="true" className="size-5" />
            {c.pedidosPendientes > 0 ? (
              <span
                className={cn(
                  "tabular absolute top-1 right-0 flex h-4 min-w-4 items-center justify-center px-1 text-[10px] font-bold",
                  c.pedidosConComprobante > 0
                    ? "bg-senal text-white"
                    : "bg-tinta text-papel"
                )}
              >
                {c.pedidosPendientes > 9 ? "9+" : c.pedidosPendientes}
              </span>
            ) : null}
          </Link>
        ) : null}
      </div>
    </header>
  )
}
