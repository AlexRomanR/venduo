"use client"

import * as React from "react"
import Image from "next/image"
import Link, { useLinkStatus } from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
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
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
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
import { estiloDelTitular } from "@/lib/plantillas/fuentes"
import { COOKIE_BARRA } from "@/lib/preferencias"
import { cn } from "@/lib/utils"
import type { BarraLateral } from "@/lib/data/barra"
import { SelloDeTienda } from "@/components/panel/tablero/sello"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
 * El nombre de un control del riel, al pasar el mouse.
 *
 * Plegada, la barra es solo íconos, y un ícono sin nombre obliga a adivinar.
 * Desplegada no hace falta: el nombre ya está escrito al lado.
 */
function ConNombre({
  nombre,
  plegada,
  children,
}: {
  nombre: string
  plegada: boolean
  children: React.ReactElement
}) {
  if (!plegada) return children

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={8}
        className="rounded-none bg-tinta text-xs font-semibold text-papel"
      >
        {nombre}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Lo que hay adentro de la barra: en escritorio, desplegada o plegada, y en el
 * cajón del móvil.
 *
 * Las secciones las arman los datos: quien tiene tienda ve "Tu negocio", quien
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
  plegada = false,
  alPlegar,
}: {
  datos: BarraLateral
  alNavegar?: () => void
  plegada?: boolean
  /** Solo en escritorio: el cajón del móvil se cierra, no se pliega. */
  alPlegar?: () => void
}) {
  const pathname = usePathname()
  const { tienda, vendedor, contadores: c, persona, apariencia } = datos

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
          href: "/panel/catalogos",
          nombre: "Catálogos",
          icono: BookOpen,
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
          href: "/panel/apariencia",
          nombre: "Apariencia",
          icono: Palette,
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

  const botonCuadrado =
    "flex size-11 items-center justify-center border border-tinta/25 transition-colors hover:border-tinta"

  return (
    <div className="flex h-full flex-col">
      {/* Marca y, en escritorio, el botón que pliega la barra */}
      <div
        className={cn(
          "flex items-center gap-3 pt-5 pb-4",
          plegada ? "flex-col px-3" : "justify-between px-5"
        )}
      >
        {plegada ? null : (
          <Link
            href="/auth/destino"
            onClick={alNavegar}
            className="flex min-h-11 items-center font-titular text-xl font-extrabold tracking-[-0.03em]"
          >
            Venduo
          </Link>
        )}

        <div className="flex items-center gap-2">
          {datos.esDemo && !plegada ? (
            <span className="border border-senal px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-senal uppercase">
              Demo
            </span>
          ) : null}

          {alPlegar ? (
            <ConNombre
              nombre={plegada ? "Mostrar la barra (Ctrl+B)" : ""}
              plegada={plegada}
            >
              <button
                type="button"
                onClick={alPlegar}
                aria-label={
                  plegada
                    ? "Mostrar la barra lateral"
                    : "Ocultar la barra lateral"
                }
                aria-expanded={!plegada}
                title={plegada ? undefined : "Ocultar la barra (Ctrl+B)"}
                className={cn(
                  "flex size-11 items-center justify-center transition-colors hover:text-senal",
                  plegada ? "" : "-mr-2"
                )}
              >
                {plegada ? (
                  <PanelLeftOpen aria-hidden="true" className="size-5" />
                ) : (
                  <PanelLeftClose aria-hidden="true" className="size-5" />
                )}
              </button>
            </ConNombre>
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
      <div
        className={cn(
          "flex-1 [scrollbar-width:thin] [scrollbar-color:color-mix(in_oklab,var(--tinta)_20%,transparent)_transparent] overflow-x-hidden overflow-y-auto pb-6",
          "px-3"
        )}
      >
        {/* La tienda: lo primero que se reconoce, y su enlace a mano */}
        {tienda && plegada ? (
          <div className="flex flex-col items-center gap-2 border-t-2 border-tinta pt-4">
            <ConNombre nombre={tienda.nombre} plegada>
              <a
                href={tienda.url}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`Ver ${tienda.nombre}`}
                className="flex size-11 items-center justify-center overflow-hidden border border-tinta/20 bg-tinta/5"
              >
                {tienda.logoUrl ? (
                  <Image
                    src={tienda.logoUrl}
                    alt=""
                    width={88}
                    height={88}
                    unoptimized
                    className="size-full object-cover"
                  />
                ) : (
                  <Store aria-hidden="true" className="size-4 opacity-45" />
                )}
              </a>
            </ConNombre>

            <ConNombre nombre="Copiar el enlace" plegada>
              <button
                type="button"
                onClick={copiarEnlace}
                aria-label="Copiar el enlace de tu tienda"
                className={botonCuadrado}
              >
                <Copy aria-hidden="true" className="size-4" />
              </button>
            </ConNombre>

            <ConNombre nombre="Nuevo producto" plegada>
              <Link
                href="/panel/productos/nuevo"
                aria-label="Nuevo producto"
                className="flex size-11 items-center justify-center border-2 border-tinta transition-colors hover:bg-tinta hover:text-papel"
              >
                <Plus aria-hidden="true" className="size-4" />
              </Link>
            </ConNombre>
          </div>
        ) : null}

        {tienda && !plegada ? (
          <div className="mx-2 border-t-2 border-tinta pt-4">
            <div className="flex items-center gap-3">
              {/* La tienda con su cara: su papel, su letra y su color de
                  acción. El resto de la barra es de Venduo. */}
              {apariencia ? (
                <SelloDeTienda
                  nombre={tienda.nombre}
                  logoUrl={tienda.logoUrl}
                  apariencia={apariencia}
                  compacto
                  className="size-11"
                />
              ) : (
                <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden border border-tinta/20 bg-tinta/5">
                  {tienda.logoUrl ? (
                    <Image
                      src={tienda.logoUrl}
                      alt=""
                      width={88}
                      height={88}
                      unoptimized
                      className="size-full object-cover"
                    />
                  ) : (
                    <Store aria-hidden="true" className="size-4 opacity-45" />
                  )}
                </div>
              )}
              <div className="min-w-0">
                <p
                  className="truncate text-base leading-tight"
                  style={
                    apariencia
                      ? estiloDelTitular(apariencia.tipografia)
                      : undefined
                  }
                >
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
              className="mt-2 flex min-h-11 items-center justify-center gap-2 rounded-plantilla border-2 border-tinta text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"
            >
              <Plus aria-hidden="true" className="size-4" />
              Nuevo producto
            </Link>
          </div>
        ) : null}

        {deTienda.length > 0 ? (
          <Grupo titulo="Tu negocio" plegada={plegada}>
            {deTienda.map((item) => (
              <Entrada
                key={item.href}
                item={item}
                pathname={pathname}
                alNavegar={alNavegar}
                plegada={plegada}
              />
            ))}
          </Grupo>
        ) : null}

        {deVendedor.length > 0 && vendedor ? (
          <Grupo
            titulo="Como vendedor"
            plegada={plegada}
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
                plegada={plegada}
              />
            ))}
          </Grupo>
        ) : null}

        {/* La otra mitad del producto, para quien todavía no la usa */}
        {tienda && !vendedor ? (
          <Grupo titulo="Gana extra" plegada={plegada}>
            <Entrada
              item={{
                href: "/sumarme",
                nombre: "Vender para otras tiendas",
                icono: Handshake,
              }}
              pathname={pathname}
              alNavegar={alNavegar}
              plegada={plegada}
            />
          </Grupo>
        ) : null}

        {!tienda && vendedor ? (
          <Grupo titulo="Tu propio negocio" plegada={plegada}>
            <Entrada
              item={{
                href: "/crear?abrir=1",
                nombre: "Abrir mi tienda",
                icono: Store,
              }}
              pathname={pathname}
              alNavegar={alNavegar}
              plegada={plegada}
            />
          </Grupo>
        ) : null}
      </div>

      {/* Quién está adentro, y la salida */}
      {plegada ? (
        <div className="flex flex-col items-center gap-2 border-t border-tinta/15 px-3 py-4">
          <ConNombre nombre="Mi cuenta" plegada>
            <Link
              href="/cuenta"
              aria-label={`Mi cuenta, ${persona.nombre}`}
              aria-current={pathname.startsWith("/cuenta") ? "page" : undefined}
              className={cn(
                "flex size-11 items-center justify-center overflow-hidden rounded-full border font-titular text-sm font-bold",
                pathname.startsWith("/cuenta")
                  ? "border-tinta bg-tinta/[0.06]"
                  : "border-tinta/20 bg-tinta/5"
              )}
            >
              {persona.avatarUrl ? (
                <Image
                  src={persona.avatarUrl}
                  alt=""
                  width={88}
                  height={88}
                  unoptimized
                  className="size-full object-cover"
                />
              ) : (
                persona.nombre.charAt(0).toUpperCase()
              )}
            </Link>
          </ConNombre>

          <form action="/auth/sign-out" method="post">
            <ConNombre nombre="Salir" plegada>
              <button
                type="submit"
                aria-label="Salir"
                className="flex size-11 items-center justify-center border border-tinta/25 transition-colors hover:border-senal hover:text-senal"
              >
                <LogOut aria-hidden="true" className="size-4" />
              </button>
            </ConNombre>
          </form>
        </div>
      ) : (
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
                  ? "border-tinta bg-tinta/[0.06]"
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
      )}
    </div>
  )
}

