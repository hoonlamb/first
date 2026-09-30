const { launch, BASE, SHOTS } = require('./lib.cjs')
const now = Date.now()
;(async () => {
  const { browser, page } = await launch({ viewport: { width: 360, height: 780 } })
  for (const note of ['https://instagram.com/ppori_walks_daily', '처음엔옆보다조금뒤가편해요자전거보면짖어요', '처음엔 옆보다 조금 뒤가 편해요. 자전거 보면 짖어요.']) {
    const SEED = { card: { name: '뽀리', size: 'medium', pace: 'slow', greeting: 'slow', comfort: 8, triggers: [], slots: [], note, updatedAt: now }, walks: [], activeWalk: null, requests: {}, bonds: {}, location: 'unknown', neighborhood: null }
    await page.goto(BASE); await page.evaluate((s) => localStorage.setItem('dangq.demo.v1', JSON.stringify(s)), SEED)
    await page.goto(BASE + '#/app'); await page.reload(); await page.waitForTimeout(600)
    console.log(note.length, note, await page.evaluate(() => document.documentElement.scrollWidth))
  }
  await page.screenshot({ path: SHOTS + 'f-note-ok.png' })
  await browser.close()
})()
