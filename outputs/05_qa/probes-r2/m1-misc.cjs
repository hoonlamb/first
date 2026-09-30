// F-07, F-08, F-12, F-13, F-14, V-01, hide/unhide, empty after hiding all, tag route
const { launch, seed, seedState, card, getS, hash, makeCard, BASE, SHOTS, now } = require('./lib.cjs')
const txt = (page, sel) => page.locator(sel).first().innerText().then((t) => t.replace(/\s+/g, ' ').trim()).catch(() => null)
;(async () => {
  const out = {}
  // ---- F-07 geolocation error codes
  for (const code of [1, 2, 3]) {
    const { browser, page, context } = await launch()
    await context.addInitScript((c) => { navigator.geolocation.getCurrentPosition = (ok, err) => setTimeout(() => err({ code: c, message: 'stub' }), 50) }, code)
    await seed(page, seedState({ location: 'unknown', neighborhood: null }), '#/app/together')
    await page.getByRole('button', { name: '현재 위치로 찾기' }).click(); await page.waitForTimeout(400)
    out['F07_code' + code] = { title: await txt(page, 'h1'), retry: await page.getByRole('button', { name: '현재 위치로 다시 찾기' }).count(), stored: (await getS(page)).location }
    if (code === 1) { await page.reload(); await page.waitForTimeout(300); out.F07_afterReloadDenied = { title: await txt(page, 'h1'), retry: await page.getByRole('button', { name: '현재 위치로 다시 찾기' }).count() } }
    await browser.close()
  }
  { // pending forever
    const { browser, page, context } = await launch()
    await context.addInitScript(() => { navigator.geolocation.getCurrentPosition = () => {} })
    await seed(page, seedState({ location: 'unknown', neighborhood: null }), '#/app/together')
    await page.getByRole('button', { name: '현재 위치로 찾기' }).click(); await page.waitForTimeout(4600)
    out.F07_pending4_6s = await page.locator('.notice').allInnerTexts()
    await browser.close()
  }
  const { browser, page, errors } = await launch()
  // ---- F-08 연남동
  await seed(page, seedState({ neighborhood: '연남동' }), '#/app/together'); await page.waitForTimeout(1200)
  out.F08 = { box: await txt(page, '.emptybox'), buttons: await page.locator('.emptybox button').allInnerTexts() }
  await page.getByRole('button', { name: '망원동 보기' }).click(); await page.waitForTimeout(1300)
  out.F08_after = await page.locator('.ncard__name').allInnerTexts()
  // hide all in 망원동 → empty message
  await seed(page, seedState({ hidden: ['dubu', 'mango', 'bori', 'sol', 'kong'] }), '#/app/together'); await page.waitForTimeout(1300)
  out.hideAll = { box: await txt(page, '.emptybox'), buttons: await page.locator('.emptybox button').allInnerTexts() }
  await page.screenshot({ path: SHOTS + 'm-all-hidden-mangwon.png', fullPage: true })
  // hide / unhide via UI
  await seed(page, seedState(), '#/app/together/dubu')
  await page.getByRole('button', { name: '이 이웃 숨기기' }).click(); await page.locator('dialog[open]').getByRole('button', { name: '숨기기' }).click(); await page.waitForTimeout(1300)
  out.hide_list = await page.locator('.ncard__name').allInnerTexts()
  await page.goto(BASE + '#/app/settings'); await page.waitForTimeout(200)
  out.hide_settings = await txt(page, 'section[aria-labelledby=hidden-title]')
  await page.getByRole('button', { name: '다시 보기' }).click(); await page.waitForTimeout(200)
  await page.goto(BASE + '#/app/together'); await page.waitForTimeout(1300)
  out.unhide_list = await page.locator('.ncard__name').allInnerTexts()
  // hidden neighbour still reachable from home "다음 산책" link
  await seed(page, seedState({ hidden: ['bori'], bonds: { bori: { neighborId: 'bori', sessions: [{ at: now, steps: [], closest: 8, endedEarly: false }] } } }), '#/app')
  out.hiddenOnHome = await txt(page, 'section[aria-labelledby=next-title]')
  await page.goto(BASE + '#/app/bond'); await page.waitForTimeout(200)
  out.hiddenOnBond = await page.locator('.bond__name').allInnerTexts()
  // ---- F-12 site CTA with existing card
  await seed(page, seedState(), '#/')
  await page.getByRole('link', { name: '카드 만들어 보기' }).click(); await page.waitForTimeout(300)
  out.F12_notice = await txt(page, '.builder .notice')
  await page.getByLabel('이름').fill('새개')
  for (let k = 0; k < 4; k++) { await page.getByRole('button', { name: /다음|카드 미리보기/ }).click(); await page.waitForTimeout(120) }
  await page.getByRole('button', { name: '카드 저장하기' }).click(); await page.waitForTimeout(200)
  out.F12_confirm = await txt(page, 'dialog[open]')
  await page.locator('dialog[open]').getByRole('button', { name: '취소' }).click(); await page.waitForTimeout(200)
  out.F12_afterCancel = (await getS(page)).card.name
  // replace → old bonds stay → new dog's first plan?
  await seed(page, seedState({ bonds: { dubu: { neighborId: 'dubu', sessions: [{ at: now, steps: [], closest: 6, endedEarly: false }] } } }), '#/app/card/new')
  await page.getByLabel('이름').fill('새개')
  for (let k = 0; k < 4; k++) { await page.getByRole('button', { name: /다음|카드 미리보기/ }).click(); await page.waitForTimeout(120) }
  await page.getByRole('button', { name: '카드 저장하기' }).click(); await page.waitForTimeout(200)
  await page.locator('dialog[open]').getByRole('button', { name: '새 카드로 바꾸기' }).click(); await page.waitForTimeout(300)
  await page.goto(BASE + '#/app/together/dubu'); await page.waitForTimeout(300)
  out.F12_newDogPlan = { title: await txt(page, '#plan-title'), steps: await txt(page, '.plan__steps'), fine: await txt(page, 'section.panel .fineprint') }
  await page.screenshot({ path: SHOTS + 'm-new-dog-inherits-second-session.png', fullPage: true })
  // ---- F-13 builder leave paths
  await seed(page, seedState(), '#/app/card/edit')
  out.F13_appbar = { settingsLink: await page.locator('a.appbar__settings').count(), logoLink: await page.locator('a.appbar__home').count() }
  await page.getByLabel('이름').fill('뽀리2')
  await page.goBack(); await page.waitForTimeout(300)
  out.F13_back = { url: hash(page), dialog: await page.locator('dialog[open]').count() }
  await page.goForward(); await page.waitForTimeout(300)
  out.F13_forwardName = await page.getByLabel('이름').inputValue().catch(() => null)
  // ---- F-14 names
  await seed(page, seedState({ card: null }), '#/app/card/new')
  await page.getByLabel('이름').fill('🐶🐶🐶🐶🐶🐶'); await page.getByRole('button', { name: '다음' }).click(); await page.waitForTimeout(200)
  out.F14_emoji6 = { err: await page.locator('.error').allInnerTexts(), h1: await txt(page, 'h1') }
  await page.getByRole('button', { name: '이전' }).click(); await page.waitForTimeout(200)
  await page.getByLabel('이름').fill('가나다라마바사아자차카'); await page.getByRole('button', { name: '다음' }).click(); await page.waitForTimeout(200)
  out.F14_11 = { err: await page.locator('.error').allInnerTexts(), maxLength: await page.getByLabel('이름').getAttribute('maxlength') }
  await page.getByLabel('이름').fill('👨‍👩‍👧‍👦👨‍👩‍👧‍👦👨‍👩‍👧‍👦👨‍👩‍👧‍👦👨‍👩‍👧‍👦'); out.F14_zwjValue = [...(await page.getByLabel('이름').inputValue())].length
  // ---- V-01 note overflow 360
  await browser.close()
  for (const note of ['처음엔옆보다조금뒤가편해요자전거보면짖어요', 'https://example.com/very/long/path/without/spaces', 'W'.repeat(40)]) {
    const { browser: b2, page: p2 } = await launch({ viewport: { width: 360, height: 800 } })
    for (const r of ['#/app', '#/app/together/dubu', '#/app/tag', '#/app/show']) {
      await seed(p2, seedState({ card: card({ note, name: '가나다라마바사아자차' }) }), r)
      const m = await p2.evaluate(() => ({ sw: document.documentElement.scrollWidth, card: Math.max(0, ...[...document.querySelectorAll('.cardface, .tag-print, .showmode')].map((e) => Math.round(e.getBoundingClientRect().right))) }))
      out['V01 ' + note.slice(0, 6) + ' ' + r] = m
    }
    await p2.screenshot({ path: SHOTS + 'm-v01-show-360.png' })
    await b2.close()
  }
  out.errors = errors
  console.log(JSON.stringify(out, null, 1))
})().catch((e) => { console.error(e); process.exit(1) })
