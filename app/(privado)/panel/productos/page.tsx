import Link from "next/link"
import { redirect } from "next/navigation"
import { Boxes, PackageMinus, PackageX, Plus, Tags, Wallet } from "lucide-react"

import { getCatalogo, type FiltrosCatalogo } from "@/lib/data/catalogo"
import { getMiTienda } from "@/lib/data/panel"
import { visitasDeMiTienda } from "@/lib/data/visitas"
import { isSupabaseConfigured } from "@/lib/env"
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { FranjaDeFichas } from "@/components/panel/fichas"
import { FichasGrandes } from "@/components/panel/fichas-grandes"
import { Cabecera, Seccion, SinDatos } from "@/components/panel/piezas"
import { BuscadorDeProductos } from "@/components/productos/buscador"
import { ListaProductos } from "@/components/productos/lista"
import { ajustarStock } from "./acciones"

export const metadata = { title: "Productos" }

const ESTADOS = [
  "sin_stock",
  "poco_stock",
  "ocultos",
  "destacados",
  "muy_vistos",
] as const

/**
 * El catálogo, la misma pantalla de la app.
 *
 * Arriba, lo que pide algo contado en grande —lo agotado, lo que se acaba— y
 * cuánto vale lo guardado; los dos primeros filtran la lista. Debajo, los
 * productos con su foto, su precio y más y menos para el stock. Las cifras se
 * calculan sobre todo el catálogo y no sobre lo filtrado: son el estado del
 * negocio, no el pie de la lista.
 */
