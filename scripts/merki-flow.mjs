// Functional pass over the Merki copy and chrome: nav links, overlays, form validation, autoplay pause.
import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.goto('http://localhost:5173/?autoplay=0', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
const hud = () => page.evaluate(() => `${document.querySelector('.count span')?.textContent}/${document.querySelector('.hud-name')?.textContent}`)
const ok = (name, cond, extra = '') => console.log(cond ? 'PASS' : 'FAIL', name, extra)

ok('starts on 01/Intro', (await hud()) === '01/Intro', await hud())
await page.click('.links a:text("Services")'); await page.waitForTimeout(3500)
ok('nav "Services" goes to 03/Services', (await hud()) === '03/Services', await hud())
await page.click('.links a:text("Process")'); await page.waitForTimeout(3500)
ok('nav "Process" goes to 06/Process', (await hud()) === '06/Process', await hud())
const wa = await page.getAttribute('.enq', 'href')
ok('WhatsApp link carries this scene\'s message', wa.includes('wa.me/918122512223') && decodeURIComponent(wa).includes('walk me through your process'), decodeURIComponent(wa).slice(0, 90))
const orb = await page.evaluate(() => ({ on: document.querySelectorAll('[data-stage="p6"] .step.on').length, glow: getComputedStyle(document.querySelector('#proc-glow')).strokeDashoffset }))
ok('process steps lit by the orb', orb.on === 4, JSON.stringify(orb))

await page.click('.pill'); await page.waitForTimeout(1600)
ok('contact panel opens', await page.evaluate(() => getComputedStyle(document.querySelector('.overlay.contact')).visibility === 'visible'))
ok('page scroll locked while open', (await page.evaluate(() => document.documentElement.style.overflow)) === 'hidden')
await page.click('.contact button[type=submit]'); await page.waitForTimeout(300)
ok('empty form is rejected (fields marked)', (await page.locator('.contact .bad').count()) === 3)
await page.fill('.contact input[name=email]', 'not-an-email'); await page.click('.contact button[type=submit]')
ok('bad email is rejected', await page.locator('.contact input[name=email].bad').count() === 1)
await page.keyboard.press('Escape'); await page.waitForTimeout(1500)
ok('Escape closes the panel', await page.evaluate(() => getComputedStyle(document.querySelector('.overlay.contact')).visibility === 'hidden'))

await page.click('.links a:text("Work")'); await page.waitForTimeout(3500)
await page.locator('[data-stage="p4"] button:text("See our work")').click({ force: true }) // the copy drifts, so skip the "stable" wait
await page.waitForTimeout(1800)
ok('work panel opens with 6 items', (await page.locator('.work .vouch article').count()) === 6 && await page.evaluate(() => getComputedStyle(document.querySelector('.overlay.work')).visibility === 'visible'))
await page.click('.work .close'); await page.waitForTimeout(1400)
ok('work panel closes', await page.evaluate(() => getComputedStyle(document.querySelector('.overlay.work')).visibility === 'hidden'))

console.log('errors:', errors.length ? errors : 'none')
await browser.close()
