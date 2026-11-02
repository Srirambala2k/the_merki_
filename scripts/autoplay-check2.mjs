// 1) per-page zoom restart, 2) take over with the wheel and watch it resume, 3) the loop back to the first page.
import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
const sample = () => page.evaluate(() => {
  const st = [...document.querySelectorAll('[data-stage]')].filter((s) => getComputedStyle(s).visibility !== 'hidden' && +getComputedStyle(s).opacity > 0.5).at(-1)
  const z = st?.querySelector('[data-zoom]')
  return { vp: +(scrollY / innerHeight).toFixed(2), page: st?.dataset.stage, zoom: z ? +new DOMMatrix(getComputedStyle(z).transform).a.toFixed(3) : null, cover: +(+getComputedStyle(document.querySelector('[data-cover]')).opacity).toFixed(2) }
})
const log = async (t) => console.log(`t=${String(t).padStart(3)}s`, JSON.stringify(await sample()))
let t = 0
const step = async (s = 1) => { await page.waitForTimeout(s * 1000); t += s }
for (; t < 14; ) { await log(t); await step(2) }               // pages p0 -> p1: zoom restarts at ~1.0 on the new page
console.log('--- visitor scrolls with the wheel at t=%d', t)
await page.mouse.wheel(0, 120); await step(0.5)
for (let i = 0; i < 6; i++) { await log(t); await step(1.5) }  // should hold still ~4s, then resume
console.log('--- let it run to the end and loop')
let looped = false, last = -1
for (; t < 140 && !looped; ) { const s = await sample(); if (s.vp < last - 5) { looped = true; console.log(`LOOPED at t=${t}`, JSON.stringify(s)) } last = s.vp; await step(1) }
await log(t); await step(4); await log(t); await step(3); await log(t)
console.log('looped:', looped, ' errors:', errors.length ? errors : 'none')
await browser.close()
