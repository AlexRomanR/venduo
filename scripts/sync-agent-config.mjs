#!/usr/bin/env node
/**
 * Copia las skills propias de `.agents/skills/` a `.claude/skills/`.
 *
 * Las dos herramientas usan el mismo formato de SKILL.md pero cada una lo busca
 * en su propio directorio, así que el archivo tiene que existir dos veces. En
 * lugar de mantener dos copias a mano —que divergen apenas alguien edita una—
 * `.agents/skills/` es la fuente y esto genera la otra.
 *
 * IMPORTANTE: este script solo administra las skills que él mismo copió, que
 * quedan anotadas en `.claude/skills/.synced.json`. Las skills de terceros
 * instaladas con `npx skills add` o `npx impeccable install` quedan intactas:
 * borrarlas en cada sincronización sería una trampa silenciosa.
 *
 * Las reglas no se copian: `.agents/rules/` las carga Antigravity sola, y
 * CLAUDE.md las trae con @-imports desde ese mismo lugar.
 *
 *   node scripts/sync-agent-config.mjs            aplica
 *   node scripts/sync-agent-config.mjs --check    solo verifica (para el CI)
 */

import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join, relative } from "node:path"

const ORIGEN = ".agents/skills"
const DESTINO = ".claude/skills"
const MANIFIESTO = join(DESTINO, ".synced.json")
const soloVerificar = process.argv.includes("--check")

/**
 * Las skills escritas por el equipo.
 *
 * Es una lista explícita y no "todo lo que haya en .agents/skills/" porque los
 * instaladores de terceros (`npx skills add`, `npx impeccable install`) dejan
 * las suyas en ese mismo directorio y las enlazan a `.claude/skills/` por su
 * cuenta. Copiarlas encima rompería sus enlaces.
 *
 * Al agregar una skill propia, sumar su nombre acá.
 */
const SKILLS_PROPIAS = [
  "ai-task-workflow",
  "database-migration",
  "implement-feature",
  "pedidos-por-whatsapp",
  "qa-verification",
  "visual-block-editor",
]

/** Lista recursiva de archivos, con su ruta relativa a `base`. */
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

/** Las skills propias que realmente existen en disco. */
async function listarSkillsPropias() {
  const entradas = await readdir(ORIGEN, { withFileTypes: true })
  const presentes = entradas.filter((e) => e.isDirectory()).map((e) => e.name)

  const faltantes = SKILLS_PROPIAS.filter((s) => !presentes.includes(s))
  if (faltantes.length > 0) {
    console.error(
      `Declaradas pero ausentes en ${ORIGEN}: ${faltantes.join(", ")}`
    )
    process.exit(1)
  }

  const sinDeclarar = presentes.filter((s) => !SKILLS_PROPIAS.includes(s))
  if (sinDeclarar.length > 0 && !soloVerificar) {
    console.log(`Skills de terceros, sin tocar: ${sinDeclarar.join(", ")}\n`)
  }

  return [...SKILLS_PROPIAS].sort()
}

/** Lo que esta herramienta copió la última vez. */
async function leerManifiesto() {
  if (!existsSync(MANIFIESTO)) return []
  try {
    const { managed } = JSON.parse(await readFile(MANIFIESTO, "utf8"))
    return Array.isArray(managed) ? managed : []
  } catch {
    return []
  }
}

/** Skills que hay en el destino y no administra este script. */
async function listarSkillsExternas(propias) {
  if (!existsSync(DESTINO)) return []
  const entradas = await readdir(DESTINO, { withFileTypes: true })
  return entradas
    .filter((e) => e.isDirectory() && !propias.includes(e.name))
    .map((e) => e.name)
    .sort()
}

async function verificar(propias) {
  const problemas = []

  for (const skill of propias) {
    const enOrigen = await listarArchivos(join(ORIGEN, skill))
    const enDestino = await listarArchivos(join(DESTINO, skill))

    for (const archivo of enOrigen) {
      if (!enDestino.includes(archivo)) {
        problemas.push(`falta: ${skill}/${archivo}`)
        continue
      }
      const [a, b] = await Promise.all([
        readFile(join(ORIGEN, skill, archivo), "utf8"),
        readFile(join(DESTINO, skill, archivo), "utf8"),
      ])
      if (a !== b) problemas.push(`difiere: ${skill}/${archivo}`)
    }

    for (const archivo of enDestino) {
      if (!enOrigen.includes(archivo)) {
        problemas.push(`sobra: ${skill}/${archivo}`)
      }
    }
  }

  // Una skill que se borró del origen pero sigue copiada en el destino.
  for (const huerfana of await leerManifiesto()) {
    if (!propias.includes(huerfana) && existsSync(join(DESTINO, huerfana))) {
      problemas.push(`quedó copiada tras borrarse del origen: ${huerfana}`)
    }
  }

  if (problemas.length > 0) {
    console.error("Las skills propias están desincronizadas:\n")
    for (const p of problemas) console.error(`  ${p}`)
    console.error("\nCorré: npm run sync:agents")
    process.exit(1)
  }

  console.log(`Sincronizado: ${propias.length} skills propias.`)
}

async function sincronizar(propias) {
  // Se borra solo lo que este script copió antes, para no llevarse puestas las
  // skills de terceros que vivan en el mismo directorio.
  for (const skill of await leerManifiesto()) {
    await rm(join(DESTINO, skill), { recursive: true, force: true })
  }

  await mkdir(DESTINO, { recursive: true })

  for (const skill of propias) {
    await rm(join(DESTINO, skill), { recursive: true, force: true })
    await cp(join(ORIGEN, skill), join(DESTINO, skill), { recursive: true })
    console.log(`  ${skill}`)
  }

  await writeFile(
    MANIFIESTO,
    JSON.stringify(
      {
        comentario:
          "Generado por scripts/sync-agent-config.mjs. No editar. Lista las skills que el script administra; lo que no está acá no se toca.",
        managed: propias,
      },
      null,
      2
    ) + "\n"
  )

  console.log(`\n${propias.length} skills propias sincronizadas.`)

  const externas = await listarSkillsExternas(propias)
  if (externas.length > 0) {
    console.log(`\nSkills de terceros, intactas: ${externas.join(", ")}`)
  }
}

async function main() {
  if (!existsSync(ORIGEN)) {
    console.error(`No existe ${ORIGEN}. Nada que sincronizar.`)
    process.exit(1)
  }

  const propias = await listarSkillsPropias()

  if (soloVerificar) {
    await verificar(propias)
  } else {
    console.log(`${ORIGEN} -> ${DESTINO}`)
    await sincronizar(propias)
  }
}

await main()
