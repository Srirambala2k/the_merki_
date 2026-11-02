// Prove the always-on motion: park the page at a composed scene, touch nothing, and sample transforms over time.
import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 810 } })
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.evaluate(() => scrollTo(0, 2 * innerHeight))
await page.waitForTimeout(2500)
const snap = () => page.evaluate(() => {
  const st = document.querySelector('[data-stage="p0"]')
  const g = (sel) => [...st.querySelectorAll(sel)].map((e) => getComputedStyle(e).transform)
  const bg = st.querySelector('picture img')
  return { zoom: g('[data-zoom]').slice(0, 3), bgTransform: getComputedStyle(bg.parentElement).transform }
})
for (const t of [0, 2, 4, 6]) { if (t) await page.waitForTimeout(2000); console.log(`t=${t}s`, JSON.stringify(await snap())) }
await browser.close()
