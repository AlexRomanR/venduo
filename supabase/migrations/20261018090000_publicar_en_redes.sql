-- ============================================================================
-- Publicar en redes: la imagen y el texto de un producto para compartir.
--
-- Son dos funciones que Venduo puede apagar desde /admin, como todas:
-- `marketing`, la pantalla, e `ia_marketing`, el texto que escribe la IA. La
-- segunda empieza con `ia_`, así que el interruptor general de la IA
-- (`ia_apagada`) también la oculta. Sin la IA, la pantalla sigue andando con
-- un texto armado sin ella.
--
-- Nacen activas. `funciones_de_mi_tienda` lee la lista de esta tabla: no hay
-- nada más que cambiar en la base.
-- ============================================================================

insert into public.feature_states (feature, state) values
  ('marketing', 'activa'),
  ('ia_marketing', 'activa')
on conflict (feature) do nothing;
