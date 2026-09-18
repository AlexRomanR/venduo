"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BadgeCheck,
  ChevronRight,
  HelpCircle,
  Menu,
  PackageSearch,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  UserRound,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useCarritoMarketplace } from "@/components/marketplace/carrito"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const RUBROS = ["Ropa", "Alimentos", "Accesorios", "Calzado", "Hogar"]

function Navegacion({ movil = false }: { movil?: boolean }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Explorar el Marketplace" className="flex flex-col">
      <Link
        href="/"
        className={cn(
          "flex min-h-11 items-center gap-3 border-b border-tinta/10 text-sm font-semibold transition-colors hover:text-senal",
          pathname === "/" && "text-senal"
        )}
      >
        <PackageSearch aria-hidden="true" className="size-4" />
        Todos los productos
      </Link>
      <Link
        href="/?orden=ofertas"
        className="flex min-h-11 items-center gap-3 border-b border-tinta/10 text-sm font-semibold transition-colors hover:text-senal"
      >
        <Tag aria-hidden="true" className="size-4" />
        Ofertas
      </Link>
      <Link
        href="/?condicion=segunda_mano"
        className="flex min-h-11 items-center gap-3 border-b border-tinta/10 text-sm font-semibold transition-colors hover:text-senal"
      >
        <RefreshCcw aria-hidden="true" className="size-4" />
        Segunda mano
      </Link>

      <p className="mt-8 text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
        Categorías
      </p>
      <div className="mt-2 flex flex-col">
        {RUBROS.map((rubro) => (
          <Link
            key={rubro}
            href={`/?categoria=${encodeURIComponent(rubro)}`}
            className="flex min-h-11 items-center justify-between text-sm opacity-70 transition-[color,opacity] hover:text-senal hover:opacity-100"
          >
            {rubro}
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        ))}
      </div>

      <p className="mt-8 text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
        Tu compra
      </p>
      <div className="mt-2 flex flex-col">
        <Link
          href="/proteccion"
          className="flex min-h-11 items-center gap-3 text-sm opacity-70 transition-[color,opacity] hover:text-senal hover:opacity-100"
        >
          <ShieldCheck aria-hidden="true" className="size-4" />
          Pago protegido
        </Link>
        <Link
          href="/ayuda"
          className="flex min-h-11 items-center gap-3 text-sm opacity-70 transition-[color,opacity] hover:text-senal hover:opacity-100"
        >
          <HelpCircle aria-hidden="true" className="size-4" />
          Ayuda para comprar
        </Link>
      </div>

      {movil ? (
        <div className="mt-8 border-t border-tinta/15 pt-5">
          <Link
            href="/unirse"
            className="flex min-h-12 items-center justify-center rounded-plantilla bg-senal px-5 font-semibold text-white"
          >
            Vender en Venduo
          </Link>
        </div>
      ) : null}
    </nav>
  )
}

export function MarcoMarketplace({ children }: { children: React.ReactNode }) {
  const { unidades, listo } = useCarritoMarketplace()

  return (
    <div className="min-h-screen bg-papel text-tinta">
      <header className="sticky top-0 z-40 border-b border-tinta/15 bg-papel/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-3 px-4 sm:px-5">
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Abrir navegación"
                className="flex size-11 items-center justify-center lg:hidden"
              >
                <Menu aria-hidden="true" className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              showCloseButton={false}
              className="w-[min(88vw,360px)] gap-0 border-r border-tinta/20 bg-papel p-0 text-tinta shadow-none"
            >
              <div className="flex h-16 items-center border-b border-tinta/15 px-5">
                <SheetTitle className="flex-1 font-titular text-xl font-extrabold tracking-[-0.03em]">
                  Venduo
                </SheetTitle>
                <SheetClose asChild>
                  <button
                    type="button"
                    aria-label="Cerrar navegación"
                    className="flex size-11 items-center justify-center"
                  >
                    <X aria-hidden="true" className="size-5" />
                  </button>
                </SheetClose>
              </div>
              <div className="overflow-y-auto px-5 py-5">
                <Navegacion movil />
              </div>
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="mr-auto font-titular text-xl font-extrabold tracking-[-0.035em] sm:text-2xl"
          >
            Venduo<span className="text-senal">.</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <Link
              href="/unirse"
              className="flex min-h-11 items-center gap-2 px-3 text-sm font-semibold transition-colors hover:text-senal"
            >
              <Store aria-hidden="true" className="size-4" />
              Vender
            </Link>
            <Link
              href="/login"
              className="flex min-h-11 items-center gap-2 px-3 text-sm font-semibold transition-colors hover:text-senal"
            >
              <UserRound aria-hidden="true" className="size-4" />
              Ingresar
            </Link>
          </div>

          <Link
            href="/carrito"
            aria-label={`Ver carrito${listo ? `, ${unidades} artículos` : ""}`}
            className="relative flex size-11 items-center justify-center"
          >
            <ShoppingBag aria-hidden="true" className="size-5" />
            {listo && unidades > 0 ? (
              <span className="tabular absolute top-0 right-0 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-senal px-1 text-[10px] font-bold text-white">
                {unidades > 99 ? "99+" : unidades}
              </span>
            ) : null}
          </Link>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1500px] lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] overflow-y-auto border-r border-tinta/15 px-6 py-7 lg:block">
          <Navegacion />
          <div className="mt-10 border-t-2 border-tinta pt-5">
            <BadgeCheck aria-hidden="true" className="size-5 text-senal" />
            <p className="mt-3 font-titular text-lg font-bold tracking-[-0.02em]">
              Compra sin apostar.
            </p>
            <p className="mt-2 text-sm leading-relaxed opacity-65">
              PagoFácil retiene tu dinero hasta que confirmas la entrega.
            </p>
          </div>
        </aside>

        <div className="min-w-0">
          <main>{children}</main>
          <footer className="mt-16 border-t border-tinta/15">
            <div className="grid gap-8 px-5 py-12 sm:grid-cols-[1fr_auto] sm:items-end lg:px-10">
              <div>
                <p className="font-titular text-2xl font-extrabold tracking-[-0.035em]">
                  Venduo<span className="text-senal">.</span>
                </p>
                <p className="mt-3 max-w-[52ch] text-sm leading-relaxed opacity-60">
                  Productos de negocios bolivianos, con pago protegido hasta la
                  entrega.
                </p>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
                <Link href="/unirse" className="min-h-11 py-3 hover:text-senal">
                  Únete a Venduo
                </Link>
                <Link
                  href="/proteccion"
                  className="min-h-11 py-3 hover:text-senal"
                >
                  Compra protegida
                </Link>
                <Link href="/login" className="min-h-11 py-3 hover:text-senal">
                  Ingresar
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
