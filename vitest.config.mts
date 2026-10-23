import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// El servidor corre en UTC: los tests también, para que una fecha no cambie de
// día según la máquina donde corren.
process.env.TZ = "UTC"

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
  },
})
