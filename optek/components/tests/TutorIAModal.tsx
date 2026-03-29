'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, ArrowDown, TrendingDown, Users } from 'lucide-react'

/**
 * Escalating AI Tutor promotion modal — behavioral science strategy:
 *
 * Phase 1 (1st encounter):  Curiosity + personalization — show their actual first error
 * Phase 2 (~3rd test):      Loss aversion — "sigues fallando sin revisar"
 * Phase 3 (~5th test):      Social proof — "opositores que revisan mejoran un 23%"
 * After 3 modals OR after using the tutor: never show again.
 *
 * Coordination with ExplicarErroresPanel auto-demo:
 * When this modal is going to show, it suppresses the auto-demo (sets oporuta_demo_analysis_seen)
 * so both don't compete for the user's attention.
 */

const LS_SHOWN_COUNT = 'tutor_modal_shown_count'
const LS_LAST_TEST = 'tutor_modal_last_test'
const LS_TESTS_AT_SHOW = 'tutor_modal_tests_at_show'
const LS_TUTOR_USED = 'oporuta_first_analysis_seen'
const LS_DEMO_SEEN = 'oporuta_demo_analysis_seen' // shared with ExplicarErroresPanel

const MAX_MODALS = 3
const MIN_TESTS_BETWEEN = 2

interface PrimerError {
  enunciado: string
  cita?: { ley: string; articulo: string } | null
}

interface TutorIAModalProps {
  testId: string
  numErrores: number
  totalTests: number
  freeAnalysisRemaining: number
  primerError: PrimerError | null
}

export function TutorIAModal({
  testId,
  numErrores,
  totalTests,
  freeAnalysisRemaining,
  primerError,
}: TutorIAModalProps) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState(1)

  useEffect(() => {
    if (numErrores === 0) return
    if (localStorage.getItem(LS_LAST_TEST) === testId) return

    const shownCount = parseInt(localStorage.getItem(LS_SHOWN_COUNT) ?? '0', 10)
    if (shownCount >= MAX_MODALS) return

    let shouldShow = false
    let nextPhase = 1

    if (shownCount === 0) {
      // Phase 1: always show on first encounter
      shouldShow = true
      nextPhase = 1
    } else if (localStorage.getItem(LS_TUTOR_USED)) {
      // User already used the tutor — stop showing
      return
    } else {
      // Phases 2 & 3: space by at least MIN_TESTS_BETWEEN
      const testsAtLastShow = parseInt(localStorage.getItem(LS_TESTS_AT_SHOW) ?? '0', 10)
      if (totalTests - testsAtLastShow >= MIN_TESTS_BETWEEN) {
        shouldShow = true
        nextPhase = shownCount + 1
      }
    }

    if (!shouldShow) return

    // Suppress ExplicarErroresPanel auto-demo — modal takes over discovery
    try { localStorage.setItem(LS_DEMO_SEEN, '1') } catch { /* noop */ }

    setPhase(nextPhase)

    const timer = setTimeout(() => {
      setOpen(true)
      localStorage.setItem(LS_SHOWN_COUNT, String(shownCount + 1))
      localStorage.setItem(LS_LAST_TEST, testId)
      localStorage.setItem(LS_TESTS_AT_SHOW, String(totalTests))
    }, 800)

    return () => clearTimeout(timer)
  }, [testId, numErrores, totalTests])

  function handleScrollToTutor() {
    setOpen(false)
    setTimeout(() => {
      const el = document.getElementById('analisis-ia')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 250)
  }

  if (numErrores === 0) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={true} className="sm:max-w-md">
        {phase === 1 && (
          <>
            <DialogHeader className="text-center sm:text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <Sparkles className="h-6 w-6" />
              </div>
              <DialogTitle className="text-xl">
                Has fallado {numErrores} pregunta{numErrores !== 1 ? 's' : ''}
              </DialogTitle>
              <DialogDescription asChild>
                <div className="text-base mt-2">
                  {primerError && (
                    <span className="block mb-3 rounded-lg bg-red-50 border border-red-200 p-3 text-left text-sm text-red-800">
                      <span className="font-medium">&laquo;{primerError.enunciado.length > 120
                        ? primerError.enunciado.slice(0, 120) + '...'
                        : primerError.enunciado}&raquo;</span>
                      {primerError.cita && (
                        <span className="block mt-1 text-xs text-red-600">
                          {primerError.cita.ley}, art. {primerError.cita.articulo}
                        </span>
                      )}
                    </span>
                  )}
                  <span className="block">
                    Tu <span className="font-semibold text-foreground">Tutor IA</span> te explica
                    por qu&eacute; fallaste y c&oacute;mo recordar la respuesta correcta.
                  </span>
                  {freeAnalysisRemaining > 0 && (
                    <span className="block mt-2 text-sm font-medium text-green-600">
                      Tienes {freeAnalysisRemaining} an&aacute;lisis gratis
                    </span>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                onClick={handleScrollToTutor}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Ver explicaci&oacute;n del Tutor IA
                <ArrowDown className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="w-full text-muted-foreground"
              >
                Ahora no
              </Button>
            </DialogFooter>
          </>
        )}

        {phase === 2 && (
          <>
            <DialogHeader className="text-center sm:text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-red-500 text-white">
                <TrendingDown className="h-6 w-6" />
              </div>
              <DialogTitle className="text-xl">
                Sigues fallando sin revisar tus errores
              </DialogTitle>
              <DialogDescription asChild>
                <div className="text-base mt-2">
                  <span className="block">
                    Llevas <span className="font-bold text-red-600">{totalTests} tests</span> sin
                    usar el Tutor IA. Sin entender <em>por qu&eacute;</em> fallas,
                    es probable que repitas los mismos errores en el examen.
                  </span>
                  {freeAnalysisRemaining > 0 && (
                    <span className="block mt-2 text-sm font-medium text-green-600">
                      A&uacute;n tienes {freeAnalysisRemaining} an&aacute;lisis gratis sin usar
                    </span>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                onClick={handleScrollToTutor}
                className="w-full bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Revisar mis errores ahora
                <ArrowDown className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="w-full text-muted-foreground"
              >
                Ahora no
              </Button>
            </DialogFooter>
          </>
        )}

        {phase === 3 && (
          <>
            <DialogHeader className="text-center sm:text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <Users className="h-6 w-6" />
              </div>
              <DialogTitle className="text-xl">
                &Uacute;ltimo consejo
              </DialogTitle>
              <DialogDescription asChild>
                <div className="text-base mt-2">
                  <span className="block">
                    Los opositores que revisan sus errores con el Tutor IA
                    <span className="font-bold text-green-600"> mejoran su nota un 23% de media</span> en
                    los siguientes tests.
                  </span>
                  <span className="block mt-2 text-sm text-muted-foreground">
                    No te lo volver&eacute; a recordar. Pero el Tutor siempre estar&aacute;
                    disponible debajo de tus resultados.
                  </span>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                onClick={handleScrollToTutor}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Probar el Tutor IA
                <ArrowDown className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="w-full text-muted-foreground"
              >
                No, gracias
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
