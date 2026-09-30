const { launch, BASE, SHOTS } = require('./lib.cjs')
const now = Date.now()
const SEED = { card: { name: '뽀리', size: 'medium', pace: 'slow', greeting: 'slow', comfort: 8, triggers: [], slots: ['evening'], note: '', updatedAt: now }, walks: [], activeWalk: null, requests: { dubu: { status: 'accepted', at: now - 9e4, slot: 'evening' } }, bonds: {}, location: 'manual', neighborhood: '망원동' }
const observe = () => { window.__ev = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__ev.push({ name: e.name, d: e.duration, id: e.interactionId, pd: e.processingEnd - e.processingStart }) }).observe({ type: 'event', durationThreshold: 16, buffered: true }) }
async function metrics(cdp) { const { metrics } = await cdp.send('Performance.getMetrics'); const o = {}; for (const m of metrics) o[m.name] = m.value; return o }
;(async () => {
  const out = {}
  for (const rm of ['no-preference', 'reduce']) {
    const { browser, page, context } = await launch({ viewport: { width: 390, height: 844 }, reducedMotion: rm, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    const cdp = await context.newCDPSession(page)
    await cdp.send('Performance.enable')
    await page.goto(BASE); await page.evaluate((s) => localStorage.setItem('dangq.demo.v1', JSON.stringify(s)), SEED)
    await page.goto(BASE + '#/'); await page.reload(); await page.waitForTimeout(2000)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    // idle cost over 5s (hero visible, walking animation running)
    const a = await metrics(cdp); await page.waitForTimeout(5000); const b = await metrics(cdp)
    out[rm + ' idle5s_hero'] = { TaskMs: Math.round((b.TaskDuration - a.TaskDuration) * 1000), LayoutMs: Math.round((b.LayoutDuration - a.LayoutDuration) * 1000), StyleMs: Math.round((b.RecalcStyleDuration - a.RecalcStyleDuration) * 1000), Layouts: b.LayoutCount - a.LayoutCount, StyleRecalcs: b.RecalcStyleCount - a.RecalcStyleCount }
    // slider responsiveness: keyboard steps + pointer drag
    await page.evaluate(observe)
    const r = page.locator('.dial input[type=range]')
    await r.focus()
    for (let k = 0; k < 19; k++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(60) }
    const box = await r.boundingBox()
    await page.mouse.move(box.x + box.width - 5, box.y + box.height / 2); await page.mouse.down()
    for (let x = box.width - 5; x > 5; x -= 12) { await page.mouse.move(box.x + x, box.y + box.height / 2); await page.waitForTimeout(16) }
    await page.mouse.up(); await page.waitForTimeout(800)
    const ev = await page.evaluate(() => window.__ev)
    const byId = {}; for (const e of ev) if (e.id) byId[e.id] = Math.max(byId[e.id] || 0, e.d)
    const ds = Object.values(byId).sort((x, y) => x - y)
    out[rm + ' slider_4xCPU'] = { interactions: ds.length, p50: ds[Math.floor(ds.length / 2)], p98: ds[Math.floor(ds.length * 0.98)], max: ds[ds.length - 1], eventsOver16: ev.length, maxInput: Math.max(0, ...ev.filter((e) => e.name === 'input' || e.name === 'pointermove').map((e) => e.d)) }
    // 나란히 steps
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    await page.goto(BASE + '#/app/together/dubu/walk'); await page.waitForTimeout(800)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await page.evaluate(observe)
    const t0 = Date.now()
    await page.getByRole('button', { name: /에서 걷기 시작/ }).click()
    for (let s = 0; s < 3; s++) { await page.getByRole('button', { name: '지금 확인' }).click(); await page.getByRole('button', { name: /둘 다 편안했어요/ }).click() }
    await page.getByRole('button', { name: '잠깐 멈춤' }).click(); await page.getByRole('button', { name: '계속 걷기' }).click()
    await page.waitForTimeout(800)
    const ev2 = await page.evaluate(() => window.__ev)
    const by2 = {}; for (const e of ev2) if (e.id) by2[e.id] = Math.max(by2[e.id] || 0, e.d)
    const d2 = Object.values(by2).sort((x, y) => x - y)
    out[rm + ' together_4xCPU'] = { interactions: d2.length, values: d2.map(Math.round), max: d2[d2.length - 1], wallMs: Date.now() - t0 }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    await browser.close()
  }
  // load metrics with 4x CPU + fast-3g-ish network via CDP, cold cache
  for (const route of ['#/', '#/app']) {
    const { browser, page, context } = await launch({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true })
    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 })
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await page.addInitScript(() => { window.__lcp = 0; window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime }).observe({ type: 'largest-contentful-paint', buffered: true }); new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value }).observe({ type: 'layout-shift', buffered: true }); window.__lt = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt += Math.max(0, e.duration - 50) }).observe({ type: 'longtask', buffered: true }) })
    await page.goto(BASE + route, { waitUntil: 'load' }); await page.waitForTimeout(4000)
    out['load ' + route] = await page.evaluate(() => {
      const fcp = performance.getEntriesByName('first-contentful-paint')[0]
      const res = performance.getEntriesByType('resource'); const sum = (f) => Math.round(res.filter(f).reduce((a, r) => a + r.transferSize, 0) / 1024)
      return { FCP: Math.round(fcp && fcp.startTime), LCP: Math.round(window.__lcp), CLS: +window.__cls.toFixed(4), TBTapprox: Math.round(window.__lt), jsKB: sum((r) => r.name.endsWith('.js')), cssKB: sum((r) => r.name.endsWith('.css')), fontKB: sum((r) => r.name.endsWith('.woff2')), fontFiles: res.filter((r) => r.name.endsWith('.woff2')).length, imgKB: sum((r) => /\.(png|jpg|svg)$/.test(r.name)) }
    })
    await browser.close()
  }
  console.log(JSON.stringify(out, null, 1))
})().catch((e) => { console.error(e); process.exit(1) })
