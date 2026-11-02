/**
 * Los productos de muestra de la portada: los de Rosa Deportes, la tienda de
 * ejemplo. Sus precios y su stock son ilustrativos, y la portada lo dice al pie.
 *
 * Las fotos son de Pexels (licencia libre), recortadas sin fondo:
 * zapatillas 31688982, labial 14444882, audífonos 7772547, perfume 36955843,
 * cartera 9327156 y chamarra 16428589.
 */

export interface Producto {
  clave: string
  rubro: string
  nombre: string
  precio: string
  quedan: number
  foto: string
  ancho: number
  alto: number
}

export const PRODUCTOS: Producto[] = [
  {
    clave: "chamarra",
    rubro: "Ropa",
    nombre: "Chamarra de jean",
    precio: "Bs 280",
    quedan: 4,
    foto: "/portada/chamarra.webp",
    ancho: 1064,
    alto: 1213,
  },
  {
    clave: "zapatillas",
    rubro: "Zapatillas",
    nombre: "Zapatillas rojas",
    precio: "Bs 450",
    quedan: 3,
    foto: "/portada/zapatillas.webp",
    ancho: 1320,
    alto: 1140,
  },
  {
    clave: "perfume",
    rubro: "Perfumes",
    nombre: "Perfume Energy",
    precio: "Bs 320",
    quedan: 6,
    foto: "/portada/perfume.webp",
    ancho: 808,
    alto: 1400,
  },
  {
    clave: "labial",
    rubro: "Maquillaje",
    nombre: "Labial dorado",
    precio: "Bs 95",
    quedan: 12,
    foto: "/portada/labial.webp",
    ancho: 1004,
    alto: 959,
  },
  {
    clave: "audifonos",
    rubro: "Tecnología",
    nombre: "Audífonos",
    precio: "Bs 390",
    quedan: 2,
    foto: "/portada/audifonos.webp",
    ancho: 1183,
    alto: 697,
  },
  {
    clave: "cartera",
    rubro: "Accesorios",
    nombre: "Cartera y mocasines",
    precio: "Bs 520",
    quedan: 1,
    foto: "/portada/cartera.webp",
    ancho: 1400,
    alto: 1008,
  },
]

export const producto = (clave: string) =>
  PRODUCTOS.find((p) => p.clave === clave)!
