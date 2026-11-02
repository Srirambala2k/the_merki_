// Capture the reference site's hero: screenshots per slide + transform samples to measure its motion.
//   node scripts/ref-probe.mjs <outDir>
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const out = process.argv[2]
mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto('https://wearebrand.io/', { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(4000)

const layers = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('sr7-module sr7-slide')].map((s, i) => ({
      i,
      cls: s.className,
      vis: getComputedStyle(s).visibility,
      layers: [...s.querySelectorAll('.sr7-layer')].slice(0, 14).map((l) => ({
        id: l.id.replace('SR7_2_1-', ''),
        tag: l.tagName.toLowerCase(),
        t: getComputedStyle(l).transform,
        o: getComputedStyle(l).opacity,
        z: getComputedStyle(l).zIndex,
        r: (({ x, y, width, height }) => [x, y, width, height].map(Math.round))(l.getBoundingClientRect()),
      })),
    })),
  )

await page.screenshot({ path: join(out, 'ref-0.png') })
console.log('SLIDE0', JSON.stringify((await layers())[0], null, 0))
for (let i = 1; i < 5; i++) {
  await page.mouse.move(960, 540)
  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(450)
  await page.screenshot({ path: join(out, `ref-${i}-mid.png`) })
  await page.waitForTimeout(2600)
  await page.screenshot({ path: join(out, `ref-${i}.png`) })
}
// mouse parallax measurement on whatever slide is active
const before = await layers()
await page.mouse.move(100, 100)
await page.mouse.move(1800, 1000, { steps: 20 })
await page.waitForTimeout(1200)
const after = await layers()
const act = before.findIndex((s) => s.vis === 'visible')
console.log('PARALLAX slide', act)
before[act]?.layers.forEach((l, k) => {
  const a = after[act].layers[k]
  console.log(l.id, l.tag, 'rect', l.r.join(','), '->', a.r.join(','))
})
await browser.close()
