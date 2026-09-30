// Walk logging (1 tap + optional distance) and summary suggestion (F-03, X-03, X-06)
const { launch, seed, seedState, card, getS, hash, BASE, SHOTS, now } = require('./lib.cjs')
const txt = (page, sel) => page.locator(sel).first().innerText().then((t) => t.replace(/\s+/g, ' ').trim()).catch(() => null)
async function walk(page, encs) {
  await page.goto(BASE + '#/app/walk'); await page.waitForTimeout(250)
  const back = page.getByRole('button', { name: '산책 기록으로 돌아가기' }); if (await back.count()) { await back.click(); await page.waitForTimeout(150) }
  await page.getByRole('button', { name: '산책 시작' }).click(); await page.waitForTimeout(250)
  for (const [reaction, d] of encs) {
    await page.locator('.walk__react').getByRole('button', { name: reaction }).click(); await page.waitForTimeout(120)
    if (d !== null) { await page.locator('.walk__dist').getByRole('radio', { name: d === 15 ? '15m+' : `${d}m`, exact: true }).check(); await page.waitForTimeout(80) }
  }
  await page.getByRole('button', { name: '산책 끝내기' }).click(); await page.waitForTimeout(300)
}
const sugg = (page) => page.locator('.suggest, .notice').allInnerTexts().then((a) => a.map((t) => t.replace(/\s+/g, ' ')))
const prevWalk = (id, encs, ago) => ({ id, startedAt: now - ago, endedAt: now - ago + 6e5, encounters: encs.map(([reaction, distance], k) => ({ at: now - ago + k * 1000, distance, reaction })) })
;(async () => {
  const out = {}
  const { browser, page, errors } = await launch()
  // W0: one tap
  await seed(page, seedState(), '#/app/walk')
  await page.getByRole('button', { name: '산책 시작' }).click(); await page.waitForTimeout(300)
  out.W0_focusAfterStart = await page.evaluate(() => document.activeElement.innerText)
  out.W0_reactBtns = await page.locator('.walk__react button').evaluateAll((bs) => bs.map((b) => b.innerText + ' ' + Math.round(b.getBoundingClientRect().width) + 'x' + Math.round(b.getBoundingClientRect().height)))
  await page.locator('.walk__react').getByRole('button', { name: '반응했어요' }).click(); await page.waitForTimeout(150)
  out.W0_afterOneTap = { encounters: (await getS(page)).activeWalk.encounters.map((e) => [e.reaction, e.distance]), toast: await page.locator('.toast.is-on').allInnerTexts(), list: await txt(page, '.enc-list') }
  await page.locator('.walk__react').getByRole('button', { name: '편안했어요' }).click(); await page.waitForTimeout(150)
  await page.locator('.walk__dist').getByRole('radio', { name: '3m', exact: true }).check(); await page.waitForTimeout(100)
  out.W0_distOnlyForLast = { encounters: (await getS(page)).activeWalk.encounters.map((e) => [e.reaction, e.distance]), fieldsets: await page.locator('.walk__dist').count() }
  await page.screenshot({ path: SHOTS + 'w-walk-one-tap-390.png', fullPage: true })
  // W1: F-03 reproduction — card 8, 3m calm + 5m react
  await seed(page, seedState(), '#/app')
  await walk(page, [['편안했어요', 3], ['반응했어요', 5]])
  out.W1_f03 = await sugg(page)
  await page.screenshot({ path: SHOTS + 'w-f03-repro-summary.png', fullPage: true })
  // W2: widen, then apply → no opposite suggestion
  await seed(page, seedState({ card: card({ comfort: 4 }) }), '#/app')
  await walk(page, [['반응했어요', 5], ['편안했어요', 2]])
  out.W2_widen = await sugg(page)
  const w2btn = page.getByRole('button', { name: /넓히기|바꾸기/ })
  if (await w2btn.count()) { await w2btn.first().click(); await page.waitForTimeout(300) }
  out.W2_afterApply = { sugg: await sugg(page), comfort: (await getS(page)).card.comfort }
  await walk(page, [['편안했어요', 3], ['편안했어요', 3], ['편안했어요', 3]])
  out.W2_nextWalkAfterWiden = await sugg(page)
  // W3: narrow requires ≥3 calm over ≥2 walks
  await seed(page, seedState({ walks: [prevWalk('p1', [['calm', 5], ['calm', 5]], 864e5)] }), '#/app')
  await walk(page, [['편안했어요', 5]])
  out.W3_narrow = await sugg(page)
  const w3btn = page.getByRole('button', { name: /바꾸기/ })
  if (await w3btn.count()) { await w3btn.first().click(); await page.waitForTimeout(300) }
  out.W3_afterApply = { sugg: await sugg(page), comfort: (await getS(page)).card.comfort }
  await page.screenshot({ path: SHOTS + 'w-narrow-applied.png', fullPage: true })
  // W3b: only 1 walk with 3 calm → no narrow
  await seed(page, seedState(), '#/app')
  await walk(page, [['편안했어요', 5], ['편안했어요', 5], ['편안했어요', 5]])
  out.W3b_singleWalk = await sugg(page)
  // W4: many reactions without distance do not block narrowing
  await seed(page, seedState({ walks: [prevWalk('p1', [['calm', 5], ['calm', 5], ['react', null], ['react', null]], 864e5)] }), '#/app')
  await walk(page, [['반응했어요', null], ['반응했어요', null], ['반응했어요', null], ['편안했어요', 5]])
  out.W4_narrowDespiteUnknownReacts = await sugg(page)
  out.W4_summary = await txt(page, '.summary')
  await page.screenshot({ path: SHOTS + 'w-narrow-despite-5-reactions.png', fullPage: true })
  // W5: widen suggested even though walk had "15m+" react at card 20? card 20 + react at 15+
  await seed(page, seedState({ card: card({ comfort: 12 }) }), '#/app')
  await walk(page, [['반응했어요', 15]])
  out.W5_react15plus_card12 = await sugg(page)
  out.errors = errors
  console.log(JSON.stringify(out, null, 1))
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
