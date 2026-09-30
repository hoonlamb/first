const { launch, BASE } = require('./lib.cjs')
const fs = require('fs')
;(async () => {
  const { browser, page, context } = await launch({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true })
  const cdp = await context.newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const events = []
  cdp.on('Tracing.dataCollected', (d) => events.push(...d.value))
  const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r))
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,blink.user_timing,disabled-by-default-devtools.timeline', transferMode: 'ReportEvents' })
  await page.goto(BASE + '#/', { waitUntil: 'load' }); await page.waitForTimeout(4000)
  await cdp.send('Tracing.end'); await done
  const main = events.filter((e) => e.ph === 'X' && e.dur > 100000)
  const agg = {}
  for (const e of events.filter((e) => e.ph === 'X' && e.dur)) { agg[e.name] = (agg[e.name] || 0) + e.dur / 1000 }
  console.log(Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => k + ' ' + Math.round(v)).join('\n'))
  console.log('--- >100ms events')
  console.log(main.filter((e) => e.name !== 'RunTask' && e.name !== 'ThreadControllerImpl::RunTask').slice(0, 20).map((e) => e.name + ' ' + Math.round(e.dur / 1000) + ' ' + JSON.stringify(e.args && (e.args.data || e.args.beginData) || {}).slice(0, 160)).join('\n'))
  await browser.close()
})()
