// Render the page at chosen scroll fractions (video viewport size) for side-by-side comparison with the reference video.
//   node scripts/compare.mjs <outDir> [w] [h] [fractions comma list]
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const [out, w = '884', h = '862', fr = '0,0.062,0.186,0.5,0.93'] = process.argv.slice(2)
mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: +w, height: +h } })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
const range = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
for (const f of fr.split(',').map(Number)) {
  await page.evaluate((y) => scrollTo(0, y), Math.round(range * f))
  await page.waitForTimeout(2200) // let the scrub catch up
  await page.screenshot({ path: join(out, `ours-${f}.png`) })
}
console.log('range', range, 'errors', errors.length ? errors : 'none')
await browser.close()
