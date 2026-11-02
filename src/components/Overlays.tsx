import gsap from 'gsap'
import { type FormEvent, useEffect, useRef } from 'react'
import { BRAND, COPY, whatsappLink } from '../content'
import { Split } from './Split'

interface PanelProps {
  open: boolean
  onClose: () => void
  label: string
  className: string
  children: React.ReactNode
}

/** A full-screen panel that wipes up from the bottom. Escape or the close button dismisses it. */
function Panel({ open, onClose, label, className, children }: PanelProps) {
  const el = useRef<HTMLDivElement>(null)
  const first = useRef(true)

  useEffect(() => {
    const panel = el.current
    if (!panel) return
    if (first.current) {
      first.current = false
      gsap.set(panel, { clipPath: 'inset(100% 0 0 0)', visibility: 'hidden' })
      if (!open) return
    }
    if (open) {
      panel.scrollTop = 0
      gsap.set(panel, { visibility: 'visible' })
      gsap.to(panel, { clipPath: 'inset(0% 0 0 0)', duration: 0.9, ease: 'expo.inOut' })
      gsap.fromTo(panel.querySelectorAll('[data-panel-in]'), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.08, delay: 0.45, ease: 'power3.out' })
      panel.querySelector<HTMLElement>('input, button, a')?.focus({ preventScroll: true })
    } else {
      gsap.to(panel, { clipPath: 'inset(100% 0 0 0)', duration: 0.9, ease: 'expo.inOut', onComplete: () => void gsap.set(panel, { visibility: 'hidden' }) })
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div ref={el} role="dialog" aria-modal="true" aria-label={label} aria-hidden={!open} className={`overlay ${className}`}>
      <button type="button" className="close" onClick={onClose}>
        {COPY.contactForm.close}
      </button>
      {children}
    </div>
  )
}

/** "Start a project": validates, then opens the visitor's mail app with the message filled in. */
export function ContactPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const c = COPY.contactForm
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>
    let ok = true
    for (const field of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')) {
      const bad = !field.value.trim() || (field.type === 'email' && !/^\S+@\S+\.\S+$/.test(field.value))
      field.classList.toggle('bad', bad)
      if (bad) ok = false
    }
    if (!ok) return
    const subject = encodeURIComponent(`New project — ${data.name}`)
    const body = encodeURIComponent(`${data.message}  ${data.name} · ${data.email}`)
    location.href = `mailto:${BRAND.email}?subject=${subject}&body=${body}`
  }
  return (
    <Panel open={open} onClose={onClose} label={c.eyebrow} className="contact">
      <form onSubmit={onSubmit} noValidate>
        <p className="eyebrow" data-panel-in>{c.eyebrow}</p>
        <h2 className="h1" data-panel-in>
          {c.heading[0].t}
          <br />
          <em>{c.heading[1].t}</em>
        </h2>
        <div className="fields" data-panel-in>
          <label>
            <span>{c.name}</span>
            <input name="name" required autoComplete="name" />
          </label>
          <label>
            <span>{c.email}</span>
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label className="wide">
            <span>{c.message}</span>
            <textarea name="message" rows={3} required />
          </label>
        </div>
        <button className="btn solid" type="submit" data-panel-in>{c.send}</button>
      </form>
    </Panel>
  )
}

/** "Proof of work": what the agency does, and where to follow it. */
export function WorkPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const c = COPY.workPanel
  return (
    <Panel open={open} onClose={onClose} label={c.eyebrow} className="work">
      <div className="work-inner">
        <p className="eyebrow" data-panel-in>{c.eyebrow}</p>
        <div data-panel-in>
          <Split as="h2" runs={c.heading} className="h1" />
        </div>
        <p className="work-lead" data-panel-in>{c.lead}</p>
        <div className="vouch" data-panel-in>
          {c.vouch.map((v) => (
            <article key={v.title}>
              <h3>{v.title}</h3>
              <p>{v.text}</p>
            </article>
          ))}
        </div>
        <div className="ig-card" data-panel-in>
          <div>
            <p className="eyebrow">{c.follow}</p>
            <p className="ig-handle">{BRAND.instagramHandle}</p>
            <p className="chips">
              {c.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </p>
          </div>
          <div className="ig-actions">
            <a className="btn solid" href={BRAND.instagram} target="_blank" rel="noopener noreferrer">{c.instagramCta}</a>
            <a className="btn" href={whatsappLink(c.whatsappMessage)} target="_blank" rel="noopener noreferrer">{c.whatsappCta}</a>
          </div>
        </div>
      </div>
    </Panel>
  )
}
