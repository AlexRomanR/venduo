-- ============================================================================
-- La IA que arma productos desde fotos, una planilla o una lista escrita.
--
-- Una función más, que el administrador puede apagar. Por empezar con `ia_`
-- entra sola en el interruptor general de la IA (`ia_apagada`).
-- ============================================================================

insert into public.feature_states (feature, state) values
  ('ia_productos', 'activa')
on conflict (feature) do nothing;