function Grupo({
  titulo,
  detalle,
  detalleUrgente = false,
  plegada,
  children,
}: {
  titulo: string
  detalle?: string
  detalleUrgente?: boolean
  plegada: boolean
  children: React.ReactNode
}) {
  return (
    <nav
      aria-label={titulo}
      className={cn(plegada ? "mt-4 border-t border-tinta/15 pt-4" : "mt-7")}
    >
      {plegada ? null : (
        <>
          <p className="px-2 text-[11px] font-semibold tracking-[0.14em] uppercase opacity-55">
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
        </>
      )}
      <ul
        className={cn("flex flex-col", plegada ? "items-center gap-1" : "mt-2")}
      >
        {children}
      </ul>
    </nav>
  )
}

/**
 * El trazo del enlace que se tocó, latiendo mientras se abre su pantalla.
 *
 * Una pantalla que no estaba en memoria tarda lo que tarda la base, y en ese
 * rato la anterior seguía quieta: parecía que el toque no había entrado. Va
 * dentro del `Link`, que es lo que le dice si su navegación está pendiente, y
 * se dibuja sobre el trazo que el enlace ya tiene.
 */
function Abriendo({ className }: { className: string }) {
  const { pending } = useLinkStatus()

  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute opacity-0",
        className,
        pending && "abriendo"
      )}
    />
  )
}

