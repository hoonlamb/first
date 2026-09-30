const { launch, BASE, SHOTS } = require('./lib.cjs')
const now = Date.now()
;(async () => {
  const { browser, page } = await launch({ viewport: { width: 360, height: 780 } })
  for (const name of ['WWWWWWWWWW', '가나다라마바사아자차']) {
    const SEED = { card: { name, size: 'medium', pace: 'slow', greeting: 'pass', comfort: 20, triggers: ['bike', 'bigdog', 'kids', 'touch', 'noise', 'smalldog'], slots: ['dawn', 'morning', 'evening', 'night'], note: 'W'.repeat(40), updatedAt: now }, walks: [], activeWalk: null, requests: { sol: { status: 'accepted', at: now - 9e4, slot: null } }, bonds: {}, location: 'manual', neighborhood: '망원동' }
    await page.goto(BASE); await page.evaluate((s) => localStorage.setItem('dangq.demo.v1', JSON.stringify(s)), SEED)
    const res = {}
    for (const r of ['#/app', '#/app/show', '#/app/together/sol', '#/app/together/sol/walk']) {
      await page.goto(BASE + r); await page.reload(); await page.waitForTimeout(900)
      res[r] = await page.evaluate(() => { const vw = document.documentElement.clientWidth; const bad = [...document.querySelectorAll('body *')].filter((e) => { const b = e.getBoundingClientRect(); return b.width && (b.right > vw + 1) }).map((e) => e.tagName + '.' + String(e.className).split(' ')[0] + ':' + Math.round(e.getBoundingClientRect().right)); return { hScroll: document.documentElement.scrollWidth > vw, overflow: [...new Set(bad)].slice(0, 6) } })
      await page.screenshot({ path: `${SHOTS}f-longname-${name[0] === 'W' ? 'latin' : 'hangul'}-${r.replace(/[#/]/g, '_')}.png`, fullPage: r === '#/app' })
    }
    console.log(name, JSON.stringify(res))
  }
  await browser.close()
})()
