// A-01/A-06/A-08 + show mode (Esc/back/Tab) + route titles + hero slider direction
const { launch, seed, seedState, card, getS, hash, BASE, SHOTS, now } = require('./lib.cjs')
const desc = () => { const a = document.activeElement; if (!a || a === document.body) return 'BODY'; return a.tagName.toLowerCase() + ':' + (a.innerText || a.getAttribute('aria-label') || a.value || '').trim().replace(/\s+/g, ' ').slice(0, 30) }
;(async () => {
  const out = {}
  const { browser, page, errors } = await launch()
  // titles
  const titles = {}
  await seed(page, seedState({ requests: { dubu: { status: 'accepted', at: now - 9e4, slot: 'evening' } } }), '#/')
  for (const r of ['#/', '#/brand', '#/case', '#/app', '#/app/card/new', '#/app/card/edit', '#/app/walk', '#/app/together', '#/app/together/dubu', '#/app/together/dubu/walk', '#/app/bond', '#/app/show', '#/app/tag', '#/app/settings', '#/zzz']) {
    await page.goto(BASE + r); await page.waitForTimeout(250); titles[r] = await page.title()
  }
  out.titles = titles; out.titlesUnique = new Set(Object.values(titles)).size
  // keyboard: empty → create → save
  await seed(page, seedState({ card: null }), '#/app')
  const seq = []
  await page.getByRole('link', { name: '산책 카드 만들기' }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300); seq.push(['create', await page.evaluate(desc)])
  await page.getByLabel('이름').focus(); await page.keyboard.type('뽀리'); await page.keyboard.press('Enter'); await page.waitForTimeout(300); seq.push(['step1', await page.evaluate(desc)])
  for (let s = 0; s < 3; s++) { await page.getByRole('button', { name: /다음|카드 미리보기/ }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(250) }
  seq.push(['preview', await page.evaluate(desc)])
  await page.getByRole('button', { name: '카드 저장하기' }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300); seq.push(['saved', await page.evaluate(desc)])
  // show mode
  await page.getByRole('link', { name: /보여주기/ }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300); seq.push(['showOpen', await page.evaluate(desc)])
  await page.keyboard.press('Tab'); seq.push(['showTab', await page.evaluate(desc)])
  await page.keyboard.press('Shift+Tab'); seq.push(['showShiftTab', await page.evaluate(desc)])
  await page.keyboard.press('Escape'); await page.waitForTimeout(300); seq.push(['showEsc', await page.evaluate(desc) + ' @' + hash(page)])
  await page.getByRole('link', { name: /보여주기/ }).click(); await page.waitForTimeout(300)
  await page.goBack(); await page.waitForTimeout(300); seq.push(['showBrowserBack', await page.evaluate(desc) + ' @' + hash(page)])
  await page.goForward(); await page.waitForTimeout(300)
  await page.getByRole('button', { name: '닫기' }).click(); await page.waitForTimeout(300); seq.push(['showCloseBtn', hash(page)])
  out.historyAfterShowClose = await page.evaluate(() => history.length)
  // show from direct URL (no history)
  const p2 = await page.context().newPage(); await p2.goto(BASE + '#/app/show'); await p2.waitForTimeout(300); await p2.keyboard.press('Escape'); await p2.waitForTimeout(300)
  seq.push(['showDirectEsc', hash(p2)]); await p2.close()
  // walk
  await page.goto(BASE + '#/app/walk'); await page.waitForTimeout(300); seq.push(['tabToWalk', await page.evaluate(desc)])
  await page.getByRole('button', { name: '산책 시작' }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300); seq.push(['walkStart', await page.evaluate(desc)])
  await page.keyboard.press('Enter'); await page.waitForTimeout(200); seq.push(['logged', await page.evaluate(desc)])
  await page.getByRole('button', { name: '산책 끝내기' }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300); seq.push(['walkEnd', await page.evaluate(desc)])
  await page.getByRole('button', { name: '산책 기록으로 돌아가기' }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300); seq.push(['summaryBack', await page.evaluate(desc)])
  await page.getByRole('button', { name: '산책 시작' }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300)
  await page.getByRole('button', { name: '기록 안 하고 끝내기' }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(200)
  seq.push(['discardDialog', await page.evaluate(desc)])
  await page.keyboard.press('Enter'); await page.waitForTimeout(300); seq.push(['discarded', await page.evaluate(desc)])
  // together timer end: no forced focus
  await seed(page, seedState({ requests: { dubu: { status: 'accepted', at: now - 9e4, slot: 'evening' } } }), '#/app/together/dubu/walk')
  await page.getByRole('button', { name: /에서 걷기 시작/ }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300)
  seq.push(['togetherWalk', await page.evaluate(desc)])
  await page.getByRole('button', { name: '잠깐 멈춤' }).focus(); await page.getByRole('button', { name: '잠깐 멈춤' }).press('Enter'); await page.getByRole('button', { name: '계속 걷기' }).press('Enter')
  await page.waitForTimeout(11000); seq.push(['togetherAfterTimer', await page.evaluate(desc), await page.locator('.together__panel [aria-live]').innerText()])
  // mobile menu
  await page.goto(BASE + '#/'); await page.waitForTimeout(300)
  await page.locator('.siteheader__menu').focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(200)
  seq.push(['menuOpen', await page.evaluate(desc), await page.locator('.siteheader__menu').getAttribute('aria-expanded')])
  await page.keyboard.press('Escape'); await page.waitForTimeout(200)
  seq.push(['menuEsc', await page.evaluate(desc), await page.locator('.siteheader__menu').getAttribute('aria-expanded')])
  // hero slider direction
  const r = page.locator('.dial input[type=range]')
  out.dial = { initialValue: await r.inputValue(), label: await page.locator('.dial__label').innerText(), ends: await page.locator('.dial__ends').innerText() }
  await r.focus(); for (let k = 0; k < 12; k++) await page.keyboard.press('ArrowLeft')
  out.dial.afterLeft12 = { value: await r.inputValue(), status: await page.locator('.dial__status').innerText() }
  const box = await r.boundingBox()
  await page.mouse.click(box.x + 4, box.y + box.height / 2); out.dial.clickLeftEnd = await r.inputValue()
  await page.mouse.click(box.x + box.width - 4, box.y + box.height / 2); out.dial.clickRightEnd = await r.inputValue()
  // lanes gap consistent: smaller value → lines closer?
  const gap = async () => page.evaluate(() => { const ls = [...document.querySelectorAll('.dial .lanes line, .dial svg line')]; return ls.length })
  out.seq = seq
  out.errors = errors
  console.log(JSON.stringify(out, null, 1))
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
