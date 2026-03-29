-- Add rama column to reto_diario (nullable for backwards compat with existing rows)
ALTER TABLE reto_diario ADD COLUMN IF NOT EXISTS rama text;

-- Create index for per-rama queries
CREATE INDEX IF NOT EXISTS idx_reto_diario_fecha_rama ON reto_diario (fecha, rama);
