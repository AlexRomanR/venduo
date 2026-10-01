---
name: qa-verification
description: >-
  Use this skill when auditing code quality, running type checks, linting,
  formatting, testing demo/mock fallback, verifying mobile responsiveness,
  and preparing code for commit and PR in Venduo.
---

# Flujo de Verificación de Calidad y Pruebas (QA)

Este skill describe la rutina obligatoria de aseguramiento de la calidad (QA), auditoría técnica y verificación manual antes de fusionar cualquier cambio en el repositorio de **Venduo**.

---

## 1. Comandos de Verificación Automatizada

Antes de solicitar revisión o hacer push a tu rama de trabajo, ejecuta el pipeline completo:

```bash
# Verificación integral (TypeScript + ESLint + Prettier)
npm run check
```

Si deseas diagnosticar problemas específicos por separado:

```bash
# 1. Solo tipos de TypeScript
npm run typecheck

# 2. Solo análisis estático con ESLint 9
npm run lint

# 3. Solo formato con Prettier
npm run format:check

# Para corregir automáticamente problemas de formato:
npm run format
```

---

## 2. Prueba de Compilación para Producción

Verifica que no existan errores de empaquetado ni incompatibilidades de Server Components en el build:

```bash
npm run build
```

- Valida que todas las páginas estáticas y dinámicas se compilen sin errores.
- Comprueba que no se hayan filtrado importaciones de `"use client"` o secretos del servidor en bundles de cliente.

---

## 3. Checklist de Auditoría Técnica

### Base de Datos y Seguridad

- [ ] ¿Los montos monetarios se almacenan en centavos enteros (`_cents`)?
- [ ] ¿Las comisiones se expresan en puntos básicos (`_bps`) de 0 a 10000?
- [ ] ¿Las nuevas tablas tienen RLS habilitado y políticas con `(select auth.uid())`?
- [ ] ¿Se verificó `deleted_at is null` para respetar el borrado lógico?
- [ ] ¿El pedido se crea llamando a `create_order` y no con `from("orders").insert(...)`? `orders` no tiene política de inserción: un insert directo falla en silencio.
- [ ] ¿Las comisiones las sigue creando el disparador, sin inserciones desde código?

### Rendimiento y UI Mobile-First

- [ ] ¿La interfaz se probó en un ancho de pantalla de 375px (móvil estándar)?
- [ ] ¿No existe scroll horizontal indeseado en la vista móvil?
- [ ] ¿Los botones y áreas interactivas miden al menos 44px x 44px?
- [ ] ¿Los campos de formulario muestran mensajes de error legibles y accesibles?
- [ ] ¿Una pantalla del panel está armada con `Cabecera` y paneles (`Seccion`), con títulos que dicen para qué sirve cada uno y su estado vacío dentro?
- [ ] ¿Se añadieron estados de carga para datos asíncronos? Una sección del panel lleva su `loading.tsx` con `EsqueletoDePantalla`.
- [ ] ¿Las consultas de la pantalla salen en paralelo, con la sesión de `getUsuario()` y la tienda de `getMiTienda()`, sin `auth.getUser()`? Ver `performance.md`.
- [ ] ¿Cada escritura vacía la memoria del navegador, con `revalidatePath` en una Server Action o `router.refresh()` desde el cliente?

### Resiliencia y Modo Demo

- [ ] ¿La pantalla funciona sin errores en modo demo (`AI_PROVIDER=mock` o sin credenciales de Supabase)?
- [ ] ¿Los errores de red o proveedores caídos muestran un fallback amigable al usuario?

---

## 4. Flujo de Git y Trabajo en Equipo

1. **Rama Personal:**
   ```bash
   git checkout -b tu-nombre/tu-funcionalidad
   ```
2. **Sincronización:**
   ```bash
   git pull --rebase origin main
   ```
3. **Commit y Verificación:**
   - Asegúrate de que `npm run check` termine en verde.
   - Crea un commit semántico y descriptivo.
   - Abre un Pull Request a `main`. El workflow de GitHub Actions (`.github/workflows/ci.yml`) ejecutará la validación automática.
