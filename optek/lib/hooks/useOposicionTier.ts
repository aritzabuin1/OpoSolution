'use client'

/**
 * lib/hooks/useOposicionTier.ts
 *
 * Returns the correct Stripe tier and price for the user's active oposición.
 * Used by PaywallCTA and other conversion components to show the right pack.
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface OposicionTier {
  tier: 'pack' | 'pack_c1' | 'pack_a2'
  price: string
  oposicionId: string
  loading: boolean
}

const TIER_MAP: Record<string, { tier: 'pack' | 'pack_c1' | 'pack_a2'; price: string }> = {
  'a0000000-0000-0000-0000-000000000001': { tier: 'pack', price: '49,99€' },
  'b0000000-0000-0000-0000-000000000001': { tier: 'pack_c1', price: '49,99€' },
  'c2000000-0000-0000-0000-000000000001': { tier: 'pack_a2', price: '69,99€' },
}

const DEFAULT = { tier: 'pack' as const, price: '49,99€' }

export function useOposicionTier(): OposicionTier {
  const [state, setState] = useState<OposicionTier>({
    tier: DEFAULT.tier,
    price: DEFAULT.price,
    oposicionId: 'a0000000-0000-0000-0000-000000000001',
    loading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data } = await supabase
        .from('profiles')
        .select('oposicion_id')
        .eq('id', user.id)
        .single()

      if (cancelled) return

      const opoId = data?.oposicion_id ?? 'a0000000-0000-0000-0000-000000000001'
      const mapped = TIER_MAP[opoId] ?? DEFAULT

      setState({
        tier: mapped.tier,
        price: mapped.price,
        oposicionId: opoId,
        loading: false,
      })
    }

    load().catch(() => setState(s => ({ ...s, loading: false })))
    return () => { cancelled = true }
  }, [])

  return state
}
