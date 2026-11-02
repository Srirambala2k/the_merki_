import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { type RefObject, useLayoutEffect } from 'react'
import type { Pose, Window } from '../lib/choreography'
import { prefersReducedMotion } from '../lib/env'
import { PROCESS_STOPS } from '../lib/process'
import { dissolving, indexAt, schedule, TRANSITION } from '../lib/schedule'
import type { Section } from '../pages.config'

gsap.registerPlugin(ScrollTrigger)

/** A window given as fractions of a section, placed on the page timeline (units: viewports). */
const place = ([a, b]: Window, start: number, range: number) => ({ at: start + a * range, duration: (b - a) * range })

/** Pose -> tween vars. Offsets are fractions of the viewport, re-read on every refresh so resizes stay correct. */
const transform = (p: Pose) => ({ x: () => p.x * innerWidth, y: () => p.y * innerHeight, scale: p.s })

const stage = (id: string) => `[data-stage="${id}"]`

/** Spread `count` staggered items evenly across a window: each takes `share` of it, the rest is the stagger. */
function staggered(count: number, duration: number, share = 0.45) {
  const each = count > 1 ? (duration * (1 - share)) / (count - 1) : 0
  return { duration: duration * share, stagger: each }
}

/** One page's text: reveals as the page composes and leaves as the dissolve begins. */
function copy(tl: gsap.core.Timeline, s: Section, start: number, scope: HTMLElement, first: boolean, last: boolean) {
  const q = (sel: string) => `${stage(s.id)} ${sel}`
  const count = (sel: string) => scope.querySelectorAll(q(sel)).length
  const words = count('[data-word]')
  const fades = count('[data-fade]')
  const textIn = place(s.windows.textIn, start, s.range)

  if (!first) {
    // The first page's copy is on screen from the start; every other page reveals its own as it composes.
    if (words) tl.fromTo(q('[data-word]'), { yPercent: 118 }, { yPercent: 0, ease: 'power3.out', ...staggered(words, textIn.duration) }, textIn.at)
    if (fades) tl.fromTo(q('[data-fade]'), { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, ease: 'power2.out', ...staggered(fades, textIn.duration, 0.5) }, textIn.at + textIn.duration * 0.25)
  }

  // Slow drift of the text blocks against the artwork across the page's scroll.
  for (const el of scope.querySelectorAll<HTMLElement>(q('[data-tdepth]'))) {
    const n = Number(el.dataset.tdepth) * 46
    tl.fromTo(el, { y: first ? 0 : n }, { y: -n, ease: 'none', duration: s.range }, start)
  }

  if (!last) {
    // Leaves as the dissolve starts: lines slide off toward their own side, everything else lifts and fades.
    const end = start + s.range
    const L = TRANSITION.length
    if (fades) tl.to(q('[data-fade]'), { autoAlpha: 0, y: -34, ease: 'power2.in', duration: 0.18 * L }, end)
    for (const el of scope.querySelectorAll<HTMLElement>(q('[data-x]'))) {
      tl.to(el, { x: Number(el.dataset.x) * 140, ease: 'power2.in', duration: 0.25 * L }, end)
    }
    if (words) tl.to(q('[data-word]'), { autoAlpha: 0, ease: 'none', duration: 0.25 * L }, end + 0.05 * L)
  }
}

/** The Process page: an orb travels the path, lighting each step as it reaches it. */
function orbJourney(tl: gsap.core.Timeline, s: Section, start: number, scope: HTMLElement) {
  const root = scope.querySelector<HTMLElement>(stage(s.id))
  const path = root?.querySelector<SVGPathElement>('[data-path]')
  const orb = root?.querySelector<HTMLElement>('[data-orb]')
  if (!root || !path || !orb) return
  const glow = root.querySelector<SVGPathElement>('[data-glow]')
  const steps = [...root.querySelectorAll<HTMLElement>('[data-step]')]
  const nodes = [...root.querySelectorAll<HTMLElement>('[data-node]')]
  const length = path.getTotalLength()
  let reached = -1

  const pulse = (el: HTMLElement | undefined, cls: string) => {
    if (!el) return
    el.classList.remove(cls)
    void el.offsetWidth // restart the CSS animation
    el.classList.add(cls)
  }

  const progress = { u: 0 }
  const w = place([0.42, 0.9], start, s.range)
  tl.fromTo(
    progress,
    { u: 0 },
    {
      u: 1,
      ease: 'none',
      duration: w.duration,
      onUpdate: () => {
        const u = progress.u
        const pt = path.getPointAtLength(u * length)
        orb.style.left = `${pt.x}%`
        orb.style.top = `${pt.y}%`
        orb.style.opacity = String(Math.min(1, u * 14)) // stays at the last step until the page dissolves away
        glow?.style.setProperty('stroke-dashoffset', String(1 - u))
        // Only the step the orb has most recently reached is lit; the earlier ones fall back to dim.
        const current = u > 0 ? PROCESS_STOPS.findLastIndex((stop) => u >= stop) : -1
        steps.forEach((step, i) => step.classList.toggle('on', i === current))
        if (current !== reached) {
          if (current > reached) {
            pulse(steps[current], 'hit')
            pulse(nodes[current], 'ping')
          }
          reached = current
        }
      },
    },
    w.at,
  )
}

