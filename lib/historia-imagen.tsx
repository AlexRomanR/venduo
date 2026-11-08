import "server-only"

import { ImageResponse } from "next/og"

import { resolverEstilo, type EstiloResuelto } from "@/lib/catalogos/estilo"
import { rutaDeVistaDePlantilla } from "@/lib/api/miniaturas"
import { getMiTienda } from "@/lib/data/panel"
import { getMaterialParaPublicar } from "@/lib/data/publicar"
import { slugify } from "@/lib/format"
import { fotoEnBase64 } from "@/lib/fotos"
import { fuentesDe } from "@/lib/publicar-imagen"
import { toDataURL } from "@/lib/qr"
import { conOrigen } from "@/lib/visitas"

/*
 * Las tarjetas para historias de Compartir: una imagen vertical de 1080 ×
 * 1920, lista para una historia de Instagram, TikTok o el estado de WhatsApp,
 * con la tienda adentro. Llevan la identidad de la tienda —su letra y sus
 * colores—, no la de Venduo: son su publicidad. Son las mismas tres de la app
 * (`tarjetas-de-historia.tsx`), dibujadas en el servidor para que salgan
 * nítidas en cualquier teléfono. Solo servidor.
 */

export const DISENOS_DE_HISTORIA = [
  { clave: "vitrina", nombre: "Vitrina" },
  { clave: "color", nombre: "Color" },
  { clave: "qr", nombre: "QR" },
] as const

export type DisenoDeHistoria = (typeof DISENOS_DE_HISTORIA)[number]["clave"]

const ANCHO = 1080
const ALTO = 1920

function esDisenoDeHistoria(valor: string | null): valor is DisenoDeHistoria {
  return DISENOS_DE_HISTORIA.some((d) => d.clave === valor)
}

function Enlace({
  enlace,
  fondo,
  letra,
  estilo,
}: {
  enlace: string
  fondo: string
  letra: string
  estilo: EstiloResuelto
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        backgroundColor: fondo,
        color: letra,
        padding: "36px 48px",
        borderRadius: estilo.radio * 3,
        fontFamily: estilo.cuerpo.fuente,
        fontWeight: estilo.cuerpo.pesoFuerte,
        fontSize: enlace.length > 34 ? 38 : 48,
      }}
    >
      {enlace}
    </div>
  )
}

function Firma({ color, estilo }: { color: string; estilo: EstiloResuelto }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        color,
        opacity: 0.7,
        fontFamily: estilo.cuerpo.fuente,
        fontWeight: estilo.cuerpo.peso,
        fontSize: 33,
        marginTop: 30,
      }}
    >
      Hecho con Venduo
    </div>
  )
}

