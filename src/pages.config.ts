import { SCENES, type SceneId } from './content'
import { autoMotion, DRAW_ORDER, LAYER_MOTION, type LayerMotion, SCROLL, type Windows } from './lib/choreography'
import { type GeneratedLayer, generated } from './slides.generated'

/** A cut-out placed in a section's artwork, with how it takes part in the always-on motion. */
export interface SectionLayer extends GeneratedLayer {
  /** Layers sharing a group zoom, bob and shift as one rigid piece (objects that touch each other). */
  group: string
  /** Mouse-parallax depth: 0 = fixed, 1 = moves the most. */
  depth: number
  /** Stands on the background: moves with the plate and zooms from its feet so it never slides or sinks. */
  grounded: boolean
  /** Image to draw when it differs from `id` (one image can serve several layers). */
  file?: string
  /** Draw only this half of the image. */
  clip?: 'top' | 'bottom'
  flip?: boolean
}

export interface Section {
  id: string
  /** Which scene's copy this page carries. */
  scene: SceneId
  /** Colour of the fixed header while this section is on screen: ink on light artwork, white on dark. */
  tone: 'ink' | 'light'
  /** Viewports of scrolling this page needs to compose itself. */
  range: number
  ratio: number
  lqip: string
  bgWidths: number[]
  /** Back-to-front. */
  layers: SectionLayer[]
  motion: Record<string, LayerMotion>
  windows: Windows
}

/** Re-places an extracted image: `width` is the object's visible width as a fraction of the artwork's width. */
interface Placement {
  id: string
  file: string
  cx: number
  cy: number
  width: number
  /** Visible height as a fraction of the artwork's height. Omit to keep the image's own proportions. */
  height?: number
  group?: string
  depth?: number
  clip?: 'top' | 'bottom'
  flip?: boolean
}

interface Spec {
  id: string
  scene: SceneId
  order: string[]
  /** Replaces `order` when the objects have to be recomposed rather than left where the source scenes put them. */
  place?: Placement[]
}

/**
 * Page order, which is the order of the scenes in `content.ts`: each scene's copy sits on the artwork it is
 * paired with on the reference site. Page 3 is deliberately absent: it is the same scene as page 0.
 * Layer ids are those produced by tools/layers.json.
 */
/** Distant bodies move least; small near objects and birds move most. */
const DEPTH: Record<string, number> = {
  moon: 0.2, moon_l: 0.2, moon_s: 0.25, planet: 0.2, rings: 0.35, door: 0.4, man: 0.5, stairs: 0.55,
  rock: 0.6, ufo: 0.6, tram: 0.6, astronaut: 0.6, lamp: 0.6, stone: 0.7, unicorn: 0.7, bulb: 0.7,
  chair_seat: 0.8, chair_float: 0.8, birds: 0.9,
}

/** Objects that physically touch must not drift apart, so they share one group (and one depth). */
const GROUPS: Record<string, { group: string; depth: number }> = {
  'p0.rock': { group: 'island', depth: 0.55 },
  'p0.man': { group: 'island', depth: 0.55 },
  'p0.chair_seat': { group: 'island', depth: 0.55 },
  'p0.lamp': { group: 'island', depth: 0.55 },
  'p6.planet': { group: 'planet', depth: 0.3 },
  'p6.rings': { group: 'planet', depth: 0.3 },
  'p6.stairs': { group: 'planet', depth: 0.3 },
  'p6.door': { group: 'planet', depth: 0.3 },
}

/** Layers that stand on the artwork's ground rather than floating in front of it. */
const GROUNDED = new Set(['p1.man'])

/**
 * The Process planet, composed as on the reference. In the source scenes each object sits alone (a planet, a loose
 * door, a stack of steps, a flat ring, a few birds); here they are assembled: the ring circles the planet, passing
 * behind its top half (`clip: 'top'`, drawn first) and in front of its bottom half (`clip: 'bottom'`, drawn after),
 * the door stands on the planet and the steps descend from it. Positions and sizes were measured from the reference.
 */
