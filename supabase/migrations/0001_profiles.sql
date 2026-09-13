-- ============================================================================
-- Venduo MVP - 0001: perfiles de usuario
--
-- Lo mínimo para que funcione el login. `auth.users` ya la crea Supabase:
-- esta migración solo agrega la tabla propia de la app que la acompaña.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Perfil del usuario
--
-- Espejo público de auth.users: ahí no se pueden agregar columnas propias,
-- así que los datos de la app viven acá, enlazados por el mismo id.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Perfil automático al registrarse
--
-- security definer: el trigger corre con permisos del dueño de la función,
-- así puede insertar en profiles antes de que exista sesión del usuario.
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

-- ----------------------------------------------------------------------------
-- Row Level Security: cada quien ve y edita solo su perfil
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "perfil propio: leer" on public.profiles;
create policy "perfil propio: leer" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "perfil propio: actualizar" on public.profiles;
create policy "perfil propio: actualizar" on public.profiles
  for update using (auth.uid() = id);
