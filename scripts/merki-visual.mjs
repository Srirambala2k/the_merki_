import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
const out = process.argv[2]; mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:5173/?autoplay=0', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
const at = async (p, name) => { await page.evaluate((y) => scrollTo(0, y), p * 900); await page.waitForTimeout(3000); await page.screenshot({ path: `${out}/${name}.png` }) }
await at(2, 'intro')
await at(13.7, 'process-mid')
await at(7, 'services')
await page.click('.pill'); await page.waitForTimeout(1800); await page.screenshot({ path: `${out}/contact.png` })
await page.keyboard.press('Escape'); await page.waitForTimeout(1300)
await page.evaluate(() => document.querySelector('[data-stage="p4"] button').click()) // "See our work"
await page.evaluate(() => scrollTo(0, 9.5 * 900)); await page.waitForTimeout(200)
await browser.close()
