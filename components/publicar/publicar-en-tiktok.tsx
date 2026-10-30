"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { CircleCheck, CircleX, LoaderCircle, Send } from "lucide-react"
import { toast } from "sonner"

import { BOTON_PRIMARIO, CAMPO_LINEA, ETIQUETA_CAMPO } from "@/lib/estilos"
import { NOMBRES_DE_PRIVACIDAD, type Privacidad } from "@/lib/tiktok-textos"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Seccion } from "@/components/panel/piezas"
import type {
  Publicacion,
  ResultadoDeEstado,
  ResultadoDePublicar,
} from "@/app/(privado)/panel/marketing/tiktok/acciones"

const MUSICA =
  "https://www.tiktok.com/legal/page/global/music-usage-confirmation/en"
const CONTENIDO_DE_MARCA =
  "https://www.tiktok.com/legal/page/global/bc-policy/en"

/** Cada cuánto se pregunta en qué va, y hasta cuándo. */
const INTERVALO_MS = 4000
const ESPERA_MAXIMA_MS = 3 * 60_000

export interface CuentaParaPublicar {
  apodo: string
  usuario: string | null
  avatar: string | null
  privacidades: Privacidad[]
  comentariosApagados: boolean
}

type Estado =
  | { tipo: "editando" }
  | { tipo: "enviando" }
  | { tipo: "procesando"; publicacion: string; archivo: string }
  | { tipo: "publicada" }
  | { tipo: "fallida"; error: string }

/**
 * Publicar la foto de un producto en TikTok, con todo lo que TikTok exige
 * mostrar antes: con qué cuenta, cómo sale, el título y el texto editables,
 * quién la puede ver —sin nada elegido de antemano—, los comentarios —apagados
 * hasta que se activen— y si es contenido comercial. Nada se manda a TikTok
 * hasta que se toca "Publicar".
 */
