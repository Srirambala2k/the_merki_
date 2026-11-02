// Render every section at several progress fractions -> <outDir>/<id>-<f>.png
//   node scripts/sections.mjs <outDir> [w] [h] [fractions]
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const [out, w = '1440', h = '810', fr = '0,0.2,0.6,1'] = process.argv.slice(2)
mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: +w, height: +h } })
const errors = []
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errors.push(`${m.type()}: ${m.text()}`))
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
const secs = await page.evaluate(() => [...document.querySelectorAll('[data-section]')].map((s) => ({ id: s.dataset.section, top: s.offsetTop, h: s.offsetHeight })))
for (const s of secs) {
  for (const f of fr.split(',').map(Number)) {
    const y = s.top + (s.h - +h) * f
    await page.evaluate((y) => scrollTo(0, y), y)
    await page.waitForTimeout(2300)
    await page.screenshot({ path: join(out, `${s.id}-${f}.png`) })
  }
}
console.log(secs.map((s) => `${s.id}:${s.h}`).join(' '), '\nconsole:', errors.length ? [...new Set(errors)] : 'clean')
await browser.close()
