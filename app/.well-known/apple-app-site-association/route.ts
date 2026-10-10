import { NextResponse } from "next/server"

import { appDeIphone, RUTAS_DE_LA_APP } from "@/lib/app-movil"

export const dynamic = "force-static"

/**
 * Lo mismo que `assetlinks.json`, para iPhone: qué app puede abrir qué rutas.
 *
 * Apple lo pide sin extensión y como JSON. Sin la app cargada no existe.
 */
export function GET() {
  const app = appDeIphone()
  if (!app) return new NextResponse(null, { status: 404 })

  return NextResponse.json({
    applinks: {
      details: [
        {
          appIDs: [app],
          components: [
            ...RUTAS_DE_LA_APP.exactas.map((ruta) => ({ "/": ruta })),
            ...RUTAS_DE_LA_APP.conTodoLoQueCuelga.flatMap((ruta) => [
              { "/": ruta },
              { "/": `${ruta}/*` },
            ]),
          ],
        },
      ],
    },
  })
}
