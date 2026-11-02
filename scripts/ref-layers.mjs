// Reference anatomy: per slide, every image layer with natural vs rendered size, file size, and animation CSS.
import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
await page.goto('https://wearebrand.io/', { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(3500)

const data = await page.evaluate(async () => {
  const out = []
  const slides = [...document.querySelectorAll('sr7-module sr7-slide')]
  for (const [i, s] of slides.entries()) {
    const imgs = []
    for (const el of s.querySelectorAll('img, sr7-bg, sr7-img')) {
      const img = el.tagName === 'IMG' ? el : el.querySelector('img')
      const cs = getComputedStyle(el)
      const bgUrl = /url\("?([^")]+)/.exec(cs.backgroundImage)?.[1]
      const src = img?.currentSrc || img?.src || img?.dataset?.src || bgUrl
      if (!src || src.startsWith('data:')) continue
      const r = (img ?? el).getBoundingClientRect()
      let bytes = null, type = null
      try {
        const res = await fetch(src, { method: 'HEAD' })
        bytes = +res.headers.get('content-length') || null
        type = res.headers.get('content-type')
      } catch {}
      imgs.push({
        file: src.split('/').pop(),
        natural: img ? `${img.naturalWidth}x${img.naturalHeight}` : '?',
        shown: `${Math.round(r.width)}x${Math.round(r.height)}`,
        kb: bytes ? Math.round(bytes / 1024) : null,
        type,
        willChange: cs.willChange,
        transform: cs.transform === 'none' ? '' : cs.transform,
      })
    }
    out.push({ slide: i, imgs })
  }
  return {
    slides: out,
    canvases: [...document.querySelectorAll('canvas')].map((c) => `${c.width}x${c.height}`),
    dpr: devicePixelRatio,
  }
})
console.log(JSON.stringify(data, null, 1))
await browser.close()
