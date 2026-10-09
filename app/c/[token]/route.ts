import { aviso, respuestaDePdf } from "@/lib/catalogos/pdf"
import { getCatalogoCompartido } from "@/lib/data/catalogos"
import { funcionDeTienda } from "@/lib/data/funciones"

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
  // Si Venduo apagó el enlace público para esta tienda, el enlace dice lo
  // mismo que uno borrado: quien lo abre no tiene por qué saber más.
  const habilitado =
    !compartido?.tienda ||
    (await funcionDeTienda(compartido.tienda, "catalogo_compartido"))
  if (!compartido || !habilitado) {
    return aviso(
      "Este catálogo ya no está disponible. Pídele a la tienda uno nuevo.",
      404
    )
  }

  return respuestaDePdf(compartido.catalogo, compartido.datos)
}
