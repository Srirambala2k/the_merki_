import gsap from 'gsap'
import { useEffect } from 'react'
import { AUTOPLAY } from '../lib/ambient'
import { prefersReducedMotion } from '../lib/env'
import { nextStop, type Slot } from '../lib/schedule'

interface Options {
  slots: Slot[]
  /** Called when a move-and-hold cycle begins, with its length in seconds. */
  onCycle?: (seconds: number) => void
  /** Called when the visitor takes over or a loop restarts. */
  onStop?: () => void
  /** Hold autoplay off entirely (for example while a panel is open). */
  paused?: boolean
  /** Full-screen element faded in to hide the jump back to the start. */
  cover: React.RefObject<HTMLElement | null>
}

/** Dispatch on `window` before scrolling the page programmatically, so autoplay stands aside. */
export const TAKE_OVER = 'merki:take-over'

const off = () => new URLSearchParams(location.search).get('autoplay') === '0'

/**
 * Plays the page by itself, like the reference slider: scroll to the next finished page, hold it, move on,
 * and loop back to the start after the last. Any wheel, touch, key or scroll by the visitor stops it;
 * it picks up again from wherever they left off after a few quiet seconds.
 * It only moves the scroll position, so every effect of the scroll-driven timeline is unchanged.
 */
export function useAutoplay({ slots, onCycle, onStop, paused, cover }: Options) {
  useEffect(() => {
    if (prefersReducedMotion() || off() || paused || !slots.length) return

    const vh = () => innerHeight
    const proxy = { pos: 0 }
    let tl: gsap.core.Timeline | null = null
    let resume: ReturnType<typeof setTimeout> | undefined
    let expected = scrollY // where autoplay last put the page: any other scroll position means the visitor moved it
    let busy = false // true while a cycle is being driven or a loop jump is covered

    const kill = () => {
      tl?.kill()
      tl = null
      busy = false
      if (cover.current) gsap.to(cover.current, { opacity: 0, duration: 0.4, overwrite: true })
    }

    const put = () => {
      expected = Math.round(proxy.pos * vh())
      scrollTo(0, expected)
    }

    const loop = () => {
      busy = true
      onStop?.()
      tl = gsap.timeline()
      tl.to(cover.current, { opacity: 1, duration: 0.7, ease: 'sine.inOut' })
        .call(() => {
          proxy.pos = 0
          put()
        })
        .to({}, { duration: 1.2 }) // the scrubbed timeline catches up while the screen is covered
        .to(cover.current, { opacity: 0, duration: 0.7, ease: 'sine.inOut' })
        .call(() => play(AUTOPLAY.startDelay))
    }

    const play = (delay: number) => {
      kill()
      proxy.pos = scrollY / vh()
      const target = nextStop(slots, proxy.pos)
      if (target === undefined) return loop()
      const move = Math.max(0.6, (target - proxy.pos) / AUTOPLAY.speed)
      busy = true
      onCycle?.(move + AUTOPLAY.hold)
      tl = gsap.timeline({ delay })
      tl.to(proxy, { pos: target, duration: move, ease: 'sine.inOut', onUpdate: put })
        .to({}, { duration: AUTOPLAY.hold })
        .call(() => play(0))
    }

    const takeOver = () => {
      kill()
      onStop?.()
      clearTimeout(resume)
      resume = setTimeout(() => play(0), AUTOPLAY.resumeAfter * 1000)
    }

    const onScroll = () => {
      if (busy && Math.abs(scrollY - expected) > 4) takeOver()
    }
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) takeOver()
    }
    const onVisibility = () => {
      if (document.hidden) {
        kill()
        onStop?.()
      } else {
        clearTimeout(resume)
        resume = setTimeout(() => play(0), 500)
      }
    }

    const intents = ['wheel', 'touchstart', 'pointerdown'] as const
    for (const ev of intents) window.addEventListener(ev, takeOver, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener(TAKE_OVER, takeOver) // the page itself is about to scroll (a nav link): stand aside
    document.addEventListener('visibilitychange', onVisibility)

    play(AUTOPLAY.startDelay)

    return () => {
      kill()
      clearTimeout(resume)
      for (const ev of intents) window.removeEventListener(ev, takeOver)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener(TAKE_OVER, takeOver)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [slots, onCycle, onStop, paused, cover])
}
