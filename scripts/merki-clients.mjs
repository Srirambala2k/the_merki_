// Find the "Clients" scene of the reference by scanning scroll positions and reading its HUD.
import { chromium } from 'playwright'
const out = process.argv[2]
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('https://merki-lime.vercel.app/', { waitUntil: 'networkidle' })
await page.waitForTimeout(3000)
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
let shot = false
for (let f = 0; f <= 1.0001; f += 0.04) {
  await page.evaluate((y) => scrollTo(0, y), Math.round(total * f))
  await page.waitForTimeout(1400)
  const n = await page.evaluate(() => document.querySelector('#hud-name')?.textContent)
  console.log(f.toFixed(2), n)
  if (n === 'Clients' && !shot) { await page.waitForTimeout(1800); await page.screenshot({ path: out + '/clients.png' }); shot = true }
}
await browser.close()