export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [tienda, parametros] = await Promise.all([getMiTienda(), searchParams])
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  const texto = (clave: string) => {
    const valor = parametros[clave]
    return typeof valor === "string" && valor ? valor : undefined
  }
  const estado = ESTADOS.find((e) => e === texto("estado"))
  const filtros: FiltrosCatalogo = {
    buscar: texto("buscar"),
    categoria: texto("categoria"),
    estado,
    orden: texto("orden"),
  }

  const [catalogo, visitas] = await Promise.all([
    getCatalogo(filtros),
    visitasDeMiTienda().catch(() => null),
  ])
  const { categorias, resumen, esDemo } = catalogo
  // "Muy vistos, poco vendidos" sale de las visitas, no del catálogo: se
  // filtra acá. Sin visitas activas, el filtro no existe y no filtra nada.
  const muyVistos = new Set(visitas?.idsMuyVistosPocoVendidos ?? [])
  const productos =
    estado === "muy_vistos" && visitas
      ? catalogo.productos.filter((p) => muyVistos.has(p.id))
      : catalogo.productos
  const hayFiltros = Boolean(filtros.buscar || filtros.categoria || estado)

  /** La dirección con un filtro cambiado y los demás como están. */
  const con = (cambios: Record<string, string | undefined>) => {
    const siguientes = new URLSearchParams()
    const actuales = { ...filtros, ...cambios }
    for (const [clave, valor] of Object.entries(actuales)) {
      if (valor) siguientes.set(clave, valor)
    }
    const consulta = siguientes.toString()
    return consulta ? `/panel/productos?${consulta}` : "/panel/productos"
  }
  // Tocar la ficha grande elegida la suelta.
  const alternar = (valor: (typeof ESTADOS)[number]) =>
    con({ estado: estado === valor ? undefined : valor })

  const sinCategoria = resumen.sinCategoria

  return (
    <div className="flex flex-col gap-6 max-lg:pb-16 md:gap-8">
      {/* En el celular "Nuevo producto" flota sobre las pestañas, como en la app. */}
      <Cabecera
        titulo="Productos"
        bajada="Lo que vendes, a qué precio y cuántas unidades te quedan. Es lo mismo que ve quien entra a tu tienda."
        soloBajadaEnCelular
      >
        <Link
          href="/panel/productos/nuevo"
          className={cn(BOTON_PRIMARIO, "min-h-11 px-4 text-sm")}
        >
          <Plus aria-hidden="true" className="size-4" />
          Nuevo producto
        </Link>
      </Cabecera>

      {resumen.total > 0 ? (
        <FichasGrandes
          fichas={[
            {
              clave: "sin_stock",
              valor: resumen.sinStock,
              etiqueta: "Sin stock",
              icono: PackageX,
              urgente: true,
              elegida: estado === "sin_stock",
              href: alternar("sin_stock"),
            },
            {
              clave: "poco_stock",
              valor: resumen.pocoStock,
              etiqueta: "Queda poco",
              icono: PackageMinus,
              elegida: estado === "poco_stock",
              href: alternar("poco_stock"),
            },
            {
              clave: "valor",
              valor: resumen.valorInventarioCents,
              tipo: "dinero",
              etiqueta: "Valor de tu stock",
              icono: Wallet,
            },
          ]}
        />
      ) : null}

      <Seccion
        id="productos"
        icono={Boxes}
        titulo="Tus productos"
        bajada={
          hayFiltros
            ? `${formatNumber(productos.length)} de ${formatNumber(resumen.total)} ${resumen.total === 1 ? "producto" : "productos"}`
            : "Cambia el stock con más y menos; toca uno para editarlo."
        }
        extra={
          <Link
            href="/panel/productos/categorias"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold underline underline-offset-4 transition-colors hover:text-senal"
          >
            <Tags aria-hidden="true" className="size-4" />
            {categorias.length === 0
              ? "Crear categorías"
              : `${formatNumber(categorias.length)} ${categorias.length === 1 ? "categoría" : "categorías"}`}
          </Link>
        }
      >
        {resumen.total > 0 ? (
          <>
            <BuscadorDeProductos />
            <FranjaDeFichas
              etiqueta="Filtrar por estado"
              fichas={[
                {
                  href: con({ estado: undefined }),
                  nombre: "Todos",
                  cuenta: resumen.total,
                  activa: !estado,
                },
                {
                  href: con({ estado: "sin_stock" }),
                  nombre: "Sin stock",
                  cuenta: resumen.sinStock,
                  urgente: true,
                  activa: estado === "sin_stock",
                },
                {
                  href: con({ estado: "poco_stock" }),
                  nombre: "Queda poco",
                  cuenta: resumen.pocoStock,
                  urgente: true,
                  activa: estado === "poco_stock",
                },
                {
                  href: con({ estado: "ocultos" }),
                  nombre: "Ocultos",
                  cuenta: resumen.ocultos,
                  activa: estado === "ocultos",
                },
                {
                  href: con({ estado: "destacados" }),
                  nombre: "Destacados",
                  cuenta: resumen.destacados,
                  activa: estado === "destacados",
                },
                ...(visitas
                  ? [
                      {
                        href: con({ estado: "muy_vistos" }),
                        nombre: "Muy vistos, poco vendidos",
                        cuenta: muyVistos.size,
                        activa: estado === "muy_vistos",
                      },
                    ]
                  : []),
              ]}
            />
            {categorias.length > 0 ? (
              <FranjaDeFichas
                etiqueta="Filtrar por categoría"
                fichas={[
                  {
                    href: con({ categoria: undefined }),
                    nombre: "Todas las categorías",
                    activa: !filtros.categoria,
                  },
                  ...categorias.map((c) => ({
                    href: con({ categoria: c.id }),
                    nombre: c.name,
                    cuenta: c.productos,
                    activa: filtros.categoria === c.id,
                  })),
                  ...(sinCategoria > 0
                    ? [
                        {
                          href: con({ categoria: "sin" }),
                          nombre: "Sin categoría",
                          cuenta: sinCategoria,
                          activa: filtros.categoria === "sin",
                        },
                      ]
                    : []),
                ]}
              />
            ) : null}
          </>
        ) : null}

        {productos.length > 0 ? (
          <ListaProductos
            productos={productos}
            ajustarStock={ajustarStock}
            soloLectura={esDemo}
            vistas={visitas?.vistasPorProducto ?? null}
          />
        ) : hayFiltros ? (
          <SinDatos
            icono={Boxes}
            titulo="Nada coincide con ese filtro"
            texto="Prueba quitando alguno."
          >
            <Link
              href="/panel/productos"
              scroll={false}
              className={cn(BOTON_SECUNDARIO, "min-h-11 px-4 text-sm")}
            >
              Ver todo
            </Link>
          </SinDatos>
        ) : (
          <SinDatos
            icono={Boxes}
            titulo="Todavía no cargaste ningún producto"
            texto="Con su foto, su precio y cuántas unidades tienes."
          >
            <Link
              href="/panel/productos/nuevo"
              className={cn(BOTON_PRIMARIO, "min-h-11 px-4 text-sm")}
            >
              <Plus aria-hidden="true" className="size-4" />
              Cargar el primero
            </Link>
          </SinDatos>
        )}
      </Seccion>

      {resumen.total > 0 ? (
        <Link
          href="/panel/productos/nuevo"
          className={cn(
            BOTON_PRIMARIO,
            "fixed right-4 bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] z-20 min-h-12 px-5 lg:hidden"
          )}
        >
          <Plus aria-hidden="true" className="size-5" />
          Nuevo producto
        </Link>
      ) : null}
    </div>
  )
}
