'use client'

/**
 * lib/hooks/useOposicionTier.ts
 *
 * Returns the correct Stripe tier and price for the user's active oposición.
 * Used by PaywallCTA and other conversion components to show the right pack.
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type PackTier = 'pack' | 'pack_c1' | 'pack_a2' | 'pack_correos' | 'pack_auxilio' | 'pack_tramitacion' | 'pack_gestion_j'

interface OposicionTier {
  tier: PackTier
  price: string
  oposicionId: string
  loading: boolean
}

const TIER_MAP: Record<string, { tier: PackTier; price: string }> = {
  // C2 AGE — Auxiliar Administrativo
  'a0000000-0000-0000-0000-000000000001': { tier: 'pack', price: '49,99€' },
  // C1 AGE — Administrativo
  'b0000000-0000-0000-0000-000000000001': { tier: 'pack_c1', price: '49,99€' },
  // A2 AGE
  'c2000000-0000-0000-0000-000000000001': { tier: 'pack_a2', price: '69,99€' },
  // Correos
  'd0000000-0000-0000-0000-000000000001': { tier: 'pack_correos', price: '49,99€' },
  // Auxilio Judicial
  'e0000000-0000-0000-0000-000000000001': { tier: 'pack_auxilio', price: '49,99€' },
  // Tramitación Procesal
  'e1000000-0000-0000-0000-000000000001': { tier: 'pack_tramitacion', price: '49,99€' },
  // Gestión Procesal
  'e2000000-0000-0000-0000-000000000001': { tier: 'pack_gestion_j', price: '79,99€' },
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
