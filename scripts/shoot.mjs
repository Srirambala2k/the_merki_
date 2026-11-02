// Visual check: step through every slide and save a screenshot of each.
//   node scripts/shoot.mjs <outDir> [width] [height] [url]
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const [outDir, w = '1920', h = '1080', url = 'http://localhost:5173/'] = process.argv.slice(2)
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: +w, height: +h } })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto(url, { waitUntil: 'networkidle' })

const count = await page.locator('section').count()
for (let i = 0; i < count; i++) {
  await page.waitForTimeout(i === 0 ? 3000 : 3200) // transition + entrance + cooldown
  await page.screenshot({ path: join(outDir, `slide-${i}.png`) })
  await page.keyboard.press('ArrowDown')
}
console.log('slides', count, 'errors', errors.length ? errors : 'none')
await browser.close()
