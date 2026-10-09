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
 * cada plantilla: ropa para Pasarela y Calle, cuidado personal para Esencia,
 * carteras para Atelier, calzado para Pisada, perfumes para Fórmula, de todo
 * un poco para Bazar y hogar y tecnología para la editorial.
 */

interface Ejemplo {
  nombre: string
  descripcion: string
  precio: number
  antes?: number
  categoria: string
  foto: string
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
  calle: [
    {
      nombre: "Polera Original",
      descripcion: "Estampado frontal, algodón pesado y corte amplio.",
      precio: 9000,
      categoria: "Poleras",
      foto: foto("1576566588028-4147f3842f27"),
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
      nombre: "Polera Paz",
      descripcion: "Negra, con estampa de esqueleto. Tallas de la S a la XL.",
      precio: 8500,
      categoria: "Poleras",
      foto: foto("1503341504253-dff4815485f1"),
    },
    {
      nombre: "Chamarra de cuero",
      descripcion: "Corte motero, cierres metálicos y forro interior.",
      precio: 45000,
      categoria: "Chamarras",
      foto: foto("1551028719-00167b16eac5"),
    },
    {
      nombre: "Jean recto",
      descripcion: "Denim rígido de tiro medio, en dos lavados.",
      precio: 21000,
      categoria: "Jeans",
      foto: foto("1542272604-787c3835535d"),
    },
    {
      nombre: "Gorra de visera curva",
      descripcion: "Ajuste trasero y bordado al frente.",
      precio: 5500,
      categoria: "Gorras",
      foto: foto("1588850561407-ed78c282e89b"),
    },
  ],
  atelier: [
    {
      nombre: "Cartera de mano Carmín",
      descripcion: "Cuero liso, asa rígida y correa larga desmontable.",
      precio: 42000,
      categoria: "Carteras",
      foto: foto("1584917865442-de89df76afd3"),
      destacado: true,
    },
    {
      nombre: "Cartera de mimbre",
      descripcion: "Mimbre tejido con tapa y asa de cuero.",
      precio: 35000,
      antes: 39000,
      categoria: "Carteras",
      foto: foto("1590874103328-eac38a683ce7"),
      destacado: true,
    },
    {
      nombre: "Bandolera Rosa",
      descripcion:
        "Pequeña, con cadena delgada. Entra el celular y las llaves.",
      precio: 26000,
      categoria: "Bandoleras",
      foto: foto("1566150905458-1bf1fc113f0d"),
    },
    {
      nombre: "Bolso Turquesa",
      descripcion: "Cuero graneado, dos compartimentos y cierre de broche.",
      precio: 48000,
      categoria: "Bolsos",
      foto: foto("1594223274512-ad4803739b7c"),
    },
    {
      nombre: "Bolso estampado",
      descripcion: "Estampado floral, asas firmes y correa larga desmontable.",
      precio: 30000,
      categoria: "Bolsos",
      foto: foto("1591561954557-26941169b49e"),
    },
    {
      nombre: "Billetera de cuero",
      descripcion: "Plegable, con seis ranuras para tarjetas.",
      precio: 12000,
      categoria: "Billeteras",
      foto: foto("1627123424574-724758594e93"),
    },
  ],
  pisada: [
    {
      nombre: "Urbana blanca y naranja",
      descripcion: "Cámara de aire en el talón y capellada de malla.",
      precio: 68000,
      categoria: "Urbanas",
      foto: foto("1600185365483-26d7a4cc7519"),
      destacado: true,
    },
    {
      nombre: "Urbana de cuero café",
      descripcion: "Gamuza y cuero, suela de goma cosida.",
      precio: 62000,
      antes: 70000,
      categoria: "Urbanas",
      foto: foto("1549298916-b41d501d3772"),
      destacado: true,
    },
    {
      nombre: "Plataforma pastel",
      descripcion: "Suela alta y colores suaves. Del 35 al 40.",
      precio: 54000,
      categoria: "Urbanas",
      foto: foto("1595950653106-6c9ebd614d3a"),
    },
    {
      nombre: "Running verde",
      descripcion: "Liviana, con amortiguación para correr todos los días.",
      precio: 58000,
      categoria: "Running",
      foto: foto("1606107557195-0e29a4b5b4aa"),
    },
    {
      nombre: "Deportiva tricolor",
      descripcion: "Malla transpirable y suela de goma con buen agarre.",
      precio: 39000,
      categoria: "Running",
      foto: foto("1560769629-975ec94e6a86"),
    },
    {
      nombre: "Tacón estampado",
      descripcion: "Punta fina y taco de 9 cm.",
      precio: 33000,
      categoria: "Tacones",
      foto: foto("1543163521-1bf539c55dd2"),
    },
  ],
  formula: [
    {
      nombre: "Ámbar de noche",
      descripcion: "Oriental, con vainilla y especias. Decant de 10 ml.",
      precio: 9000,
      categoria: "Orientales",
      foto: foto("1541643600914-78b084683601"),
      destacado: true,
    },
    {
      nombre: "Rosa negra",
      descripcion: "Floral intenso, para la noche. Frasco de 50 ml.",
      precio: 42000,
      antes: 48000,
      categoria: "Florales",
      foto: foto("1594035910387-fea47794261f"),
      destacado: true,
    },
    {
      nombre: "Azul profundo",
      descripcion: "Amaderado fresco, con cedro y bergamota.",
      precio: 38000,
      categoria: "Amaderados",
      foto: foto("1523293182086-7651a899d37f"),
    },
    {
      nombre: "Verde menta",
      descripcion: "Aromático y fresco, de salida cítrica.",
      precio: 36000,
      categoria: "Cítricos",
      foto: foto("1587017539504-67cfbddac569"),
    },
    {
      nombre: "Juego de decants",
      descripcion: "Cinco aromas de 5 ml para probar antes del frasco.",
      precio: 15000,
      categoria: "Decants",
      foto: foto("1615634260167-c8cdede054de"),
    },
    {
      nombre: "Flor de durazno",
      descripcion: "Floral suave, para todos los días. Frasco de 100 ml.",
      precio: 44000,
      categoria: "Florales",
      foto: foto("1592945403244-b3fbafd7f539"),
    },
  ],
  bazar: [
    {
      nombre: "Reloj minimalista",
      descripcion: "Correa de silicona y esfera blanca.",
      precio: 14000,
      categoria: "Accesorios",
      foto: foto("1523275335684-37898b6baf30"),
      destacado: true,
    },
    {
      nombre: "Lentes de sol clásicos",
      descripcion: "Marco negro y filtro UV400.",
      precio: 7500,
      antes: 9500,
      categoria: "Accesorios",
      foto: foto("1572635196237-14b3f281503f"),
      destacado: true,
    },
    {
      nombre: "Cámara instantánea",
      descripcion: "Imprime la foto al momento. Funciona perfecto.",
      precio: 52000,
      categoria: "Tecnología",
      foto: foto("1526170375885-4d8ecf77b99f"),
    },
    {
      nombre: "Botella térmica",
      descripcion: "Acero inoxidable, mantiene el frío 24 horas. 500 ml.",
      precio: 6500,
      categoria: "Hogar",
      foto: foto("1602143407151-7111542de6e8"),
    },
    {
      nombre: "Audífonos con cable",
      descripcion: "Almohadillas acolchadas y cable de 1,5 m.",
      precio: 9000,
      categoria: "Tecnología",
      foto: foto("1583394838336-acd977736f90"),
    },
    {
      nombre: "Manta de alpaca",
      descripcion: "Tejida a mano, abrigada y liviana.",
      precio: 38000,
      categoria: "Hogar",
      foto: foto("1584100936595-c0654b55a2e2"),
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
    is_active: true,
    is_featured: ejemplo.destacado ?? false,
    sku: null,
    moderated_at: null,
    moderation_reason: null,
    created_at: ahora,
    updated_at: ahora,
    deleted_at: null,
  }))
}
