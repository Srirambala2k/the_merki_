/**
 * Where every section sits on the single page-long scroll timeline.
 * Units are viewports of scroll (1 = one screen height of scrolling).
 */
export const TRANSITION = {
  /** Scroll length of the dissolve between two pages. */
  length: 1,
  /** The next page starts composing this far (fraction of `length`) into the dissolve. */
  overlap: 0.5,
} as const

export interface Slot {
  /** Compose timeline start. */
  start: number
  /** Compose timeline end; the dissolve to the next page starts here. */
  end: number
}

export interface Schedule {
  slots: Slot[]
  /** Total scroll range in viewports. */
  total: number
}

/** `ranges[i]` is how many viewports of scrolling section i needs to compose itself. */
export function schedule(ranges: number[]): Schedule {
  let start = 0
  const slots = ranges.map((range) => {
    const slot = { start, end: start + range }
    start = slot.end + TRANSITION.length * TRANSITION.overlap
    return slot
  })
  return { slots, total: slots.at(-1)?.end ?? 0 }
}

/** Which section is "current" at scroll position `pos`: it flips at the middle of each dissolve. */
export function indexAt(slots: Slot[], pos: number): number {
  let index = 0
  for (let i = 0; i < slots.length - 1; i++) {
    if (pos >= slots[i].end + TRANSITION.length / 2) index = i + 1
  }
  return index
}

/** True while a dissolve between two pages is under way at scroll position `pos`. */
export function dissolving(slots: Slot[], pos: number): boolean {
  return slots.some((slot, i) => i < slots.length - 1 && pos > slot.end && pos < slot.end + TRANSITION.length)
}

/** The next scroll position at which autoplay pauses (a page fully composed) after `pos`, or undefined past the last. */
export function nextStop(slots: Slot[], pos: number): number | undefined {
  return slots.map((slot) => slot.end).find((end) => end > pos + 0.02)
}
