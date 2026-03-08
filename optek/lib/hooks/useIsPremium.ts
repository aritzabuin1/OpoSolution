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

      // Check compras OR is_founder OR is_admin (admin needs full access to test)
      // IMPORTANT: premium does NOT grant admin — admin panel checks is_admin separately
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [{ data: compraData }, { data: profileData }] = await Promise.all([
        supabase.from('compras').select('id').eq('user_id', user.id).limit(1),
        (supabase as any).from('profiles').select('is_founder, is_admin').eq('id', user.id).single(),
      ])

      const hasPurchase = (compraData?.length ?? 0) > 0
      const prof = profileData as { is_founder?: boolean; is_admin?: boolean } | null
      const isFounder = prof?.is_founder === true
      const isAdmin = prof?.is_admin === true

      if (!cancelled) setIsPremium(hasPurchase || isFounder || isAdmin)
    }

    check().catch(() => { if (!cancelled) setIsPremium(false) })
    return () => { cancelled = true }
  }, [])

  return isPremium
}
