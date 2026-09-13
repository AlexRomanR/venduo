-- ============================================================================
-- Venduo — 0001 base: extensiones y tipos
--
-- Todos los enums del sistema viven acá, antes que cualquier tabla, para que
-- el orden de las migraciones siguientes no dependa de dónde se usa cada uno.
-- ============================================================================

create extension if not exists "pgcrypto";

-- Estado del pedido.
do $$ begin
  create type public.order_status as enum
    ('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado');
exception when duplicate_object then null; end $$;

-- Qué generó la IA. 'bloques' es la edición de la tienda.
do $$ begin
  create type public.ai_generation_kind as enum
    ('tienda', 'bloques', 'analisis', 'marketing');
exception when duplicate_object then null; end $$;

-- Cómo entra un vendedor a una tienda. Lo decide el emprendedor.
do $$ begin
  create type public.seller_join_mode as enum ('abierta', 'con_aprobacion');
exception when duplicate_object then null; end $$;

-- Estado del vínculo entre un vendedor y una tienda.
do $$ begin
  create type public.seller_status as enum
    ('pendiente', 'activo', 'rechazado', 'suspendido');
exception when duplicate_object then null; end $$;

-- Ciclo de vida de la comisión. Una venta cancelada anula, nunca borra.
do $$ begin
  create type public.commission_status as enum
    ('pendiente', 'confirmada', 'pagada', 'anulada');
exception when duplicate_object then null; end $$;

-- Condición del producto. La elige el emprendedor al cargarlo y es lo que
-- alimenta el filtro de segunda mano del catálogo.
do $$ begin
  create type public.product_condition as enum
    ('nuevo', 'segunda_mano', 'reacondicionado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.page_status as enum ('borrador', 'publicada');
exception when duplicate_object then null; end $$;

-- 'bloqueada' es el estado tras vencer la prueba: solo lectura y exportación.
do $$ begin
  create type public.subscription_status as enum
    ('prueba', 'activa', 'bloqueada', 'cancelada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.social_provider as enum ('facebook', 'whatsapp');
exception when duplicate_object then null; end $$;

-- 'publicado' es por API (plan A); 'compartido' es por enlace manual (plan B).
do $$ begin
  create type public.social_post_status as enum
    ('borrador', 'publicado', 'compartido', 'fallido');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.block_proposal_status as enum
    ('propuesta', 'aplicada', 'rechazada', 'invalida');
exception when duplicate_object then null; end $$;
