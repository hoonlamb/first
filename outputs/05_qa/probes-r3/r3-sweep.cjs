// Regression sweep: core journey via UI on 390 and 1440, all routes, console errors, horizontal overflow.
const { launch, makeCard, getS, hash, BASE, SHOTS } = require('./lib.cjs')
;(async () => {
  const out = {}
  for (const w of [390, 1440]) {
    const { browser, page, errors } = await launch({ viewport: { width: w, height: w === 390 ? 844 : 900 } })
    const r = out[w] = { routes: {} }
    await page.goto(BASE + '#/'); await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(400)
    await makeCard(page, { name: '솔', comfort: 8 })
    r.afterCard = hash(page)
    // walk: 1-tap react + calm with distance, finish
    await page.goto(BASE + '#/app/walk'); await page.waitForTimeout(300)
    const startBtn = page.getByRole('button', { name: /산책 시작/ }); if (await startBtn.count()) { await startBtn.first().click(); await page.waitForTimeout(200) }
    await page.getByRole('button', { name: '반응했어요' }).click(); await page.waitForTimeout(150)
    await page.getByRole('button', { name: '편안했어요' }).click(); await page.waitForTimeout(150)
    const endBtn = page.getByRole('button', { name: /산책 마치기|끝내기|마치기/ }); if (await endBtn.count()) { await endBtn.first().click(); await page.waitForTimeout(300) }
    const dlg = page.locator('dialog[open]'); if (await dlg.count()) { await dlg.getByRole('button').last().click(); await page.waitForTimeout(300) }
    r.walkSummary = (await page.locator('main').innerText()).replace(/\s+/g, ' ').slice(0, 200)
    r.walksSaved = (await getS(page)).walks.length
    // nearby → dubu → request → auto-accept → start → 3 calm steps
    await page.goto(BASE + '#/app/together'); await page.waitForTimeout(1300)
    await page.goto(BASE + '#/app/together/dubu'); await page.waitForTimeout(300)
    r.detailTitle = await page.locator('#plan-title').innerText()
    await page.getByRole('button', { name: '나란히 산책 요청하기' }).click(); await page.waitForTimeout(200)
    await page.locator('dialog[open]').getByRole('button', { name: '요청 보내기' }).click(); await page.waitForTimeout(3200)
    await page.getByRole('button', { name: '나란히 산책 시작' }).click(); await page.waitForTimeout(300)
    await page.getByRole('button', { name: /에서 걷기 시작/ }).click(); await page.waitForTimeout(200)
    const steps = []
    for (let k = 0; k < 6 && (await page.locator('.together__num').count()); k++) { steps.push(await page.locator('.together__num').innerText()); await page.getByRole('button', { name: '둘 다 편해요?' }).click(); await page.waitForTimeout(120); await page.getByRole('button', { name: /둘 다 편안했어요/ }).click(); await page.waitForTimeout(200) }
    r.firstSessionSteps = steps
    r.greetShown = await page.getByText('짧게 인사해 볼까요?').count()
    r.done = (await page.locator('.together__panel').innerText()).replace(/\s+/g, ' ').slice(0, 120)
    await page.screenshot({ path: SHOTS + `sweep-${w}-together-done.png`, fullPage: true })
    for (const route of ['#/', '#/brand', '#/case', '#/app', '#/app/show', '#/app/walk', '#/app/together', '#/app/together/dubu', '#/app/bond', '#/app/tag', '#/app/settings', '#/app/card/edit']) {
      await page.goto(BASE + route); await page.waitForTimeout(route === '#/brand' ? 900 : 450)
      r.routes[route] = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, h1: (document.querySelector('h1') || {}).innerText?.replace(/\s+/g, ' ').slice(0, 40) }))
      if (['#/', '#/app', '#/app/bond'].includes(route)) await page.screenshot({ path: SHOTS + `sweep-${w}-${route.replace(/[#/]+/g, '_')}.png` })
    }
    r.overflow = Object.entries(r.routes).filter(([, v]) => v.sw > v.cw).map(([k]) => k)
    r.errors = errors
    await browser.close()
  }
  console.log(JSON.stringify(out, null, 1))
})().catch((e) => { console.error(e); process.exit(1) })
