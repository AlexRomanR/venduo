-- ============================================================================
-- Políticas de la administración y las visitas.
--
-- Las tablas de administración (platform_admins, admin_audit_log,
-- platform_settings, feature_states, store_feature_states, store_notes,
-- invitations, ai_requests, visit_salts, store_visits) tienen RLS activo y
-- **ninguna política**, a propósito: solo las toca el servidor con la clave de
-- servicio, detrás de `exigirAdmin()` o de `/api/visita`. No agregarles.
-- ============================================================================

-- Un producto moderado por Venduo no se le muestra a quien compra. Su dueño lo
-- sigue viendo en su panel.
drop policy if exists "productos publicados: leer" on public.products;
create policy "productos publicados: leer" on public.products
  for select
  using (
    deleted_at is null
    and (
      (is_active and moderated_at is null and public.store_is_live(store_id))
      or store_id = public.my_store_id()
    )
  );

-- Las visitas de la tienda, en resumen por día, solo si Venduo se las activó.
drop policy if exists "visitas propias: leer" on public.store_visits_daily;
create policy "visitas propias: leer" on public.store_visits_daily
  for select
  using (
    store_id = (select public.my_store_id())
    and (select public.funcion_activa('visitas'))
  );

-- Qué plantillas de catálogo se ofrecen: lo lee el constructor de catálogos.
drop policy if exists "plantillas de catalogo: leer" on public.catalog_template_settings;
create policy "plantillas de catalogo: leer" on public.catalog_template_settings
  for select
  to authenticated
  using (true);
