import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getComboDeTienda } from "@/lib/data/combos"
import { marcoDeTienda } from "@/lib/data/tienda-publica"
import { kitDePlantilla } from "@/components/plantillas"
import { FichaDelCombo } from "@/components/tienda/combo"

type Parametros = Promise<{ slug: string; token: string; combo: string }>

export async function generateMetadata({ params }: { params: Parametros }) {
  const { slug, token, combo } = await params
  const encontrado = await getComboDeTienda(slug, token, combo)
  if (!encontrado) return { title: "Tienda no encontrada" }

  const { tienda } = encontrado
  if (!encontrado.combo) {
    return { title: { absolute: `Combo no disponible · ${tienda.nombre}` } }
  }
  const foto = encontrado.combo.productos.find((p) => p.image_url)?.image_url
  return {
    title: { absolute: `${encontrado.combo.nombre} · ${tienda.nombre}` },
    description: encontrado.combo.nota || undefined,
    openGraph: {
      title: encontrado.combo.nombre,
      description: encontrado.combo.nota || undefined,
      images: foto ? [{ url: foto }] : undefined,
    },
  }
}

/**
 * Un combo de un catálogo, en la tienda: a donde lleva "Pedir este combo" del
 * PDF. Tiene su URL porque el PDF ya mandado apunta a ella; si el combo ya no
 * se puede pedir, lo dice con la cabecera de la tienda en vez de dar un 404.
 * Brief: docs/briefs/2026-11-20-combos-que-se-compran.md.
 */
export default async function ComboPage({ params }: { params: Parametros }) {
  const { slug, token, combo: comboId } = await params
  const encontrado = await getComboDeTienda(slug, token, comboId)
  if (!encontrado) notFound()

  const { tienda, combo } = encontrado
  const kit = kitDePlantilla(tienda.plantilla)
  const marco = marcoDeTienda(tienda)

  return (
    <>
      <kit.Cabecera marco={marco} />

      <main className="flex-1">
        {/* Sin combo, el aviso ya lleva a la tienda: no se repite. */}
        {combo ? (
          <div className="mx-auto w-full max-w-6xl px-5 pt-6">
            <Link
              href={`/t/${tienda.slug}`}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-60"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Ver la tienda
            </Link>
          </div>
        ) : null}

        {combo ? (
          <FichaDelCombo
            combo={combo}
            slug={tienda.slug}
            nombreTienda={tienda.nombre}
            whatsapp={tienda.whatsapp}
          />
        ) : (
          <div className="mx-auto w-full max-w-6xl px-5 pb-16">
            <kit.Vacio
              titulo="Este combo ya no está disponible."
              texto="Mira lo que tenemos hoy en nuestra tienda."
              accion={{ etiqueta: "Ver la tienda", href: `/t/${tienda.slug}` }}
            />
          </div>
        )}
      </main>

      <kit.Pie marco={marco} />
    </>
  )
}
