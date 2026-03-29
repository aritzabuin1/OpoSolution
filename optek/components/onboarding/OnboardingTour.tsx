'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { trackGTMEvent } from '@/lib/analytics/gtm'
import { buildTourSteps } from './tour-steps'
import 'driver.js/dist/driver.css'
import './tour-styles.css'

interface OnboardingTourProps {
  userId: string
  onboardingCompletedAt: string | null
  totalTests: number
  diasParaExamen: number | null
  organismo?: string
  preguntasExamen?: number
  minutosExamen?: number
}

const REPLAY_KEY = 'oporuta_replay_tour'

export function OnboardingTour({
  userId,
  onboardingCompletedAt,
  totalTests,
  diasParaExamen,
  organismo,
  preguntasExamen,
  minutosExamen,
}: OnboardingTourProps) {
  const router = useRouter()
  const tourRef = useRef<ReturnType<typeof import('driver.js').driver> | null>(null)

  const markCompleted = useCallback(async (skipped: boolean) => {
    localStorage.removeItem(REPLAY_KEY)
    if (skipped) {
      trackGTMEvent('tour_skip')
    } else {
      trackGTMEvent('tour_complete')
    }
    const supabase = createClient()
    await (supabase as ReturnType<typeof createClient>)
      .from('profiles')
      .update({ onboarding_completed_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', userId)
  }, [userId])

  useEffect(() => {
    const isReplay = localStorage.getItem(REPLAY_KEY) === '1'
    const shouldShow =
      (onboardingCompletedAt === null && totalTests === 0) || isReplay

    if (!shouldShow) return

    const isMobile = window.matchMedia('(max-width: 767px)').matches

    // Dynamic import — zero cost for returning users
    const timer = setTimeout(async () => {
      const { driver } = await import('driver.js')

      const steps = buildTourSteps({ diasParaExamen, isMobile, organismo, preguntasExamen, minutosExamen })

      // On mobile, open hamburger menu for nav-targeting steps
      const openMobileNav = () => {
        if (!isMobile) return
        const menuBtn = document.querySelector<HTMLButtonElement>('[aria-label="Abrir menú"]')
          ?? document.querySelector<HTMLButtonElement>('[aria-label="Toggle menu"]')
        if (menuBtn) menuBtn.click()
      }

      const closeMobileNav = () => {
        if (!isMobile) return
        const closeBtn = document.querySelector<HTMLButtonElement>('[aria-label="Cerrar menú"]')
          ?? document.querySelector<HTMLButtonElement>('[aria-label="Toggle menu"]')
        // Only close if the nav is currently open
        const nav = document.querySelector('[data-tour="nav-tests"]')
        if (nav && closeBtn) {
          // Small delay to ensure the step is highlighted first
          setTimeout(() => closeBtn.click(), 100)
        }
      }

      const driverInstance = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayColor: 'rgba(0,0,0,0.6)',
        stagePadding: 8,
        stageRadius: 12,
        popoverClass: 'oporuta-tour-popover',
        nextBtnText: 'Siguiente →',
        prevBtnText: 'Atrás',
        doneBtnText: 'Empezar mi primer test →',
        progressText: '{{current}} de {{total}}',
        steps: steps.map((step, idx) => ({
          ...(step.element ? { element: step.element } : {}),
          popover: {
            ...step.popover,
            ...(idx === 0
              ? {
                  nextBtnText: 'Vamos →',
                  showButtons: ['next' as const, 'close' as const],
                }
              : {}),
          },
        })),
        onNextClick: (element, step, opts) => {
          const nextIdx = (opts as { state?: { activeIndex?: number } })?.state?.activeIndex
          // Before nav-targeting steps on mobile, open the menu
          if (isMobile && nextIdx != null) {
            const nextStep = steps[nextIdx + 1]
            if (nextStep?.element?.includes('nav-')) {
              openMobileNav()
            }
          }
          driverInstance.moveNext()
        },
        onDestroyStarted: () => {
          closeMobileNav()
          // If the tour completed (not skipped), go to tests
          const activeIdx = driverInstance.getActiveIndex()
          const isComplete = activeIdx != null && activeIdx >= steps.length - 1
          markCompleted(!isComplete)
          if (isComplete) {
            router.push('/tests')
          }
          driverInstance.destroy()
        },
      })

      tourRef.current = driverInstance
      trackGTMEvent('tour_start')
      driverInstance.drive()
    }, 1500) // Delay for DOM to be ready

    return () => {
      clearTimeout(timer)
      if (tourRef.current) {
        tourRef.current.destroy()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null // This component only runs side effects
}
