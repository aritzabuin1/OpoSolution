import { describe, it, expect } from 'vitest'
import { buildTourSteps } from '../../components/onboarding/tour-steps'

describe('buildTourSteps', () => {
  it('builds 7 steps for desktop with diasParaExamen', () => {
    const steps = buildTourSteps({ diasParaExamen: 65, isMobile: false })
    expect(steps.length).toBe(7)
    // Step 0 = welcome overlay (no element)
    expect(steps[0].element).toBeUndefined()
    // Step 1 = countdown
    expect(steps[1].element).toBe('[data-tour="countdown"]')
    // Steps 2-3 = nav items (right side on desktop)
    expect(steps[2].popover.side).toBe('right')
    expect(steps[3].popover.side).toBe('right')
    // Step 6 = final CTA (no element)
    expect(steps[6].element).toBeUndefined()
  })

  it('builds 6 steps when diasParaExamen is null (no countdown step)', () => {
    const steps = buildTourSteps({ diasParaExamen: null, isMobile: false })
    expect(steps.length).toBe(6)
    // No countdown step
    expect(steps.every(s => s.element !== '[data-tour="countdown"]')).toBe(true)
  })

  it('uses bottom position for nav items on mobile', () => {
    const steps = buildTourSteps({ diasParaExamen: 65, isMobile: true })
    const navSteps = steps.filter(s => s.element?.includes('nav-'))
    expect(navSteps.length).toBe(2)
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
    expect(last.popover.title).toBe('¡Todo listo!')
  })
})
