import gsap from 'gsap'
import { type RefObject, useEffect, useLayoutEffect, useRef } from 'react'
import { AMBIENT } from '../lib/ambient'
import { prefersReducedMotion } from '../lib/env'

interface State {
  /** This stage is the current page. */
  active: boolean
  /** Not in the middle of a dissolve. */
  running: boolean
}

/**
 * While `mounted`, the objects inside `root` keep moving with no input, as on the reference:
 * each `[data-zoom]` zooms 1.0 -> 1.15 over 8s (restarting each time its page becomes current, then holding),
 * the `[data-bg]` plate slowly pushes in and out and drifts (never resetting), and each `[data-depth]` follows the mouse a little.
 * Scroll-driven transforms live on elements nested inside these, so the two never fight.
 *
 * The zoom pauses in place (no snap) during a dissolve, when two full screens are cross-fading and
 * zooming objects as well would cost frames.
 */
export function useAmbient(root: RefObject<HTMLElement | null>, mounted: boolean, { active, running }: State) {
  const zooms = useRef<gsap.core.Tween[]>([])
  const plate = useRef<gsap.core.Tween[]>([])
  const live = useRef({ active, running })
  const wasActive = useRef(false)

  useLayoutEffect(() => {
    const el = root.current
    if (!mounted || !el || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      for (const node of gsap.utils.toArray<HTMLElement>('[data-zoom]')) {
        zooms.current.push(
          gsap.fromTo(node, { scale: 1 }, { scale: AMBIENT.zoom.to, duration: AMBIENT.zoom.duration, ease: AMBIENT.zoom.ease, paused: true }),
        )
      }
      for (const node of gsap.utils.toArray<HTMLElement>('[data-bg]')) {
        const b = AMBIENT.background
        const loop = { ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true } as const
        // Start each axis at a random point of its own cycle so the drift never looks mechanical.
        const drift = [
          gsap.fromTo(node, { scale: b.scale[0] }, { scale: b.scale[1], duration: b.scaleSeconds, ...loop }),
          gsap.fromTo(node, { xPercent: -b.panX * 100 }, { xPercent: b.panX * 100, duration: b.panXSeconds, ...loop }),
          gsap.fromTo(node, { yPercent: -b.panY * 100 }, { yPercent: b.panY * 100, duration: b.panYSeconds, ...loop }),
        ]
        for (const t of drift) t.progress(Math.random())
        plate.current.push(...drift)
      }
    }, el)

    let off = () => {}
    if (matchMedia('(pointer: fine)').matches) {
      const nodes = gsap.utils.toArray<HTMLElement>('[data-depth]', el)
      const movers = nodes.map((node) => ({
        depth: Number(node.dataset.depth),
        x: gsap.quickTo(node, 'x', { duration: AMBIENT.parallax.smooth, ease: 'power3.out' }),
        y: gsap.quickTo(node, 'y', { duration: AMBIENT.parallax.smooth, ease: 'power3.out' }),
      }))
      const onMove = (e: PointerEvent) => {
        if (!live.current.running) return
        const amp = innerWidth * AMBIENT.parallax.amplitude
        const nx = (e.clientX / innerWidth) * 2 - 1
        const ny = (e.clientY / innerHeight) * 2 - 1
        for (const m of movers) {
          m.x(-nx * amp * m.depth)
          m.y(-ny * amp * m.depth)
        }
      }
      window.addEventListener('pointermove', onMove)
      off = () => {
        window.removeEventListener('pointermove', onMove)
        gsap.set(nodes, { x: 0, y: 0 })
      }
    }

    return () => {
      off()
      ctx.revert()
      zooms.current = []
      plate.current = []
      wasActive.current = false
    }
  }, [root, mounted])

  useEffect(() => {
    live.current = { active, running }
    for (const z of zooms.current) {
      if (active && !wasActive.current) z.restart() // a page that has just become current starts its zoom afresh
      z.paused(!(active && running))
    }
    for (const t of plate.current) t.paused(!(active && running))
    wasActive.current = active
  }, [active, running, mounted])
}
