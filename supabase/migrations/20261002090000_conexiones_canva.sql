-- ============================================================================
-- La conexión con Canva, en social_connections.
--
-- Sin esto, "Editar en Canva" pedía la aprobación en cada uso: el permiso se
-- usaba una vez y se descartaba. Ahora se guarda el token de renovación que
-- entrega Canva, y las veces siguientes se cambia por un permiso nuevo sin
-- pasar por su pantalla.
--
-- Va en social_connections y no en una tabla propia: es la tabla de las
-- conexiones de la tienda con servicios de afuera —Facebook hoy, Instagram y
-- TikTok cuando se construyan—, ya tiene RLS activo y cero políticas, y una
-- fila por tienda y proveedor. Solo se le suma el proveedor y la columna.
--
-- El token llega **cifrado por la aplicación** (AES-256-GCM, con una llave que
-- sale del secreto de la integración): quien lea la tabla no se lleva una llave
-- a la cuenta de Canva de nadie.
-- ============================================================================

alter type public.social_provider add value if not exists 'canva';

-- Canva entrega un permiso de cuatro horas y un token para renovarlo, que
-- cambia en cada renovación. Se guarda el segundo; el primero no.
alter table public.social_connections
  add column if not exists refresh_token text;
