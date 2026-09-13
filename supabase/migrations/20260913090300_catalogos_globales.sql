-- ============================================================================
-- Venduo — 0003 catálogos globales: planes, plantillas y tipos de bloque
--
-- Ninguna de estas tablas pertenece a una tienda. Son catálogo compartido:
-- lectura para todos, escritura solo desde el servidor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Planes de suscripción.
--
-- Sin campos de precio: el cobro está fuera de alcance y lo que el software
-- necesita conocer es el estado de la suscripción, no su monto. La estructura
-- admite sumar niveles (pro, plus) sin migrar datos.
-- ----------------------------------------------------------------------------
create table if not exists public.plans (
  key         text primary key,
  name        text not null,
  features    jsonb not null default '[]'::jsonb,
  trial_days  integer not null default 30 check (trial_days >= 0),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

insert into public.plans (key, name, features) values
  ('base', 'Base', '["Tienda online","Cobro por QR","Inteligencia de negocio","Marketing con IA","Red de vendedores"]'::jsonb)
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- Tipos de bloque: el catálogo que la IA puede usar para editar una tienda.
--
-- `props_schema` describe las propiedades válidas de cada tipo. El sistema
-- valida contra este esquema antes de aplicar lo que la IA propone.
-- Clave textual y no uuid: la IA referencia nombres legibles.
-- ----------------------------------------------------------------------------
create table if not exists public.block_types (
  key            text primary key,
  name           text not null,
  description    text,
  category       text,
  props_schema   jsonb not null,
  default_props  jsonb not null default '{}'::jsonb,
  max_per_page   integer,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

insert into public.block_types (key, name, description, category, max_per_page, props_schema, default_props) values
  ('hero', 'Portada', 'Título grande, bajada e imagen de fondo.', 'estructura', 1,
   '{"type":"object","properties":{"title":{"type":"string","maxLength":120},"subtitle":{"type":"string","maxLength":240},"imageUrl":{"type":"string"},"ctaLabel":{"type":"string","maxLength":40},"ctaHref":{"type":"string","maxLength":200}},"required":["title"],"additionalProperties":false}'::jsonb,
   '{"title":"Bienvenido","subtitle":""}'::jsonb),

  ('product_grid', 'Grilla de productos', 'Catálogo en grilla, con filtro opcional por condición.', 'catalogo', null,
   '{"type":"object","properties":{"title":{"type":"string","maxLength":120},"columns":{"type":"integer","minimum":2,"maximum":4},"limit":{"type":"integer","minimum":1,"maximum":48},"condition":{"type":"string","enum":["todos","nuevo","segunda_mano","reacondicionado"]},"category":{"type":"string","maxLength":60}},"required":["title"],"additionalProperties":false}'::jsonb,
   '{"title":"Nuestros productos","columns":3,"limit":12,"condition":"todos"}'::jsonb),

  ('about', 'Sobre el negocio', 'Texto de presentación con imagen opcional.', 'contenido', null,
   '{"type":"object","properties":{"title":{"type":"string","maxLength":120},"body":{"type":"string","maxLength":1200},"imageUrl":{"type":"string"}},"required":["title","body"],"additionalProperties":false}'::jsonb,
   '{"title":"Quiénes somos","body":""}'::jsonb),

  ('testimonials', 'Testimonios', 'Opiniones de clientes.', 'contenido', 1,
   '{"type":"object","properties":{"title":{"type":"string","maxLength":120},"items":{"type":"array","maxItems":6,"items":{"type":"object","properties":{"quote":{"type":"string","maxLength":400},"author":{"type":"string","maxLength":80}},"required":["quote","author"],"additionalProperties":false}}},"required":["title","items"],"additionalProperties":false}'::jsonb,
   '{"title":"Lo que dicen","items":[]}'::jsonb),

  ('cta', 'Llamado a la acción', 'Bloque de cierre con botón.', 'estructura', null,
   '{"type":"object","properties":{"title":{"type":"string","maxLength":120},"body":{"type":"string","maxLength":400},"buttonLabel":{"type":"string","maxLength":40},"buttonHref":{"type":"string","maxLength":200}},"required":["title","buttonLabel"],"additionalProperties":false}'::jsonb,
   '{"title":"¿Hacemos negocio?","buttonLabel":"Escribinos"}'::jsonb),

  ('contact', 'Contacto', 'Datos de contacto y enlace a WhatsApp.', 'contenido', 1,
   '{"type":"object","properties":{"title":{"type":"string","maxLength":120},"whatsapp":{"type":"string","maxLength":30},"address":{"type":"string","maxLength":200},"hours":{"type":"string","maxLength":200}},"required":["title"],"additionalProperties":false}'::jsonb,
   '{"title":"Contacto"}'::jsonb),

  ('faq', 'Preguntas frecuentes', 'Lista de preguntas y respuestas.', 'contenido', 1,
   '{"type":"object","properties":{"title":{"type":"string","maxLength":120},"items":{"type":"array","maxItems":10,"items":{"type":"object","properties":{"question":{"type":"string","maxLength":200},"answer":{"type":"string","maxLength":800}},"required":["question","answer"],"additionalProperties":false}}},"required":["title","items"],"additionalProperties":false}'::jsonb,
   '{"title":"Preguntas frecuentes","items":[]}'::jsonb)
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- Plantillas por rubro.
-- ----------------------------------------------------------------------------
create table if not exists public.templates (
  key                text primary key,
  name               text not null,
  sector             text not null,
  description        text,
  theme              jsonb not null default '{}'::jsonb,
  preview_image_url  text,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now()
);

insert into public.templates (key, name, sector, description, theme) values
  ('abarrotes', 'Almacén', 'abarrotes', 'Catálogo amplio, precios visibles, pensado para reposición frecuente.',
   '{"primary":"#0f766e","accent":"#f59e0b","font":"Inter"}'::jsonb),
  ('carpinteria', 'Taller', 'carpinteria', 'Piezas por encargo, foco en fotos grandes y terminaciones.',
   '{"primary":"#78350f","accent":"#d97706","font":"Inter"}'::jsonb),
  ('moda', 'Indumentaria', 'moda', 'Grilla visual, talles y temporada. Incluye sección de segunda mano.',
   '{"primary":"#831843","accent":"#ec4899","font":"Inter"}'::jsonb),
  ('gastronomia', 'Cocina', 'gastronomia', 'Menú por categorías y pedido rápido por WhatsApp.',
   '{"primary":"#7f1d1d","accent":"#ef4444","font":"Inter"}'::jsonb)
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- Páginas que siembra cada plantilla.
--
-- `blocks` es el arreglo ordenado que se copia a store_pages/store_blocks
-- cuando el emprendedor elige la plantilla.
-- ----------------------------------------------------------------------------
create table if not exists public.template_pages (
  template_key  text not null references public.templates(key) on delete cascade,
  page_key      text not null,
  title         text not null,
  is_home       boolean not null default false,
  blocks        jsonb not null default '[]'::jsonb,
  primary key (template_key, page_key)
);

insert into public.template_pages (template_key, page_key, title, is_home, blocks) values
  ('abarrotes', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"Tu almacén de confianza","subtitle":"Todo lo que necesitás, cerca."}},
     {"block_type_key":"product_grid","props":{"title":"Productos","columns":3,"limit":12,"condition":"todos"}},
     {"block_type_key":"contact","props":{"title":"Dónde encontrarnos"}}]'::jsonb),

  ('carpinteria', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"Muebles a medida","subtitle":"Madera maciza, trabajo artesanal."}},
     {"block_type_key":"about","props":{"title":"El taller","body":"Contá acá tu historia y tu forma de trabajar."}},
     {"block_type_key":"product_grid","props":{"title":"Trabajos","columns":2,"limit":8,"condition":"todos"}},
     {"block_type_key":"cta","props":{"title":"¿Tenés un proyecto?","buttonLabel":"Pedí presupuesto"}}]'::jsonb),

  ('moda', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"Nueva temporada","subtitle":"Prendas seleccionadas."}},
     {"block_type_key":"product_grid","props":{"title":"Nuevo","columns":3,"limit":12,"condition":"nuevo"}},
     {"block_type_key":"product_grid","props":{"title":"Segunda mano","columns":3,"limit":12,"condition":"segunda_mano"}},
     {"block_type_key":"contact","props":{"title":"Contacto"}}]'::jsonb),

  ('gastronomia', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"Comida casera","subtitle":"Hecho en el día."}},
     {"block_type_key":"product_grid","props":{"title":"Menú","columns":3,"limit":16,"condition":"todos"}},
     {"block_type_key":"faq","props":{"title":"Preguntas frecuentes","items":[]}},
     {"block_type_key":"contact","props":{"title":"Pedidos"}}]'::jsonb)
on conflict (template_key, page_key) do nothing;
