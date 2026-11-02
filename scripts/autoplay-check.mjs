// With NO input: record scroll position, current page, zoom and the progress bar over time; then interrupt and watch it resume.
//   node scripts/autoplay-check.mjs <outDir> [seconds]
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const [out, secs = '60'] = process.argv.slice(2)
mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
const sample = () => page.evaluate(() => {
  const vis = [...document.querySelectorAll('[data-stage]')].filter((s) => getComputedStyle(s).visibility === 'visible' && +getComputedStyle(s).opacity > 0.5).map((s) => s.dataset.stage)
  const z = document.querySelector('[data-stage][style*="visibility: inherit"] [data-zoom], [data-stage="p0"] [data-zoom]')
  const bar = document.querySelector('.origin-top')
  return { vp: +(scrollY / innerHeight).toFixed(2), vis: vis.join('+'), zoom: z ? +new DOMMatrix(getComputedStyle(z).transform).a.toFixed(3) : null, bar: bar ? +new DOMMatrix(getComputedStyle(bar).transform).d.toFixed(2) : null }
})
let n = 0
for (let t = 0; t <= +secs; t += 3) {
  console.log(`t=${String(t).padStart(2)}s`, JSON.stringify(await sample()))
  if (t % 12 === 0) await page.screenshot({ path: join(out, `auto-${String(n++).padStart(2, '0')}.png`) })
  await page.waitForTimeout(3000)
}
console.log('errors:', errors.length ? errors : 'none')
await browser.close()
