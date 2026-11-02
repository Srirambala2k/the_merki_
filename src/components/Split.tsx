import { type ElementType, Fragment } from 'react'
import type { Run } from '../content'

interface Props {
  as?: ElementType
  runs: readonly Run[]
  className?: string
  /** -1 / 1: the side the heading slides toward on exit (read by the timeline). */
  x?: -1 | 1
}

/**
 * A heading split into words, each in its own clipped line box so it can rise into place.
 * The timeline animates `[data-word]`; italic runs keep the serif face. The full text stays available to
 * assistive tech through `aria-label`.
 */
export function Split({ as: Tag = 'h2', runs, className = '', x }: Props) {
  const label = runs.map((r) => r.t).join('')
  return (
    <Tag className={className} data-x={x} aria-label={label}>
      {runs.map((run, i) =>
        run.t
          .split(/\s+/)
          .filter(Boolean)
          .map((word, j) => (
            // The space sits outside the clipped word box, where inline-block would otherwise collapse it.
            <Fragment key={`${i}-${j}`}>
              <span className="w" aria-hidden>
                <span data-word className={`c${run.em ? ' ital' : ''}`}>
                  {word}
                </span>
              </span>{' '}
            </Fragment>
          )),
      )}
    </Tag>
  )
}
