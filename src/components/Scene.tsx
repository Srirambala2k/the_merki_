import type { Section, SectionLayer } from '../pages.config'
import { Picture } from './Picture'

/** Layers grouped by `group`, in draw order; each group is one rigid unit for zoom and parallax. */
function groupLayers(layers: SectionLayer[]): SectionLayer[][] {
  const groups = new Map<string, SectionLayer[]>()
  for (const l of layers) groups.set(l.group, [...(groups.get(l.group) ?? []), l])
  return [...groups.values()]
}

/** The point a group's zoom grows from: its centre, or for something standing on the ground, its feet. */
function origin(group: SectionLayer[]): string {
  const x0 = Math.min(...group.map((l) => l.x))
  const x1 = Math.max(...group.map((l) => l.x + l.w))
  const y0 = Math.min(...group.map((l) => l.y))
  const y1 = Math.max(...group.map((l) => l.y + l.h))
  const y = group.every((l) => l.grounded) ? y1 : (y0 + y1) / 2
  return `${((x0 + x1) / 2) * 100}% ${y * 100}%`
}

function Group({ id, group, mounted }: { id: string; group: SectionLayer[]; mounted: boolean }) {
  return (
    <div data-depth={group[0].depth} className="absolute inset-0 will-change-transform">
      <div data-zoom className="absolute inset-0 will-change-transform" style={{ transformOrigin: origin(group) }}>
        {group.map((l) => (
          <div
            key={l.id}
            data-layer={l.id}
            className="absolute will-change-transform"
            style={{ left: `${l.x * 100}%`, top: `${l.y * 100}%`, width: `${l.w * 100}%`, height: `${l.h * 100}%` }}
          >
            {mounted && (
              <div
                className="size-full"
                style={{
                  clipPath: l.clip === 'top' ? 'inset(0 0 50% 0)' : l.clip === 'bottom' ? 'inset(50% 0 0 0)' : undefined,
                  transform: l.flip ? 'scaleX(-1)' : undefined,
                }}
              >
                <Picture
                  sizes={`${(l.w * 100).toFixed(1)}vw`}
                  candidates={[
                    { base: `/img/layers/${id}-${l.file ?? l.id}-half`, width: Math.round(l.px / 2) },
                    { base: `/img/layers/${id}-${l.file ?? l.id}`, width: l.px },
                  ]}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * The artwork for one section. Nesting, outside in:
 *   plate (slow push and drift) > background image + grounded objects
 *   group (mouse parallax) > zoom (subject zoom) > layer (scroll timeline)   for floating objects
 * Layer wrappers always exist (the timeline needs them); images load once `mounted`.
 */
export function Scene({ section, mounted }: { section: Section; mounted: boolean }) {
  const { id, ratio, lqip, bgWidths, layers } = section
  const groups = groupLayers(layers)
  const grounded = groups.filter((g) => g.every((l) => l.grounded))
  const floating = groups.filter((g) => !g.every((l) => l.grounded))
  return (
    <div className="stage" style={{ ['--ar' as string]: ratio, backgroundImage: `url(${lqip})` }}>
      <div data-bg className="absolute inset-0 will-change-transform">
        {mounted && (
          <Picture
            eager={id === 'p0'}
            sizes={`max(100vw, calc(100svh * ${ratio}))`}
            candidates={bgWidths.map((w) => ({ base: `/img/bg/${id}-${w}`, width: w }))}
          />
        )}
        {grounded.map((g) => (
          <Group key={g[0].group} id={id} group={g} mounted={mounted} />
        ))}
      </div>
      {floating.map((g) => (
        <Group key={g[0].group} id={id} group={g} mounted={mounted} />
      ))}
    </div>
  )
}
