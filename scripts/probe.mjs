// Diagnose motion: report zoom scale, parallax/float offsets and save a moved-mouse shot.
//   node scripts/probe.mjs <outDir> [width] [height] [reducedMotion]
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const [outDir, w = '1366', h = '768', rm = 'no-preference'] = process.argv.slice(2)
mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, reducedMotion: rm })
const page = await ctx.newPage()
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.waitForTimeout(3000)
await page.mouse.move(+w * 0.1, +h * 0.1)
await page.mouse.move(+w * 0.9, +h * 0.9, { steps: 20 })
await page.waitForTimeout(1500)
const info = await page.evaluate(() => {
  const t = (el) => getComputedStyle(el).transform
  const s0 = document.querySelector('section')
  return {
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    finePointer: matchMedia('(pointer: fine)').matches,
    zoom: t(s0.querySelector('[data-zoom]')),
    firstDepth: t(s0.querySelector('[data-depth]')),
    firstFloat: t(s0.querySelector('[data-float]')),
  }
})
console.log(JSON.stringify(info, null, 1))
await page.screenshot({ path: join(outDir, `probe-${w}x${h}-${rm}.png`) })
await browser.close()
