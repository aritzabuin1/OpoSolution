-- §2.23 — RPC para tamaño de base de datos (Monitor de Infraestructura)
-- Necesaria porque pg_database_size no es accesible vía PostgREST sin función SECURITY DEFINER.

CREATE OR REPLACE FUNCTION public.get_db_size_bytes()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pg_database_size(current_database())::bigint;
$$;

GRANT EXECUTE ON FUNCTION public.get_db_size_bytes() TO service_role;
