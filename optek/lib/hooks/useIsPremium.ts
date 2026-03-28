'use client'

/**
 * lib/hooks/useIsPremium.ts
 *
 * Lightweight hook to check if the current user has paid access
 * for their ACTIVE oposición (scoped by profiles.oposicion_id).
 * Returns: null (loading) | true | false
 *
 * Reactivity: re-checks when oposicion_id changes (via storage event
 * or periodic polling every 30s) to handle oposición switching.
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

/** Event name fired when user switches oposición (ProfileForm dispatches this) */
export const OPOSICION_CHANGED_EVENT = 'oporuta:oposicion-changed'

export function useIsPremium(): boolean | null {
  const [isPremium, setIsPremium] = useState<boolean | null>(null)

  const check = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsPremium(false); return }

    // 1. Get user's oposicion_id + flags from profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profileData } = await (supabase as any)
      .from('profiles')
      .select('oposicion_id, is_admin')
      .eq('id', user.id)
      .single()

    const prof = profileData as { oposicion_id?: string; is_admin?: boolean } | null
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
    setIsPremium(hasPurchase || isAdmin)
  }, [])

  useEffect(() => {
    check().catch(() => setIsPremium(false))

    // Re-check when oposición changes (custom event from ProfileForm / OposicionSwitcher)
    const handleChange = () => { check().catch(() => setIsPremium(false)) }
    window.addEventListener(OPOSICION_CHANGED_EVENT, handleChange)

    return () => {
      window.removeEventListener(OPOSICION_CHANGED_EVENT, handleChange)
    }
  }, [check])

  return isPremium
}
