-- ============================================================================
-- Textos a medida: la IA reescribe la portada con lo que vende la tienda.
--
-- Brief: docs/briefs/2026-11-18-textos-que-se-adaptan.md.
--
-- 1. La función "IA: textos a medida" (`ia_textos`), oculta de fábrica. Al
--    crear una tienda la IA corre una vez igual; después, solo donde el
--    administrador la active. Por empezar con `ia_` la cubre el interruptor
--    general de la IA.
-- 2. Las propuestas de textos viven en `block_edit_proposals`, con su origen,
--    y a lo sumo una pendiente por tienda: dos pestañas no generan dos.
-- 3. Los textos que la persona aceptó, aparte de la portada: si cambia de
--    plantilla y empieza con la nueva, la nueva los usa en vez de los neutros.
--
-- Aditiva: el código anterior no lee ninguna de estas columnas.
-- ============================================================================

insert into public.feature_states (feature, state) values
  ('ia_textos', 'oculta')
on conflict (feature) do nothing;

alter table public.block_edit_proposals
  add column if not exists origen text not null default 'editor';

do $$ begin
  alter table public.block_edit_proposals
    add constraint block_edit_proposals_origen_check
    check (origen in ('editor', 'textos'));
exception when duplicate_object then null; end $$;

create unique index if not exists block_edit_proposals_textos_pendiente_idx
  on public.block_edit_proposals (store_id)
  where origen = 'textos' and status = 'propuesta';

-- Por tipo de sección y campo: {"hero": {"title": "…", "subtitle": "…"}, …}.
-- Lo escribe la aplicación al aceptar una propuesta; `null` si nunca aceptó.
alter table public.stores
  add column if not exists textos_a_medida jsonb;