/** One page composing itself: objects arrive, then settle. */
function compose(tl: gsap.core.Timeline, s: Section, start: number) {
  const arrive = place(s.windows.arrive, start, s.range)
  const appear = place(s.windows.appear, start, s.range)
  const settle = place(s.windows.settle, start, s.range)
  for (const [id, m] of Object.entries(s.motion)) {
    const el = `${stage(s.id)} [data-layer="${id}"]`
    tl.fromTo(el, transform(m.hero), { ...transform(m.a), ease: 'power2.out', duration: arrive.duration }, arrive.at)
    tl.fromTo(el, { opacity: m.hero.o }, { opacity: m.a.o, duration: appear.duration }, appear.at)
    tl.to(el, { x: 0, y: 0, scale: 1, ease: 'power2.inOut', duration: settle.duration }, settle.at)
  }
}

/**
 * The dissolve between two pages, starting at `t`:
 * the next page wipes up from the bottom while fading in, and the old one fades out underneath.
 */
function dissolve(tl: gsap.core.Timeline, from: Section, to: Section, t: number) {
  const L = TRANSITION.length
  const at = (f: number) => t + f * L
  const d = (f: number) => f * L
  const wipe = { ease: 'power2.inOut', duration: d(0.85) }

  tl.fromTo(stage(to.id), { autoAlpha: 0 }, { autoAlpha: 1, ease: 'none', duration: d(0.85) }, at(0.05))
  tl.fromTo(stage(to.id), { yPercent: 100 }, { yPercent: 0, ...wipe }, at(0.05))
  tl.fromTo(`[data-inner="${to.id}"]`, { yPercent: -100 }, { yPercent: 0, ...wipe }, at(0.05))
  tl.to(stage(from.id), { autoAlpha: 0, ease: 'none', duration: d(0.5) }, at(0.5))
}

interface Options {
  track: RefObject<HTMLElement | null>
  /** The fixed viewport holding every page's stage. */
  root: RefObject<HTMLElement | null>
  sections: Section[]
  /** Called as the scroll moves: the current page (flips at a dissolve's midpoint) and whether a dissolve is under way. */
  onState: (state: { index: number; dissolving: boolean }) => void
  /** Overall progress 0..1, for the rail. Called on every scroll update, so keep it cheap. */
  onProgress?: (progress: number) => void
}

/**
 * One scrubbed timeline over the whole page scroll. Pages compose themselves one after another and
 * dissolve into each other; positions are in viewports of scroll, so a page's length is its `range`.
 */
export function useMasterTimeline({ track, root, sections, onState, onProgress }: Options) {
  useLayoutEffect(() => {
    const trackEl = track.current
    const rootEl = root.current
    if (!trackEl || !rootEl) return
    const { slots, total } = schedule(sections.map((s) => s.range))

    // Pages after the first wait out of sight until their dissolve.
    gsap.set(sections.slice(1).map((s) => stage(s.id)), { autoAlpha: 0 })

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: trackEl,
          start: 'top top',
          end: 'bottom bottom',
          scrub: prefersReducedMotion() ? true : 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const pos = self.progress * total
            onState({ index: indexAt(slots, pos), dissolving: dissolving(slots, pos) })
            onProgress?.(self.progress)
          },
        },
      })
      tl.set({}, {}, total) // timeline length = scroll range, so positions are viewports
      sections.forEach((s, i) => {
        const start = slots[i].start
        compose(tl, s, start)
        copy(tl, s, start, rootEl, i === 0, i === sections.length - 1)
        if (s.scene === 'process') orbJourney(tl, s, start, rootEl)
        if (i < sections.length - 1) dissolve(tl, s, sections[i + 1], slots[i].end)
      })
    }, rootEl)

    return () => ctx.revert()
  }, [track, root, sections, onState, onProgress])
}
