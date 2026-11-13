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
 * un poco para Bazar y hogar y tecnología para la editorial. Quilate y
 * Probador traen además una segunda foto —la joya puesta— y sus tallas, que
 * son parte de cómo se ven sus tarjetas.
 */

interface Ejemplo {
  nombre: string
  descripcion: string
  precio: number
  antes?: number
  categoria: string
  foto: string
  /** Las otras fotos, después de la principal: la pieza puesta, la espalda. */
  fotos?: string[]
  /** Las opciones con sus valores, como las guarda un producto. */
  opciones?: { nombre: string; valores: string[] }[]
  destacado?: boolean
}

const TALLAS = [{ nombre: "Talla", valores: ["XS", "S", "M", "L", "XL"] }]

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
  quilate: [
    {
      nombre: "Argollas de plata 925",
      descripcion:
        "Argollas medianas con cierre a presión. Livianas para todo el día.",
      precio: 12000,
      categoria: "Aretes",
      foto: foto("1677913842001-3941986ca979"),
      fotos: [foto("1560577938-a5ed9b19fe12")],
      destacado: true,
    },
    {
      nombre: "Collar de perlas",
      descripcion: "Perlas de cultivo en hilo doble, con broche de plata.",
      precio: 15000,
      categoria: "Collares",
      foto: foto("1595345705177-ffe090eb0784"),
      fotos: [foto("1772785951048-50c2bbaee710")],
    },
    {
      nombre: "Anillo solitario de acero",
      descripcion:
        "Una piedra de circón en garras. No se oscurece con el agua.",
      precio: 8500,
      categoria: "Anillos",
      foto: foto("1559006864-38a01f201f95"),
      fotos: [foto("1762342672674-bc14e52572f4")],
    },
    {
      nombre: "Pulsera de eslabones bañada en oro",
      descripcion:
        "Eslabones gruesos con cierre de mosquetón. Largo regulable.",
      precio: 14000,
      antes: 17000,
      categoria: "Pulseras",
      foto: foto("1602173574767-37ac01994b2a"),
      fotos: [foto("1633810542706-90e5ff7557be")],
    },
    {
      nombre: "Aretes colgantes de cristal",
      descripcion:
        "Cristal tallado que cambia de color con la luz, en gancho de plata.",
      precio: 9500,
      categoria: "Aretes",
      foto: foto("1671513577548-20ec8027d6e1"),
      fotos: [foto("1611653842967-39eb011b2ca3")],
    },
    {
      nombre: "Reloj de malla dorado",
      descripcion:
        "Esfera limpia y malla tejida que se ajusta sin herramientas.",
      precio: 26000,
      categoria: "Relojes",
      foto: foto("1760532466984-39c3eb7f1254"),
      destacado: true,
    },
  ],
  probador: [
    {
      nombre: "Vestido midi cruzado",
      descripcion: "Satén con caída, cruzado al frente y cintura marcada.",
      precio: 24000,
      categoria: "Para salir",
      foto: foto("1704775990154-b87562565d4c"),
      opciones: TALLAS,
    },
    {
      nombre: "Blusa de lino",
      descripcion:
        "Lino liviano, sin mangas y con escote en V. Fresca para el día.",
      precio: 13500,
      categoria: "Para el día",
      foto: foto("1774005906344-57048d3f5856"),
      opciones: TALLAS,
    },
    {
      nombre: "Blazer de sastre",
      descripcion:
        "Corte recto con hombreras suaves. Va con pantalón o con vestido.",
      precio: 32000,
      categoria: "Para la oficina",
      foto: foto("1774205884993-86c63afbe871"),
      opciones: TALLAS,
      destacado: true,
    },
    {
      nombre: "Pantalón palazzo",
      descripcion: "Tiro alto, pierna ancha y pinzas al frente.",
      precio: 19000,
      antes: 23000,
      categoria: "Para la oficina",
      foto: foto("1767631338127-8cd80ee2f9df"),
      opciones: TALLAS,
    },
    {
      nombre: "Blusa de broderie con vuelos",
      descripcion: "Algodón calado, vuelos en el pecho y puños fruncidos.",
      precio: 11500,
      categoria: "Para el día",
      foto: foto("1738651875566-859920488d0d"),
      opciones: TALLAS,
    },
    {
      nombre: "Vestido de satén",
      descripcion: "Tiras finas y escote drapeado. Largo hasta la rodilla.",
      precio: 28000,
      categoria: "Para salir",
      foto: foto("1750064161409-5cc34e5f7367"),
      opciones: TALLAS,
      destacado: true,
    },
  ],
  ambar: [
    {
      nombre: "Oud Nocturno 100 ml",
      descripcion: "Oud, cuero y ámbar.\nAmaderado y profundo, para la noche.",
      precio: 42000,
      categoria: "Amaderados",
      foto: foto("1640869116016-93c00ba94b28"),
      destacado: true,
    },
    {
      nombre: "Decant Oud Nocturno 10 ml",
      descripcion:
        "Oud, cuero y ámbar.\nEl mismo perfume, para probarlo antes del frasco.",
      precio: 6000,
      categoria: "Amaderados",
      foto: foto("1646149757906-e6e9e9a7c77f"),
    },
    {
      nombre: "Rosa de Damasco 100 ml",
      descripcion: "Rosa, azafrán y almizcle.\nFloral y cálido.",
      precio: 36000,
      antes: 42000,
      categoria: "Florales",
      foto: foto("1705936119725-f893c63ce939"),
    },
    {
      nombre: "Vainilla y Ámbar 80 ml",
      descripcion: "Vainilla, ámbar y tonka.\nDulce y envolvente.",
      precio: 34000,
      categoria: "Dulces",
      foto: foto("1638295916768-459f6cf440bc"),
      destacado: true,
    },
    {
      nombre: "Almizcle Blanco 50 ml",
      descripcion: "Almizcle, jazmín y algodón.\nLimpio y suave, para el día.",
      precio: 26000,
      categoria: "Frescos",
      foto: foto("1594125311687-3b1b3eafa9f4"),
    },
    {
      nombre: "Decant Vainilla y Ámbar 5 ml",
      descripcion:
        "Vainilla, ámbar y tonka.\nUn decant para llevar en la cartera.",
      precio: 3500,
      categoria: "Dulces",
      foto: foto("1738414808975-201966230c59"),
    },
  ],
  correa: [
    {
      nombre: "Cartera de mano Rosa",
      descripcion:
        "Cuero sintético con cadena desmontable. Entra el celular y las llaves.",
      precio: 18000,
      categoria: "De mano",
      foto: foto("1566150905458-1bf1fc113f0d"),
      opciones: [{ nombre: "Color", valores: ["Rosado", "Blanco", "Negro"] }],
      destacado: true,
    },
    {
      nombre: "Bandolera Cognac",
      descripcion: "Tapa con imán y correa regulable. Para todos los días.",
      precio: 14500,
      categoria: "Cruzadas",
      foto: foto("1600857062241-98e5dba7f214"),
      opciones: [{ nombre: "Color", valores: ["Café", "Negro", "Beige"] }],
    },
    {
      nombre: "Tote trenzado Miel",
      descripcion:
        "Cuero trenzado a mano, con asa de cadena. Entra una laptop chica.",
      precio: 16000,
      antes: 19000,
      categoria: "Grandes",
      foto: foto("1598532163257-ae3c6b2524b6"),
      opciones: [{ nombre: "Color", valores: ["Café", "Negro"] }],
    },
    {
      nombre: "Satchel Gris",
      descripcion: "Dos hebillas y asa arriba. Se lleva a la mano o cruzado.",
      precio: 29000,
      categoria: "Mochilas",
      foto: foto("1605733513597-a8f8341084e6"),
      opciones: [
        {
          nombre: "Color",
          valores: ["Gris", "Café", "Azul", "Verde", "Negro"],
        },
      ],
      destacado: true,
    },
    {
      nombre: "Cartera de fiesta Blanca",
      descripcion: "Rígida, con asa corta. Para salir de noche.",
      precio: 13000,
      categoria: "De fiesta",
      foto: foto("1682745230951-8a5aa9a474a0"),
      opciones: [{ nombre: "Color", valores: ["Blanco", "Negro"] }],
    },
    {
      nombre: "Bolso Turquesa",
      descripcion: "Cuero con broche dorado y bolsillo interno.",
      precio: 21000,
      categoria: "De mano",
      foto: foto("1594223274512-ad4803739b7c"),
      opciones: [{ nombre: "Color", valores: ["Celeste", "Verde"] }],
    },
  ],
  taco: [
    {
      nombre: "Sandalia de tiras charol",
      descripcion: "Tiras finas en charol negro y taco aguja de 9 cm.",
      precio: 26000,
      categoria: "Taco alto",
      foto: foto("1789110519471-74ac17dd1cf6"),
      opciones: [{ nombre: "Número", valores: ["35", "36", "37", "38", "39"] }],
      destacado: true,
    },
    {
      nombre: "Stiletto plateado",
      descripcion: "Brillo plateado, punta fina y taco de 10 cm.",
      precio: 32000,
      categoria: "Taco alto",
      foto: foto("1632761298177-51e35403e27e"),
      opciones: [{ nombre: "Número", valores: ["35", "36", "37", "38"] }],
    },
    {
      nombre: "Mule de gamuza negro",
      descripcion: "Gamuza suave y taco cuadrado bajo. Se pone sin manos.",
      precio: 21000,
      antes: 25000,
      categoria: "Taco bajo",
      foto: foto("1789110519446-77822570546e"),
      opciones: [{ nombre: "Número", valores: ["36", "37", "38", "39", "40"] }],
    },
    {
      nombre: "Botín de gamuza camel",
      descripcion: "Cierre lateral y suela de goma. Para todo el invierno.",
      precio: 38000,
      categoria: "Botines",
      foto: foto("1605733160314-4fc7dac4bb16"),
      opciones: [
        { nombre: "Número", valores: ["35", "36", "37", "38", "39", "40"] },
      ],
      destacado: true,
    },
    {
      nombre: "Mocasín dorado",
      descripcion: "Cuero metalizado con hebilla. Plano y cómodo.",
      precio: 17000,
      categoria: "Planos",
      foto: foto("1678784973559-43fb10550343"),
      opciones: [{ nombre: "Número", valores: ["35", "36", "37", "38"] }],
    },
    {
      nombre: "Sandalia plataforma vino",
      descripcion: "Tiras cruzadas y plataforma de 5 cm, liviana.",
      precio: 24000,
      categoria: "Plataformas",
      foto: foto("1562273138-f46be4ebdf33"),
      opciones: [{ nombre: "Número", valores: ["36", "37", "38", "39"] }],
    },
  ],
  tocador: [
    {
      nombre: "Gel limpiador facial",
      descripcion: "Limpia sin resecar. Para la mañana y la noche.",
      precio: 8500,
      categoria: "Limpiar",
      foto: foto("1748639320154-6ba118bccc74"),
    },
    {
      nombre: "Crema hidratante en gel",
      descripcion: "Textura liviana que se absorbe rápido.",
      precio: 11000,
      categoria: "Hidratar",
      foto: foto("1556228720-195a672e8a03"),
      destacado: true,
    },
    {
      nombre: "Protector solar FPS 50",
      descripcion: "Toque seco, sin brillo. Todos los días, también nublado.",
      precio: 13000,
      antes: 15500,
      categoria: "Proteger",
      foto: foto("1598440947619-2c35fc9aa908"),
      destacado: true,
    },
    {
      nombre: "Base líquida de larga duración",
      descripcion: "Cobertura media y acabado natural.",
      precio: 15000,
      categoria: "Maquillar",
      foto: foto("1623143445418-40c192fa3d11"),
      opciones: [
        {
          nombre: "Tono",
          valores: ["Marfil", "Arena", "Miel", "Canela", "Cacao"],
        },
      ],
    },
    {
      nombre: "Polvo compacto",
      descripcion: "Sella la base y quita el brillo.",
      precio: 9500,
      categoria: "Maquillar",
      foto: foto("1515688594390-b649af70d282"),
      opciones: [{ nombre: "Tono", valores: ["Claro", "Medio", "Oscuro"] }],
    },
    {
      nombre: "Labial mate",
      descripcion: "Color intenso que dura todo el día.",
      precio: 6500,
      categoria: "Maquillar",
      foto: foto("1586495777744-4413f21062fa"),
      opciones: [
        { nombre: "Color", valores: ["Rojo", "Rosado", "Café", "Morado"] },
      ],
    },
  ],
  crayon: [
    {
      nombre: "Body de algodón manga corta",
      descripcion:
        "Algodón suave con broches abajo para cambiar el pañal fácil.",
      precio: 5500,
      categoria: "0 a 12 meses",
      foto: foto("1622290319146-7b63df48a635"),
      opciones: [{ nombre: "Talla", valores: ["3 m", "6 m", "9 m", "12 m"] }],
    },
    {
      nombre: "Enterito de punto gris",
      descripcion: "Tejido de punto abrigado, con botones al frente.",
      precio: 11000,
      categoria: "0 a 12 meses",
      foto: foto("1617331140180-e8262094733a"),
      opciones: [{ nombre: "Talla", valores: ["6 m", "9 m", "12 m"] }],
      destacado: true,
    },
    {
      nombre: "Vestido de lunares",
      descripcion: "Algodón estampado, con vuelo y bolsillos.",
      precio: 9500,
      antes: 11500,
      categoria: "1 a 3 años",
      foto: foto("1560506840-ec148e82a604"),
      opciones: [{ nombre: "Talla", valores: ["1", "2", "3"] }],
      destacado: true,
    },
    {
      nombre: "Polera básica blanca",
      descripcion: "Algodón peinado, cuello redondo. Va con todo.",
      precio: 4500,
      categoria: "1 a 3 años",
      foto: foto("1622290291468-a28f7a7dc6a8"),
      opciones: [{ nombre: "Talla", valores: ["1", "2", "3"] }],
    },
    {
      nombre: "Pijama rosado",
      descripcion: "Dos piezas de algodón, suave para dormir.",
      precio: 8500,
      categoria: "4 a 8 años",
      foto: foto("1771419912747-df33d91c329d"),
      opciones: [{ nombre: "Talla", valores: ["4", "6", "8"] }],
    },
    {
      nombre: "Bodies de colores, pack de 3",
      descripcion: "Tres bodies de algodón en colores lisos.",
      precio: 12000,
      categoria: "0 a 12 meses",
      foto: foto("1766918780914-5df4a5a98c44"),
      opciones: [{ nombre: "Talla", valores: ["3 m", "6 m", "9 m"] }],
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
    images: [ejemplo.foto, ...(ejemplo.fotos ?? [])],
    image_url: ejemplo.foto,
    category: ejemplo.categoria,
    category_id: `ejemplo-${ejemplo.categoria}`,
    is_active: true,
    is_featured: ejemplo.destacado ?? false,
    sku: null,
    moderated_at: null,
    opciones: ejemplo.opciones ?? [],
    moderation_reason: null,
    created_at: ahora,
    updated_at: ahora,
    deleted_at: null,
  }))
}
