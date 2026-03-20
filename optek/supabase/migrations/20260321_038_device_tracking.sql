-- Migration 038: Add device_type to api_usage_log for mobile/desktop analytics
-- Enables admin metrics to differentiate mobile vs desktop usage patterns

ALTER TABLE api_usage_log
  ADD COLUMN IF NOT EXISTS device_type text DEFAULT 'desktop'
  CHECK (device_type IN ('mobile', 'tablet', 'desktop'));

-- Index for efficient GROUP BY queries in admin analytics
CREATE INDEX IF NOT EXISTS idx_api_usage_device_type
  ON api_usage_log (device_type, timestamp);

COMMENT ON COLUMN api_usage_log.device_type IS 'Device type detected from User-Agent: mobile, tablet, or desktop';
