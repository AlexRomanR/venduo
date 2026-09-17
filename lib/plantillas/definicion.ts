import type { Apariencia } from "@/lib/plantillas/apariencia"

/**
 * La base de una plantilla, en lo que no es un componente.
 *
 * Los componentes viven en `components/plantillas/{clave}` y se registran
 * aparte, porque este módulo lo lee también código que no dibuja: la
 * validación de una personalización, la galería del alta, mañana la IA.
 */
export interface DefinicionDePlantilla {
  /**
   * El nombre de respaldo. El que se muestra es `templates.name`, que puede
   * cambiar sin desplegar; este aparece solo en modo demo.
   */
  nombre: string
  descripcion: string
  /** Lo que la distingue, en frases cortas. Lo muestran la galería y el panel. */
  rasgos: string[]
  apariencia: Apariencia
}
