const { launch, BASE } = require('./lib.cjs')
;(async () => {
  const out = {}
  for (const variant of ['baseline', 'no-fonts', 'reduced-motion', 'no-fonts+reduced']) {
    const vals = []
    for (let rep = 0; rep < 2; rep++) {
      const { browser, page, context } = await launch({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, reducedMotion: variant.includes('reduced') ? 'reduce' : 'no-preference' })
      if (variant.includes('no-fonts')) await page.route(/\.woff2$/, (r) => r.abort())
      const cdp = await context.newCDPSession(page)
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
      await page.addInitScript(() => { window.__lt = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push(Math.round(e.duration)) }).observe({ type: 'longtask', buffered: true }) })
      await page.goto(BASE + '#/', { waitUntil: 'load' }); await page.waitForTimeout(5000)
      vals.push(await page.evaluate(() => ({ FCP: Math.round(performance.getEntriesByName('first-contentful-paint')[0].startTime), longtasks: window.__lt, TBT: window.__lt.reduce((a, d) => a + Math.max(0, d - 50), 0) })))
      await browser.close()
    }
    out[variant] = vals
  }
  console.log(JSON.stringify(out))
})()
