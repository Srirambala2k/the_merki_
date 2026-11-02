/**
 * Always-on motion, measured from the reference hero (wearebrand.io):
 * every subject layer zooms slowly while its slide is up, the background plate stays still,
 * the mouse nudges layers by a few pixels, and the slider advances by itself.
 */
export const AMBIENT = {
  /** Subject zoom: 1.0 -> 1.15 over 8s, linear, one way, restarting on every new slide. */
  zoom: { to: 1.15, duration: 8, ease: 'none' },
  /**
   * The background plate (the reference keeps it still; here it drifts slowly): a push-in and out with a gentle
   * pan. The scale never drops below 1 + 2 * pan, so the plate's edges are never exposed.
   */
  background: { scale: [1.05, 1.15], scaleSeconds: 16, panX: 0.015, panXSeconds: 21, panY: 0.01, panYSeconds: 27 },
  /** Mouse parallax: max shift at depth 1, as a fraction of viewport width (the reference moves about +-15px at 1920). */
  parallax: { amplitude: 0.012, smooth: 0.8 },
} as const

export const AUTOPLAY = {
  /** How fast the page scrolls itself, in viewports per second. */
  speed: 0.85,
  /** Seconds a finished page is held (the reference holds a slide about 9s in all, zoom running). */
  hold: 5.5,
  /** Seconds the opening headline is shown before the first page starts composing. */
  startDelay: 0.8,
  /** Seconds of no input after the visitor takes over before autoplay resumes. */
  resumeAfter: 4,
} as const
