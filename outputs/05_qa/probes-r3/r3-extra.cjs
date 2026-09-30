// Round-3 targeted rechecks: R2-01 variant, R2-02 URL guard, R2-13 active+gate, R2-14 slot leak, R2-15 greet stop,
// R2-11 hide active partner, R2-04 print page count at desktop widths/long note, R2-07 dial copy, brand TOC.
const { launch, seed, seedState, card, getS, hash, BASE, SHOTS, now } = require('./lib.cjs')
const fs = require('fs')
const acc = (id) => ({ [id]: { status: 'accepted', at: now - 9e4, slot: 'evening' } })
const txt = (page, sel) => page.locator(sel).first().innerText().then((t) => t.replace(/\s+/g, ' ').trim()).catch(() => null)
async function calm(page) { await page.getByRole('button', { name: '둘 다 편해요?' }).click(); await page.waitForTimeout(120); await page.getByRole('button', { name: /둘 다 편안했어요/ }).click(); await page.waitForTimeout(180) }
;(async () => {
  const out = {}
  const { browser, page, errors } = await launch()
  // R2-01 variant: tense at step 1 → 오늘은 여기까지
  await seed(page, seedState({ requests: acc('dubu') }), '#/app/together/dubu/walk')
  await page.getByRole('button', { name: /에서 걷기 시작/ }).click(); await page.waitForTimeout(200)
  await page.getByRole('button', { name: '긴장했어요', exact: true }).click(); await page.waitForTimeout(150)
  await page.getByRole('button', { name: '오늘은 여기까지' }).click(); await page.waitForTimeout(300)
  await page.goto(BASE + '#/app/together/dubu'); await page.waitForTimeout(300)
  out.R201_tenseStop = { title: await txt(page, '#plan-title'), steps: await txt(page, '.plan__steps'), sessions: (await getS(page)).bonds.dubu?.sessions.map((s) => s.closest) }
  // re-request sheet wording after such a session
  if (await page.getByRole('button', { name: '나란히 산책 요청하기' }).count()) { await page.getByRole('button', { name: '나란히 산책 요청하기' }).click(); await page.waitForTimeout(200); out.R201_sheet = await txt(page, 'dialog[open] .sheet__body'); await page.keyboard.press('Escape') }
  // R2-02: dubu in progress, direct URL to bori walk
  await seed(page, seedState({ requests: { ...acc('dubu'), ...acc('bori') } }), '#/app/together/dubu/walk')
  await page.getByRole('button', { name: /에서 걷기 시작/ }).click(); await page.waitForTimeout(200); await calm(page)
  await page.goto(BASE + '#/app/together/bori/walk'); await page.waitForTimeout(400)
  let s = await getS(page)
  out.R202_directUrl = { url: hash(page), active: s.activeTogether?.neighborId, i: s.activeTogether?.i, notice: await page.locator('.notice').allInnerTexts() }
  // R2-10 home entry
  await page.goto(BASE + '#/app'); await page.waitForTimeout(300)
  const resume = page.locator('a.rowlink[href*="together/dubu/walk"]')
  out.R210_home = { text: await resume.innerText().catch(() => null) }
  await page.screenshot({ path: SHOTS + 'home-resume-entry-390.png' })
  if (await resume.count()) { await resume.click(); await page.waitForTimeout(300); out.R210_afterClick = { url: hash(page), panel: await txt(page, '.together__panel') } }
  // R2-11: hide the in-progress partner (dubu) → bori detail
  await page.goto(BASE + '#/app/together/dubu'); await page.waitForTimeout(300)
  const hideBtn = page.getByRole('button', { name: /숨기기/ })
  if (await hideBtn.count()) { await hideBtn.first().click(); await page.waitForTimeout(150); await page.locator('dialog[open]').getByRole('button', { name: /숨기기/ }).last().click(); await page.waitForTimeout(300) }
  s = await getS(page)
  await page.goto(BASE + '#/app/together/bori'); await page.waitForTimeout(300)
  out.R211_hideActive = { hidden: s.hidden, active: s.activeTogether?.neighborId || null, boriNotice: await page.locator('.notice').allInnerTexts() }
  await page.screenshot({ path: SHOTS + 'hide-active-partner-bori.png' })
  // R2-13: active dubu walk, then card raised to 14m, direct walk URL / detail
  await seed(page, seedState({ requests: acc('dubu') }), '#/app/together/dubu/walk')
  await page.getByRole('button', { name: /에서 걷기 시작/ }).click(); await page.waitForTimeout(200); await calm(page)
  await page.evaluate((k) => { const st = JSON.parse(localStorage.getItem(k)); st.card.comfort = 14; localStorage.setItem(k, JSON.stringify(st)) }, 'dangq.demo.v1')
  await page.goto(BASE + '#/app/settings'); await page.reload(); await page.waitForTimeout(200)
  await page.goto(BASE + '#/app/together/dubu/walk'); await page.waitForTimeout(400)
  out.R213_activeThenGate = { url: hash(page), panel: await txt(page, '.together__panel'), buttons: await page.locator('.together__panel button').allInnerTexts() }
  await page.goto(BASE + '#/app/together/dubu'); await page.waitForTimeout(300)
  out.R213_detail = { status: await page.locator('.status-box, .notice').allInnerTexts(), resumeBtn: await page.getByRole('button', { name: '이어서 걷기' }).count() }
  await page.goto(BASE + '#/app'); await page.waitForTimeout(300)
  out.R213_home = await txt(page, 'section[aria-labelledby=next-title]')
  // R2-14: select a slot in bori sheet, then navigate to kong
  await seed(page, seedState({ card: card({ slots: ['morning', 'evening', 'dawn', 'night'] }) }), '#/app/together/bori')
  await page.getByRole('button', { name: '나란히 산책 요청하기' }).click(); await page.waitForTimeout(200)
  const radios = page.locator('dialog[open] input[type=radio]'); const rc = await radios.count()
  if (rc > 1) await radios.nth(rc - 1).check()
  out.R214_boriChosen = await page.locator('dialog[open] input[type=radio]:checked').evaluate((e) => e.value).catch(() => null)
  await page.goto(BASE + '#/app/together/kong'); await page.waitForTimeout(300)
  out.R214_kong = { dialogOpen: await page.locator('dialog[open]').count() }
  await page.getByRole('button', { name: '나란히 산책 요청하기' }).click(); await page.waitForTimeout(200)
  out.R214_kongChosen = await page.locator('dialog[open] input[type=radio]:checked').evaluate((e) => e.value).catch(() => null)
  out.R214_kongOptions = await page.locator('dialog[open] input[type=radio]').evaluateAll((es) => es.map((e) => e.value))
  // R2-15: second session to greet; is 그만하기 shown at greet?
  await seed(page, seedState({ requests: acc('dubu'), bonds: { dubu: { sessions: [{ at: now - 864e5, steps: [], closest: 6, endedEarly: false }] } } }), '#/app/together/dubu/walk')
  await page.getByRole('button', { name: /에서 걷기 시작/ }).click(); await page.waitForTimeout(200)
  for (let k = 0; k < 8 && (await page.locator('.together__num').count()); k++) await calm(page)
  out.R215_greet = { title: await txt(page, '.together__title'), stopVisible: await page.getByRole('button', { name: '그만하기' }).count() }
  // R2-07 dial copy (site hero)
  await page.goto(BASE + '#/'); await page.waitForTimeout(500)
  out.R207_dialSamples = await page.locator('.dial, [class*=dial]').first().innerText().then((t) => t.replace(/\s+/g, ' ').slice(0, 300)).catch(() => null)
  // brand TOC hrefs
  await page.goto(BASE + '#/brand'); await page.waitForTimeout(600)
  out.brandToc = await page.locator('nav a[href="#/brand"]').count()
  const firstToc = page.locator('nav a[href="#/brand"]').nth(2)
  if (await firstToc.count()) { const y0 = await page.evaluate(() => scrollY); await firstToc.click(); await page.waitForTimeout(900); out.brandTocClick = { url: hash(page), y0, y1: await page.evaluate(() => scrollY), active: await page.evaluate(() => document.activeElement && document.activeElement.id) } }
  // R2-04 print at desktop widths & long note
  for (const [w, label, c] of [[1440, 'desk', card()], [1440, 'desk-longnote', card({ note: '가'.repeat(60) })], [390, 'm-longnote', card({ note: '가'.repeat(60) })]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } }); const p = await ctx.newPage()
    await seed(p, seedState({ card: c }), '#/app/tag')
    for (const fmt of ['A4', 'Letter']) {
      const pdf = await p.pdf({ format: fmt, printBackground: true })
      fs.writeFileSync(`/home/user/first/outputs/05_qa/shots-r3/tag-${label}-${fmt}.pdf`, pdf)
      out[`R204_${label}_${fmt}_pages`] = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length
    }
    await p.emulateMedia({ media: 'print' })
    out[`R204_${label}_printDocMm`] = await p.evaluate(() => +(document.documentElement.scrollHeight / (96 / 25.4)).toFixed(1))
    await p.setViewportSize({ width: 703, height: 1032 }); await p.waitForTimeout(100)
    out[`R204_${label}_tagsMm`] = await p.evaluate(() => [...document.querySelectorAll('.tag-print')].map((e) => { const b = e.getBoundingClientRect(); return [+(b.left / 3.7795).toFixed(1), +(b.right / 3.7795).toFixed(1), +(b.top / 3.7795).toFixed(1), +(b.bottom / 3.7795).toFixed(1)] }))
    await p.screenshot({ path: SHOTS + `tag-print-${label}-A4w.png` })
    await ctx.close()
  }
  out.errors = errors
  console.log(JSON.stringify(out, null, 1))
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
