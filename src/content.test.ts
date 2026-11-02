import { describe, expect, it } from 'vitest'
import { BRAND, COPY, NAV, SCENES, sceneIndex, whatsappLink } from './content'

describe('content', () => {
  it('has the eight scenes in order, each with a name, theme and WhatsApp message', () => {
    expect(SCENES.map((s) => s.name)).toEqual(['Intro', 'About', 'Services', 'Work', 'Philosophy', 'Process', 'Clients', 'Contact'])
    for (const s of SCENES) {
      expect(['light', 'dark']).toContain(s.theme)
      expect(s.whatsapp.startsWith('Hi The Merki')).toBe(true)
    }
  })
  it('navigation points at real scenes', () => {
    for (const n of NAV) expect(sceneIndex(n.to)).toBeGreaterThanOrEqual(0)
  })
  it('has four services, four process steps and six proof-of-work items', () => {
    expect(COPY.services.items).toHaveLength(4)
    expect(COPY.process.steps).toHaveLength(4)
    expect(COPY.workPanel.vouch).toHaveLength(6)
  })
  it('builds a WhatsApp link with the number and an encoded message', () => {
    expect(whatsappLink()).toBe(`https://wa.me/${BRAND.whatsappNumber}`)
    expect(whatsappLink('Hi The Merki, a b')).toContain('?text=Hi%20The%20Merki%2C%20a%20b')
  })
})
