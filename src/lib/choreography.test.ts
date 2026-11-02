import { describe, expect, it } from 'vitest'
import { SCENES } from '../content'
import { sections } from '../pages.config'
import { autoMotion, SCROLL, type Window } from './choreography'

describe('scroll windows', () => {
  const windows = Object.values(SCROLL) as Window[]
  it('are ordered and within 0..1', () => {
    for (const [start, end] of windows) {
      expect(start).toBeGreaterThanOrEqual(0)
      expect(end).toBeLessThanOrEqual(1)
      expect(start).toBeLessThan(end)
    }
  })
  it('objects arrive before they settle, and the words are in before the scene has settled', () => {
    expect(SCROLL.arrive[1]).toBeLessThan(SCROLL.settle[0])
    expect(SCROLL.textIn[1]).toBeLessThan(SCROLL.settle[1])
  })
})

describe('sections', () => {
  it('skips page 3, which repeats the page 0 scene', () => {
    expect(sections.map((s) => s.id)).toEqual(['p1', 'p2', 'p0', 'p4', 'p5', 'p6', 'p7', 'p8'])
  })
  it('carry the scenes in content order, so HUD index, copy and artwork agree', () => {
    expect(sections.map((s) => s.scene)).toEqual(SCENES.map((s) => s.id))
  })
  it('take their header tone from the scene theme', () => {
    sections.forEach((s, i) => expect(s.tone).toBe(SCENES[i].theme === 'dark' ? 'light' : 'ink'))
  })
  it('every layer has motion and every section has a positive scroll range', () => {
    for (const s of sections) {
      expect(s.range).toBeGreaterThan(0)
      for (const l of s.layers) expect(s.motion[l.id], `${s.id}.${l.id}`).toBeDefined()
    }
  })
})

describe('autoMotion', () => {
  it('sends an off-centre object back toward its own side', () => {
    const m = autoMotion({ x: 0.7, y: 0.4, w: 0.1, h: 0.1 })
    expect(m.hero.x).toBeGreaterThan(0)
    expect(m.hero.o).toBe(0)
    expect(m.a.o).toBe(1)
  })
  it('lifts a centred object from below', () => {
    const m = autoMotion({ x: 0.45, y: 0.45, w: 0.1, h: 0.1 })
    expect(m.hero.x).toBe(0)
    expect(m.hero.y).toBeGreaterThan(0)
  })
})
