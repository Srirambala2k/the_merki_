import { type ReactNode, useRef } from 'react'
import { useAmbient } from '../hooks/useAmbient'
import type { Section } from '../pages.config'
import { Scene } from './Scene'

/**
 * One page's full-viewport stage. The outer element is what the dissolve wipes up and fades; the inner one
 * counter-moves so the artwork stays put while the edge travels across it. Its objects zoom on their own while it is
 * the current page (see useAmbient).
 */
export function Stage({ section, mounted, active, running, children }: { section: Section; mounted: boolean; active: boolean; running: boolean; children?: ReactNode }) {
  const inner = useRef<HTMLDivElement>(null)
  useAmbient(inner, mounted, { active, running })
  return (
    <div data-stage={section.id} className="absolute inset-0 overflow-hidden bg-[#9aa5a4]">
      <div ref={inner} data-inner={section.id} className="absolute inset-0">
        <Scene section={section} mounted={mounted} />
        {children}
      </div>
    </div>
  )
}
