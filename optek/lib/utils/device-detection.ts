/**
 * lib/utils/device-detection.ts — Lightweight UA-based device detection
 *
 * No external dependencies. Parses User-Agent header to classify:
 *   'mobile' | 'tablet' | 'desktop'
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

const MOBILE_RE = /Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|webOS/i
const TABLET_RE = /iPad|Android(?!.*Mobile)|Tablet|Kindle|Silk/i

/**
 * Detect device type from User-Agent string.
 * Returns 'desktop' as default when UA is missing or unrecognized.
 */
export function detectDeviceType(userAgent: string | null | undefined): DeviceType {
  if (!userAgent) return 'desktop'
  if (MOBILE_RE.test(userAgent)) return 'mobile'
  if (TABLET_RE.test(userAgent)) return 'tablet'
  return 'desktop'
}