function Tarjeta({
  diseno,
  nombre,
  enlace,
  vista,
  qr,
  estilo,
}: {
  diseno: DisenoDeHistoria
  nombre: string
  enlace: string
  vista: string | null
  qr: string | null
  estilo: EstiloResuelto
}) {
  const { papel, tinta, acento, sobreAcento } = estilo.colores
  const titular = {
    fontFamily: estilo.titular.fuente,
    fontWeight: estilo.titular.peso,
    textTransform: estilo.titular.mayusculas ? "uppercase" : "none",
    letterSpacing: -3,
    lineHeight: 1.04,
  } as const
  const grande = nombre.length > 22 ? 96 : 120

  if (diseno === "qr") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          width: ANCHO,
          height: ALTO,
          backgroundColor: tinta,
          padding: 84,
        }}
      >
        <div style={{ display: "flex", height: 36 }} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              ...titular,
              display: "flex",
              textAlign: "center",
              color: papel,
              fontSize: grande - 12,
              maxWidth: 900,
            }}
          >
            {nombre}
          </div>
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr}
              width={690}
              height={690}
              alt=""
              style={{ marginTop: 54, backgroundColor: "#ffffff", padding: 42 }}
            />
          ) : null}
          <div
            style={{
              display: "flex",
              marginTop: 54,
              color: papel,
              fontFamily: estilo.cuerpo.fuente,
              fontWeight: estilo.cuerpo.pesoFuerte,
              fontSize: 51,
            }}
          >
            Escanéame y pide por WhatsApp
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignSelf: "stretch",
          }}
        >
          <Enlace
            enlace={enlace}
            fondo={acento}
            letra={sobreAcento}
            estilo={estilo}
          />
          <Firma color={papel} estilo={estilo} />
        </div>
      </div>
    )
  }

  const enColor = diseno === "color"
  const fondo = enColor ? acento : papel
  const letra = enColor ? sobreAcento : tinta

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: ANCHO,
        height: ALTO,
        backgroundColor: fondo,
        padding: "120px 84px 84px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            color: enColor ? letra : acento,
            opacity: enColor ? 0.8 : 1,
            fontFamily: estilo.cuerpo.fuente,
            fontWeight: estilo.cuerpo.pesoFuerte,
            fontSize: 39,
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          Mira mi tienda
        </div>
        <div
          style={{
            ...titular,
            display: "flex",
            color: letra,
            fontSize: grande,
            marginTop: 18,
          }}
        >
          {nombre}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignSelf: "center",
          width: 528,
          height: 990,
          border: `15px solid ${enColor ? letra : tinta}`,
          borderRadius: 78,
          overflow: "hidden",
          backgroundColor: papel,
          // Sin giro también se escribe: con `undefined`, el dibujo se caía.
          transform: enColor ? "rotate(-4deg)" : "rotate(0deg)",
        }}
      >
        {vista ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vista}
            alt=""
            width={498}
            height={960}
            style={{ objectFit: "cover", objectPosition: "top" }}
          />
        ) : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <Enlace
          enlace={enlace}
          fondo={enColor ? letra : tinta}
          letra={enColor ? acento : papel}
          estilo={estilo}
        />
        <Firma color={letra} estilo={estilo} />
      </div>
    </div>
  )
}

/**
 * `GET /panel/compartir/historia?diseno=vitrina|color|qr`: la tarjeta en PNG.
 * Con `descargar`, se baja con nombre de archivo en vez de mostrarse.
 */
export async function respuestaDeHistoria(
  peticion: Request
): Promise<Response> {
  const consulta = new URL(peticion.url).searchParams
  const diseno = consulta.get("diseno")
  if (!esDisenoDeHistoria(diseno)) {
    return new Response("Pedido incompleto.", { status: 400 })
  }

  const [material, tienda] = await Promise.all([
    getMaterialParaPublicar(),
    getMiTienda(),
  ])
  const estilo = resolverEstilo(material.estilo)
  // La captura de la portada de la tienda o, si todavía no hay, la de su
  // plantilla, que vive en `public/`.
  const vistaUrl =
    tienda?.vista_url ??
    new URL(
      rutaDeVistaDePlantilla(tienda?.template_key ?? null),
      peticion.url
    ).toString()

  const [fuentes, vista, qr] = await Promise.all([
    fuentesDe(estilo),
    diseno === "qr"
      ? Promise.resolve(null)
      : fotoEnBase64(vistaUrl, { lado: 1000, calidad: 86 }),
    diseno === "qr"
      ? toDataURL(conOrigen(material.tienda.url, "qr"), {
          size: 606,
          margin: 1,
          dark: "#0a0a0a",
          light: "#ffffff",
        })
      : Promise.resolve(null),
  ])

  const archivo = `${slugify(material.tienda.nombre) || "tienda"}-historia-${diseno}.png`
  return new ImageResponse(
    <Tarjeta
      diseno={diseno}
      nombre={material.tienda.nombre}
      enlace={material.tienda.enlace}
      vista={vista}
      qr={qr}
      estilo={estilo}
    />,
    {
      width: ANCHO,
      height: ALTO,
      fonts: fuentes,
      headers: {
        "Cache-Control": "private, max-age=60",
        "Content-Disposition": `${consulta.has("descargar") ? "attachment" : "inline"}; filename="${archivo}"`,
      },
    }
  )
}
