// Our Process scene vs the reference's, same viewport, orb at the end of its path.
import { chromium } from 'playwright'
const out = process.argv[2]
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1807, height: 868 } })
await page.goto('http://localhost:5173/?autoplay=0', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.evaluate(() => scrollTo(0, 14.4 * innerHeight)); await page.waitForTimeout(3200)
await page.screenshot({ path: `${out}/ours.png` })
const ref = await browser.newPage({ viewport: { width: 1807, height: 868 } })
await ref.goto('https://merki-lime.vercel.app/', { waitUntil: 'networkidle' })
await ref.waitForTimeout(3500)
const total = await ref.evaluate(() => document.documentElement.scrollHeight - innerHeight)
for (const f of [0.69, 0.71, 0.73]) {
  await ref.evaluate((y) => scrollTo(0, y), Math.round(total * f)); await ref.waitForTimeout(3200)
  console.log(f, await ref.evaluate(() => document.querySelector('#hud-name')?.textContent))
  await ref.screenshot({ path: `${out}/ref-${f}.png` })
}
await browser.close()
