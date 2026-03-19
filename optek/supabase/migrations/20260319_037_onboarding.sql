-- §onboarding — Añade campo para trackear completitud del onboarding tour
-- timestamptz en vez de boolean para analytics (cuándo completan, no solo si completan)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz DEFAULT NULL;