export function PublicarEnTiktok({
  cuenta,
  imagen,
  ancho,
  alto,
  base,
  tituloInicial,
  descripcionInicial,
  publicar,
  estado: preguntarEstado,
  desconectar,
  conectar,
}: {
  cuenta: CuentaParaPublicar
  imagen: string
  ancho: number
  alto: number
  /** El producto, el diseño y el formato que se publican. */
  base: Pick<Publicacion, "productoId" | "diseno" | "formato">
  tituloInicial: string
  descripcionInicial: string
  publicar: (publicacion: Publicacion) => Promise<ResultadoDePublicar>
  estado: (publicacion: string, archivo: string) => Promise<ResultadoDeEstado>
  desconectar: () => Promise<{ ok: boolean }>
  conectar: string
}) {
  const router = useRouter()
  const [titulo, setTitulo] = React.useState(tituloInicial)
  const [descripcion, setDescripcion] = React.useState(() =>
    sinEnlaces(descripcionInicial)
  )
  const [privacidad, setPrivacidad] = React.useState<Privacidad | "">("")
  const [comentarios, setComentarios] = React.useState(false)
  const [musica, setMusica] = React.useState(false)
  const [comercial, setComercial] = React.useState(false)
  const [marcaPropia, setMarcaPropia] = React.useState(false)
  const [pagado, setPagado] = React.useState(false)
  const [estado, setEstado] = React.useState<Estado>({ tipo: "editando" })

  // El texto que se estaba escribiendo en "Publicar en redes", sin enlaces:
  // TikTok no deja que una app los agregue.
  React.useEffect(() => {
    try {
      const guardado = sessionStorage.getItem("venduo:publicar:texto")
      if (guardado) setDescripcion(sinEnlaces(guardado))
    } catch {
      // Sin almacenamiento, queda el texto armado.
    }
  }, [])

  // Contenido de marca no puede ser privado: si estaba en "Solo yo", se
  // suelta la elección y se dice por qué.
  React.useEffect(() => {
    if (pagado && privacidad === "SELF_ONLY") {
      setPrivacidad("")
      toast.info(
        "El contenido de marca no puede ser privado: elige quién lo ve."
      )
    }
  }, [pagado, privacidad])

  const faltaTipoComercial = comercial && !marcaPropia && !pagado
  const listo =
    privacidad !== "" && !faltaTipoComercial && estado.tipo === "editando"

  async function enviar() {
    if (!listo) return
    setEstado({ tipo: "enviando" })
    const resultado = await publicar({
      ...base,
      titulo,
      descripcion,
      privacidad,
      permitirComentarios: comentarios && !cuenta.comentariosApagados,
      musica,
      comercial,
      marcaPropia: comercial && marcaPropia,
      contenidoPagado: comercial && pagado,
    }).catch((): ResultadoDePublicar => ({
      ok: false,
      error: "No pudimos conectarnos con TikTok. Inténtalo de nuevo.",
    }))
    if (!resultado.ok) {
      if (resultado.reconectar) {
        toast.error(resultado.error)
        window.location.href = conectar
        return
      }
      setEstado({ tipo: "fallida", error: resultado.error })
      return
    }
    setEstado({
      tipo: "procesando",
      publicacion: resultado.publicacion,
      archivo: resultado.archivo,
    })
  }

  // Mientras TikTok procesa, se pregunta en qué va: lo pide TikTok, para que
  // la persona sepa qué pasa con su publicación.
  React.useEffect(() => {
    if (estado.tipo !== "procesando") return
    const inicio = Date.now()
    let vigente = true
    let reloj: number | undefined
    const revisar = async () => {
      const resultado = await preguntarEstado(
        estado.publicacion,
        estado.archivo
      ).catch((): ResultadoDeEstado => ({ ok: true, estado: "procesando" }))
      if (!vigente) return
      if (!resultado.ok) {
        setEstado({ tipo: "fallida", error: resultado.error })
      } else if (resultado.estado === "publicada") {
        setEstado({ tipo: "publicada" })
      } else if (Date.now() - inicio > ESPERA_MAXIMA_MS) {
        // Sigue procesando: no es una falla, solo tarda.
        setEstado({ tipo: "publicada" })
      } else {
        reloj = window.setTimeout(revisar, INTERVALO_MS)
      }
    }
    reloj = window.setTimeout(revisar, INTERVALO_MS)
    return () => {
      vigente = false
      window.clearTimeout(reloj)
    }
  }, [estado, preguntarEstado])

  const etiquetaComercial = pagado
    ? "Tu foto se etiquetará como «Colaboración pagada»."
    : marcaPropia
      ? "Tu foto se etiquetará como «Contenido promocional»."
      : null

  return (
    <div className="grid grid-cols-1 items-start gap-6 md:gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <Seccion
        id="vista"
        icono={Send}
        titulo="Así se verá"
        bajada="Sin enlaces: TikTok no los permite en la foto."
        className="lg:sticky lg:top-6"
      >
        <div className="flex justify-center bg-tinta/[0.04] px-4 py-6 sm:px-5">
          <div
            className={cn(
              "relative w-full overflow-hidden border border-tinta/15 bg-tinta/[0.06]",
              alto > ancho ? "max-w-[16rem]" : "max-w-[22rem]"
            )}
            style={{ aspectRatio: `${ancho} / ${alto}` }}
          >
            <Image
              src={imagen}
              alt="La foto que se publica en TikTok"
              fill
              unoptimized
              sizes="22rem"
              className="object-cover"
            />
          </div>
        </div>
      </Seccion>

      <Seccion
        id="publicar"
        icono={Send}
        titulo="Tu publicación"
        bajada="Revisa todo antes de publicar."
        relleno
      >
        <div className="flex items-start gap-3 border border-tinta/15 p-3">
          <span className="relative flex size-11 shrink-0 overflow-hidden rounded-full bg-tinta/10">
            {cuenta.avatar ? (
              <Image
                src={cuenta.avatar}
                alt=""
                fill
                unoptimized
                sizes="44px"
                className="object-cover"
              />
            ) : null}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-xs opacity-65">Publicarás como</span>
            <span className="truncate font-semibold">{cuenta.apodo}</span>
            {cuenta.usuario ? (
              <span className="truncate text-sm opacity-65">
                @{cuenta.usuario}
              </span>
            ) : null}
            <button
              type="button"
              onClick={async () => {
                await desconectar()
                router.refresh()
              }}
              className="min-h-11 w-fit text-left text-sm font-semibold underline underline-offset-4 transition-colors hover:text-senal"
            >
              Cambiar de cuenta
            </button>
          </span>
        </div>

        <label className="flex flex-col gap-1">
          <span className={ETIQUETA_CAMPO}>Título</span>
          <input
            value={titulo}
            maxLength={90}
            onChange={(evento) => setTitulo(evento.target.value)}
            className={CAMPO_LINEA}
          />
          <span className="tabular self-end text-xs opacity-65">
            {titulo.length}/90
          </span>
        </label>

        <label className="flex flex-col gap-1">
          <span className={ETIQUETA_CAMPO}>Texto</span>
          <textarea
            value={descripcion}
            maxLength={2200}
            rows={6}
            onChange={(evento) => setDescripcion(evento.target.value)}
            className="w-full resize-y border border-tinta/25 bg-papel p-3 text-base leading-relaxed outline-none focus-visible:border-tinta"
          />
        </label>

        <div className="flex flex-col gap-1">
          <span id="quien-ve" className={ETIQUETA_CAMPO}>
            Quién puede verlo
          </span>
          <Select
            value={privacidad}
            onValueChange={(valor) => setPrivacidad(valor as Privacidad)}
          >
            <SelectTrigger
              aria-labelledby="quien-ve"
              className={cn(CAMPO_LINEA, "w-full data-[size=default]:h-12")}
            >
              <SelectValue placeholder="Elige quién puede verlo" />
            </SelectTrigger>
            <SelectContent>
              {cuenta.privacidades.map((opcion) => {
                const bloqueada = opcion === "SELF_ONLY" && pagado
                return (
                  <SelectItem
                    key={opcion}
                    value={opcion}
                    disabled={bloqueada}
                    title={
                      bloqueada
                        ? "El contenido de marca no puede ser privado."
                        : undefined
                    }
                  >
                    {NOMBRES_DE_PRIVACIDAD[opcion]}
                    {bloqueada ? " · no disponible con contenido de marca" : ""}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          {cuenta.privacidades.length === 1 &&
          cuenta.privacidades[0] === "SELF_ONLY" ? (
            <span className="text-xs opacity-65">
              Mientras TikTok revisa Venduo, solo se puede publicar como «Solo
              yo».
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <span className={ETIQUETA_CAMPO}>Interacción</span>
          <Casilla
            id="comentarios"
            marcada={comentarios}
            alCambiar={setComentarios}
            apagada={cuenta.comentariosApagados}
            texto="Permitir comentarios"
            ayuda={
              cuenta.comentariosApagados
                ? "Desactivaste los comentarios en tu cuenta de TikTok."
                : undefined
            }
          />
          <Casilla
            id="musica"
            marcada={musica}
            alCambiar={setMusica}
            texto="Agregar música sugerida por TikTok"
            ayuda="Se puede cambiar después en TikTok."
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-tinta/15 pt-5">
          <div className="flex items-start justify-between gap-4">
            <label htmlFor="comercial" className="flex flex-col gap-0.5">
              <span className="font-semibold">Contenido comercial</span>
              <span className="text-sm opacity-70">
                Indica si promociona a ti, a una marca, un producto o un
                servicio.
              </span>
            </label>
            <Switch
              id="comercial"
              checked={comercial}
              onCheckedChange={(activo) => {
                setComercial(activo)
                if (!activo) {
                  setMarcaPropia(false)
                  setPagado(false)
                }
              }}
            />
          </div>
          {comercial ? (
            <div className="flex flex-col gap-3 pl-1">
              <Casilla
                id="marca-propia"
                marcada={marcaPropia}
                alCambiar={setMarcaPropia}
                texto="Tu marca"
                ayuda="Promocionas tu propio negocio."
              />
              <Casilla
                id="contenido-pagado"
                marcada={pagado}
                alCambiar={setPagado}
                texto="Contenido de marca"
                ayuda="Promocionas a otra marca o a un tercero."
              />
              {etiquetaComercial ? (
                <p className="text-sm font-semibold">{etiquetaComercial}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-tinta/15 pt-5">
          <p className="text-sm opacity-75">
            {pagado ? (
              <>
                Al publicar, aceptas la{" "}
                <a
                  href={CONTENIDO_DE_MARCA}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-semibold underline underline-offset-4"
                >
                  Política de contenido de marca
                </a>{" "}
                y la{" "}
                <a
                  href={MUSICA}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-semibold underline underline-offset-4"
                >
                  Confirmación de uso de música
                </a>{" "}
                de TikTok.
              </>
            ) : (
              <>
                Al publicar, aceptas la{" "}
                <a
                  href={MUSICA}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-semibold underline underline-offset-4"
                >
                  Confirmación de uso de música
                </a>{" "}
                de TikTok.
              </>
            )}
          </p>

          <EstadoDeLaPublicacion
            estado={estado}
            alReintentar={() => setEstado({ tipo: "editando" })}
          />

          <button
            type="button"
            onClick={() => void enviar()}
            disabled={!listo}
            title={
              faltaTipoComercial
                ? "Indica si lo que publicas te promociona a ti, a un tercero o a los dos."
                : undefined
            }
            className={cn(BOTON_PRIMARIO, "w-full")}
          >
            {estado.tipo === "enviando" || estado.tipo === "procesando" ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-5 animate-spin"
              />
            ) : (
              <Send aria-hidden="true" className="size-5" />
            )}
            Publicar en TikTok
          </button>
          {faltaTipoComercial ? (
            <p className="text-sm text-senal">
              Indica si lo que publicas te promociona a ti, a un tercero o a los
              dos.
            </p>
          ) : privacidad === "" && estado.tipo === "editando" ? (
            <p className="text-center text-xs opacity-65">
              Elige quién puede verlo para publicar.
            </p>
          ) : null}
          <p className="text-center text-xs opacity-65">
            TikTok puede tardar unos minutos en procesarla y mostrarla en tu
            perfil.
          </p>
        </div>
      </Seccion>
    </div>
  )
}

function Casilla({
  id,
  marcada,
  alCambiar,
  texto,
  ayuda,
  apagada = false,
}: {
  id: string
  marcada: boolean
  alCambiar: (marcada: boolean) => void
  texto: string
  ayuda?: string
  apagada?: boolean
}) {
  return (
    <div className={cn("flex items-start gap-3", apagada && "opacity-50")}>
      <Checkbox
        id={id}
        checked={marcada && !apagada}
        disabled={apagada}
        onCheckedChange={(valor) => alCambiar(valor === true)}
        className="mt-0.5 size-6 rounded-none border-tinta data-[state=checked]:border-tinta data-[state=checked]:bg-tinta"
      />
      <label
        htmlFor={id}
        className="flex min-h-11 cursor-pointer flex-col gap-0.5"
      >
        <span className="font-semibold">{texto}</span>
        {ayuda ? <span className="text-sm opacity-70">{ayuda}</span> : null}
      </label>
    </div>
  )
}

function EstadoDeLaPublicacion({
  estado,
  alReintentar,
}: {
  estado: Estado
  alReintentar: () => void
}) {
  if (estado.tipo === "editando") return null
  const [icono, texto, rojo] =
    estado.tipo === "enviando"
      ? [LoaderCircle, "Enviando a TikTok…", false]
      : estado.tipo === "procesando"
        ? [LoaderCircle, "TikTok está procesando tu publicación…", false]
        : estado.tipo === "publicada"
          ? [
              CircleCheck,
              "Listo: TikTok la está publicando. Puede tardar unos minutos en aparecer en tu perfil.",
              false,
            ]
          : [CircleX, estado.error, true]
  const Icono = icono
  return (
    <p
      aria-live="polite"
      className={cn(
        "flex items-start gap-2 border px-3 py-2.5 text-sm font-semibold",
        rojo ? "border-senal text-senal" : "border-tinta/25"
      )}
    >
      <Icono
        aria-hidden="true"
        className={cn(
          "mt-0.5 size-4 shrink-0",
          (estado.tipo === "enviando" || estado.tipo === "procesando") &&
            "animate-spin"
        )}
      />
      {texto}
      {estado.tipo === "fallida" ? (
        <button
          type="button"
          onClick={alReintentar}
          className="ml-auto shrink-0 underline underline-offset-4"
        >
          Reintentar
        </button>
      ) : null}
    </p>
  )
}

/** El texto sin enlaces ni la línea que los presentaba. */
function sinEnlaces(texto: string): string {
  return (
    texto
      .split("\n")
      // "Pídelo desde el enlace" tampoco: no tendría a qué apuntar.
      .filter((linea) => !/https?:\/\/|enlace/i.test(linea))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  )
}
