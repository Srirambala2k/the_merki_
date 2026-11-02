// Does the zoom soften the subject? Screenshot crop at rest vs near full zoom, with and without will-change.
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'
const out = process.argv[2]; mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
for (const [name, css] of [['willchange-on', ''], ['willchange-off', '*{will-change:auto!important}']]) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  for (let i = 0; i < 5; i++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(2000) }
  if (css) await page.addStyleTag({ content: css })
  await page.waitForTimeout(500)
  const clip = { x: 790, y: 360, width: 360, height: 270 }
  await page.screenshot({ path: join(out, `${name}-a.png`), clip })
  await page.waitForTimeout(4500)
  await page.screenshot({ path: join(out, `${name}-b.png`), clip })
  await page.close()
}
await browser.close()
