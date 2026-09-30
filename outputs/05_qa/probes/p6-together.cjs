const { launch, BASE } = require('./lib.cjs')
const now = Date.now()
const SEED = { card: { name: '뽀리', size: 'medium', pace: 'slow', greeting: 'slow', comfort: 8, triggers: [], slots: ['evening'], note: '', updatedAt: now }, walks: [], activeWalk: null, requests: { dubu: { status: 'accepted', at: now - 9e4, slot: 'evening' } }, bonds: {}, location: 'manual', neighborhood: '망원동' }
;(async () => {
  for (const rm of ['reduce', 'no-preference', 'reduce']) {
    const { browser, page, context } = await launch({ viewport: { width: 390, height: 844 }, reducedMotion: rm })
    const cdp = await context.newCDPSession(page)
    await page.goto(BASE); await page.evaluate((s) => localStorage.setItem('dangq.demo.v1', JSON.stringify(s)), SEED)
    await page.goto(BASE + '#/app/together/dubu/walk'); await page.reload(); await page.waitForTimeout(1500)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await page.evaluate(() => { window.__ev = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__ev.push({ n: e.name, d: Math.round(e.duration), id: e.interactionId, t: e.target && (e.target.innerText || '').slice(0, 12) }) }).observe({ type: 'event', durationThreshold: 16 }) })
    await page.getByRole('button', { name: /에서 걷기 시작/ }).click()
    for (let s = 0; s < 3; s++) { await page.getByRole('button', { name: '지금 확인' }).click(); await page.getByRole('button', { name: /둘 다 편안했어요/ }).click() }
    await page.waitForTimeout(500)
    const ev = await page.evaluate(() => window.__ev.filter((e) => e.n === 'click' || e.n === 'pointerup' || e.n === 'pointerdown'))
    console.log(rm, JSON.stringify(ev.filter((e) => e.n === 'click').map((e) => e.d + ':' + e.t)))
    await browser.close()
  }
})()
