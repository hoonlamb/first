const { launch, BASE, SHOTS } = require('./lib.cjs')
const now = Date.now()
const SEED = { card: { name: '뽀리', size: 'medium', pace: 'slow', greeting: 'slow', comfort: 8, triggers: ['bike', 'kids'], slots: ['evening'], note: '처음엔 옆보다 조금 뒤가 편해요', updatedAt: now }, walks: [], activeWalk: null, requests: {}, bonds: { bori: { neighborId: 'bori', sessions: [{ at: now, steps: [], closest: 6, endedEarly: false }] } }, location: 'manual', neighborhood: '망원동' }
;(async () => {
  for (const vp of [{ width: 390, height: 700 }, { width: 1440, height: 900 }]) {
    const { browser, page } = await launch({ viewport: vp })
    await page.goto(BASE); await page.evaluate((s) => localStorage.setItem('dangq.demo.v1', JSON.stringify(s)), SEED)
    for (const r of ['#/app', '#/app/together']) {
      await page.goto(BASE + r); await page.reload(); await page.waitForTimeout(1400)
      await page.evaluate(() => window.scrollTo(0, 1e6)); await page.waitForTimeout(200)
      const info = await page.evaluate(() => {
        const tab = document.querySelector('.tabbar'); const main = document.querySelector('#main')
        const kids = [...main.querySelectorAll('a,button,p,li')].filter((e) => e.getBoundingClientRect().height > 0)
        const last = kids[kids.length - 1]
        return { tabTop: tab && Math.round(tab.getBoundingClientRect().top), lastBottom: Math.round(last.getBoundingClientRect().bottom), lastText: last.innerText.slice(0, 30), tabPos: tab && getComputedStyle(tab).position }
      })
      console.log(vp.width, r, JSON.stringify(info))
      await page.screenshot({ path: `${SHOTS}r-bottom-${r.replace(/[#/]/g, '') || 'app'}-${vp.width}.png` })
    }
    await browser.close()
  }
})()
