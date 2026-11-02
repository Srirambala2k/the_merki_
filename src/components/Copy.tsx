import { useLayoutEffect, useRef } from 'react'
import { COPY, SCENES, type SceneId } from '../content'
import { useActions } from '../lib/actions'
import { PROCESS_STOPS } from '../lib/process'
import { Split } from './Split'

const fade = { 'data-fade': '' }
const YEAR = new Date().getFullYear()

function ProcessPath() {
  const path = useRef<SVGPathElement>(null)
  const nodes = useRef<(HTMLElement | null)[]>([])

  // Drop a node on the path at each step's stop. Positions are in the path's own 0-100 space, which is
  // stretched over the whole scene, so percentages line up exactly.
  useLayoutEffect(() => {
    const p = path.current
    if (!p) return
    const len = p.getTotalLength()
    PROCESS_STOPS.forEach((u, i) => {
      const pt = p.getPointAtLength(u * len)
      const el = nodes.current[i]
      if (el) Object.assign(el.style, { left: `${pt.x}%`, top: `${pt.y}%` })
    })
  }, [])

  return (
    <>
      <svg className="path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <path ref={path} data-path id="proc-path" pathLength="1" d="M12 64 Q 50 112 88 64" />
        <path data-glow id="proc-glow" pathLength="1" d="M12 64 Q 50 112 88 64" />
      </svg>
      {PROCESS_STOPS.map((u, i) => (
        <i key={u} ref={(el) => void (nodes.current[i] = el)} data-node={i} className="node" />
      ))}
      <div data-orb className="orb" aria-hidden>
        <i className="o-glow" />
        <i className="o-core" />
      </div>
    </>
  )
}

const Button = ({ onClick, children, solid }: { onClick: () => void; children: React.ReactNode; solid?: boolean }) => (
  <button type="button" className={`btn${solid ? ' solid' : ''}`} onClick={onClick} {...fade}>
    {children}
  </button>
)

