'use client'

/**
 * lib/hooks/useUserAccess.ts — §1.15.4
 *
 * Hook que verifica si el usuario tiene acceso de pago a un tema o al pack
 * completo de la oposición.
 *
 * Retorna:
 *   - hasAccess:  true si el usuario puede generar tests ilimitados
 *   - accessType: 'tema' | 'pack' | 'free'
 *   - loading:    true mientras carga
 *   - corrections: saldo de correcciones disponibles
 *   - freeTestsUsed: tests gratuitos usados (0–5)
 *
 * Lógica de acceso (ADR-0010 — Fuel Tank):
 *   - Pack Oposición comprado → acceso completo a todos los temas
 *   - Tema Individual comprado → acceso a ESE tema específico
 *   - Sin compras → free tier (máx 5 tests, máx 2 correcciones)
 *
 * Uso:
 *   const { hasAccess, accessType, loading } = useUserAccess(temaId)
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export type AccessType = 'tema' | 'pack' | 'free'

interface UserAccessResult {
  hasAccess: boolean
  accessType: AccessType
  loading: boolean
  corrections: number
  freeTestsUsed: number
  freeCorrectionsUsed: number
}

export function useUserAccess(temaId?: string): UserAccessResult {
  const [result, setResult] = useState<UserAccessResult>({
    hasAccess: false,
    accessType: 'free',
    loading: true,
    corrections: 0,
    freeTestsUsed: 0,
    freeCorrectionsUsed: 0,
  })

  useEffect(() => {
    let cancelled = false

    async function checkAccess() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (!cancelled) {
          setResult((prev) => ({ ...prev, loading: false }))
        }
        return
      }

      // ── Fetch en paralelo: perfil + compras ────────────────────────────────
      const [profileResult, comprasResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('free_tests_used, free_corrector_used, corrections_balance')
          .eq('id', user.id)
          .single(),
        supabase
          .from('compras')
          .select('tipo, tema_id')
          .eq('user_id', user.id),
      ])

      if (cancelled) return

      const profile = profileResult.data
      const compras = comprasResult.data ?? []

      const freeTestsUsed = profile?.free_tests_used ?? 0
      const freeCorrectionsUsed = profile?.free_corrector_used ?? 0
      const corrections = profile?.corrections_balance ?? 0

      // ── Verificar tipo de acceso ───────────────────────────────────────────
      // Pack: acceso ilimitado a todos los temas
      const hasPack = compras.some((c) => c.tipo === 'pack_oposicion' || c.tipo === 'pack')
      if (hasPack) {
        setResult({
          hasAccess: true,
          accessType: 'pack',
          loading: false,
          corrections,
          freeTestsUsed,
          freeCorrectionsUsed,
        })
        return
      }

      // Tema individual: acceso a ese tema concreto
      if (temaId) {
        const hasTema = compras.some((c) => c.tipo === 'tema' && c.tema_id === temaId)
        if (hasTema) {
          setResult({
            hasAccess: true,
            accessType: 'tema',
            loading: false,
            corrections,
            freeTestsUsed,
            freeCorrectionsUsed,
          })
          return
        }
      }

      // Free tier
      setResult({
        hasAccess: freeTestsUsed < 5, // tiene tests gratuitos restantes
        accessType: 'free',
        loading: false,
        corrections,
        freeTestsUsed,
        freeCorrectionsUsed,
      })
    }

    checkAccess().catch(console.error)

    return () => {
      cancelled = true
    }
  }, [temaId])

  return result
}
