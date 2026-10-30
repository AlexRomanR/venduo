import Link from "next/link"
import { redirect } from "next/navigation"
import { CircleAlert, Send } from "lucide-react"

import { funcionesDeMiTienda } from "@/lib/data/funciones"
import { getMiTienda } from "@/lib/data/panel"
import { getMaterialParaPublicar } from "@/lib/data/publicar"
import { BOTON_PRIMARIO } from "@/lib/estilos"
import {
  esDiseno,
  esFormato,
  FORMATOS,
  rutaDeImagen,
  textosSinIa,
} from "@/lib/publicar"
import {
  accesoVigente,
  cuentaDeTiktok,
  isTikTokConfigured,
  mensajeDeTiktok,
  RechazoDeTiktok,
  type CuentaDeTiktok,
} from "@/lib/tiktok"
import { cn } from "@/lib/utils"
import { Cabecera, Seccion, SinDatos, Volver } from "@/components/panel/piezas"
import { TituloDeLaBarra } from "@/components/panel/titulo-de-barra"
import { PublicarEnTiktok } from "@/components/publicar/publicar-en-tiktok"
import { desconectarTiktok, estadoEnTiktok, publicarEnTiktok } from "./acciones"

export const metadata = { title: "Publicar en TikTok" }
// Armar la imagen y mandarla a TikTok puede tardar más que lo de siempre.
export const maxDuration = 60

const AVISOS: Record<string, string> = {
  error: "No pudimos conectar tu cuenta de TikTok. Inténtalo de nuevo.",
  no: "No conectaste tu cuenta de TikTok.",
}

/**
 * Publicar la foto de un producto en TikTok. Sin la cuenta conectada, ofrece
 * conectarla; con ella, lee la cuenta cada vez que se abre —lo pide TikTok,
 * porque sus opciones cambian— y muestra la pantalla de publicar.
 */
export default async function PublicarEnTiktokPage({
  searchParams,
}: {
  searchParams: Promise<{
    producto?: string
    diseno?: string
    formato?: string
    tiktok?: string
  }>
}) {
  const [tienda, funciones, material, parametros] = await Promise.all([
    getMiTienda(),
    funcionesDeMiTienda(),
    getMaterialParaPublicar(),
    searchParams,
  ])
  if (
    funciones.marketing !== "activa" ||
    funciones.tiktok !== "activa" ||
    !isTikTokConfigured
  ) {
    redirect("/panel/marketing")
  }

  const producto = material.productos.find((p) => p.id === parametros.producto)
  if (!producto) redirect("/panel/marketing")
  const diseno = esDiseno(parametros.diseno) ? parametros.diseno : "foto"
  const formato = esFormato(parametros.formato)
    ? parametros.formato
    : "historia"
  const medida = FORMATOS.find((f) => f.clave === formato) ?? FORMATOS[0]

  const aqui = `/panel/marketing/tiktok?${new URLSearchParams({
    producto: producto.id,
    diseno,
    formato,
  }).toString()}`
  const conectar = `/panel/marketing/tiktok/conectar?volver=${encodeURIComponent(aqui)}`
  const volver = `/panel/marketing?producto=${producto.id}`

  const acceso = tienda ? await accesoVigente(tienda.id) : null
  let cuenta: CuentaDeTiktok | null = null
  let problema: string | null = null
  if (acceso) {
    try {
      cuenta = await cuentaDeTiktok(acceso)
    } catch (error) {
      problema =
        error instanceof RechazoDeTiktok
          ? mensajeDeTiktok(error.codigo)
          : mensajeDeTiktok("internal")
    }
  }

  const base = textosSinIa(producto, material.tienda.nombre)
  const descripcionInicial = [
    base.instagram,
    base.hashtags.map((etiqueta) => `#${etiqueta}`).join(" "),
  ].join("\n\n")
  const aviso = parametros.tiktok ? AVISOS[parametros.tiktok] : undefined

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <TituloDeLaBarra titulo="Publicar en TikTok" volver={volver} />
      <Volver href={volver}>Publicar en redes</Volver>
      <Cabecera
        titulo="Publicar en TikTok."
        bajada={`${producto.nombre}: revisa cómo sale y elige quién lo ve.`}
      />

      {aviso ? (
        <p className="flex items-start gap-2 border border-senal px-4 py-3 text-sm font-semibold text-senal">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {aviso}
        </p>
      ) : null}

      {cuenta && cuenta.privacidades.length > 0 ? (
        <PublicarEnTiktok
          cuenta={cuenta}
          imagen={rutaDeImagen(producto.id, diseno, formato, false, "tiktok")}
          ancho={medida.ancho}
          alto={medida.alto}
          base={{ productoId: producto.id, diseno, formato }}
          tituloInicial={producto.nombre.slice(0, 90)}
          descripcionInicial={descripcionInicial}
          publicar={publicarEnTiktok}
          estado={estadoEnTiktok}
          desconectar={desconectarTiktok}
          conectar={conectar}
        />
      ) : (
        <Seccion
          id="conectar"
          icono={Send}
          titulo={
            problema
              ? "No se puede publicar ahora"
              : "Conecta tu cuenta de TikTok"
          }
          bajada={problema ? "Lo dice TikTok." : "Se hace una sola vez."}
        >
          <SinDatos
            icono={problema ? CircleAlert : Send}
            titulo={problema ?? "Publica sin salir de Venduo"}
            texto={
              problema
                ? "Puedes compartir la imagen desde «Publicar en redes» mientras tanto."
                : "Te llevamos a TikTok para que apruebes a Venduo. Solo pedimos permiso para publicar lo que tú elijas, y puedes quitarlo cuando quieras."
            }
          >
            {problema ? (
              <Link
                href={volver}
                className={cn(BOTON_PRIMARIO, "min-h-11 px-4 text-sm")}
              >
                Volver a Publicar en redes
              </Link>
            ) : (
              <a
                href={conectar}
                className={cn(BOTON_PRIMARIO, "min-h-11 px-4 text-sm")}
              >
                <Send aria-hidden="true" className="size-4" />
                Conectar TikTok
              </a>
            )}
          </SinDatos>
        </Seccion>
      )}
    </div>
  )
}
