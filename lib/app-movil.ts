import { env } from "@/lib/env"

/*
 * Lo que la web sabe de la app del emprendedor, que vive en otro repositorio
 * (`venduo-app`).
 *
 * Android y iPhone abren un enlace del panel dentro de la app solo si esta web
 * les confirma que la app es suya: lo preguntan en `/.well-known/`. Hasta que
 * estén cargadas las variables —`APP_ANDROID_HUELLAS`, `APP_IOS_ID`— la web no
 * confirma nada y los enlaces siguen abriendo en el navegador.
 */

/** El identificador de la app en las dos tiendas. */
export const PAQUETE_DE_LA_APP = "bo.venduo.app"

/**
 * Las rutas que la app sabe abrir. Son las mismas de `app.config.ts` en el
 * repositorio de la app: una ruta nueva se suma en los dos lados.
 *
 * `/editor` y `/panel/catalogos` no están a propósito: la app los abre en el
 * navegador, y si estuvieran acá ese enlace volvería a abrir la app.
 */
export const RUTAS_DE_LA_APP = {
  exactas: ["/panel", "/panel/estadisticas", "/panel/apariencia", "/cuenta"],
  conTodoLoQueCuelga: ["/panel/pedidos", "/panel/productos"],
} as const

/**
 * Las huellas SHA-256 de las firmas de la app en Android, separadas por coma.
 *
 * Puede haber más de una: la de la clave con que se sube y la de Play Store,
 * que vuelve a firmar. Lo que no tenga forma de huella se descarta: una mal
 * copiada no puede confirmar nada.
 */
export function huellasDeAndroid(): string[] {
  return (env.APP_ANDROID_HUELLAS ?? "")
    .split(",")
    .map((huella) => huella.trim().toUpperCase())
    .filter((huella) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(huella))
}

/** El identificador de la app en iPhone: el equipo de Apple, un punto y el paquete. */
export function appDeIphone(): string | null {
  const id = env.APP_IOS_ID?.trim()
  return id && /^[A-Z0-9]{10}\.[A-Za-z0-9.-]+$/.test(id) ? id : null
}
