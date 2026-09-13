#!/usr/bin/env node
/**
 * Prepara el entorno local: crea .env.local a partir de .env.example
 * y muestra qué falta configurar. Se ejecuta con `npm run setup`.
 */
import { copyFileSync, existsSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const example = join(root, ".env.example")
const local = join(root, ".env.local")

if (!existsSync(local)) {
  copyFileSync(example, local)
  console.log("✓ .env.local creado a partir de .env.example")
} else {
  console.log("· .env.local ya existía, no lo toco")
}

const content = readFileSync(local, "utf8")
const value = (key) =>
  content.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim() ?? ""

const checks = [
  ["Supabase", Boolean(value("NEXT_PUBLIC_SUPABASE_URL"))],
  ["IA", value("AI_PROVIDER") === "mock" || Boolean(value("AI_API_KEY"))],
]

console.log("")
for (const [name, ok] of checks) {
  console.log(`${ok ? "✓" : "○"} ${name}${ok ? "" : " — sin configurar"}`)
}

console.log("\nListo. Arrancá con:  npm run dev")
