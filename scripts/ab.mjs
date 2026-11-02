// A/B frame pacing: apply CSS tweaks to the live page and re-measure.
import { chromium } from 'playwright'

const variants = {
  baseline: '',
  'no grain (blend-mode)': '.grain{display:none!important}',
  'no will-change': '*{will-change:auto!important}',
  'no grain + no will-change': '.grain{display:none!important}*{will-change:auto!important}',
  'no grain + no progress/chevrons': '.grain,.progress,nav{display:none!important}',
}
const browser = await chromium.launch()
for (const [name, css] of Object.entries(variants)) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  if (css) await page.addStyleTag({ content: css })
  await page.waitForTimeout(2500)
  const r = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const t = []
        const s = performance.now()
        const tick = (n) => {
          t.push(n)
          if (n - s < 3000) requestAnimationFrame(tick)
          else {
            const d = t.slice(1).map((x, i) => x - t[i])
            resolve(`${(1000 / (d.reduce((a, b) => a + b, 0) / d.length)).toFixed(1)} fps, ${d.filter((x) => x > 33).length} slow frames`)
          }
        }
        requestAnimationFrame(tick)
      }),
  )
  console.log(name.padEnd(36), r)
  await page.close()
}
await browser.close()
