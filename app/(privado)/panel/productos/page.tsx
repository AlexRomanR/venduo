import Link from "next/link"
import { redirect } from "next/navigation"
import { Boxes, Package, Plus, Tags } from "lucide-react"

import { getCatalogo, type FiltrosCatalogo } from "@/lib/data/catalogo"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { formatMoney, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ProductCondition } from "@/types"
import {
  Cabecera,
  Cifra,
  Cifras,
  Seccion,
  SinDatos,
} from "@/components/panel/piezas"
import { FiltrosCatalogo as Filtros } from "@/components/productos/filtros"
import { ListaProductos } from "@/components/productos/lista"
import { ajustarStock, alternarProducto, borrarProducto } from "./acciones"

export const metadata = { title: "Productos" }

/**
 * El catálogo del emprendedor.
 *
 * Las cifras de arriba se calculan sobre todo el catálogo y no sobre lo
 * filtrado: son el estado del negocio, no el pie de la lista. La que puede
 * pedir una acción —lo que se acabó o se está por acabar— va en rojo, y el
 * resto en tinta, para que el acento siga queriendo decir algo.
 */
export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const tienda = await getMiTienda()
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  const parametros = await searchParams
  const texto = (clave: string) => {
    const valor = parametros[clave]
    return typeof valor === "string" ? valor : undefined
  }

  const filtros: FiltrosCatalogo = {
    buscar: texto("buscar"),
    categoria: texto("categoria"),
    condicion: texto("condicion") as ProductCondition | undefined,
    estado: texto("estado"),
    orden: texto("orden"),
  }

  const { productos, categorias, resumen, esDemo } = await getCatalogo(filtros)
  const hayFiltros = Object.values(filtros).some(Boolean)
  const porReponer = resumen.sinStock + resumen.pocoStock

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera
        titulo="Tu catálogo."
        bajada="Lo que vendes, a qué precio y cuánto te queda. Es lo mismo que ve quien entra a tu tienda."
        demo={
          esDemo &&
          "Estás en modo demo: los productos son de ejemplo y los cambios no se guardan."
        }
      >
        <Link
          href="/panel/productos/categorias"
          className={cn(BOTON_SECUNDARIO, "min-h-11 px-4 text-sm")}
        >
          <Tags aria-hidden="true" className="size-4" />
          Categorías
        </Link>
        <Link
          href="/panel/productos/nuevo"
          className={cn(BOTON_PRIMARIO, "min-h-11 px-4 text-sm")}
        >
          <Plus aria-hidden="true" className="size-4" />
          Nuevo producto
        </Link>
      </Cabecera>

      <Seccion
        id="inventario"
        icono={Package}
        titulo="Cómo está tu catálogo"
        bajada="Todo lo que tienes cargado, sin importar los filtros de abajo."
      >
        <Cifras>
          <Cifra
            etiqueta="En catálogo"
            valor={formatNumber(resumen.total)}
            detalle={`${formatNumber(resumen.activos)} ${resumen.activos === 1 ? "publicado" : "publicados"} · ${formatNumber(resumen.ocultos)} ${resumen.ocultos === 1 ? "oculto" : "ocultos"}`}
          />
          <Cifra
            etiqueta="Unidades"
            valor={formatNumber(resumen.unidades)}
            detalle={`${formatNumber(resumen.destacados)} ${resumen.destacados === 1 ? "destacado" : "destacados"} en tu portada`}
          />
          <Cifra
            etiqueta="Vale tu stock"
            valor={formatMoney(resumen.valorInventarioCents)}
            detalle="Precio por unidades en mano"
          />
          <Cifra
            etiqueta="Por reponer"
            valor={formatNumber(porReponer)}
            detalle={`${formatNumber(resumen.sinStock)} ${resumen.sinStock === 1 ? "agotado" : "agotados"} · ${formatNumber(resumen.pocoStock)} por acabarse`}
            alerta={porReponer > 0}
          />
        </Cifras>
      </Seccion>

      <Seccion
        id="productos"
        icono={Boxes}
        titulo="Tus productos"
        bajada="Busca, filtra y cambia el stock sin abrir cada uno."
        extra={
          productos.length > 0 ? (
            <span className="tabular text-sm opacity-70">
              {hayFiltros
                ? `${formatNumber(productos.length)} de ${formatNumber(resumen.total)}`
                : `${formatNumber(resumen.total)} ${resumen.total === 1 ? "producto" : "productos"}`}
            </span>
          ) : null
        }
      >
        {resumen.total > 0 ? <Filtros categorias={categorias} /> : null}

        {productos.length === 0 ? (
          hayFiltros ? (
            <SinDatos
              icono={Boxes}
              titulo="Nada coincide con ese filtro"
              texto="Prueba quitando alguno, o busca por otra palabra. El catálogo completo sigue ahí."
            />
          ) : (
            <SinDatos
              icono={Boxes}
              titulo="Todavía no cargaste ningún producto"
              texto="Carga el primero con su foto, su precio y cuántas unidades tienes. Desde ese momento tu tienda tiene qué mostrar."
            >
              <Link
                href="/panel/productos/nuevo"
                className={cn(BOTON_PRIMARIO, "min-h-11 px-4 text-sm")}
              >
                <Plus aria-hidden="true" className="size-4" />
                Cargar el primero
              </Link>
            </SinDatos>
          )
        ) : (
          <ListaProductos
            productos={productos}
            soloLectura={esDemo}
            acciones={{
              alternar: alternarProducto,
              ajustarStock,
              borrar: borrarProducto,
            }}
          />
        )}
      </Seccion>
    </div>
  )
}
