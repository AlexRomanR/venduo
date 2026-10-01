import {
  hojasDe,
  type Contexto,
  type DatosDelCatalogo,
  type Hoja,
} from "@/lib/catalogos/datos"
import { resolverEstilo } from "@/lib/catalogos/estilo"
import { HOJAS } from "@/lib/catalogos/constantes"
import type { Catalogo } from "@/lib/catalogos/modelo"
import type { Primitivas } from "@/components/catalogos/primitivas"
import { CONTRAPORTADAS } from "@/components/catalogos/variantes/contraportada"
import { OFERTAS } from "@/components/catalogos/variantes/oferta"
import { PACKS } from "@/components/catalogos/variantes/pack"
import { PORTADAS } from "@/components/catalogos/variantes/portada"
import { PRODUCTOS } from "@/components/catalogos/variantes/productos"
import { SEPARADORES } from "@/components/catalogos/variantes/separador"
import { TEXTOS } from "@/components/catalogos/variantes/texto"

/*
 * Un catálogo dibujado, hoja por hoja.
 *
 * Es lo único que conoce todas las variantes. La vista previa del editor y el
 * PDF del servidor llaman a lo mismo con otras piezas, y por eso lo que se ve
 * al editar es lo que sale en el archivo.
 */

export interface HojaConContexto {
  hoja: Hoja
  ctx: Contexto
}

/** Las hojas del catálogo, cada una con lo que necesita para dibujarse. */
export function hojasConContexto(
  catalogo: Catalogo,
  datos: DatosDelCatalogo
): HojaConContexto[] {
  const estilo = resolverEstilo(catalogo.estilo)
  const { ancho, alto } = HOJAS[catalogo.hoja]
  const hojas = hojasDe(catalogo, datos)

  return hojas.map((hoja, indice) => ({
    hoja,
    ctx: {
      catalogo,
      datos,
      estilo,
      hoja: { ancho, alto },
      numero: indice + 1,
      total: hojas.length,
    },
  }))
}

export function DibujoDeHoja({
  P,
  hoja,
  ctx,
}: {
  P: Primitivas
} & HojaConContexto) {
  if (hoja.clase === "productos") {
    const Variante = PRODUCTOS[hoja.bloque.variante]
    return <Variante P={P} ctx={ctx} hoja={hoja} />
  }
  if (hoja.clase === "pack") {
    const Variante = PACKS[hoja.bloque.variante]
    return <Variante P={P} ctx={ctx} hoja={hoja} />
  }

  const { bloque } = hoja
  switch (bloque.tipo) {
    case "portada": {
      const Variante = PORTADAS[bloque.variante]
      return <Variante P={P} ctx={ctx} bloque={bloque} />
    }
    case "separador": {
      const Variante = SEPARADORES[bloque.variante]
      return <Variante P={P} ctx={ctx} bloque={bloque} />
    }
    case "oferta": {
      const Variante = OFERTAS[bloque.variante]
      return <Variante P={P} ctx={ctx} bloque={bloque} />
    }
    case "contraportada": {
      const Variante = CONTRAPORTADAS[bloque.variante]
      return <Variante P={P} ctx={ctx} bloque={bloque} />
    }
    case "texto": {
      const Variante = TEXTOS[bloque.variante]
      return <Variante P={P} ctx={ctx} bloque={bloque} />
    }
  }
}

/** Todas las hojas, en orden: lo que va dentro del `<Document>` del PDF. */
export function HojasDelCatalogo({
  P,
  catalogo,
  datos,
}: {
  P: Primitivas
  catalogo: Catalogo
  datos: DatosDelCatalogo
}) {
  return (
    <>
      {hojasConContexto(catalogo, datos).map(({ hoja, ctx }) => (
        <DibujoDeHoja key={ctx.numero} P={P} hoja={hoja} ctx={ctx} />
      ))}
    </>
  )
}
