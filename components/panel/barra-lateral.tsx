"use client"

import * as React from "react"
import Image from "next/image"
import Link, { useLinkStatus } from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  ChartColumn,
  House,
  LogOut,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Plus,
  Receipt,
  Share2,
  Store,
  Tags,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react"

import { COOKIE_BARRA } from "@/lib/preferencias"
import { cn } from "@/lib/utils"
import type { BarraLateral } from "@/lib/data/barra"
import type { EstadoDeFuncion } from "@/lib/funciones"
import { ConFuncion } from "@/components/panel/funcion"
import { CompartirTienda } from "@/components/panel/tablero/compartir"
import {
  tituloDeRuta,
  useTituloPropio,
} from "@/components/panel/titulo-de-barra"
import { Logo, Simbolo } from "@/components/marca/logo"
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
  /** La ruta que la marca como elegida, si no es la de `href`. */
  marca?: string
  /** Nunca se marca elegida: lleva a una parte de otra pantalla. */
  sinMarca?: boolean
  contador?: { valor: number; urgente: boolean; etiqueta: string }
  /** Lo que le falta, en dos palabras y en rojo: "Falta WhatsApp". */
  estado?: string
  /** No es una pantalla: abre compartir la tienda. */
  compartir?: boolean
  /** Si Venduo la apagó: oculta no aparece, desactivada se ve y no responde. */
  funcion?: EstadoDeFuncion
  hijos?: Array<{ href: string; nombre: string; icono: LucideIcon }>
}

