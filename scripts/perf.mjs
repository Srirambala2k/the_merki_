// Measure frame pacing while idle-animating, and sharpness before/after the zoom.
//   node scripts/perf.mjs <url> <label> [slideSteps] [outDir]
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const [url, label, steps = '0', outDir = '.'] = process.argv.slice(2)
mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
for (let i = 0; i < +steps; i++) {
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(2200)
}
await page.waitForTimeout(1500)
const clip = { x: 760, y: 300, width: 480, height: 360 }
await page.screenshot({ path: join(outDir, `${label}-early.png`), clip })

const fps = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const t = []
      const start = performance.now()
      const tick = (now) => {
        t.push(now)
        if (now - start < 4000) requestAnimationFrame(tick)
        else {
          const d = t.slice(1).map((x, i) => x - t[i])
          resolve({ frames: d.length, avgFps: +(1000 / (d.reduce((a, b) => a + b, 0) / d.length)).toFixed(1), over33ms: d.filter((x) => x > 33).length, worstMs: Math.round(Math.max(...d)) })
        }
      }
      requestAnimationFrame(tick)
    }),
)
await page.waitForTimeout(2500)
await page.screenshot({ path: join(outDir, `${label}-late.png`), clip })
console.log(label, JSON.stringify(fps))
await browser.close()
