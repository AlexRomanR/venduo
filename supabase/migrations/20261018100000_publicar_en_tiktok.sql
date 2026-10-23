-- ============================================================================
-- Publicar en TikTok, desde "Publicar en redes".
--
-- La tienda conecta su cuenta de TikTok una vez (OAuth) y desde ahí publica
-- la foto de un producto sin salir de Venduo. El permiso vive en
-- `social_connections`, como el de Canva: RLS activo, cero políticas, y el
-- token cifrado por la aplicación (`lib/tiktok.ts`).
--
-- `tiktok` es una función más que Venduo puede apagar desde /admin. Nace
-- activa; igual no aparece mientras la integración no tenga sus credenciales.
-- ============================================================================

alter type public.social_provider add value if not exists 'tiktok';

insert into public.feature_states (feature, state) values
  ('tiktok', 'activa')
on conflict (feature) do nothing;
