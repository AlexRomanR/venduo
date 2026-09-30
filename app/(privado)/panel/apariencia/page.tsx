import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, ArrowUpRight, WandSparkles } from "lucide-react"

import {
  getAparienciaDeMiTienda,
  type PlantillaElegible,
} from "@/lib/data/apariencia"
import { isSupabaseConfigured } from "@/lib/env"
import { BOTON_PRIMARIO } from "@/lib/estilos"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { CambiarPlantilla } from "@/components/panel/cambiar-plantilla"
import { Encabezado } from "@/components/panel/piezas"
import { RestaurarVersion } from "@/components/panel/restaurar-version"
import { Miniatura } from "@/components/plantillas/miniatura"
import type { DesignOrigin } from "@/types"
import { cambiarPlantilla, restaurarVersion } from "./acciones"

export const metadata = { title: "Apariencia" }

const ORIGENES: Record<DesignOrigin, string> = {
  alta: "Al crear la tienda",
  inicial: "Diseño que tenía la tienda",
  antes_de_cambiar_plantilla: "Antes de cambiar de plantilla",
  antes_de_publicar: "Antes de publicar cambios",
  antes_de_restaurar: "Antes de restaurar una versión",
}

/**
 * La apariencia de la tienda: la puerta al editor, la plantilla que usa y a
 * cuál puede pasarse, y el historial para volver atrás.
 *
 * El editor vive aparte, en `/editor`, a pantalla completa: acá se entra.
 */
