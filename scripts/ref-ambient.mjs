// Watch the reference hero with NO input: which slide is active, and which elements' transforms change over time.
//   node scripts/ref-ambient.mjs <outDir>
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const out = process.argv[2]
mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto('https://wearebrand.io/', { waitUntil: 'networkidle', timeout: 60000 })

const sample = () =>
  page.evaluate(() => {
    const mod = document.querySelector('sr7-module')
    const slides = [...mod.querySelectorAll('sr7-slide')]
    const activeIdx = slides.findIndex((s) => getComputedStyle(s).visibility === 'visible' && getComputedStyle(s).opacity !== '0')
    const els = []
    for (const [i, s] of slides.entries()) {
      for (const el of s.querySelectorAll('sr7-img, sr7-bg, canvas, sr7-txt, sr7-row, sr7-zone')) {
        const cs = getComputedStyle(el)
        if (cs.transform !== 'none' || el.tagName === 'CANVAS') {
          els.push([`s${i}:${el.tagName.toLowerCase()}#${el.id.replace('SR7_2_1-', '')}`, cs.transform === 'none' ? '' : cs.transform, cs.opacity])
        }
      }
    }
    const canv = [...mod.querySelectorAll('canvas')].map((c) => `${c.width}x${c.height}@${getComputedStyle(c).opacity}/${getComputedStyle(c).visibility}`)
    return { activeIdx, els, canv, t: performance.now() | 0 }
  })

const rows = []
for (let i = 0; i < 20; i++) {
  rows.push(await sample())
  if (i % 3 === 0) await page.screenshot({ path: join(out, `t${String(i * 2).padStart(2, '0')}.png`) })
  await page.waitForTimeout(2000)
}
console.log('active slide over time (every 2s):', rows.map((r) => r.activeIdx).join(' '))
const track = new Map()
for (const r of rows) for (const [k, t] of r.els) track.set(k, [...(track.get(k) ?? []), t])
for (const [k, ts] of track) {
  const uniq = [...new Set(ts)]
  if (uniq.length > 1) console.log(k, `${uniq.length} distinct transforms:`, uniq.slice(0, 4).join(' | '), '...', uniq.at(-1))
}
console.log('canvases (first/last):', rows[0].canv.join(' ; '), '=>', rows.at(-1).canv.join(' ; '))
await browser.close()
