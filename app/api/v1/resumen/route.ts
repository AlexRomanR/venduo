import { after } from "next/server"

import { esAdmin } from "@/lib/admin"
import { rutaDeVistaDePlantilla } from "@/lib/api/miniaturas"
import { getSiteUrl } from "@/lib/env"
import { exigirSesion, respuesta } from "@/lib/api/respuestas"
import { getBarraLateral } from "@/lib/data/barra"
import { getMiTienda, getResumenPanel } from "@/lib/data/panel"
import { getTablero } from "@/lib/data/tablero"
import { visitasDeMiTienda } from "@/lib/data/visitas"
import { PLANTILLAS, plantillaDeTienda } from "@/lib/plantillas"
import { pedirVista } from "@/lib/vista"

export const dynamic = "force-dynamic"

/**
 * Todo lo que la app necesita para su pantalla de Inicio, en un solo viaje.
 *
 * Son las mismas lecturas del Resumen del panel —la barra, el tablero, la
 * suscripción, las visitas si están activas—, así la app y la web nunca
 * muestran números distintos. Lo que la app también usa para decidir a dónde
 * entra: sin tienda terminada va al alta, y la cuenta de administrador no
 * tiene nada que hacer acá.
 */
export async function GET() {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const [barra, tienda, resumen, tablero, visitas, admin] = await Promise.all([
    getBarraLateral(),
    getMiTienda(),
    getResumenPanel(),
    getTablero().catch(() => null),
    visitasDeMiTienda().catch(() => null),
    esAdmin(),
  ])

  const terminada = tienda?.template_key && barra.tienda ? tienda : null

  // La captura de la portada, o la miniatura de su plantilla mientras no la
  // haya. Si quedó vieja, se saca otra después de responder: la app la ve la
  // próxima vez que pida el resumen.
  const vieja =
    terminada &&
    (!terminada.vista_at ||
      new Date(terminada.vista_at) < new Date(terminada.vista_cambio_at))
  if (vieja && barra.tienda?.publicada && !barra.tienda.pausada) {
    const id = terminada.id
    after(() => pedirVista(id))
  }

  return respuesta({
    persona: barra.persona,
    esAdmin: admin,
    tienda:
      terminada && barra.tienda
        ? {
            id: terminada.id,
            nombre: barra.tienda.nombre,
            slug: barra.tienda.slug,
            url: barra.tienda.url,
            logoUrl: barra.tienda.logoUrl,
            publicada: barra.tienda.publicada,
            pausada: barra.tienda.pausada,
            // Se ve, pero no recibe pedidos. `hasta`: el día que vuelve.
            vacaciones: {
              activa: barra.tienda.deVacaciones,
              hasta: terminada.vacaciones_hasta,
            },
            whatsapp: terminada.whatsapp,
            plantilla:
              PLANTILLAS[plantillaDeTienda(terminada.template_key)].nombre,
            vista: {
              url:
                terminada.vista_url ??
                `${getSiteUrl()}${rutaDeVistaDePlantilla(terminada.template_key)}`,
              // Si es la captura de su portada o la miniatura de la plantilla.
              real: Boolean(terminada.vista_url),
            },
            // Solo los tres colores: alcanzan para el sello de la tienda.
            sello: barra.apariencia
              ? {
                  papel: barra.apariencia.colores.papel,
                  tinta: barra.apariencia.colores.tinta,
                  senal: barra.apariencia.colores.senal,
                }
              : null,
          }
        : null,
    // Una tienda empezada y sin plantilla: la app la manda a terminar el alta.
    altaPendiente: Boolean(tienda && !tienda.template_key),
    contadores: barra.contadores,
    funciones: barra.funciones,
    suscripcion: resumen?.suscripcion ?? null,
    tablero: terminada ? tablero : null,
    visitas: terminada ? visitas : null,
  })
}
