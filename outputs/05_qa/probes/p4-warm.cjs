const { launch, BASE } = require('./lib.cjs')
;(async () => {
  const { browser, page, context } = await launch({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true })
  const cdp = await context.newCDPSession(page)
  await page.goto(BASE + '#/', { waitUntil: 'load' }); await page.waitForTimeout(3000) // warm cache incl. fonts
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)) } })
  await page.waitForTimeout(2000)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await page.addInitScript(() => { window.__lt = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push(Math.round(e.duration)) }).observe({ type: 'longtask', buffered: true }) })
  for (let i = 0; i < 2; i++) {
    await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(4000)
    console.log('warm reload', JSON.stringify(await page.evaluate(() => ({ FCP: Math.round(performance.getEntriesByName('first-contentful-paint')[0].startTime), lt: window.__lt }))))
  }
  await browser.close()
})()
