-- ============================================================================
-- Políticas de los avisos de la app.
--
-- `push_tokens` se lee pero no se escribe desde la app: registrar y olvidar un
-- celular pasan por `registrar_dispositivo` y `olvidar_dispositivo`, porque un
-- mismo celular puede cambiar de cuenta y esa fila es de otra persona.
-- ============================================================================

-- Cada quien ve los celulares en los que tiene avisos.
drop policy if exists "dispositivos propios: leer" on public.push_tokens;
create policy "dispositivos propios: leer" on public.push_tokens
  for select
  to authenticated
  using (user_id = (select auth.uid()) and deleted_at is null);

-- Las preferencias son una fila por persona, y es suya.
drop policy if exists "preferencias propias: leer" on public.notification_preferences;
create policy "preferencias propias: leer" on public.notification_preferences
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "preferencias propias: crear" on public.notification_preferences;
create policy "preferencias propias: crear" on public.notification_preferences
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "preferencias propias: editar" on public.notification_preferences;
create policy "preferencias propias: editar" on public.notification_preferences
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
