/**
 * Scroll choreography. The island page's poses were tuned against the reference video; the other pages
 * use poses generated from where each object sits in the artwork.
 * Scroll progress runs 0..1 across a section; every window is a [start, end] range of it.
 */
export interface Pose {
  /** Offset from the layer's resting place, as a fraction of viewport width. */
  x: number
  /** Offset from the resting place, as a fraction of viewport height. */
  y: number
  /** Scale about the layer's centre. */
  s: number
  /** Opacity. */
  o: number
}

export type Window = readonly [number, number]

export interface Windows {
  /** Objects fly in from the hero state to their first positions. */
  arrive: Window
  /** Opacity part of the arrival, which is quicker than the move. */
  appear: Window
  /** Objects settle into the finished scene. */
  settle: Window
  /** The page's words rise into place. */
  textIn: Window
}

/** The same rhythm for every page; each is two viewports of scroll long. */
export const SCROLL: Windows = {
  arrive: [0.06, 0.3],
  appear: [0.06, 0.18],
  settle: [0.38, 0.8],
  textIn: [0.12, 0.36],
}

export interface LayerMotion {
  /** Scroll 0: scattered / hidden. */
  hero: Pose
  /** First arrangement, before the objects settle. */
  a: Pose
}

const hidden = (x: number, y: number): Pose => ({ x, y, s: 1, o: 0 })
const ghost = (x: number, y: number): Pose => ({ x, y, s: 0.9, o: 0.14 })

/** First page, tuned against the video. Resting place is each layer's natural position in the artwork. */
export const LAYER_MOTION: Record<string, LayerMotion> = {
  man: { hero: ghost(-0.46, -0.42), a: { x: -0.09, y: -0.058, s: 1, o: 1 } },
  chair_seat: { hero: ghost(-0.44, 0.07), a: { x: -0.11, y: 0.06, s: 0.82, o: 1 } },
  rock: { hero: hidden(0, 0.9), a: { x: -0.045, y: 0.105, s: 0.956, o: 1 } },
  lamp: { hero: hidden(0.5, -0.3), a: { x: 0.077, y: -0.087, s: 1, o: 1 } },
  bulb: { hero: hidden(0, -0.5), a: { x: -0.017, y: -0.12, s: 1, o: 1 } },
  moon_l: { hero: hidden(0.3, -0.5), a: { x: 0.104, y: -0.073, s: 1, o: 1 } },
  moon_s: { hero: hidden(0.2, -0.5), a: { x: 0.044, y: -0.109, s: 1, o: 1 } },
  stairs: { hero: hidden(0.3, 0.8), a: { x: 0, y: 0.18, s: 1, o: 1 } },
  chair_float: { hero: hidden(-0.2, 0.8), a: { x: -0.08, y: 0.13, s: 1, o: 1 } },
}

/** Back-to-front draw order of the first page's layers. */
export const DRAW_ORDER = ['moon_l', 'moon_s', 'bulb', 'lamp', 'rock', 'chair_seat', 'man', 'stairs', 'chair_float']

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Motion for a layer with no hand-tuned poses: it arrives from the direction it sits in
 * (away from the centre of the artwork), and anything near the middle rises from below.
 */
export function autoMotion(box: Box): LayerMotion {
  const cx = box.x + box.w / 2 - 0.5
  const cy = box.y + box.h / 2 - 0.5
  const len = Math.hypot(cx, cy)
  const [dx, dy] = len < 0.08 ? [0, 1] : [cx / len, cy / len]
  const reach = 0.7
  return {
    hero: { x: dx * reach * 0.8, y: dy * reach, s: 0.92, o: 0 },
    a: { x: dx * reach * 0.14, y: dy * reach * 0.14, s: 0.97, o: 1 },
  }
}
