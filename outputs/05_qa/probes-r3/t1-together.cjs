// 나란히: persistence (leave/back/reload/resume), 그만하기, step-back at step 1, greeting only from 2nd session,
// early-stop bypass, second-neighbour overwrite, pro gate, auto-accept toast, next-start consistency (F-02/F-04/F-06/F-09/F-11/F-16/C-02)
const { launch, seed, seedState, getS, hash, BASE, SHOTS, now } = require('./lib.cjs')
const acc = (id) => ({ [id]: { status: 'accepted', at: now - 9e4, slot: 'evening' } })
const txt = (page, sel) => page.locator(sel).first().innerText().then((t) => t.replace(/\s+/g, ' ').trim()).catch(() => null)
async function toCheck(page) { await page.getByRole('button', { name: '둘 다 편해요?' }).click(); await page.waitForTimeout(150) }
async function calm(page) { await toCheck(page); await page.getByRole('button', { name: /둘 다 편안했어요/ }).click(); await page.waitForTimeout(200) }
;(async () => {
  const out = {}
  const { browser, page, errors } = await launch()
  // ---- A. persistence
  await seed(page, seedState({ requests: acc('dubu') }), '#/app/together/dubu')
  out.A_detailPlan = await txt(page, '.plan__steps')
  out.A_detailLead = await txt(page, '.plan__lead')
  await page.getByRole('button', { name: '나란히 산책 시작' }).click(); await page.waitForTimeout(300)
  out.A_introRules = await txt(page, '.rules')
  await page.getByRole('button', { name: /에서 걷기 시작/ }).click(); await page.waitForTimeout(200)
  await calm(page)
  out.A_afterCalm = await txt(page, '.together__panel')
  await page.goBack(); await page.waitForTimeout(400)
  out.A_backUrl = hash(page)
  let s = await getS(page)
  out.A_backActive = s.activeTogether && { id: s.activeTogether.neighborId, i: s.activeTogether.i, phase: s.activeTogether.phase, log: s.activeTogether.log, steps: s.activeTogether.steps }
  out.A_backBonds = s.bonds
  out.A_detailStatus = await txt(page, '.status-box')
  await page.goto(BASE + '#/app'); await page.waitForTimeout(300)
  out.A_homeMentionsActive = await page.locator('main').innerText().then((t) => /진행 중|이어서/.test(t) ? t.match(/.{0,20}(진행 중|이어서).{0,20}/)[0] : 'no mention')
  await page.goto(BASE + '#/app/together/dubu'); await page.waitForTimeout(300)
  await page.getByRole('button', { name: '이어서 걷기' }).click(); await page.waitForTimeout(300)
  out.A_resumed = await txt(page, '.together__panel')
  await page.reload(); await page.waitForTimeout(500)
  out.A_afterReload = await txt(page, '.together__panel')
  out.A_afterReloadProgress = await page.locator('.progress').getAttribute('aria-label')
  await page.screenshot({ path: SHOTS + 't-together-resume-after-reload.png' })
  // ---- B. step-back at step 1 is tested on a fresh session below; here: 그만하기
  await page.getByRole('button', { name: '그만하기' }).click(); await page.waitForTimeout(200)
  out.A_stopDialog = await txt(page, 'dialog[open]')
  await page.locator('dialog[open]').getByRole('button', { name: '마치기' }).click(); await page.waitForTimeout(300)
  s = await getS(page)
  out.A_afterStopBond = s.bonds.dubu && s.bonds.dubu.sessions.map((x) => ({ closest: x.closest, endedEarly: x.endedEarly, steps: x.steps.length }))
  out.A_afterStopActive = s.activeTogether
  out.A_doneText = await txt(page, '.together__panel')
  // next start consistency across 4 screens
  await page.goto(BASE + '#/app'); await page.waitForTimeout(300)
  out.I_home = await txt(page, 'a.rowlink[href*="together/dubu"]')
  out.I_homeSmallLines = await page.locator('a.rowlink[href*="together/dubu"] small').evaluate((e) => Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight))).catch(() => null)
  await page.goto(BASE + '#/app/together'); await page.waitForTimeout(1300)
  out.I_list = await txt(page, 'a.ncard[href$="/dubu"] .ncard__dist')
  await page.goto(BASE + '#/app/together/dubu'); await page.waitForTimeout(300)
  out.I_detail = await txt(page, '.plan__lead')
  out.I_detailSteps = await txt(page, '.plan__steps')
  out.I_bond = await page.goto(BASE + '#/app/bond').then(() => page.waitForTimeout(300)).then(() => txt(page, '.bond__next'))
  // ---- C. first session to the floor → no greet; second session → greet allowed
  await seed(page, seedState({ requests: acc('dubu') }), '#/app/together/dubu/walk')
  await page.getByRole('button', { name: /에서 걷기 시작/ }).click(); await page.waitForTimeout(200)
  const firstSteps = []
  for (let k = 0; k < 6; k++) {
    if (!(await page.locator('.together__num').count())) break
    firstSteps.push(await txt(page, '.together__num'))
    await calm(page)
  }
  out.C_firstSteps = firstSteps
  out.C_firstEnd = await txt(page, '.together__panel')
  out.C_greetShownFirst = await page.getByText('짧게 인사해 볼까요?').count()
  // second session: request again (demo auto-accept)
  await page.goto(BASE + '#/app/together/dubu'); await page.waitForTimeout(300)
  out.C_secondPlan = await txt(page, '.plan__steps'); out.C_secondTitle = await txt(page, '#plan-title')
  await page.getByRole('button', { name: '나란히 산책 요청하기' }).click(); await page.waitForTimeout(200)
  out.C_secondSheet = await txt(page, 'dialog[open] .sheet__body')
  await page.locator('dialog[open]').getByRole('button', { name: '요청 보내기' }).click()
  await page.waitForTimeout(3000)
  out.C_toast = await page.locator('.toast.is-on').allInnerTexts()
  await page.getByRole('button', { name: '나란히 산책 시작' }).click(); await page.waitForTimeout(300)
  await page.getByRole('button', { name: /에서 걷기 시작/ }).click(); await page.waitForTimeout(200)
  const secondSteps = []
  for (let k = 0; k < 8; k++) {
    if (!(await page.locator('.together__num').count())) break
    secondSteps.push(await txt(page, '.together__num'))
    await calm(page)
  }
  out.C_secondSteps = secondSteps
  out.C_greetShownSecond = await page.getByText('짧게 인사해 볼까요?').count()
  await page.screenshot({ path: SHOTS + 't-greet-second-session.png' })
  // ---- B. step-back at step 1 (fresh)
  await seed(page, seedState({ requests: acc('dubu') }), '#/app/together/dubu/walk')
  await page.getByRole('button', { name: /에서 걷기 시작/ }).click(); await page.waitForTimeout(200)
  out.B_tenseButtonsOnWalking = await page.locator('.together__panel button').allInnerTexts()
  await page.getByRole('button', { name: '긴장했어요', exact: true }).click(); await page.waitForTimeout(200)
  out.B_tensePanel = await page.locator('.together__panel button').allInnerTexts()
  await page.getByRole('button', { name: /물러나 다시 걷기/ }).click(); await page.waitForTimeout(200)
  out.B_afterBack = { num: await txt(page, '.together__num'), progress: await page.locator('.progress').getAttribute('aria-label'), steps: (await getS(page)).activeTogether.steps }
  for (let k = 0; k < 6; k++) { await page.getByRole('button', { name: '긴장했어요', exact: true }).click(); await page.waitForTimeout(100); await page.getByRole('button', { name: /물러나 다시 걷기/ }).click(); await page.waitForTimeout(100) }
  out.B_afterManyBack = (await getS(page)).activeTogether.steps
  await page.screenshot({ path: SHOTS + 't-stepback-many.png' })
  // ---- D. bypass: stop immediately in session 1 (no calm step), then session 2 plan
  await seed(page, seedState({ requests: acc('dubu') }), '#/app/together/dubu/walk')
  await page.getByRole('button', { name: /에서 걷기 시작/ }).click(); await page.waitForTimeout(200)
  await page.getByRole('button', { name: '그만하기' }).click(); await page.locator('dialog[open]').getByRole('button', { name: '마치기' }).click(); await page.waitForTimeout(300)
  out.D_done = await txt(page, '.together__panel')
  await page.goto(BASE + '#/app/together/dubu'); await page.waitForTimeout(300)
  out.D_nextTitle = await txt(page, '#plan-title'); out.D_nextPlan = await txt(page, '.plan__steps'); out.D_nextFine = await txt(page, '.plan__panel .fineprint, section.panel .fineprint')
  await page.screenshot({ path: SHOTS + 't-bypass-after-zero-step-session.png', fullPage: true })
  // ---- E. second neighbour overwrites an in-progress session
  await seed(page, seedState({ requests: { ...acc('dubu'), ...acc('bori') } }), '#/app/together/dubu/walk')
  await page.getByRole('button', { name: /에서 걷기 시작/ }).click(); await page.waitForTimeout(200)
  await calm(page)
  await page.goto(BASE + '#/app/together/bori'); await page.waitForTimeout(300)
  out.E_boriStatus = await page.locator('.status-box, .notice').allInnerTexts()
  if (await page.getByRole('button', { name: '나란히 산책 시작' }).count()) {
    await page.getByRole('button', { name: '나란히 산책 시작' }).click(); await page.waitForTimeout(300)
    await page.getByRole('button', { name: /에서 걷기 시작/ }).click(); await page.waitForTimeout(200)
  }
  s = await getS(page)
  out.E_after = { active: s.activeTogether && s.activeTogether.neighborId, dubuBond: s.bonds.dubu || null }
  // ---- F. pro gate
  await seed(page, seedState(), '#/app/together/mango')
  out.F_mango = { note: await txt(page, '.status-box'), requestBtn: await page.getByRole('button', { name: '나란히 산책 요청하기' }).count() }
  await seed(page, seedState({ card: { ...seedState().card, comfort: 12 } }), '#/app/together/dubu')
  out.F_card12_dubu = { note: await txt(page, '.status-box'), requestBtn: await page.getByRole('button', { name: '나란히 산책 요청하기' }).count() }
  await seed(page, seedState({ card: { ...seedState().card, comfort: 11 } }), '#/app/together/dubu')
  out.F_card11_dubu = { plan: await txt(page, '.plan__steps'), requestBtn: await page.getByRole('button', { name: '나란히 산책 요청하기' }).count() }
  // accepted before raising to 12m → direct URL
  await seed(page, seedState({ card: { ...seedState().card, comfort: 14 }, requests: acc('dubu') }), '#/app/together/dubu/walk')
  out.F_card14_acceptedDirectWalk = { url: hash(page), intro: await txt(page, '.together__panel') }
  await page.goto(BASE + '#/app'); await page.waitForTimeout(300)
  out.F_card14_home = await txt(page, 'section[aria-labelledby=next-title]')
  // ---- H. global auto-accept toast from another screen, and from the site
  await seed(page, seedState(), '#/app/together/dubu')
  await page.getByRole('button', { name: '나란히 산책 요청하기' }).click(); await page.locator('dialog[open]').getByRole('button', { name: '요청 보내기' }).click()
  await page.goto(BASE + '#/app/walk'); const t0 = Date.now()
  await page.locator('.toast.is-on').first().waitFor({ timeout: 6000 }).catch(() => {})
  out.H_toastOnWalk = { ms: Date.now() - t0, text: await page.locator('.toast.is-on').allInnerTexts(), status: (await getS(page)).requests.dubu }
  await page.goto(BASE + '#/app/together/bori'); await page.getByRole('button', { name: '나란히 산책 요청하기' }).click(); await page.locator('dialog[open]').getByRole('button', { name: '요청 보내기' }).click()
  await page.goto(BASE + '#/'); await page.waitForTimeout(3500)
  out.H_onSiteStatus = (await getS(page)).requests.bori.status
  await page.goto(BASE + '#/app'); await page.waitForTimeout(600)
  out.H_backInAppStatus = (await getS(page)).requests.bori.status
  out.H_backInAppToast = await page.locator('.toast.is-on').allInnerTexts()
  // ---- K. cancel accepted toast; night-only slot for first meeting
  await seed(page, seedState({ requests: acc('dubu') }), '#/app/together/dubu')
  await page.getByRole('button', { name: '약속 취소' }).click(); await page.locator('dialog[open]').getByRole('button', { name: '취소하기' }).click(); await page.waitForTimeout(200)
  out.K_cancelToast = await page.locator('.toast.is-on').allInnerTexts()
  await seed(page, seedState({ card: { ...seedState().card, slots: ['night'] } }), '#/app/together/bori')
  // r3: the request button is now disabled up-front with a reason
  out.K_nightOnly = { requestDisabled: await page.getByRole('button', { name: '나란히 산책 요청하기' }).isDisabled(), reason: await page.locator('p.error').allInnerTexts() }
  await page.screenshot({ path: SHOTS + 't-night-only-no-slot.png' })
  out.errors = errors
  console.log(JSON.stringify(out, null, 1))
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
