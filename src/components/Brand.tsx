import { useEffect, useRef } from 'react'
import { BRAND, COPY, NAV, SCENES, whatsappLink } from '../content'
import { useActions } from '../lib/actions'

/** The M mark. Its outline draws itself in on load (CSS), then fills. */
function Mark() {
  return (
    <svg className="mark" viewBox="-1 -1 46 38" aria-hidden>
      <path pathLength="1" d="M0 36V0h8l12 14L32 0h8v28h-8V12L20 26 8 12v24z" />
      <rect pathLength="1" x="35" y="30" width="6" height="6" />
    </svg>
  )
}

/** Logo, section links, Instagram and the contact pill. Pinned to the top of the viewport. */
export function Header() {
  const { goTo, openContact } = useActions()
  return (
    <header className="nav">
      <a className="brand" href="#" onClick={(e) => (e.preventDefault(), goTo('intro'))} aria-label={`${BRAND.name} — home`}>
        <Mark />
        <span className="wordmark" aria-hidden>THE MERKI</span>
      </a>
      <nav className="links" aria-label="Primary">
        {NAV.map((n) => (
          <a key={n.to} href="#" onClick={(e) => (e.preventDefault(), goTo(n.to))}>
            {n.label}
          </a>
        ))}
        <a className="ig" href={BRAND.instagram} target="_blank" rel="noopener noreferrer" aria-label={COPY.nav.instagramLabel}>
          <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="5.2" />
            <circle cx="12" cy="12" r="4.1" />
            <circle cx="17.4" cy="6.6" r=".6" fill="currentColor" />
          </svg>
        </a>
        <button type="button" className="pill" onClick={openContact}>
          {COPY.nav.project}
        </button>
      </nav>
    </header>
  )
}

/** Bottom-left scene counter and name, plus the thin progress rail on the right edge. */
export function Hud({ index, railRef }: { index: number; railRef: React.RefObject<HTMLElement | null> }) {
  return (
    <aside className="hud" aria-hidden>
      <div className="count">
        <span key={index} className="hud-swap">{String(index + 1).padStart(2, '0')}</span>
        <i />
        <span>{String(SCENES.length).padStart(2, '0')}</span>
      </div>
      <div key={SCENES[index].name} className="hud-name hud-swap">{SCENES[index].name}</div>
      <div className="rail">
        <b ref={railRef as React.RefObject<HTMLElement>} />
      </div>
    </aside>
  )
}

const WhatsApp = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path
      fill="currentColor"
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
    />
  </svg>
)

/** Floating WhatsApp button; its pre-filled message follows the scene on screen. */
export function Enquiry({ index }: { index: number }) {
  const link = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    if (link.current) link.current.href = whatsappLink(SCENES[index].whatsapp)
  }, [index])
  return (
    <a ref={link} className="enq" href={whatsappLink()} target="_blank" rel="noopener noreferrer" aria-label="Enquire on WhatsApp">
      <WhatsApp />
      <span>{COPY.enquiry}</span>
    </a>
  )
}
