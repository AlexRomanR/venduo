import { NextResponse } from "next/server"

import { huellasDeAndroid, PAQUETE_DE_LA_APP } from "@/lib/app-movil"

// Sale de variables de entorno: cambia con un despliegue, no con cada pedido.
export const dynamic = "force-static"

/**
 * Le confirma a Android que la app es de esta web.
 *
 * Con eso, un enlace del panel abre la app sin preguntar con qué abrirlo. Sin
 * huellas cargadas responde una lista vacía, que es un "no" válido.
 */
export function GET() {
  const huellas = huellasDeAndroid()

  return NextResponse.json(
    huellas.length === 0
      ? []
      : [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
              namespace: "android_app",
              package_name: PAQUETE_DE_LA_APP,
              sha256_cert_fingerprints: huellas,
            },
          },
        ]
  )
}
