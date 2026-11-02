// Screenshot the page at given scroll positions (in viewports of scroll) to inspect a dissolve.
//   node scripts/transition.mjs <outDir> <w> <h> <pos,pos,...>
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const [out, w = '1285', h = '771', ps = '3.15,3.35,3.5,3.7,3.9'] = process.argv.slice(2)
mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: +w, height: +h } })
const errors = []
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errors.push(`${m.type()}: ${m.text()}`))
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://localhost:5173/?autoplay=0', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
for (const p of ps.split(',').map(Number)) {
  await page.evaluate((y) => scrollTo(0, y), Math.round(p * +h))
  await page.waitForTimeout(2600)
  await page.screenshot({ path: join(out, `pos-${p}.png`) })
}
console.log('console:', errors.length ? [...new Set(errors)] : 'clean')
await browser.close()
