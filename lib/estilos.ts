/**
 * Vestido editorial de los controles de formulario.
 *
 * Son cadenas de clases y no componentes nuevos: los campos siguen siendo los
 * de shadcn, que aportan el cableado de accesibilidad. Viven acá porque los
 * repetían cuatro formularios y una corrección se olvidaba en dos.
 */

/** Etiqueta en versalita, que pasa a rojo cuando el campo tiene error. */
export const ETIQUETA_CAMPO =
  "text-xs font-semibold tracking-[0.12em] uppercase opacity-55 data-[error=true]:text-senal data-[error=true]:opacity-100"

/** Campo sin caja: una regla abajo que se pone roja al enfocar o al fallar. */
export const CAMPO =
  "rounded-none border-0 border-b border-tinta bg-transparent px-0 text-base transition-colors placeholder:text-tinta/35 focus-visible:border-senal focus-visible:ring-0 aria-invalid:border-senal aria-invalid:ring-0 md:text-base"

/** El alto mínimo de un campo de una línea: 48 px, por encima del táctil. */
export const CAMPO_LINEA = `h-12 ${CAMPO}`

/** Botón primario: el rojo de señal, uno por bloque. */
export const BOTON_PRIMARIO =
  "flex min-h-12 items-center justify-center gap-2 rounded-plantilla bg-senal px-5 font-semibold text-white transition-colors hover:bg-senal-alta disabled:opacity-60"

/** Botón secundario: trazo de 2 px que se invierte al pasar el cursor. */
export const BOTON_SECUNDARIO =
  "flex min-h-12 items-center justify-center gap-2 rounded-plantilla border-2 border-tinta px-5 font-semibold transition-colors hover:bg-tinta hover:text-papel disabled:opacity-60"

/** Mensaje de error de un campo. */
export const ERROR_CAMPO = "text-sm text-senal"

/** Ayuda bajo un campo. */
export const AYUDA_CAMPO = "text-xs text-tinta/55"
