/*
 * La marca de Venduo: la feria en el celular.
 *
 * El toldo a rayas de un puesto de feria, dentro de la pantalla de un
 * celular: el puesto de siempre, ahora en el teléfono.
 *
 * Esta es la única fuente de su geometría. De acá la dibuja `Simbolo`
 * (`components/marca/logo.tsx`) y de acá salen todos los archivos —SVG, PNG,
 * íconos y favicon— con `node scripts/marca.mjs`. Sin dependencias y sin
 * sintaxis que no sea borrable, porque el script la importa con Node.
 */

/** Los colores de la marca. Son los de `DESIGN.md` y no cambian con la plantilla. */
export const COLORES_DE_MARCA = {
  tinta: "#16171a",
  senal: "#d62d12",
  papel: "#f1f0ee",
} as const

/** La caja de dibujo de todas las piezas. */
export const CAJA = 256

/** La caja justa del celular, cuadrada: para el favicon y los usos chicos. */
export const CAJA_JUSTA = "14 18 228 228"

/** El cuerpo del celular, con la pantalla calada. */
export const CELULAR =
  "M76 24H180A24 24 0 0 1 204 48V216A24 24 0 0 1 180 240H76A24 24 0 0 1 52 216V48A24 24 0 0 1 76 24ZM76 50H180A10 10 0 0 1 190 60V204A10 10 0 0 1 180 214H76A10 10 0 0 1 66 204V60A10 10 0 0 1 76 50Z"

/**
 * Las cinco rayas del toldo, de izquierda a derecha, con su borde de ondas.
 * Las de los extremos copian la esquina redondeada de la pantalla: con una
 * esquina viva, el rojo se montaba sobre el marco.
 */
export const RAYAS = [
  {
    senal: true,
    d: "M66 60A10 10 0 0 1 76 50H90.8V100A12.4 12.4 0 0 1 66 100Z",
  },
  { senal: false, d: "M90.8 50H115.6V100A12.4 12.4 0 0 1 90.8 100Z" },
  { senal: true, d: "M115.6 50H140.4V100A12.4 12.4 0 0 1 115.6 100Z" },
  { senal: false, d: "M140.4 50H165.2V100A12.4 12.4 0 0 1 140.4 100Z" },
  {
    senal: true,
    d: "M165.2 50H180A10 10 0 0 1 190 60V100A12.4 12.4 0 0 1 165.2 100Z",
  },
] as const

/** El mostrador del puesto. */
export const MOSTRADOR = "M80 170H176V186H80Z"
