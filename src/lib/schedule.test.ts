import { describe, expect, it } from 'vitest'
import { dissolving, indexAt, nextStop, schedule, TRANSITION } from './schedule'

describe('schedule', () => {
  const { slots, total } = schedule([3, 2, 2])

  it('places sections in order, each after the previous one has begun dissolving', () => {
    expect(slots[0]).toEqual({ start: 0, end: 3 })
    expect(slots[1].start).toBe(3 + TRANSITION.length * TRANSITION.overlap)
    expect(slots[1].start).toBeGreaterThan(slots[0].end)
    expect(slots[2].start).toBeGreaterThan(slots[1].end)
  })
  it('ends where the last section ends', () => {
    expect(total).toBe(slots[2].end)
  })
  it('handles no sections', () => {
    expect(schedule([])).toEqual({ slots: [], total: 0 })
  })
})

describe('indexAt', () => {
  const { slots } = schedule([3, 2, 2])
  it('stays on a section until the middle of the dissolve', () => {
    expect(indexAt(slots, 0)).toBe(0)
    expect(indexAt(slots, 3.4)).toBe(0)
    expect(indexAt(slots, 3.5)).toBe(1)
  })
  it('reaches the last section', () => {
    expect(indexAt(slots, 100)).toBe(2)
  })
})

describe('dissolving', () => {
  const { slots } = schedule([3, 2, 2])
  it('is true only inside a dissolve window', () => {
    expect(dissolving(slots, 2.9)).toBe(false)
    expect(dissolving(slots, 3.5)).toBe(true)
    expect(dissolving(slots, 4.2)).toBe(false)
  })
  it('does not treat the end of the last page as a dissolve', () => {
    expect(dissolving(slots, slots[2].end + 0.5)).toBe(false)
  })
})

describe('nextStop', () => {
  const { slots } = schedule([3, 2, 2])
  it('finds the end of the page being composed, then the next page', () => {
    expect(nextStop(slots, 0)).toBe(3)
    expect(nextStop(slots, 2.9)).toBe(3)
    expect(nextStop(slots, 2.99)).toBe(slots[1].end) // within the tolerance of the stop: already there
    expect(nextStop(slots, 3)).toBe(slots[1].end)
    expect(nextStop(slots, 3.2)).toBe(slots[1].end)
  })
  it('is undefined after the last page', () => {
    expect(nextStop(slots, slots[2].end)).toBeUndefined()
  })
})
