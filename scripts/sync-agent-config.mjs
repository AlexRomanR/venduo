#!/usr/bin/env node
/**
 * Copia las skills de `.agents/skills/` a `.claude/skills/`.
 *
 * Las dos herramientas usan el mismo formato de SKILL.md pero cada una lo busca
 * en su propio directorio, así que el archivo tiene que existir dos veces. En
 * lugar de mantener dos copias a mano —que divergen apenas alguien edita una—
 * `.agents/skills/` es la fuente y esto genera la otra.
 *
 * Las reglas no se copian: `.agents/rules/` las carga Antigravity sola, y
 * CLAUDE.md las trae con @-imports desde ese mismo lugar.
 *
 *   node scripts/sync-agent-config.mjs           aplica
 *   node scripts/sync-agent-config.mjs --check    solo verifica (para el CI)
 */

import { cp, mkdir, readdir, readFile, rm } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join, relative } from "node:path"

const ORIGEN = ".agents/skills"
const DESTINO = ".claude/skills"
const soloVerificar = process.argv.includes("--check")

/** Lista recursiva de archivos, con su ruta relativa a `raiz`. */
async function listarArchivos(raiz, base = raiz) {
  if (!existsSync(raiz)) return []

  const entradas = await readdir(raiz, { withFileTypes: true })
  const archivos = []

  for (const entrada of entradas) {
    const ruta = join(raiz, entrada.name)
    if (entrada.isDirectory()) {
      archivos.push(...(await listarArchivos(ruta, base)))
    } else {
      archivos.push(relative(base, ruta).replaceAll("\\", "/"))
    }
  }

  return archivos.sort()
}

async function main() {
  if (!existsSync(ORIGEN)) {
    console.error(`No existe ${ORIGEN}. Nada que sincronizar.`)
    process.exit(1)
  }

  const enOrigen = await listarArchivos(ORIGEN)

  if (soloVerificar) {
    const enDestino = await listarArchivos(DESTINO)
    const desincronizados = []

    for (const archivo of enOrigen) {
      if (!enDestino.includes(archivo)) {
        desincronizados.push(`falta en ${DESTINO}: ${archivo}`)
        continue
      }
      const [a, b] = await Promise.all([
        readFile(join(ORIGEN, archivo), "utf8"),
        readFile(join(DESTINO, archivo), "utf8"),
      ])
      if (a !== b) desincronizados.push(`difiere: ${archivo}`)
    }

    for (const archivo of enDestino) {
      if (!enOrigen.includes(archivo)) {
        desincronizados.push(`sobra en ${DESTINO}: ${archivo}`)
      }
    }

    if (desincronizados.length > 0) {
      console.error("Las skills están desincronizadas:\n")
      for (const d of desincronizados) console.error(`  ${d}`)
      console.error("\nCorré: npm run sync:agents")
      process.exit(1)
    }

    console.log(`Sincronizado: ${enOrigen.length} archivos.`)
    return
  }

  // Se borra el destino para que un archivo eliminado en el origen también
  // desaparezca acá; si no, quedan skills fantasma que la herramienta sigue
  // cargando.
  await rm(DESTINO, { recursive: true, force: true })
  await mkdir(DESTINO, { recursive: true })
  await cp(ORIGEN, DESTINO, { recursive: true })

  console.log(`${ORIGEN} -> ${DESTINO}`)
  for (const archivo of enOrigen) console.log(`  ${archivo}`)
  console.log(`\n${enOrigen.length} archivos sincronizados.`)
}

await main()