const P6_PLANET: Placement[] = [
  { id: 'ring_back', file: 'rings', cx: 0.515, cy: 0.447, width: 0.79, group: 'planet', depth: 0.3, clip: 'top' },
  { id: 'planet', file: 'planet', cx: 0.513, cy: 0.4075, width: 0.346, group: 'planet', depth: 0.3 },
  { id: 'ring_front', file: 'rings', cx: 0.515, cy: 0.447, width: 0.79, group: 'planet', depth: 0.3, clip: 'bottom' },
  { id: 'door', file: 'door', cx: 0.5169, cy: 0.4158, width: 0.0454, height: 0.1545, group: 'planet', depth: 0.3 },
  { id: 'stairs', file: 'stairs', cx: 0.5193, cy: 0.638, width: 0.141, height: 0.2835, group: 'planet', depth: 0.3 },
  // Flocks: the same few gulls, repeated at different sizes and mirrored, so the sky is never empty.
  { id: 'flock_centre', file: 'birds_flock', cx: 0.5, cy: 0.284, width: 0.4, depth: 0.9 },
  { id: 'flock_right', file: 'birds_flock', cx: 0.775, cy: 0.17, width: 0.23, depth: 0.95, flip: true },
  { id: 'flock_left', file: 'birds_flock', cx: 0.19, cy: 0.26, width: 0.27, depth: 0.85, flip: true },
  { id: 'bird_single', file: 'birds_single', cx: 0.105, cy: 0.215, width: 0.1, depth: 1 },
]

const SPECS: Spec[] = [
  { id: 'p1', scene: 'intro', order: ['stone', 'man'] },
  { id: 'p2', scene: 'about', order: ['ufo'] },
  { id: 'p0', scene: 'services', order: DRAW_ORDER },
  { id: 'p4', scene: 'work', order: ['moon', 'stone'] },
  { id: 'p5', scene: 'philosophy', order: ['birds', 'astronaut'] },
  { id: 'p6', scene: 'process', order: [], place: P6_PLANET },
  { id: 'p7', scene: 'clients', order: ['unicorn'] },
  { id: 'p8', scene: 'contact', order: ['tram'] },
]

export const sections: Section[] = SPECS.map((spec) => {
  const page = generated.find((s) => s.id === spec.id)
  if (!page) throw new Error(`no generated data for ${spec.id}`)
  const layers: SectionLayer[] = spec.place
    ? spec.place.map((pl) => {
        const src = page.layers.find((l) => l.id === pl.file)
        if (!src) throw new Error(`${spec.id} has no image ${pl.file}`)
        // The extracted box carries a 1% pad each side; scale so the visible object, not the box, hits `width`.
        const k = pl.width / (src.w - 0.02)
        const w = src.w * k
        const h = pl.height ? src.h * (pl.height / (src.h - 0.02)) : src.h * k
        return { ...src, id: pl.id, file: pl.file, x: pl.cx - w / 2, y: pl.cy - h / 2, w, h, group: pl.group ?? pl.id, depth: pl.depth ?? 0.5, grounded: false, clip: pl.clip, flip: pl.flip }
      })
    : spec.order.map((id) => {
        const layer = page.layers.find((l) => l.id === id)
        if (!layer) throw new Error(`${spec.id} has no layer ${id}`)
        const g = GROUPS[`${spec.id}.${id}`]
        const grounded = GROUNDED.has(`${spec.id}.${id}`)
        return { ...layer, group: g?.group ?? id, depth: grounded ? 0 : (g?.depth ?? DEPTH[id] ?? 0.5), grounded }
      })
  const tuned = spec.id === 'p0'
  return {
    id: spec.id,
    scene: spec.scene,
    tone: SCENES.find((c) => c.id === spec.scene)!.theme === 'dark' ? 'light' : 'ink',
    range: 2,
    ratio: page.bg.ratio,
    lqip: page.bg.lqip,
    bgWidths: page.bg.widths,
    layers,
    motion: Object.fromEntries(
      layers.map((l) => {
        const lead = layers.find((o) => o.group === l.group)!
        return [l.id, tuned ? LAYER_MOTION[l.id] : autoMotion(lead)]
      }),
    ),
    windows: SCROLL,
  }
})
