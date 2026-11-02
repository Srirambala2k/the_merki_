import { useState } from 'react'

interface Candidate {
  /** URL without extension. */
  base: string
  width: number
}

interface Props {
  candidates: Candidate[]
  sizes: string
  eager?: boolean
  className?: string
}

const srcSet = (c: Candidate[], ext: string) => c.map((x) => `${x.base}.${ext} ${x.width}w`).join(', ')

/** AVIF -> WebP <picture> that fades in once decoded, so the blur placeholder never pops. */
export function Picture({ candidates, sizes, eager = false, className = '' }: Props) {
  const [loaded, setLoaded] = useState(false)
  const largest = candidates.reduce((a, b) => (b.width > a.width ? b : a))
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(candidates, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(candidates, 'webp')} sizes={sizes} />
      <img
        ref={(el) => {
          if (el?.complete && el.naturalWidth) setLoaded(true)
        }}
        src={`${largest.base}.webp`}
        alt=""
        draggable={false}
        decoding="async"
        fetchPriority={eager ? 'high' : 'auto'}
        onLoad={() => setLoaded(true)}
        className={`block size-full select-none transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      />
    </picture>
  )
}
