---
description: Verificación completa antes de commitear
---

Verificá que el proyecto esté listo para commitear:

1. Corré `npm run check`. Si el formato falla, arreglalo con `npm run format` y volvé a
   correr. Si fallan tipos o lint, arreglá la causa: no silencies el error con `any` ni
   con un `eslint-disable`.
2. Corré `npm run build` con `AI_PROVIDER=mock`, que es como corre el CI.
3. Si tocaste skills, corré `npm run sync:agents:check`.
4. Mostrame `git status` y revisá que no haya quedado preparado nada que no debería:
   `.env.local`, claves, volcados de base, archivos de otra persona.

Reportá qué quedó en verde y qué falta. No commitees salvo que te lo pida.