export default async function AparienciaPage() {
  const datos = await getAparienciaDeMiTienda()
  if (!datos) {
    if (isSupabaseConfigured) redirect("/crear")
    return null
  }

  const { tienda, actual, disponibles, versiones, esDemo } = datos

  return (
    <div className="flex flex-col gap-16">
      <div>
        <h1 className="max-w-[20ch] font-titular text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.02] font-extrabold tracking-[-0.03em]">
          Cómo se ve tu tienda.
        </h1>
        <p className="mt-3 max-w-[60ch] text-sm leading-relaxed opacity-70">
          La plantilla decide la letra, los colores y cómo se muestran tus
          productos, en tu tienda y en este panel. Cambiarla no toca tus
          productos, categorías, pedidos ni vendedores.
          {esDemo ? (
            <>
              {" "}
              <span className="font-semibold">
                Estás en modo demo: el cambio no se guarda.
              </span>
            </>
          ) : null}
        </p>
      </div>

      <section className="flex flex-col gap-6 border-2 border-tinta p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="max-w-[46ch]">
          <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
            Editor de tu tienda
          </p>
          <h2 className="mt-2 font-titular text-[clamp(1.5rem,4vw,2rem)] leading-tight font-extrabold tracking-[-0.03em]">
            Tu logo, tus colores y tu portada.
          </h2>
          <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed opacity-70">
            <WandSparkles
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-senal"
            />
            Con tu tienda de verdad al lado, deshacer cuando quieras y la IA
            para pedirle cambios en tus palabras.
          </p>
        </div>
        <Link href="/editor" className={cn(BOTON_PRIMARIO, "shrink-0 px-7")}>
          Abrir el editor
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <Miniatura clave={actual.clave} className="border-2 border-tinta" />

        <div className="flex flex-col">
          <Encabezado etiqueta="Tu plantilla" />
          <h2 className="mt-3 font-titular text-[clamp(2rem,5vw,3rem)] leading-none font-extrabold tracking-[-0.03em]">
            {actual.retirada ? "Plantilla anterior" : actual.nombre}
          </h2>
          {actual.rubro ? (
            <p className="mt-2 text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
              {actual.rubro}
            </p>
          ) : null}

          <p className="mt-5 max-w-[52ch] leading-relaxed opacity-75">
            {actual.retirada
              ? "Tu tienda usa una plantilla que ya no se ofrece. Sigue funcionando igual, con el diseño editorial de Venduo, y puedes pasarte a una de las nuevas cuando quieras."
              : actual.descripcion}
          </p>

          <Rasgos plantilla={actual} />

          {actual.personalizada ? (
            <p className="mt-4 text-sm opacity-65">
              Tu tienda tiene cambios propios sobre la plantilla.
            </p>
          ) : null}

          <a
            href={tienda.url}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-6 inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
          >
            Ver {tienda.nombre}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
        </div>
      </section>

      <section className="border-t-2 border-tinta pt-10">
        <Encabezado
          etiqueta="Otras plantillas"
          titulo="Cambia la cara, no el negocio"
        />

        {disponibles.length === 0 ? (
          <p className="mt-6 max-w-[52ch] text-sm leading-relaxed opacity-70">
            Por ahora no hay otras plantillas para elegir.
          </p>
        ) : (
          <ul className="mt-8 grid gap-x-8 gap-y-12 md:grid-cols-2">
            {disponibles.map((plantilla) => (
              <li key={plantilla.clave} className="flex flex-col">
                <Miniatura
                  clave={plantilla.clave}
                  className="border border-tinta/25"
                />
                <h3 className="mt-5 font-titular text-xl font-bold tracking-[-0.02em]">
                  {plantilla.nombre}
                </h3>
                {plantilla.rubro ? (
                  <p className="mt-1 text-xs tracking-[0.12em] uppercase opacity-50">
                    {plantilla.rubro}
                  </p>
                ) : null}
                {plantilla.descripcion ? (
                  <p className="mt-3 text-sm leading-relaxed opacity-70">
                    {plantilla.descripcion}
                  </p>
                ) : null}
                <Rasgos plantilla={plantilla} />
                <div className="mt-6 pt-1 sm:mt-auto">
                  <CambiarPlantilla
                    clave={plantilla.clave}
                    nombre={plantilla.nombre}
                    plantillaActual={
                      actual.retirada ? "tu plantilla anterior" : actual.nombre
                    }
                    cambiar={cambiarPlantilla}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t border-tinta/15 pt-10">
        <Encabezado etiqueta="Historial de diseño" />
        <p className="mt-3 max-w-[58ch] text-sm leading-relaxed opacity-70">
          Antes de cada cambio guardamos cómo estaba tu tienda: la plantilla,
          los colores, el logo, las secciones y sus textos. Puedes volver a
          cualquiera de estas versiones, y lo de ahora también queda guardado.
        </p>

        {versiones.length === 0 ? (
          <p className="mt-6 text-sm opacity-55">Todavía no hay versiones.</p>
        ) : (
          <ol className="mt-6 border-t border-tinta">
            {versiones.map((version) => (
              <li
                key={version.id}
                className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1 border-b border-tinta/15 py-3 sm:grid-cols-[auto_1fr_auto_auto] sm:items-center"
              >
                <span className="tabular font-titular text-lg font-bold">
                  {String(version.numero).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {ORIGENES[version.origen]}
                  </span>
                  <span className="mt-0.5 block text-sm opacity-60">
                    {version.nota ?? version.plantilla}
                  </span>
                </span>
                <span className="tabular col-start-2 text-xs opacity-55 sm:col-start-auto">
                  {formatDate(version.fecha)}
                </span>
                <RestaurarVersion
                  version={version.id}
                  numero={version.numero}
                  descripcion={`${ORIGENES[version.origen]} · ${formatDate(version.fecha)}`}
                  restaurar={restaurarVersion}
                  className="col-start-2 -my-1 sm:col-start-auto sm:ml-4"
                />
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

function Rasgos({ plantilla }: { plantilla: PlantillaElegible }) {
  return (
    <ul className="mt-5 border-t border-tinta/15">
      {plantilla.rasgos.map((rasgo) => (
        <li
          key={rasgo}
          className="border-b border-tinta/15 py-2.5 text-sm opacity-80"
        >
          {rasgo}
        </li>
      ))}
    </ul>
  )
}
