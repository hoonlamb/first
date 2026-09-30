// A-02 / P-01: running animations over time and idle main-thread cost (4x CPU), same method as round 1 p1-perf.cjs
const { launch, seed, seedState, BASE, SHOTS, now } = require('./lib.cjs')
const SEED = seedState({ requests: { dubu: { status: 'accepted', at: now - 9e4, slot: 'evening' } } })
const running = () => document.getAnimations().filter((a) => a.playState === 'running').length
async function metrics(cdp) { const { metrics } = await cdp.send('Performance.getMetrics'); const o = {}; for (const m of metrics) o[m.name] = m.value; return o }
;(async () => {
  const out = {}
  for (const rm of ['no-preference', 'reduce']) {
    const { browser, page, context } = await launch({ viewport: { width: 390, height: 844 }, reducedMotion: rm, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    const cdp = await context.newCDPSession(page); await cdp.send('Performance.enable')
    await seed(page, SEED, '#/')
    await page.reload(); 
    const r = {}
    await page.waitForTimeout(1000); r.home_1s = await page.evaluate(running)
    await page.waitForTimeout(1000)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    let a = await metrics(cdp); await page.waitForTimeout(5000); let b = await metrics(cdp)
    r.idle_2to7s = { TaskMs: Math.round((b.TaskDuration - a.TaskDuration) * 1000), Layouts: b.LayoutCount - a.LayoutCount, StyleRecalcs: b.RecalcStyleCount - a.RecalcStyleCount }
    r.home_7s = await page.evaluate(running)
    a = await metrics(cdp); await page.waitForTimeout(5000); b = await metrics(cdp)
    r.idle_7to12s = { TaskMs: Math.round((b.TaskDuration - a.TaskDuration) * 1000), Layouts: b.LayoutCount - a.LayoutCount, StyleRecalcs: b.RecalcStyleCount - a.RecalcStyleCount }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    // interaction restarts motion then rests
    await page.locator('.dial input[type=range]').fill('9'); await page.waitForTimeout(500); r.dial_after_change_0_5s = await page.evaluate(running)
    await page.waitForTimeout(5200); r.dial_after_change_5_7s = await page.evaluate(running)
    // together walking
    await page.goto(BASE + '#/app/together/dubu/walk'); await page.waitForTimeout(400)
    await page.getByRole('button', { name: /에서 걷기 시작/ }).click(); await page.waitForTimeout(800); r.together_0_8s = await page.evaluate(running)
    await page.waitForTimeout(5000); r.together_5_8s = await page.evaluate(running)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    a = await metrics(cdp); await page.waitForTimeout(5000); b = await metrics(cdp)
    r.together_idle_after_rest = { TaskMs: Math.round((b.TaskDuration - a.TaskDuration) * 1000), Layouts: b.LayoutCount - a.LayoutCount, StyleRecalcs: b.RecalcStyleCount - a.RecalcStyleCount }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    // builder comfort step, empty-hero
    await page.goto(BASE + '#/app/card/edit'); await page.waitForTimeout(200); await page.getByRole('button', { name: '다음' }).click(); await page.waitForTimeout(6000); r.builder_6s = await page.evaluate(running)
    await page.goto(BASE + '#/brand'); await page.waitForTimeout(6500); r.brand_6_5s = await page.evaluate(running)
    await page.goto(BASE + '#/app/show'); await page.waitForTimeout(500); r.show = await page.evaluate(running)
    // tween: reduce → instant
    await page.goto(BASE + '#/'); await page.waitForTimeout(500)
    await page.locator('.dial input[type=range]').fill('3'); await page.waitForTimeout(40)
    r.tween40ms = await page.evaluate(() => document.querySelector('.dial .lane:nth-of-type(2)').getAttribute('transform'))
    await page.waitForTimeout(700)
    r.tween740ms = await page.evaluate(() => document.querySelector('.dial .lane:nth-of-type(2)').getAttribute('transform'))
    out[rm] = r
    await browser.close()
  }
  console.log(JSON.stringify(out, null, 1))
})().catch((e) => { console.error(e); process.exit(1) })
