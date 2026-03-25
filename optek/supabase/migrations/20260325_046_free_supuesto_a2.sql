-- Migration 046: 1 supuesto práctico gratis para usuarios A2
-- Todos los usuarios A2 que no han comprado pack reciben supuestos_balance = 1

-- Backfill: A2 users without purchases get 1 free supuesto
UPDATE profiles p
SET supuestos_balance = 1
WHERE p.oposicion_id = 'c2000000-0000-0000-0000-000000000001'
  AND p.supuestos_balance = 0
  AND NOT EXISTS (
    SELECT 1 FROM compras c
    WHERE c.user_id = p.id
      AND c.oposicion_id = 'c2000000-0000-0000-0000-000000000001'
  );
