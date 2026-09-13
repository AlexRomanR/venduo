-- ============================================================================
-- Venduo — 0012 rol de registro
--
-- Guarda con qué intención se registró cada persona: emprendedor o vendedor.
--
-- NO es un permiso. Los permisos siguen derivando de los datos: sos dueño si
-- tenés una fila en stores, y sos vendedor si tenés un vínculo activo en
-- store_sellers. Una misma persona puede ser las dos cosas, y el documento
-- maestro lo dice explícitamente.
--
-- Sirve para saber a dónde llevar a alguien que se registró y todavía no hizo
-- nada: sin esto, una cuenta recién creada es indistinguible entre los dos
-- caminos.
-- ============================================================================

do $$ begin
  create type public.user_role as enum ('emprendedor', 'vendedor');
exception when duplicate_object then null; end $$;

alter table public.profiles
  add column if not exists primary_role public.user_role;

-- ----------------------------------------------------------------------------
-- Crea el perfil de vendedor si todavía no existe.
--
-- Vive en una función propia porque hacen falta dos caminos: al registrarse
-- eligiendo vendedor, y al sumarse a una tienda sin haberlo elegido antes.
-- El sufijo del identificador hace que el slug no colisione entre homónimos.
-- ----------------------------------------------------------------------------
create or replace function public.ensure_seller_profile(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.seller_profiles (user_id, display_name, slug)
  select
    p_user_id,
    coalesce(nullif(btrim(p.full_name), ''), 'Vendedor'),
    trim(
      both '-' from lower(
        regexp_replace(
          coalesce(nullif(btrim(p.full_name), ''), 'vendedor'),
          '[^a-zA-Z0-9]+', '-', 'g'
        )
      )
    ) || '-' || substr(replace(p_user_id::text, '-', ''), 1, 6)
  from public.profiles p
  where p.id = p_user_id
  on conflict (user_id) do nothing;
end $$;

-- ----------------------------------------------------------------------------
-- El disparador de alta pasa a leer también el rol elegido.
--
-- Un valor desconocido se guarda como nulo en vez de romper el registro: el
-- alta de una cuenta no puede fallar por un dato que solo decide una pantalla.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
begin
  v_role := case new.raw_user_meta_data->>'primary_role'
              when 'emprendedor' then 'emprendedor'::public.user_role
              when 'vendedor'    then 'vendedor'::public.user_role
              else null
            end;

  insert into public.profiles (id, full_name, avatar_url, primary_role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    v_role
  )
  on conflict (id) do nothing;

  -- Quien se registra como vendedor recibe su identidad de una, así tiene
  -- perfil público y enlace propio antes de sumarse a ninguna tienda.
  if v_role = 'vendedor' then
    perform public.ensure_seller_profile(new.id);
  end if;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- `join_store` deja de duplicar la creación del perfil y delega en la función
-- compartida, para que el slug se arme en un solo lugar.
-- ----------------------------------------------------------------------------
create or replace function public.join_store(p_store_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_store record;
  v_existing uuid;
  v_status public.seller_status;
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Hace falta iniciar sesión';
  end if;

  select id, owner_id, seller_network_enabled, seller_join_mode
    into v_store
    from public.stores
   where slug = p_store_slug and is_published and deleted_at is null;

  if v_store.id is null then
    raise exception 'La tienda no existe o no está publicada';
  end if;

  if not v_store.seller_network_enabled then
    raise exception 'Esta tienda no tiene la red de vendedores activada';
  end if;

  if v_store.owner_id = v_user_id then
    raise exception 'No podés ser vendedor de tu propia tienda';
  end if;

  select id into v_existing
    from public.store_sellers
   where store_id = v_store.id and user_id = v_user_id and deleted_at is null;

  if v_existing is not null then
    return v_existing;
  end if;

  perform public.ensure_seller_profile(v_user_id);

  v_status := case v_store.seller_join_mode
                when 'abierta' then 'activo'::public.seller_status
                else 'pendiente'::public.seller_status
              end;

  insert into public.store_sellers (store_id, user_id, referral_code, status, approved_at)
  values (
    v_store.id,
    v_user_id,
    public.generate_referral_code(),
    v_status,
    case when v_status = 'activo' then now() else null end
  )
  returning id into v_id;

  return v_id;
end $$;

revoke all on function public.join_store(text) from public;
grant execute on function public.join_store(text) to authenticated;
