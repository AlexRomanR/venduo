import type { ClavePlantilla } from "@/lib/plantillas"
import type { Product } from "@/types"

/**
 * Productos de ejemplo para la vista previa del editor.
 *
 * Una tienda recién creada no tiene catálogo, y sin productos el catálogo, la
 * ficha y el carrito se ven vacíos: la persona no puede juzgar si le gustan la
 * foto cuadrada o las cuatro columnas. Estos llenan esas pantallas **solo en
 * la vista previa**, con un aviso de que son de ejemplo. Nunca se guardan ni
 * llegan a la tienda.
 *
 * Las fotos son de los datos de demostración, ya verificadas, del rubro de
 * cada plantilla: ropa para Pasarela, cuidado personal para Esencia y hogar y
 * tecnología para la editorial.
 */

interface Ejemplo {
  nombre: string
  descripcion: string
  precio: number
  antes?: number
  categoria: string
  foto: string
  condicion?: Product["condition"]
  destacado?: boolean
}

const foto = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=85`

const EJEMPLOS: Record<ClavePlantilla, Ejemplo[]> = {
  fashion: [
    {
      nombre: "Polera básica",
      descripcion: "Algodón peinado, corte recto. Va con todo.",
      precio: 6500,
      categoria: "Poleras",
      foto: foto("1521572163474-6864f9cf17ab"),
      destacado: true,
    },
    {
      nombre: "Buzo oversize",
      descripcion: "Frisa suave por dentro, capucha y bolsillo canguro.",
      precio: 18000,
      antes: 22000,
      categoria: "Buzos",
      foto: foto("1556905055-8f358a7a47b2"),
      destacado: true,
    },
    {
      nombre: "Campera rompeviento",
      descripcion: "Liviana, repele el agua y se guarda en su propio bolsillo.",
      precio: 32000,
      categoria: "Camperas",
      foto: foto("1548883354-7622d03aca27"),
    },
    {
      nombre: "Zapatilla running",
      descripcion: "Amortiguación para correr todos los días.",
      precio: 52000,
      categoria: "Zapatillas",
      foto: foto("1542291026-7eec264c27ff"),
    },
    {
      nombre: "Mochila urbana",
      descripcion: "Compartimento para laptop y bolsillos por todos lados.",
      precio: 24000,
      categoria: "Mochilas",
      foto: foto("1553062407-98eeb64c6a62"),
      condicion: "segunda_mano",
    },
    {
      nombre: "Gorra deportiva",
      descripcion: "Visera curva y ajuste trasero.",
      precio: 5500,
      categoria: "Gorras",
      foto: foto("1588850561407-ed78c282e89b"),
    },
  ],
  perfume: [
    {
      nombre: "Crema hidratante",
      descripcion: "Hidratación profunda para todo el día. 50 ml.",
      precio: 9500,
      categoria: "Rostro",
      foto: foto("1556228720-195a672e8a03"),
      destacado: true,
    },
    {
      nombre: "Sérum de vitamina C",
      descripcion: "Ilumina y unifica el tono. Frasco con gotero de 30 ml.",
      precio: 14000,
      antes: 16500,
      categoria: "Rostro",
      foto: foto("1620916566398-39f1143ab7be"),
      destacado: true,
    },
    {
      nombre: "Labial mate",
      descripcion: "Larga duración y acabado aterciopelado.",
      precio: 4500,
      categoria: "Maquillaje",
      foto: foto("1586495777744-4413f21062fa"),
    },
    {
      nombre: "Protector solar FPS 50",
      descripcion: "Textura ligera que no deja rastro blanco. 60 ml.",
      precio: 11000,
      categoria: "Rostro",
      foto: foto("1598440947619-2c35fc9aa908"),
    },
  ],
  clasica: [
    {
      nombre: "Manta de alpaca",
      descripcion: "Tejida a mano, abrigada y liviana.",
      precio: 38000,
      categoria: "Hogar",
      foto: foto("1584100936595-c0654b55a2e2"),
      destacado: true,
    },
    {
      nombre: "Lámpara de mesa",
      descripcion: "Luz cálida para leer o trabajar.",
      precio: 29000,
      antes: 34000,
      categoria: "Hogar",
      foto: foto("1507473885765-e6ed057f782c"),
    },
    {
      nombre: "Audífonos inalámbricos",
      descripcion: "Hasta 20 horas de batería y estuche de carga.",
      precio: 22000,
      categoria: "Tecnología",
      foto: foto("1505740420928-5e560c06d30e"),
      destacado: true,
    },
    {
      nombre: "Maceta de cerámica",
      descripcion: "Esmaltada a mano, con plato.",
      precio: 7500,
      categoria: "Hogar",
      foto: foto("1485955900006-10f4d324d411"),
    },
    {
      nombre: "Power bank 20000 mAh",
      descripcion: "Carga dos celulares a la vez.",
      precio: 26000,
      categoria: "Tecnología",
      foto: foto("1609091839311-d5365f9ff1c5"),
      condicion: "reacondicionado",
    },
    {
      nombre: "Teclado mecánico",
      descripcion: "Teclas silenciosas y luz regulable.",
      precio: 32000,
      categoria: "Tecnología",
      foto: foto("1587829741301-dc798b83add3"),
    },
  ],
}

/** Los productos de ejemplo de una plantilla, con la forma de uno real. */
export function productosDeEjemplo(
  plantilla: ClavePlantilla,
  tiendaId: string
): Product[] {
  const ahora = new Date().toISOString()

  return EJEMPLOS[plantilla].map((ejemplo, indice) => ({
    id: `ejemplo-${indice + 1}`,
    store_id: tiendaId,
    name: ejemplo.nombre,
    description: ejemplo.descripcion,
    price_cents: ejemplo.precio,
    compare_at_price_cents: ejemplo.antes ?? null,
    stock: 10,
    low_stock_threshold: 3,
    images: [ejemplo.foto],
    image_url: ejemplo.foto,
    category: ejemplo.categoria,
    category_id: `ejemplo-${ejemplo.categoria}`,
    condition: ejemplo.condicion ?? "nuevo",
    condition_note: null,
    is_active: true,
    is_featured: ejemplo.destacado ?? false,
    sku: null,
    created_at: ahora,
    updated_at: ahora,
    deleted_at: null,
  }))
}
