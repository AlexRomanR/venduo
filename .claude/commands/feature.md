---
description: Implementar una feature de punta a punta
---

Usá la skill `implement-feature` para construir: $ARGUMENTS

Antes de escribir código, confirmá tres cosas y decímelas:

1. **Que esté dentro de alcance.** La lista de lo que no se construye está en `VENDUO.md`
   §7. Si la feature toca algo de ahí, frená y preguntame.
2. **Qué ya existe en `lib/` que puedas reusar.** Moneda, slugs, QR, clientes de Supabase
   y validación ya están resueltos.
3. **Quién la usa** — el emprendedor o quien compra — porque eso decide dónde vive y
   qué política RLS la cubre.

Después seguí el orden de la skill: base de datos, tipos, capa de datos, interfaz,
verificación. Al terminar, corré `npm run check`.