function estaActivo(pathname: string, item: Item) {
  if (item.sinMarca || item.compartir) return false
  const ruta = item.marca ?? item.href.split(/[?#]/)[0]
  return item.exacto ? pathname === ruta : pathname.startsWith(ruta)
}

/** El enlace de la tienda sin `https://`, como se dicta y se lee. */
function legible(url: string) {
  return url.replace(/^https?:\/\//, "")
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
 * cajón del celular.
 *
 * Es el mismo menú de la app, con su orden y sus nombres: quien usa las dos no
 * aprende dos menús. Arriba la persona, después su tienda con su propia cara,
 * y tres grupos —el negocio, la tienda y la cuenta—. El rojo aparece solo
 * donde algo pide una acción: un pedido que espera que confirmes su pago, un
 * producto sin stock, la tienda sin WhatsApp.
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
  const { tienda, contadores: c, persona, apariencia, funciones } = datos
  const enCajon = Boolean(alNavegar)

  const reposicion = c.productosSinStock + c.productosPocoStock

  const grupos: Array<{ titulo: string; items: Item[] }> = tienda
    ? [
        {
          titulo: "Tu negocio",
          items: [
            { href: "/panel", nombre: "Inicio", icono: House, exacto: true },
            {
              href: "/panel/pedidos",
              nombre: "Pedidos",
              icono: Receipt,
              contador:
                c.pedidosPendientes > 0
                  ? {
                      valor: c.pedidosPendientes,
                      urgente: true,
                      etiqueta: `${c.pedidosPendientes} por cobrar`,
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
              funcion: funciones.catalogos,
            },
            { href: "", nombre: "Compartir", icono: Share2, compartir: true },
          ],
        },
        {
          titulo: "Tu tienda",
          items: [
            {
              href: "/panel/estadisticas",
              nombre: "Estadísticas",
              icono: ChartColumn,
              funcion: funciones.estadisticas,
            },
            // Apariencia es la puerta al editor, y además guarda la plantilla
            // y el historial, que el editor de la web no tiene.
            {
              href: "/panel/apariencia",
              nombre: "Editar tu tienda",
              icono: Palette,
            },
            {
              href: "/cuenta#tienda",
              nombre: "Datos de la tienda",
              icono: Store,
              sinMarca: true,
              estado: tienda.conWhatsApp ? undefined : "Falta WhatsApp",
            },
          ],
        },
        {
          titulo: "Tu cuenta",
          items: [
            {
              href: "/cuenta#persona",
              nombre: "Tus datos",
              icono: UserRound,
              marca: "/cuenta",
            },
          ],
        },
      ].map((grupo) => ({
        ...grupo,
        items: grupo.items.filter((item: Item) => item.funcion !== "oculta"),
      }))
    : []

  return (
    <div className="flex h-full flex-col">
      {/* En escritorio, la marca y el botón que pliega la barra. El cajón del
          celular es el menú de la app, que no la lleva. */}
      {enCajon ? null : (
        <div
          className={cn(
            "flex items-center gap-3 pt-5 pb-2",
            plegada ? "flex-col px-3" : "justify-between px-5"
          )}
        >
          {plegada ? (
            <Link
              href="/auth/destino"
              className="flex size-11 items-center justify-center"
            >
              <Simbolo titulo="Venduo" className="size-7" />
            </Link>
          ) : (
            <Link
              href="/auth/destino"
              className="flex min-h-11 items-center text-xl"
            >
              <Logo />
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
          </div>
        </div>
      )}

      {/* El desplazamiento de la página es rojo por sistema; acá sería un segundo
          trazo rojo pegado al contenido, así que se apaga a tinta. */}
      <div
        className={cn(
          "flex-1 [scrollbar-width:thin] [scrollbar-color:color-mix(in_oklab,var(--tinta)_20%,transparent)_transparent] overflow-x-hidden overflow-y-auto pb-4",
          plegada ? "px-3" : "px-2",
          enCajon ? "pt-5" : "pt-3"
        )}
      >
        {plegada ? (
          <RielDeTienda datos={datos} />
        ) : (
          <>
            <div className="flex items-center gap-3 px-3">
              <Avatar persona={persona} tamano="size-12 text-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{persona.nombre}</p>
                {persona.correo ? (
                  <p className="truncate text-sm opacity-65">
                    {persona.correo}
                  </p>
                ) : null}
              </div>
              {/* El cierre que trae shadcn mide 28 px y dice "Close": se apaga
                  y va este. */}
              {enCajon ? (
                <button
                  type="button"
                  onClick={alNavegar}
                  aria-label="Cerrar el menú"
                  className="-mr-1 flex size-11 shrink-0 items-center justify-center transition-colors hover:text-senal"
                >
                  <X aria-hidden="true" className="size-5" />
                </button>
              ) : null}
            </div>

            {tienda ? (
              <TarjetaDeTienda tienda={tienda} apariencia={apariencia} />
            ) : null}

            {/* Un atajo de la computadora: en el celular, Productos tiene su
                botón para cargar uno. */}
            {tienda && !enCajon ? (
              <Link
                href="/panel/productos/nuevo"
                className="mx-1 mt-3 flex min-h-11 items-center justify-center gap-2 rounded-plantilla border-2 border-tinta text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"
              >
                <Plus aria-hidden="true" className="size-4" />
                Nuevo producto
              </Link>
            ) : null}
          </>
        )}

        {grupos.map((grupo) => (
          <Grupo key={grupo.titulo} titulo={grupo.titulo} plegada={plegada}>
            {grupo.items.map((item) => (
              <Entrada
                key={item.nombre}
                item={item}
                tienda={tienda}
                pathname={pathname}
                alNavegar={alNavegar}
                plegada={plegada}
                enCajon={enCajon}
              />
            ))}
          </Grupo>
        ))}

        <form action="/auth/sign-out" method="post" className="mt-6">
          <ConNombre nombre="Cerrar sesión" plegada={plegada}>
            <button
              type="submit"
              aria-label={plegada ? "Cerrar sesión" : undefined}
              className={cn(
                "flex items-center transition-colors hover:text-senal",
                plegada
                  ? "mx-auto size-11 justify-center border border-tinta/25"
                  : "min-h-12 w-full gap-3 px-3 font-semibold"
              )}
            >
              <LogOut aria-hidden="true" className="size-5 shrink-0" />
              {plegada ? null : "Cerrar sesión"}
            </button>
          </ConNombre>
        </form>
      </div>
    </div>
  )
}

/** La foto de la persona, o su inicial. */
function Avatar({
  persona,
  tamano,
}: {
  persona: BarraLateral["persona"]
  tamano: string
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-tinta font-titular font-bold text-papel",
        tamano
      )}
    >
      {persona.avatarUrl ? (
        <Image
          src={persona.avatarUrl}
          alt=""
          width={96}
          height={96}
          unoptimized
          className="size-full object-cover"
        />
      ) : (
        persona.nombre.charAt(0).toUpperCase()
      )}
    </span>
  )
}

/**
 * La tienda, con su propia cara: su papel, su letra y su color de acción. Es
 * la única parte del menú que no es de Venduo, igual que en la app. Tocarla
 * la abre.
 */
function TarjetaDeTienda({
  tienda,
  apariencia,
}: {
  tienda: NonNullable<BarraLateral["tienda"]>
  apariencia: BarraLateral["apariencia"]
}) {
  const colores = apariencia?.colores
  const alAire = tienda.publicada && !tienda.pausada

  return (
    <a
      href={tienda.url}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`${tienda.nombre}. Abrir tu tienda`}
      className="mx-1 mt-4 block border p-4 transition-transform active:scale-[0.98] motion-reduce:transform-none"
      style={{
        backgroundColor: colores?.papel,
        color: colores?.tinta,
        borderColor: colores?.tinta ?? "var(--tinta)",
        borderBottomWidth: 5,
        borderBottomColor: colores?.senal ?? "var(--senal)",
      }}
    >
      <span className="flex items-center gap-2">
        {tienda.logoUrl ? (
          <Image
            src={tienda.logoUrl}
            alt=""
            width={56}
            height={56}
            unoptimized
            className="size-7 object-contain"
          />
        ) : null}
        {/* El nombre va en la letra de Venduo, como en la app: la de la
            plantilla —una condensada en mayúsculas, una antigua fina— no se
            leía con el resto del menú. La tienda se reconoce por sus colores. */}
        <span className="line-clamp-2 flex-1 font-titular text-xl leading-tight font-extrabold tracking-[-0.02em]">
          {tienda.nombre}
        </span>
        <ArrowUpRight aria-hidden="true" className="size-[18px] shrink-0" />
      </span>
      <span className="mt-2 flex items-center gap-1.5 text-[13px] font-medium opacity-80">
        <span
          aria-hidden="true"
          className="size-[7px] shrink-0 rounded-full"
          style={{
            backgroundColor: alAire ? colores?.tinta : colores?.senal,
          }}
        />
        <span className="truncate">
          {tienda.pausada
            ? "Pausada"
            : tienda.publicada
              ? "Publicada"
              : "Borrador"}{" "}
          · {legible(tienda.url)}
        </span>
      </span>
    </a>
  )
}

/** La barra plegada: la persona, la tienda y el atajo de un producto nuevo. */
function RielDeTienda({ datos }: { datos: BarraLateral }) {
  const { tienda, persona } = datos
  return (
    <div className="flex flex-col items-center gap-2 border-t-2 border-tinta pt-4">
      <ConNombre nombre={persona.nombre} plegada>
        <Link href="/cuenta" aria-label={`Tus datos, ${persona.nombre}`}>
          <Avatar persona={persona} tamano="size-11 text-sm" />
        </Link>
      </ConNombre>
      {tienda ? (
        <>
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
          <ConNombre nombre="Nuevo producto" plegada>
            <Link
              href="/panel/productos/nuevo"
              aria-label="Nuevo producto"
              className="flex size-11 items-center justify-center border-2 border-tinta transition-colors hover:bg-tinta hover:text-papel"
            >
              <Plus aria-hidden="true" className="size-4" />
            </Link>
          </ConNombre>
        </>
      ) : null}
    </div>
  )
}

function Grupo({
  titulo,
  plegada,
  children,
}: {
  titulo: string
  plegada: boolean
  children: React.ReactNode
}) {
  return (
    <nav
      aria-label={titulo}
      className={cn(plegada ? "mt-4 border-t border-tinta/15 pt-4" : "mt-6")}
    >
      {plegada ? null : (
        <p className="px-3 pb-1 text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
          {titulo}
        </p>
      )}
      <ul className={cn("flex flex-col", plegada && "items-center gap-1")}>
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
 * se dibuja sobre el borde del enlace.
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
  tienda,
  pathname,
  alNavegar,
  plegada,
  enCajon,
}: {
  item: Item
  tienda: BarraLateral["tienda"]
  pathname: string
  alNavegar?: () => void
  plegada: boolean
  /** En el cajón del celular, la fila es la de la app: Geist 600 a 16 px. */
  enCajon: boolean
}) {
  const activo = estaActivo(pathname, item)
  const Icono = item.icono
  // Los hijos se abren solo dentro de su sección: listados siempre, la barra
  // crecería hasta obligar a desplazarla para llegar a "Cerrar sesión".
  const abierto = !plegada && activo && item.hijos && item.hijos.length > 0
  const actual =
    activo && pathname === item.href.split(/[?#]/)[0] ? "page" : undefined
  const nombre = item.contador
    ? `${item.nombre} · ${item.contador.etiqueta}`
    : item.estado
      ? `${item.nombre} · ${item.estado}`
      : item.nombre

  // Como en la app: la elegida va en tinta llena. En el cajón del celular,
  // la fila de la app tal cual; en la barra de escritorio, más liviana —15 px
  // y peso medio—, porque a la vista todo el día una columna entera en
  // semibold competía con el contenido.
  const clases = plegada
    ? cn(
        "relative flex size-11 items-center justify-center transition-colors",
        activo ? "bg-tinta text-papel" : "hover:bg-tinta/[0.06]"
      )
    : cn(
        "relative flex w-full items-center gap-3 px-3 text-left transition-colors",
        enCajon
          ? "min-h-12 font-semibold"
          : cn(
              "min-h-11 text-[15px]",
              activo ? "font-semibold" : "font-medium"
            ),
        activo ? "bg-tinta text-papel" : "hover:bg-tinta/[0.06]"
      )

  const interior = (
    <>
      <Icono
        aria-hidden="true"
        className={cn(
          "size-5 shrink-0",
          item.estado && !activo && "text-senal"
        )}
      />
      {plegada ? null : <span className="flex-1 truncate">{item.nombre}</span>}
      {!plegada && item.estado ? (
        <span className={cn("text-sm font-normal", !activo && "text-senal")}>
          {item.estado}
        </span>
      ) : null}
      {item.contador ? (
        <span
          aria-hidden={plegada ? true : undefined}
          aria-label={plegada ? undefined : item.contador.etiqueta}
          title={item.contador.etiqueta}
          className={cn(
            "tabular flex items-center justify-center rounded-full font-bold",
            plegada
              ? "absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[9px]"
              : "h-[22px] min-w-[22px] px-1.5 text-xs",
            item.contador.urgente
              ? "bg-senal text-white"
              : activo
                ? "bg-papel text-tinta"
                : "bg-tinta text-papel"
          )}
        >
          {item.contador.valor > 99 ? "99+" : item.contador.valor}
        </span>
      ) : null}
    </>
  )

  if (item.compartir) {
    if (!tienda) return null
    return (
      <li>
        <CompartirTienda
          nombre={tienda.nombre}
          slug={tienda.slug}
          url={tienda.url}
          legible={legible(tienda.url)}
        >
          <button
            type="button"
            aria-label={plegada ? nombre : undefined}
            title={plegada ? nombre : undefined}
            className={clases}
          >
            {interior}
          </button>
        </CompartirTienda>
      </li>
    )
  }

  return (
    <li>
      <ConNombre nombre={nombre} plegada={plegada}>
        <ConFuncion estado={item.funcion ?? "activa"}>
          <Link
            href={item.href}
            prefetch
            onClick={alNavegar}
            aria-label={plegada ? nombre : undefined}
            aria-current={actual}
            className={clases}
          >
            <Abriendo className="inset-y-0 left-0 w-0.5 bg-senal" />
            {interior}
          </Link>
        </ConFuncion>
      </ConNombre>

      {abierto ? (
        <ul className="mt-1 mb-1 ml-6 border-l border-tinta/15">
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
                    "relative flex min-h-11 items-center gap-2.5 pl-4 text-sm transition-colors",
                    hijoActivo
                      ? "font-semibold"
                      : "opacity-65 hover:opacity-100"
                  )}
                >
                  <Abriendo className="inset-y-0 -left-px w-0.5 bg-tinta" />
                  <Hijo aria-hidden="true" className="size-4 shrink-0" />
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
 * —pedidos sin cobrar, productos sin stock— fuera de la vista justo
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

/** Las tres rayitas del botón del menú: largos distintos, como renglones. */
const RAYITAS = [18, 12, 22]

/**
 * El botón que abre el menú, el mismo de la app: un cuadro con tres rayitas de
 * distinto largo. Al apretarlo se llena de tinta; mientras el menú está
 * abierto, las rayitas se doblan en una flecha que apunta hacia él. Lleva un
 * punto rojo si adentro hay algo que pide atención.
 */
function BotonDeMenu({
  abierto,
  urgente,
}: {
  abierto: boolean
  urgente: boolean
}) {
  return (
    <span className="relative block">
      <span
        className={cn(
          "flex size-11 items-center justify-center border-[1.5px] border-tinta transition-colors duration-200",
          abierto ? "bg-tinta" : "group-active:bg-tinta"
        )}
      >
        <span className="flex h-3.5 w-[22px] flex-col justify-between">
          {RAYITAS.map((largo, indice) => {
            const brazo = indice === 0 ? -1 : indice === 2 ? 1 : 0
            return (
              <span
                key={indice}
                aria-hidden="true"
                className={cn(
                  "block h-0.5 origin-left transition-[width,transform,background-color] duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
                  abierto ? "bg-papel" : "bg-tinta group-active:bg-papel"
                )}
                style={{
                  width: abierto ? (brazo === 0 ? 20 : 11) : largo,
                  transform: abierto
                    ? `translateY(${-brazo * 6}px) rotate(${brazo * 40}deg)`
                    : undefined,
                }}
              />
            )
          })}
        </span>
      </span>
      {urgente ? (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 size-3 rounded-full border-2 border-papel bg-senal"
        />
      ) : null}
    </span>
  )
}

/**
 * En el celular, la barra de arriba y el menú en un cajón: los mismos de la
 * app. Arriba solo el botón del menú; cuando el nombre de la tienda se va de
 * la pantalla aparece en la barra, con una regla abajo para que se sepa dónde
 * termina lo fijo. Lo de todos los días está en las pestañas de abajo.
 */
export function BarraLateralMovil({ datos }: { datos: BarraLateral }) {
  const [abierta, setAbierta] = React.useState(false)
  const [desplazada, setDesplazada] = React.useState(false)
  const pathname = usePathname()
  const propio = useTituloPropio()
  const deRuta = tituloDeRuta(pathname)
  // El que puso la página vale solo para la ruta que lo pide: al navegar, la
  // página nueva todavía no limpió el suyo.
  const barra = propio && deRuta?.volver === propio.volver ? propio : deRuta

  React.useEffect(() => {
    setAbierta(false)
  }, [pathname])

  const conTitulo = Boolean(barra)
  React.useEffect(() => {
    const medir = () => setDesplazada(window.scrollY > (conTitulo ? 4 : 120))
    medir()
    window.addEventListener("scroll", medir, { passive: true })
    return () => window.removeEventListener("scroll", medir)
  }, [conTitulo])

  const urgente =
    datos.contadores.pedidosPendientes > 0 ||
    datos.tienda?.conWhatsApp === false

  // En el Resumen la barra no dice nada hasta que su cabecera se va de la
  // pantalla; en las demás, el nombre de la pantalla va siempre, como en la app.
  const titulo = barra?.titulo ?? datos.tienda?.nombre ?? "Venduo"
  const visible = conTitulo || desplazada

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b bg-papel transition-colors duration-200 lg:hidden",
        desplazada ? "border-tinta" : "border-transparent"
      )}
    >
      <div className="flex h-14 items-center gap-4 px-4">
        {barra?.volver && barra.alVolver ? (
          <button
            type="button"
            onClick={barra.alVolver}
            aria-label={barra.cerrar ? "Cerrar" : "Volver"}
            className="-ml-1.5 flex size-11 shrink-0 items-center justify-center transition-opacity active:opacity-60"
          >
            {barra.cerrar ? (
              <X aria-hidden="true" className="size-6" />
            ) : (
              <ArrowLeft aria-hidden="true" className="size-6" />
            )}
          </button>
        ) : barra?.volver ? (
          <Link
            href={barra.volver}
            aria-label="Volver"
            className="-ml-1.5 flex size-11 shrink-0 items-center justify-center transition-opacity active:opacity-60"
          >
            <ArrowLeft aria-hidden="true" className="size-6" />
          </Link>
        ) : (
          <Sheet open={abierta} onOpenChange={setAbierta}>
            <SheetTrigger
              aria-label={
                urgente
                  ? "Abrir el menú. Hay algo que atender"
                  : "Abrir el menú"
              }
              className="group"
            >
              <BotonDeMenu abierto={abierta} urgente={urgente} />
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
        )}

        <p
          aria-hidden={!visible}
          className={cn(
            "tabular min-w-0 flex-1 truncate font-titular text-[19px] leading-6 font-extrabold tracking-[-0.02em] transition-[opacity,transform] duration-200 motion-reduce:transition-none",
            visible ? "opacity-100" : "translate-y-2 opacity-0"
          )}
        >
          {titulo}
        </p>
        {barra?.acciones ? (
          <div className="-mr-2 flex shrink-0 items-center">
            {barra.acciones}
          </div>
        ) : null}
      </div>
    </header>
  )
}
