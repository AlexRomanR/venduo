import Link from "next/link"
import { redirect } from "next/navigation"
import { BookOpen, Plus } from "lucide-react"

import { HOJAS } from "@/lib/catalogos/constantes"
import { elegidos } from "@/lib/catalogos/datos"
import {
  PLANTILLAS_DE_CATALOGO,
  estilosDeLaTienda,
} from "@/lib/catalogos/plantillas"
import {
  getCatalogos,
  getMaterialDelCatalogo,
  plantillasDeCatalogoVisibles,
} from "@/lib/data/catalogos"
import { funcionesDeMiTienda } from "@/lib/data/funciones"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { BOTON_PRIMARIO } from "@/lib/estilos"
import { formatRelative } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ConFuncion } from "@/components/panel/funcion"
import { Cabecera, Seccion } from "@/components/panel/piezas"
import { AccionesDeCatalogo } from "@/components/catalogos/acciones-de-lista"
import { MiniaturaDeCatalogo } from "@/components/catalogos/miniatura"
import { PedirCatalogoALaIa } from "@/components/catalogos/pedir-a-la-ia"
import { PlantillasDeLaLista } from "@/components/catalogos/plantillas-de-la-lista"
import { armarCatalogoConLaIa } from "./acciones"

export const metadata = { title: "Catálogos" }

/**
 * Los catálogos en PDF de la tienda, la misma pantalla de la app.
 *
 * Arriba, la IA plegada en una fila; después los guardados —si hay—, que se
 * mandan tal como están y siempre salen con los precios del día; y al final
 * las plantillas, dibujadas con los productos de la tienda: tocar una empieza
 * un catálogo con ella. "Nuevo catálogo" flota sobre las pestañas en el
 * celular, como "Nuevo producto".
 */
export default async function CatalogosPage() {
  const [tienda, { catalogos, esDemo }, material, funciones, plantillas] =
    await Promise.all([
      getMiTienda(),
      getCatalogos(),
      getMaterialDelCatalogo(),
      funcionesDeMiTienda(),
      plantillasDeCatalogoVisibles(),
    ])
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")
  if (funciones.catalogos !== "activa") redirect("/panel")
  const { datos, estiloDeTienda, plantillaDeLaTienda } = material
  const sugeridos = estilosDeLaTienda(
    estiloDeTienda,
    plantillaDeLaTienda
  ).filter((sugerido) => plantillas.includes(sugerido.plantilla))

  return (
    <div className="flex flex-col gap-6 max-lg:pb-16 md:gap-8">
      <Cabecera
        titulo="Tus catálogos."
        bajada="Tus productos en PDF, con los precios del día, para mandar por WhatsApp o imprimir."
        accionesSoloEnPantallaAncha
      >
        <Link
          href="/panel/catalogos/nuevo"
          className={cn(BOTON_PRIMARIO, "min-h-11 px-4 text-sm")}
        >
          <Plus aria-hidden="true" className="size-4" />
          Nuevo catálogo
        </Link>
      </Cabecera>

      <ConFuncion estado={funciones.ia_catalogos}>
        <PedirCatalogoALaIa armar={armarCatalogoConLaIa} />
      </ConFuncion>

      {/* Sin catálogos no hay nada que mostrar aquí: las plantillas de abajo
          son las que invitan a armar el primero. */}
      {catalogos.length > 0 ? (
        <Seccion
          id="guardados"
          icono={BookOpen}
          titulo="Los que ya armaste"
          bajada="Siempre salen con los precios de hoy."
        >
          <ul>
            {catalogos.map((guardado) => {
              const cuantos = elegidos(guardado.catalogo, datos).length
              return (
                <li
                  key={guardado.id}
                  className="flex items-center gap-4 border-t border-tinta/15 px-4 py-4 first:border-t-0 sm:px-5"
                >
                  <Link
                    href={`/panel/catalogos/${guardado.id}`}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="shrink-0"
                  >
                    <MiniaturaDeCatalogo
                      catalogo={guardado.catalogo}
                      datos={datos}
                      ancho={56}
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/panel/catalogos/${guardado.id}`}
                      className="line-clamp-2 font-semibold break-words underline-offset-4 hover:underline"
                    >
                      {guardado.nombre}
                    </Link>
                    <p className="mt-0.5 text-sm leading-snug opacity-70">
                      {PLANTILLAS_DE_CATALOGO[guardado.plantilla].nombre} ·{" "}
                      {cuantos} {cuantos === 1 ? "producto" : "productos"} ·{" "}
                      {HOJAS[guardado.hoja].nombre}
                    </p>
                    {esDemo ? null : (
                      <p className="mt-0.5 text-xs opacity-65">
                        Editado {formatRelative(guardado.actualizado)}
                      </p>
                    )}
                  </div>
                  <AccionesDeCatalogo
                    id={guardado.id}
                    nombre={guardado.nombre}
                    tienda={datos.tienda.nombre}
                    enlace={guardado.enlace}
                    compartir={funciones.catalogo_compartido}
                    esDemo={esDemo}
                  />
                </li>
              )
            })}
          </ul>
        </Seccion>
      ) : null}

      <PlantillasDeLaLista
        datos={datos}
        estiloDeTienda={estiloDeTienda}
        sugeridos={sugeridos}
        plantillas={plantillas}
      />

      <Link
        href="/panel/catalogos/nuevo"
        className={cn(
          BOTON_PRIMARIO,
          "fixed right-4 bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] z-20 min-h-12 px-5 lg:hidden"
        )}
      >
        <Plus aria-hidden="true" className="size-5" />
        Nuevo catálogo
      </Link>
    </div>
  )
}
