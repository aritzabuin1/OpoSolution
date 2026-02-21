-- =============================================================================
-- ROLLBACK Migration 005: Seed data
-- =============================================================================

DELETE FROM legislacion WHERE id LIKE 'c0000000-0000-0000-0001-%';
DELETE FROM temas WHERE id LIKE 'b0000000-0000-0000-0001-%';
DELETE FROM oposiciones WHERE slug = 'aux-admin-estado';
