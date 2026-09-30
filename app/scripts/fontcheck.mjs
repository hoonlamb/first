import { chromium } from '@playwright/test'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
for (const path of ['#/', '#/app', '#/brand', '#/case']) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } })
  const fonts = []
  p.on('response', async (r) => { if (r.url().endsWith('.woff2')) fonts.push([r.url().split('/').pop(), Number(r.headers()['content-length'] ?? 0)]) })
  await p.goto('http://127.0.0.1:4173/' + path); await p.waitForLoadState('networkidle'); await p.waitForTimeout(500)
  const fam = await p.evaluate(() => document.fonts.check('16px "DANGQ Sans"'))
  console.log(path, fonts.length, 'files', Math.round(fonts.reduce((a, f) => a + f[1], 0) / 1024) + 'KB', 'subset ok:', fam, fonts.map(f=>f[0].slice(0,24)).join(','))
  await p.close()
}
await b.close()
