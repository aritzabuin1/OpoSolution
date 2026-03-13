'use client'

/**
 * lib/hooks/useIsPremium.ts
 *
 * Lightweight hook to check if the current user has paid access
 * for their ACTIVE oposición (scoped by profiles.oposicion_id).
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

      // 1. Get user's oposicion_id + flags from profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profileData } = await (supabase as any)
        .from('profiles')
        .select('oposicion_id, is_founder, is_admin')
        .eq('id', user.id)
        .single()

      const prof = profileData as { oposicion_id?: string; is_founder?: boolean; is_admin?: boolean } | null
      const isFounder = prof?.is_founder === true
      const isAdmin = prof?.is_admin === true
      const oposicionId = prof?.oposicion_id ?? 'a0000000-0000-0000-0000-000000000001'

      // 2. Check compras scoped by oposicion_id
      const { data: compraData } = await supabase
        .from('compras')
        .select('id')
        .eq('user_id', user.id)
        .eq('oposicion_id', oposicionId)
        .limit(1)

      const hasPurchase = (compraData?.length ?? 0) > 0

      if (!cancelled) setIsPremium(hasPurchase || isFounder || isAdmin)
    }

    check().catch(() => { if (!cancelled) setIsPremium(false) })
    return () => { cancelled = true }
  }, [])

  return isPremium
}
