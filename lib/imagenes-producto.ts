/**
 * Mapeo curado y determinista de imágenes para productos de Venduo.
 * Todas las URLs provienen de Unsplash con parámetros optimizados.
 */

const FOTOS = {
  // Calzado y Ropa
  zapatillaRetro:
    "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1200&q=85",
  zapatillaRunning:
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85",
  zapatillaBlanca:
    "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=1200&q=85",
  botinCuero:
    "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=1200&q=85",
  buzoOversize:
    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=85",
  poleraBasica:
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85",
  campera:
    "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1200&q=85",
  mochila:
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85",
  gorra:
    "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1200&q=85",
  shortDeportivo:
    "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1200&q=85",

  // Tecnología
  auriculares:
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85",
  laptop:
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=85",
  monitor:
    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=85",
  mouse:
    "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1200&q=85",
  teclado:
    "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=85",
  hubUsb:
    "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?auto=format&fit=crop&w=1200&q=85",
  cargador:
    "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=85",
  funda:
    "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1200&q=85",
  celular:
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=85",
  powerBank:
    "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=1200&q=85",

  // Café y Alimentos
  cafe: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=1200&q=85",
  molinillo:
    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=85",
  miel: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=1200&q=85",
  empanada:
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85",
  cunape:
    "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=85",
  torta:
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=85",

  // Cosmética y Cuidado Personal
  serum:
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=85",
  crema:
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=85",
  labial:
    "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1200&q=85",
  solar:
    "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=1200&q=85",

  // Hogar y Accesorios
  lampara:
    "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=85",
  maceta:
    "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1200&q=85",
  posavasos:
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85",
  manta:
    "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1200&q=85",
  chompa:
    "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=1200&q=85",
  gorroLana:
    "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=1200&q=85",
  bufanda:
    "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=1200&q=85",
}

const LISTA_FALLBACK = [
  FOTOS.mochila,
  FOTOS.zapatillaRetro,
  FOTOS.auriculares,
  FOTOS.cafe,
  FOTOS.buzoOversize,
  FOTOS.teclado,
  FOTOS.serum,
  FOTOS.posavasos,
]

/**
 * Resuelve una imagen realista de alta calidad basada en el nombre y categoría del producto.
 */
export function resolverImagenProducto(
  nombre?: string | null,
  categoria?: string | null
): string {
  const sinTildes = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")

  const n = sinTildes(nombre ?? "")
  const c = sinTildes(categoria ?? "")

  // Coincidencias específicas por nombre
  if (n.includes("zapatilla") || n.includes("tenis") || n.includes("sneaker")) {
    if (n.includes("retro") || n.includes("vintage"))
      return FOTOS.zapatillaRetro
    if (n.includes("blanca") || n.includes("urbana"))
      return FOTOS.zapatillaBlanca
    return FOTOS.zapatillaRunning
  }
  if (n.includes("botin") || n.includes("bota") || n.includes("cuero")) {
    return FOTOS.botinCuero
  }
  if (n.includes("buzo") || n.includes("hoodie") || n.includes("sudadera")) {
    return FOTOS.buzoOversize
  }
  if (n.includes("campera") || n.includes("chaqueta") || n.includes("abrigo")) {
    return FOTOS.campera
  }
  if (n.includes("polera") || n.includes("remera") || n.includes("camiseta")) {
    return FOTOS.poleraBasica
  }
  if (n.includes("short") || n.includes("bermuda")) {
    return FOTOS.shortDeportivo
  }
  if (n.includes("gorra") || n.includes("sombrero")) {
    return FOTOS.gorra
  }
  if (n.includes("mochila") || n.includes("bolso") || n.includes("morral")) {
    return FOTOS.mochila
  }
  if (
    n.includes("auricular") ||
    n.includes("audifono") ||
    n.includes("headphone")
  ) {
    return FOTOS.auriculares
  }
  if (
    n.includes("laptop") ||
    n.includes("computadora") ||
    n.includes("portatil")
  ) {
    return FOTOS.laptop
  }
  if (n.includes("monitor") || n.includes("pantalla")) {
    return FOTOS.monitor
  }
  if (n.includes("teclado")) {
    return FOTOS.teclado
  }
  if (n.includes("mouse") || n.includes("raton")) {
    return FOTOS.mouse
  }
  if (n.includes("hub") || n.includes("adaptador") || n.includes("usb")) {
    return FOTOS.hubUsb
  }
  if (n.includes("cargador") || n.includes("cable")) {
    return FOTOS.cargador
  }
  if (n.includes("funda") || n.includes("case")) {
    return FOTOS.funda
  }
  if (
    n.includes("celular") ||
    n.includes("smartphone") ||
    n.includes("telefono")
  ) {
    return FOTOS.celular
  }
  if (n.includes("power bank") || n.includes("bateria")) {
    return FOTOS.powerBank
  }
  if (n.includes("cafe") || n.includes("café") || n.includes("grano")) {
    return FOTOS.cafe
  }
  if (n.includes("molinillo") || n.includes("molino")) {
    return FOTOS.molinillo
  }
  if (n.includes("miel")) {
    return FOTOS.miel
  }
  if (n.includes("empanada") || n.includes("horneado")) {
    return FOTOS.empanada
  }
  if (n.includes("cuñape") || n.includes("cunape")) {
    return FOTOS.cunape
  }
  if (n.includes("torta") || n.includes("dulce") || n.includes("pastel")) {
    return FOTOS.torta
  }
  if (n.includes("serum") || n.includes("sérum")) {
    return FOTOS.serum
  }
  if (n.includes("crema") || n.includes("hidratante")) {
    return FOTOS.crema
  }
  if (
    n.includes("labial") ||
    n.includes("maquillaje") ||
    n.includes("lipstick")
  ) {
    return FOTOS.labial
  }
  if (n.includes("solar") || n.includes("bloqueador")) {
    return FOTOS.solar
  }
  if (n.includes("lampara") || n.includes("lámpara") || n.includes("luz")) {
    return FOTOS.lampara
  }
  if (n.includes("maceta") || n.includes("planta")) {
    return FOTOS.maceta
  }
  if (n.includes("posavasos")) {
    return FOTOS.posavasos
  }
  if (n.includes("manta") || n.includes("cobija")) {
    return FOTOS.manta
  }
  if (n.includes("chompa") || n.includes("sueter") || n.includes("sweater")) {
    return FOTOS.chompa
  }
  if (n.includes("bufanda")) {
    return FOTOS.bufanda
  }
  if (n.includes("gorro") || n.includes("lana")) {
    return FOTOS.gorroLana
  }

  // Coincidencias por categoría
  if (c.includes("ropa") || c.includes("calzado") || c.includes("moda")) {
    return FOTOS.poleraBasica
  }
  if (c.includes("tecno") || c.includes("electr")) {
    return FOTOS.auriculares
  }
  if (c.includes("cafe") || c.includes("alimento") || c.includes("comida")) {
    return FOTOS.cafe
  }
  if (c.includes("cosmet") || c.includes("belleza") || c.includes("cuidado")) {
    return FOTOS.crema
  }
  if (c.includes("hogar") || c.includes("deco")) {
    return FOTOS.lampara
  }

  // Fallback determinista por hash del nombre
  let hash = 0
  for (let i = 0; i < n.length; i++) {
    hash = (hash << 5) - hash + n.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % LISTA_FALLBACK.length
  return LISTA_FALLBACK[index]
}
