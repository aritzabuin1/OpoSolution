-- Migration 059: Push notification subscriptions
-- Stores Web Push subscriptions for opted-in users.
-- 1 user can have multiple subscriptions (multiple devices/browsers).

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription  jsonb NOT NULL,  -- PushSubscription object {endpoint, keys: {p256dh, auth}}
  created_at    timestamptz DEFAULT now(),
  -- Prevent duplicate subscriptions for same endpoint
  UNIQUE (user_id, (subscription->>'endpoint'))
);

-- Index for querying all subscriptions (broadcast)
CREATE INDEX idx_push_subs_user ON push_subscriptions (user_id);

-- RLS: users can only manage their own subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY push_subs_select ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY push_subs_insert ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY push_subs_delete ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);
