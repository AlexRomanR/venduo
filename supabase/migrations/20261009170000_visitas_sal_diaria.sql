-- ============================================================================
-- Venduo — la sal de las visitas se borra todos los días, no a la suerte
--
-- `registrar_visita` limpiaba las sales viejas y el detalle de más de 90 días
-- con una probabilidad de 1 en 500 por visita. Con poco tráfico, la sal de
-- ayer podía quedar semanas, y la promesa es que no quede: sin ella, una
-- huella vieja ya no se puede volver a calcular. Ahora limpia la primera
-- visita de cada día, la que crea la sal nueva. El resto es igual.
-- ============================================================================

create or replace function public.registrar_visita(
  p_store_id    uuid,
  p_kind        text,
  p_product_id  uuid,
  p_source      text,
  p_device      text,
  p_firma       text,
  p_usuario     uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dia      date := (now() at time zone 'America/La_Paz')::date;
  v_inicio   timestamptz := (v_dia::timestamp at time zone 'America/La_Paz');
  v_sal      text;
  v_huella   text;
  v_nuevo    boolean;
  v_sal_nueva date;
  v_producto uuid := coalesce(p_product_id, '00000000-0000-0000-0000-000000000000');
begin
  -- El dueño mirando su tienda y los administradores no cuentan.
  if p_usuario is not null and (
    exists (select 1 from public.stores where id = p_store_id and owner_id = p_usuario)
    or exists (select 1 from public.platform_admins where user_id = p_usuario)
  ) then
    return;
  end if;

  if not public.store_is_live(p_store_id) then
    return;
  end if;

  -- La primera visita del día crea la sal de hoy y borra las de días pasados:
  -- sin la sal, una huella vieja ya no se puede volver a calcular.
  insert into public.visit_salts (day) values (v_dia)
    on conflict (day) do nothing
    returning day into v_sal_nueva;
  if v_sal_nueva is not null then
    delete from public.visit_salts where day < v_dia;
    delete from public.store_visits where created_at < now() - interval '90 days';
  end if;
  select salt into v_sal from public.visit_salts where day = v_dia;
  v_huella := md5(v_sal || ':' || p_store_id::text || ':' || coalesce(p_firma, ''));

  -- La misma persona en la misma página dentro de media hora es una recarga.
  if exists (
    select 1 from public.store_visits
     where store_id = p_store_id
       and visitor = v_huella
       and kind = p_kind
       and product_id is not distinct from p_product_id
       and created_at > now() - interval '30 minutes'
  ) then
    return;
  end if;

  v_nuevo := not exists (
    select 1 from public.store_visits
     where store_id = p_store_id and visitor = v_huella and created_at >= v_inicio
  );

  insert into public.store_visits (store_id, product_id, kind, source, device, visitor)
  values (p_store_id, p_product_id, p_kind, p_source, p_device, v_huella);

  insert into public.store_visits_daily (store_id, day, kind, source, product_id, visits, visitors)
  values (p_store_id, v_dia, p_kind, p_source, v_producto, 1, case when v_nuevo then 1 else 0 end)
  on conflict (store_id, day, kind, source, product_id) do update
    set visits = public.store_visits_daily.visits + 1,
        visitors = public.store_visits_daily.visitors + excluded.visitors;

end $$;

revoke all on function public.registrar_visita(uuid, text, uuid, text, text, text, uuid)
  from public, anon, authenticated;

grant execute on function public.registrar_visita(uuid, text, uuid, text, text, text, uuid)
  to service_role;
