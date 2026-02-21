-- =============================================================================
-- ROLLBACK Migration 004: Functions
-- =============================================================================

DROP FUNCTION IF EXISTS increment_free_corrector(uuid, int);
DROP FUNCTION IF EXISTS increment_free_tests(uuid, int);
DROP FUNCTION IF EXISTS get_user_stats(uuid);
DROP FUNCTION IF EXISTS search_legislacion(text, int);
DROP FUNCTION IF EXISTS match_legislacion(vector, int, uuid);
