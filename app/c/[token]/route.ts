import { aviso, respuestaDePdf } from "@/lib/catalogos/pdf"
import { getCatalogoCompartido } from "@/lib/data/catalogos"

/** Los precios y el stock se leen en el momento: nunca de caché. */
export const dynamic = "force-dynamic"

/**
 * Un catálogo compartido: el enlace que la tienda manda por WhatsApp.
 *
 * Abre el PDF en el visor del teléfono, armado cada vez con los precios y el
 * stock del día. Por eso se comparte el enlace y no el archivo: un PDF
 * reenviado tres veces sigue diciendo lo de hoy.
 */
export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  if (!/^[a-z0-9-]{8,64}$/.test(token)) {
    return aviso("Este catálogo no existe.", 404)
  }

  const compartido = await getCatalogoCompartido(token)
  if (!compartido) {
    return aviso(
      "Este catálogo ya no está disponible. Pídele a la tienda uno nuevo.",
      404
    )
  }

  return respuestaDePdf(compartido.catalogo, compartido.datos)
}
