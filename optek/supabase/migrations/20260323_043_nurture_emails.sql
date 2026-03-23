-- §nurture: Email nurturing sequence tracking
-- Tracks which nurture emails have been sent to which users (prevents duplicates).
-- Also adds opt-out flag to profiles for GDPR compliance.

-- ── Table: nurture_emails_sent ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nurture_emails_sent (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_key TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resend_id TEXT,
  UNIQUE(user_id, email_key)
);

-- Index for the 4-day guard check (frequent query in cron)
CREATE INDEX IF NOT EXISTS idx_nurture_sent_user_date
  ON nurture_emails_sent(user_id, sent_at DESC);

-- RLS: service role only (cron uses createServiceClient)
ALTER TABLE nurture_emails_sent ENABLE ROW LEVEL SECURITY;

-- ── Column: profiles.email_nurture_opt_out ──────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_nurture_opt_out BOOLEAN NOT NULL DEFAULT false;
