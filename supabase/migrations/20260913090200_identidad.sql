-- ============================================================================
-- Venduo — 0002 identidad: perfiles de usuario y de vendedor
--
-- `auth.users` la administra Supabase y no se toca. Acá viven las tablas
-- propias de la aplicación que la acompañan.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Perfil general. Espejo público de auth.users, que no admite columnas propias.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- ----------------------------------------------------------------------------
-- Identidad del vendedor.
--
-- Vive fuera de toda tienda a propósito: es lo que sostiene el historial
-- laboral verificable, que tiene que sobrevivir a la tienda que lo empleó.
-- ----------------------------------------------------------------------------
create table if not exists public.seller_profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null,
  slug          text not null,
  phone         text,
  city          text,
  bio           text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- Único solo entre filas vivas: un perfil dado de baja no puede bloquear
-- para siempre la reutilización de su slug.
create unique index if not exists seller_profiles_slug_key
  on public.seller_profiles (slug) where deleted_at is null;

-- ----------------------------------------------------------------------------
-- Perfil automático al registrarse.
--
-- security definer: corre con permisos del dueño de la función, así puede
-- insertar antes de que exista sesión del usuario.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
