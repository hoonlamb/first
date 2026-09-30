const { launch, BASE, SHOTS } = require('./lib.cjs')
const now = Date.now()
const SEED = { card: { name: '뽀리', size: 'medium', pace: 'slow', greeting: 'slow', comfort: 8, triggers: [], slots: ['evening'], note: '', updatedAt: now }, walks: [], activeWalk: null, requests: { dubu: { status: 'accepted', at: now - 9e4, slot: 'evening' } }, bonds: {}, location: 'manual', neighborhood: '망원동' }
const anims = () => document.getAnimations().filter((a) => a.playState === 'running').map((a) => (a.animationName || a.transitionProperty || 'anim') + '@' + (a.effect && a.effect.target && (a.effect.target.getAttribute('class') || a.effect.target.tagName)).toString().slice(0, 30))
;(async () => {
  for (const rm of ['no-preference', 'reduce']) {
    const { browser, page } = await launch({ viewport: { width: 390, height: 844 }, reducedMotion: rm })
    await page.goto(BASE); await page.evaluate((s) => localStorage.setItem('dangq.demo.v1', JSON.stringify(s)), SEED)
    const res = {}
    await page.goto(BASE + '#/'); await page.reload(); await page.waitForTimeout(1200)
    res.site = await page.evaluate(anims)
    // tween check: move slider and sample bracket text/gap 50ms later
    await page.locator('.dial input[type=range]').fill('18')
    await page.waitForTimeout(50)
    res.gapAt50ms = await page.evaluate(() => document.querySelector('.dial .lanes .lane:nth-of-type(2)').getAttribute('transform'))
    await page.waitForTimeout(600)
    res.gapAt650ms = await page.evaluate(() => document.querySelector('.dial .lanes .lane:nth-of-type(2)').getAttribute('transform'))
    await page.goto(BASE + '#/app/together/dubu/walk'); await page.waitForTimeout(500)
    await page.getByRole('button', { name: /에서 걷기 시작/ }).click(); await page.waitForTimeout(300)
    res.together = await page.evaluate(anims)
    res.timerTransition = await page.evaluate(() => getComputedStyle(document.querySelector('.timer__bar')).transition)
    await page.goto(BASE + '#/app/together'); await page.reload(); await page.waitForTimeout(200)
    res.skeleton = await page.evaluate(anims)
    await page.goto(BASE + '#/app/show'); await page.waitForTimeout(100)
    res.show = await page.evaluate(anims)
    await page.goto(BASE + '#/brand'); await page.waitForTimeout(800)
    res.brand = await page.evaluate(anims)
    console.log(rm, JSON.stringify(res, null, 1))
    await browser.close()
  }
})().catch((e) => { console.error(e); process.exit(1) })