function Entrada({
  item,
  pathname,
  alNavegar,
  plegada,
}: {
  item: Item
  pathname: string
  alNavegar?: () => void
  plegada: boolean
}) {
  const activo = estaActivo(pathname, item)
  const Icono = item.icono
  // Los hijos se abren solo dentro de su sección: listados siempre, la barra
  // crecería hasta obligar a desplazarla para llegar a "Salir".
  const abierto = !plegada && activo && item.hijos && item.hijos.length > 0
  const actual =
    activo && pathname === item.href.split("?")[0] ? "page" : undefined

  if (plegada) {
    const nombre = item.contador
      ? `${item.nombre} · ${item.contador.etiqueta}`
      : item.pronto
        ? `${item.nombre} · pronto`
        : item.nombre

    return (
      <li>
        <ConNombre nombre={nombre} plegada>
          <Link
            href={item.href}
            prefetch
            aria-label={nombre}
            aria-current={actual}
            className={cn(
              "relative flex size-11 items-center justify-center border-l-2 transition-colors",
              activo
                ? "border-tinta bg-tinta/[0.06]"
                : "border-transparent hover:bg-tinta/[0.04]"
            )}
          >
            <Abriendo className="inset-y-0 -left-0.5 w-0.5 bg-tinta" />
            <Icono
              aria-hidden="true"
              className={cn("size-[18px]", activo ? "" : "opacity-60")}
            />
            {item.contador ? (
              <span
                aria-hidden="true"
                className={cn(
                  "tabular absolute top-1 right-0.5 flex h-4 min-w-4 items-center justify-center px-1 text-[9px] font-bold",
                  item.contador.urgente
                    ? "bg-senal text-white"
                    : "bg-tinta text-papel"
                )}
              >
                {item.contador.valor > 9 ? "9+" : item.contador.valor}
              </span>
            ) : null}
          </Link>
        </ConNombre>
      </li>
    )
  }

  return (
    <li>
      <Link
        href={item.href}
        prefetch
        onClick={alNavegar}
        aria-current={actual}
        className={cn(
          // La regla de 2 px a la izquierda es el mismo trazo que abre un tema
          // en el resto del sistema, girado para una columna.
          "relative flex min-h-11 items-center gap-3 border-l-2 px-3 text-sm transition-colors",
          activo
            ? "border-tinta bg-tinta/[0.06] font-semibold"
            : "border-transparent hover:border-tinta/25 hover:bg-tinta/[0.03]"
        )}
      >
        <Abriendo className="inset-y-0 -left-0.5 w-0.5 bg-tinta" />
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
                  prefetch
                  onClick={alNavegar}
                  aria-current={hijoActivo ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-11 items-center gap-2.5 pl-4 text-xs transition-colors",
                    hijoActivo
                      ? "font-semibold"
                      : "opacity-60 hover:opacity-100"
                  )}
                >
                  <Abriendo className="inset-y-0 -left-px w-0.5 bg-tinta" />
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

/**
 * La barra fija de escritorio, que se pliega a un riel de íconos.
 *
 * Plegada no desaparece: queda un riel de 72 px con los íconos, sus contadores
 * y su nombre al pasar el mouse. Ocultarla del todo dejaría los avisos
 * —pedidos con comprobante, productos sin stock— fuera de la vista justo
 * cuando alguien quiso más lugar para trabajar.
 *
 * El estado vive en una cookie y no en `localStorage`: la lee el layout del
 * lado del servidor, así la página llega ya con el ancho correcto. Con
 * `localStorage` se dibujaría abierta y se cerraría un instante después.
 */
export function BarraLateralEscritorio({
  datos,
  plegadaInicial,
}: {
  datos: BarraLateral
  plegadaInicial: boolean
}) {
  const [plegada, setPlegada] = React.useState(plegadaInicial)

  const alternar = React.useCallback(() => {
    setPlegada((antes) => {
      const ahora = !antes
      document.cookie = ahora
        ? `${COOKIE_BARRA}=plegada; path=/; max-age=31536000; samesite=lax`
        : `${COOKIE_BARRA}=; path=/; max-age=0; samesite=lax`
      return ahora
    })
  }, [])

  // Ctrl+B o Cmd+B, el atajo de barra lateral de la mayoría de los editores.
  React.useEffect(() => {
    function alTeclear(evento: KeyboardEvent) {
      if (
        evento.key.toLowerCase() === "b" &&
        (evento.ctrlKey || evento.metaKey) &&
        !evento.altKey
      ) {
        // No robarlo mientras se escribe: en un campo de texto, Ctrl+B es de
        // quien escribe.
        const destino = evento.target as HTMLElement | null
        if (destino?.closest("input, textarea, [contenteditable='true']")) {
          return
        }
        evento.preventDefault()
        alternar()
      }
    }

    window.addEventListener("keydown", alTeclear)
    return () => window.removeEventListener("keydown", alTeclear)
  }, [alternar])

  return (
    <aside
      data-plegada={plegada ? "" : undefined}
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 overflow-hidden border-r border-tinta/15 bg-papel lg:block",
        "transition-[width] duration-200 ease-out motion-reduce:transition-none",
        plegada ? "w-[4.5rem]" : "w-[17rem]"
      )}
    >
      <Contenido datos={datos} plegada={plegada} alPlegar={alternar} />
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