/** The words of one scene, laid out as on the reference site. Everything animatable carries a data attribute. */
export function SceneCopy({ id }: { id: SceneId }) {
  const { goTo, openContact, openWork } = useActions()
  const theme = SCENES.find((s) => s.id === id)!.theme

  let body: React.ReactNode
  switch (id) {
    case 'intro': {
      const c = COPY.intro
      body = (
        <>
          <div className="row" style={{ ['--top' as string]: '36%', ['--gap' as string]: '19vw' }}>
            <Split as="h1" runs={c.left} className="h1 col-l" x={-1} />
            <Split as="h1" runs={c.right} className="h1 col-r" x={1} />
          </div>
          <div className="foot-center hero-foot" data-tdepth="0.5">
            <p className="lead" {...fade}>
              {c.lead[0]} <br />
              {c.lead[1]}
            </p>
            <Button onClick={() => goTo('work')}>{c.button}</Button>
          </div>
          <div className="scroll-hint" {...fade}>
            <span>{c.scroll}</span>
            <i />
          </div>
        </>
      )
      break
    }
    case 'about': {
      const c = COPY.about
      body = (
        <>
          <div className="row edge" style={{ ['--top' as string]: '38%', ['--gap' as string]: '14vw' }}>
            <Split runs={c.heading} className="h2 col-l" x={-1} />
            <div className="col-r" data-tdepth="0.8">
              <p className="body" {...fade}>{c.body}</p>
            </div>
          </div>
          <div className="foot-center">
            <Button onClick={openContact}>{COPY.cta.project}</Button>
          </div>
        </>
      )
      break
    }
    case 'services': {
      const c = COPY.services
      const pos = ['svc-a', 'svc-b', 'svc-c', 'svc-d']
      const depth = [0.4, 0.9, 0.7, 1.1]
      body = (
        <>
          <Split runs={c.title} className="h2 corner-title" x={-1} />
          {c.items.map((s, i) => (
            <div key={s.title} className={`svc ${pos[i]}`} data-tdepth={depth[i]}>
              <h3 {...fade}>{s.title}</h3>
              <p {...fade}>{s.text}</p>
            </div>
          ))}
          <div className="foot-center">
            <Button onClick={() => goTo('process')}>{c.button}</Button>
          </div>
        </>
      )
      break
    }
    case 'work': {
      const c = COPY.work
      body = (
        <>
          <div className="row edge" style={{ ['--top' as string]: '44%', ['--gap' as string]: '27vw' }}>
            <Split runs={c.left} className="h2 col-l" x={-1} />
            <Split runs={c.right} className="h2 col-r" x={1} />
          </div>
          <div className="foot-center">
            <div className="btn-row">
              <Button onClick={openWork}>{COPY.cta.seeWork}</Button>
              <Button onClick={openContact}>{COPY.cta.project}</Button>
            </div>
          </div>
        </>
      )
      break
    }
    case 'philosophy': {
      const c = COPY.philosophy
      body = (
        <>
          <div className="row edge" style={{ ['--top' as string]: '38%', ['--gap' as string]: '14vw' }}>
            <Split runs={c.heading} className="h2 col-l" x={-1} />
            <div className="col-r" data-tdepth="0.8">
              <p className="body" {...fade}>{c.body}</p>
            </div>
          </div>
          <div className="foot-center">
            <Button onClick={openContact}>{COPY.cta.project}</Button>
          </div>
        </>
      )
      break
    }
    case 'process': {
      const c = COPY.process
      const depth = [0.3, 0.6, 0.6, 0.3]
      body = (
        <>
          <Split runs={c.title} className="h2 corner-title" x={-1} />
          <ProcessPath />
          {c.steps.map((s, i) => (
            <div key={s} className={`step st${i + 1}`} data-tdepth={depth[i]} data-step={i}>
              <span {...fade}>{String(i + 1).padStart(2, '0')}</span>
              <h3 {...fade}>{s}</h3>
            </div>
          ))}
          <div className="foot-center">
            <Button onClick={() => goTo('clients')}>{c.button}</Button>
          </div>
        </>
      )
      break
    }
    case 'clients': {
      const c = COPY.clients
      body = (
        <>
          <div className="row" style={{ ['--top' as string]: '34%', ['--gap' as string]: '20vw' }}>
            <Split runs={c.left} className="h2 col-l" x={-1} />
            <Split runs={c.right} className="h2 col-r" x={1} />
          </div>
          <div className="quote-wrap" data-tdepth="0.6">
            <figure className="quote" {...fade}>
              <p className="qt">{c.quote}</p>
              <figcaption>{c.attribution}</figcaption>
            </figure>
            <Button onClick={openWork}>{COPY.cta.seeWork}</Button>
          </div>
          <div className="marquee" {...fade} aria-label="What we do">
            <div className="track">
              {[...c.marquee, ...c.marquee].map((m, i) => (
                <span key={i} aria-hidden={i >= c.marquee.length}>{m}</span>
              ))}
            </div>
          </div>
        </>
      )
      break
    }
    case 'contact': {
      const c = COPY.contact
      body = (
        <>
          <div className="row" style={{ ['--top' as string]: '62%', ['--gap' as string]: '24vw' }}>
            <Split as="h2" runs={c.left} className="h1 col-l" x={-1} />
            <Split as="h2" runs={c.right} className="h1 col-r" x={1} />
          </div>
          <div className="foot-center" data-tdepth="0.4">
            <p className="lead" {...fade}>
              {c.lead[0]} <br />
              {c.lead[1]}
            </p>
            <Button onClick={openContact}>{COPY.cta.project}</Button>
          </div>
          <footer className="legal" {...fade}>{COPY.legal(YEAR)}</footer>
        </>
      )
      break
    }
  }

  return (
    <div className="scene-copy" data-theme={theme}>
      {body}
    </div>
  )
}
