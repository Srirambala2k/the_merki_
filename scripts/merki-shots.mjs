// Screenshot each scene of the reference site (merki-lime.vercel.app) by driving its own scroll.
//   node scripts/merki-shots.mjs <outDir> [w] [h]
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const [out, w = '1440', h = '900'] = process.argv.slice(2)
mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: +w, height: +h } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('https://merki-lime.vercel.app/', { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(3500)
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
console.log('scroll range px', total, 'viewport', h)
for (let i = 0; i < 8; i++) {
  const y = Math.round((total * i) / 7)
  await page.evaluate((y) => window.scrollTo(0, y), y)
  await page.waitForTimeout(3200)
  await page.screenshot({ path: join(out, `scene-${i + 1}.png`) })
  const info = await page.evaluate(() => ({ hud: document.querySelector('#hud-i')?.textContent, name: document.querySelector('#hud-name')?.textContent }))
  console.log(i + 1, y, JSON.stringify(info))
}
console.log('errors', errors.length ? errors : 'none')
await browser.close()
