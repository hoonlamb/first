import { createRequire } from 'node:module'
const { chromium } = createRequire('/home/user/first/app/package.json')('@playwright/test')
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await b.newPage(); await p.goto('http://127.0.0.1:5199/#/brand'); await p.waitForTimeout(800)
console.log(await p.evaluate(() => {
  const m = (t, f) => { const s = document.createElement('span'); s.textContent = t; s.style.cssText = `font:880 100px var(--font);font-variant-numeric:${f};position:absolute;white-space:nowrap`; document.body.append(s); const w = s.getBoundingClientRect().width; s.remove(); return Math.round(w) }
  return ['1111', '8888'].map(t => [t, m(t, 'tabular-nums'), m(t, 'proportional-nums')])
}))
await b.close()
