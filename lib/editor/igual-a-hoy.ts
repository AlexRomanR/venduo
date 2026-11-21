/**
 * Si una versión del historial es igual a cómo está la tienda hoy.
 *
 * Restaurarla no cambiaría nada, así que el historial no la ofrece. Se compara
 * lo mismo que guarda `capture_design_version`: plantilla, personalización,
 * logo y las páginas con sus secciones. Sin dependencias: lo usan la página
 * de Apariencia y la API de la app.
 */

export interface DisenoGuardado {
  template_key: string | null
  theme_overrides: unknown
  logo_url: string | null
  pages: unknown
}

/** JSON con las claves ordenadas: la base devuelve `jsonb` en otro orden. */
function estable(valor: unknown): string {
  if (Array.isArray(valor)) return `[${valor.map(estable).join(",")}]`
  if (valor && typeof valor === "object") {
    return `{${Object.keys(valor)
      .sort()
      .filter(
        (clave) => (valor as Record<string, unknown>)[clave] !== undefined
      )
      .map(
        (clave) =>
          `${JSON.stringify(clave)}:${estable((valor as Record<string, unknown>)[clave])}`
      )
      .join(",")}}`
  }
  return JSON.stringify(valor ?? null)
}

/** La huella de un diseño: dos diseños iguales tienen la misma. */
export function huellaDeDiseno(diseno: DisenoGuardado): string {
  return estable({
    plantilla: diseno.template_key ?? null,
    personalizacion: diseno.theme_overrides ?? {},
    logo: diseno.logo_url ?? null,
    paginas: diseno.pages ?? [],
  })
}
