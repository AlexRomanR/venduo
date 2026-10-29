-- ============================================================================
-- Lo que genera la IA al cargar productos se registra como tal.
--
-- `ai_generation_kind` no tenía un tipo para eso y la carga quedaba anotada
-- como una generación de tienda. `ai_requests` ya la anota como `productos`.
-- ============================================================================

alter type public.ai_generation_kind add value if not exists 'productos';
