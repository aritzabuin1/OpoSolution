import { describe, it, expect } from 'vitest'
import { buildTourSteps } from '../../components/onboarding/tour-steps'

describe('buildTourSteps', () => {
  it('builds 11 steps for desktop with diasParaExamen (all features covered)', () => {
    const steps = buildTourSteps({ diasParaExamen: 65, isMobile: false })
    expect(steps.length).toBe(11)
    // Step 0 = welcome overlay (no element)
    expect(steps[0].element).toBeUndefined()
    // Step 1 = countdown
    expect(steps[1].element).toBe('[data-tour="countdown"]')
    // Steps 2-8 = nav items (right side on desktop)
    expect(steps[2].element).toBe('[data-tour="nav-tests"]')
    expect(steps[3].element).toBe('[data-tour="nav-psicotecnicos"]')
    expect(steps[4].element).toBe('[data-tour="nav-simulacros"]')
    expect(steps[5].element).toBe('[data-tour="nav-flashcards"]')
    expect(steps[6].element).toBe('[data-tour="nav-cazatrampas"]')
    expect(steps[7].element).toBe('[data-tour="nav-reto-diario"]')
    expect(steps[8].element).toBe('[data-tour="nav-radar"]')
    // Step 9 = stats
    expect(steps[9].element).toBe('[data-tour="stats"]')
    // Step 10 = final CTA (no element)
    expect(steps[10].element).toBeUndefined()
  })

  it('builds 10 steps when diasParaExamen is null (no countdown step)', () => {
    const steps = buildTourSteps({ diasParaExamen: null, isMobile: false })
    expect(steps.length).toBe(10)
    expect(steps.every(s => s.element !== '[data-tour="countdown"]')).toBe(true)
  })

  it('uses bottom position for nav items on mobile', () => {
    const steps = buildTourSteps({ diasParaExamen: 65, isMobile: true })
    const navSteps = steps.filter(s => s.element?.includes('nav-'))
    expect(navSteps.length).toBe(7) // tests, psicotecnicos, simulacros, flashcards, cazatrampas, reto-diario, radar
    navSteps.forEach(s => {
      expect(s.popover.side).toBe('bottom')
    })
  })

  it('includes diasParaExamen in welcome description', () => {
    const steps = buildTourSteps({ diasParaExamen: 42, isMobile: false })
    expect(steps[0].popover.description).toContain('42 días')
  })

  it('omits diasParaExamen from welcome when null', () => {
    const steps = buildTourSteps({ diasParaExamen: null, isMobile: false })
    expect(steps[0].popover.description).not.toContain('días')
  })

  it('last step is always the CTA overlay', () => {
    const steps = buildTourSteps({ diasParaExamen: 65, isMobile: false })
    const last = steps[steps.length - 1]
    expect(last.element).toBeUndefined()
    expect(last.popover.title).toContain('listo')
  })

  it('covers all differentiating features', () => {
    const steps = buildTourSteps({ diasParaExamen: 65, isMobile: false })
    const allText = steps.map(s => s.popover.title + ' ' + s.popover.description).join(' ')
    expect(allText).toContain('BOE')
    expect(allText).toContain('Psicotécnicos')
    expect(allText).toContain('INAP')
    expect(allText).toContain('Flashcards')
    expect(allText).toContain('Caza-Trampas')
    expect(allText).toContain('Reto Diario')
    expect(allText).toContain('Radar')
    expect(allText).toContain('socrático')
  })
})
