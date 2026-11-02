/** Honours the OS "reduce motion" setting, unless the page is opened with ?motion=full. */
export const prefersReducedMotion = () =>
  new URLSearchParams(location.search).get('motion') !== 'full' && matchMedia('(prefers-reduced-motion: reduce)').matches
