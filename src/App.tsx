import gsap from 'gsap'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Enquiry, Header, Hud } from './components/Brand'
import { SceneCopy } from './components/Copy'
import { ContactPanel, WorkPanel } from './components/Overlays'
import { Stage } from './components/Stage'
import { SCENES, type SceneId, sceneIndex } from './content'
import { TAKE_OVER, useAutoplay } from './hooks/useAutoplay'
import { useMasterTimeline } from './hooks/useMasterTimeline'
import { type Actions, ActionsContext } from './lib/actions'
import { schedule } from './lib/schedule'
import { sections } from './pages.config'

const { slots, total } = schedule(sections.map((s) => s.range))

export default function App() {
  const track = useRef<HTMLElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const cover = useRef<HTMLDivElement>(null)
  const rail = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const [dissolving, setDissolving] = useState(false)
  const [panel, setPanel] = useState<'contact' | 'work' | null>(null)

  const onState = useCallback((s: { index: number; dissolving: boolean }) => {
    setActive(s.index)
    setDissolving(s.dissolving)
  }, [])
  const onProgress = useCallback((p: number) => {
    if (rail.current) rail.current.style.transform = `scaleY(${p})`
  }, [])
  useMasterTimeline({ track, root: viewport, sections, onState, onProgress })
  useAutoplay({ slots, cover, paused: panel !== null })

  // While a panel is open the page behind it must not move.
  useEffect(() => {
    document.documentElement.style.overflow = panel ? 'hidden' : ''
    return () => void (document.documentElement.style.overflow = '')
  }, [panel])

  const actions = useMemo<Actions>(
    () => ({
      goTo: (scene: SceneId) => {
        window.dispatchEvent(new Event(TAKE_OVER))
        const target = slots[sceneIndex(scene)].end * innerHeight
        const proxy = { y: scrollY }
        gsap.to(proxy, {
          y: target,
          duration: gsap.utils.clamp(1.1, 2.4, Math.abs(target - scrollY) / innerHeight / 3),
          ease: 'power3.inOut',
          onUpdate: () => scrollTo(0, proxy.y),
          overwrite: true,
        })
      },
      openContact: () => setPanel('contact'),
      openWork: () => setPanel('work'),
    }),
    [],
  )
  const close = useCallback(() => setPanel(null), [])

  return (
    <ActionsContext.Provider value={actions}>
      <div className="mk" data-theme={SCENES[active].theme}>
        {/* Page height: the scroll range plus the one screen the pinned viewport itself occupies. */}
        <main ref={track} className="relative" style={{ height: `${(total + 1) * 100}svh` }}>
          <div ref={viewport} className="sticky top-0 h-svh overflow-hidden bg-[#0b0b0b]">
            {sections.map((s, i) => (
              // Only the current page and its neighbours hold images; the zoom pauses during a dissolve (two full screens are cross-fading).
              <Stage key={s.id} section={s} mounted={Math.abs(i - active) <= 1} active={i === active} running={!dissolving}>
                <SceneCopy id={s.scene} />
              </Stage>
            ))}
            <div ref={cover} data-cover aria-hidden className="pointer-events-none absolute inset-0 z-[35] bg-[#dfe5e5] opacity-0" />
          </div>
        </main>
        <Header />
        <Hud index={active} railRef={rail} />
        <Enquiry index={active} />
        <ContactPanel open={panel === 'contact'} onClose={close} />
        <WorkPanel open={panel === 'work'} onClose={close} />
      </div>
    </ActionsContext.Provider>
  )
}
