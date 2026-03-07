'use client'

/**
 * lib/hooks/useIsPremium.ts
 *
 * Lightweight hook to check if the current user has any purchase (= premium).
 * Returns: null (loading) | true | false
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useIsPremium(): boolean | null {
  const [isPremium, setIsPremium] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) { if (!cancelled) setIsPremium(false); return }

      const { data } = await supabase
        .from('compras')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (!cancelled) setIsPremium((data?.length ?? 0) > 0)
    }

    check().catch(() => { if (!cancelled) setIsPremium(false) })
    return () => { cancelled = true }
  }, [])

  return isPremium
}
