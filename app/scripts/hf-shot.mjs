// Screenshot hi-fi screens with a seeded demo state. Usage: node scripts/hf-shot.mjs <hash> <out.png> [w] [h] [seed=1]
import { chromium } from '@playwright/test'
const [,, hash = '/app', out = '/tmp/sh/hf.png', w = '1280', h = '960', seed = '1'] = process.argv
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2 })
const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
await p.goto('http://127.0.0.1:5173/')
if (seed === '1') await p.evaluate(() => localStorage.setItem('dangq.demo.v1', JSON.stringify({ card: { name: '뽀리', size: 'medium', pace: 'slow', greeting: 'slow', comfort: 8, triggers: ['bike'], slots: ['evening', 'morning'], note: '', photo: 'photos/dog-03-bori-terrier.jpg', breed: '믹스', age: 4, sex: 'm', updatedAt: 1 } })))
await p.goto('http://127.0.0.1:5173/#' + hash); await p.reload(); await p.waitForTimeout(1200)
await p.screenshot({ path: out }); console.log('errors:', errs.length ? errs.join('\n') : 'none'); await b.close()
