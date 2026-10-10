import { esAdmin } from "@/lib/admin"
import { exigirSesion, respuesta } from "@/lib/api/respuestas"
import { getBarraLateral } from "@/lib/data/barra"
import { getMiTienda, getResumenPanel } from "@/lib/data/panel"
import { getTablero } from "@/lib/data/tablero"
import { visitasDeMiTienda } from "@/lib/data/visitas"
import { PLANTILLAS, plantillaDeTienda } from "@/lib/plantillas"

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
            whatsapp: terminada.whatsapp,
            plantilla:
              PLANTILLAS[plantillaDeTienda(terminada.template_key)].nombre,
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
