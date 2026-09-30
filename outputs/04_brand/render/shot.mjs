// Screenshot helper for verification: node shot.mjs <url> <out.png> <width> <height> [fullPage=1]
import { createRequire } from 'node:module'
const { chromium } = createRequire('/home/user/first/app/package.json')('@playwright/test')
const [,, url, out, w, h, full = '1'] = process.argv
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await b.newPage({ viewport: { width: +w, height: +h } })
await p.goto(url); await p.waitForTimeout(700)
// scroll through once so loading="lazy" images load before the full-page capture
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) } scrollTo(0, 0) })
await p.waitForTimeout(800)
await p.screenshot({ path: out, fullPage: full === '1' }); await b.close()
