import { describe, it, expect } from 'vitest'
import { injectMidArticleCTA, getInlineCTAHtml } from '../../components/blog/BlogCTA'

describe('injectMidArticleCTA', () => {
  const ctaHtml = getInlineCTAHtml()

  it('injects CTA before the 3rd h2 when 3+ h2 tags exist', () => {
    const html = '<h2>First</h2><p>text</p><h2>Second</h2><p>text</p><h2>Third</h2><p>text</p>'
    const result = injectMidArticleCTA(html)
    expect(result).toContain(ctaHtml)
    // CTA should appear before the 3rd <h2>
    const ctaIdx = result.indexOf('Pon a prueba')
    const thirdH2Idx = result.indexOf('<h2>Third')
    expect(ctaIdx).toBeLessThan(thirdH2Idx)
  })

  it('does not inject CTA when fewer than 3 h2 tags', () => {
    const html = '<h2>First</h2><p>text</p><h2>Second</h2><p>text</p>'
    const result = injectMidArticleCTA(html)
    expect(result).not.toContain('Pon a prueba')
    expect(result).toBe(html)
  })

  it('does not inject CTA when no h2 tags', () => {
    const html = '<p>Just a paragraph</p>'
    const result = injectMidArticleCTA(html)
    expect(result).toBe(html)
  })

  it('handles h2 with attributes', () => {
    const html = '<h2 id="a">First</h2><p>t</p><h2 class="x">Second</h2><p>t</p><h2 id="b">Third</h2>'
    const result = injectMidArticleCTA(html)
    expect(result).toContain('Pon a prueba')
  })

  it('handles 5+ h2 tags (only injects once, before the 3rd)', () => {
    const html = '<h2>1</h2><h2>2</h2><h2>3</h2><h2>4</h2><h2>5</h2>'
    const result = injectMidArticleCTA(html)
    const matches = result.match(/Pon a prueba/g)
    expect(matches?.length).toBe(1)
  })
})
