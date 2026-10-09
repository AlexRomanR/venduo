import Link from "next/link"
import { redirect } from "next/navigation"
import { BookOpen, LayoutTemplate, Palette, Plus } from "lucide-react"

import { HOJAS } from "@/lib/catalogos/constantes"
import { elegidos } from "@/lib/catalogos/datos"
import {
  PLANTILLAS_DE_CATALOGO,
  armarCatalogo,
  armarConEstilo,
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
import { Cabecera, Seccion, SinDatos } from "@/components/panel/piezas"
import { AccionesDeCatalogo } from "@/components/catalogos/acciones-de-lista"
import { MiniaturaDeCatalogo } from "@/components/catalogos/miniatura"

export const metadata = { title: "Catálogos" }

/**
 * Los catálogos en PDF de la tienda.
 *
 * Arriba los guardados, que se mandan tal como están y siempre salen con los
 * precios del día; abajo las plantillas que se ofrecen, con los productos de
 * la tienda, que es lo que convence de armar el primero.
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
  const productos = Object.values(datos.productos)

  // Las muestras se arman con los primeros productos: alcanzan para ver cómo
  // queda cada plantilla sin dibujar el catálogo entero doce veces.
  const muestra = productos.slice(0, 12)

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera
        titulo="Tus catálogos."
        bajada="Catálogos en PDF con tus productos, para mandar por WhatsApp o imprimir. Se arman con el precio y el stock del día cada vez que se abren."
        demo={
          esDemo &&
          "Estás en modo demo: los catálogos son de ejemplo y no se guardan."
        }
      >
        <Link
          href="/panel/catalogos/nuevo"
          className={cn(BOTON_PRIMARIO, "min-h-11 px-4 text-sm")}
        >
          <Plus aria-hidden="true" className="size-4" />
          Nuevo catálogo
        </Link>
      </Cabecera>

      <Seccion
        id="guardados"
        icono={BookOpen}
        titulo="Los que ya armaste"
        bajada="Ábrelos para cambiarlos o mándalos como están: siempre salen con los precios de hoy."
      >
        {catalogos.length === 0 ? (
          <SinDatos
            icono={BookOpen}
            titulo="Todavía no tienes catálogos"
            texto="Arma el primero en un minuto: eliges productos, eliges una plantilla y lo descargas en PDF o lo mandas por WhatsApp."
          >
            <Link
              href="/panel/catalogos/nuevo"
              className={cn(BOTON_PRIMARIO, "min-h-11 px-4 text-sm")}
            >
              <Plus aria-hidden="true" className="size-4" />
              Armar mi primer catálogo
            </Link>
          </SinDatos>
        ) : (
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
        )}
      </Seccion>

      {muestra.length > 0 && sugeridos.length > 0 ? (
        <Seccion
          id="con-tu-estilo"
          icono={Palette}
          titulo="Con el estilo de tu tienda"
          bajada="Tus colores tal cual, tu color a toda hoja, en oscuro o en tonos de tu color."
          accion={{
            href: "/panel/catalogos/nuevo",
            texto: "Armar uno con tu estilo",
          }}
        >
          <ul className="grid grid-cols-2 gap-px bg-tinta/15 lg:grid-cols-4">
            {sugeridos.map((sugerido) => (
              <li
                key={sugerido.clave}
                className="flex flex-col gap-3 bg-papel p-4"
              >
                <MiniaturaDeCatalogo
                  catalogo={armarConEstilo(sugerido, {
                    nombre: "Catálogo de temporada",
                    productos: muestra,
                    tienda: {
                      nombre: datos.tienda.nombre,
                      whatsapp: datos.tienda.whatsapp,
                    },
                  })}
                  datos={datos}
                  ancho={112}
                />
                <div>
                  <p className="font-titular leading-tight font-bold tracking-[-0.01em]">
                    {sugerido.nombre}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed opacity-70">
                    {sugerido.detalle}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Seccion>
      ) : null}

      <Seccion
        id="plantillas"
        icono={LayoutTemplate}
        titulo="Plantillas para empezar"
        bajada="Dibujadas con tus productos y los colores de tu tienda. Cualquier hoja de una sirve en otra."
        accion={{ href: "/panel/catalogos/nuevo", texto: "Armar un catálogo" }}
      >
        {muestra.length === 0 ? (
          <SinDatos
            icono={LayoutTemplate}
            titulo="Primero, tus productos"
            texto="Las plantillas se dibujan con lo que vendes. Carga algunos productos y vuelve a verlas."
          >
            <Link
              href="/panel/productos/nuevo"
              className={cn(BOTON_PRIMARIO, "min-h-11 px-4 text-sm")}
            >
              <Plus aria-hidden="true" className="size-4" />
              Cargar un producto
            </Link>
          </SinDatos>
        ) : (
          <ul className="grid grid-cols-2 gap-px bg-tinta/15 sm:grid-cols-3 xl:grid-cols-4">
            {plantillas.map((clave) => {
              const plantilla = PLANTILLAS_DE_CATALOGO[clave]
              const catalogo = armarCatalogo({
                plantilla: clave,
                nombre: "Catálogo de temporada",
                productos: muestra,
                tienda: {
                  nombre: datos.tienda.nombre,
                  whatsapp: datos.tienda.whatsapp,
                },
                estilo: estiloDeTienda,
              })
              return (
                <li key={clave} className="flex flex-col gap-3 bg-papel p-4">
                  <MiniaturaDeCatalogo
                    catalogo={catalogo}
                    datos={datos}
                    ancho={112}
                  />
                  <div>
                    <p className="font-titular leading-tight font-bold tracking-[-0.01em]">
                      {plantilla.nombre}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed opacity-70">
                      {plantilla.ideal}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Seccion>
    </div>
  )
}
