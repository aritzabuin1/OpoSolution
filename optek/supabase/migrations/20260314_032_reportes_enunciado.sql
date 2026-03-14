-- =============================================================================
-- Migration 032: Añadir enunciado a preguntas_reportadas
-- Autor: Claude / Aritz | Fecha: 2026-03-14
--
-- Sin enunciado, un reporte solo dice "test X, pregunta 0" — inútil para
-- revisar sin abrir el JSON del test. Ahora se guarda el texto de la pregunta.
-- =============================================================================

ALTER TABLE preguntas_reportadas ADD COLUMN IF NOT EXISTS enunciado text;
