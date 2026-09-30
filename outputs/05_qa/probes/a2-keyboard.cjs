const { launch, BASE, SHOTS } = require('./lib.cjs')
const desc = () => {
  const a = document.activeElement
  if (!a || a === document.body) return { el: 'BODY' }
  const cs = getComputedStyle(a)
  let vis = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0
  // radios/checkboxes use sibling span outline
  if (!vis && a.matches('input') && a.nextElementSibling) { const s = getComputedStyle(a.nextElementSibling); vis = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 }
  if (!vis && a.matches('input[type=range]')) vis = 'thumb-only'
  if (!vis && cs.boxShadow !== 'none') vis = 'box-shadow'
  const r = a.getBoundingClientRect()
  return { el: a.tagName.toLowerCase() + (a.type ? '[' + a.type + ']' : ''), text: (a.innerText || a.getAttribute('aria-label') || a.value || '').trim().replace(/\s+/g, ' ').slice(0, 28), vis, inView: r.bottom > 0 && r.top < innerHeight }
}
;(async () => {
  const out = {}
  const { browser, page } = await launch({ viewport: { width: 390, height: 844 } })
  await page.goto(BASE + '#/'); await page.waitForTimeout(500)
  const stops = []
  for (let k = 0; k < 14; k++) { await page.keyboard.press('Tab'); stops.push(await page.evaluate(desc)) }
  out.siteTabStops390 = stops
  // skip link
  await page.goto(BASE + '#/brand'); await page.reload(); await page.waitForTimeout(500)
  await page.keyboard.press('Tab'); out.firstStop = await page.evaluate(desc)
  await page.screenshot({ path: SHOTS + 'a-skiplink-visible.png' })
  await page.keyboard.press('Enter'); await page.waitForTimeout(200)
  out.afterSkip = await page.evaluate(() => document.activeElement.id + ' url=' + location.hash)
  await page.keyboard.press('Tab'); out.afterSkipNext = await page.evaluate(desc)
  // mobile menu: open with keyboard, Esc?
  await page.goto(BASE + '#/'); await page.reload(); await page.waitForTimeout(300)
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab')
  out.menuFocus = await page.evaluate(desc)
  await page.keyboard.press('Enter'); await page.waitForTimeout(200)
  out.menuExpanded = await page.locator('.siteheader__menu').getAttribute('aria-expanded')
  await page.screenshot({ path: SHOTS + 'a-mobile-menu-open.png' })
  await page.keyboard.press('Escape'); await page.waitForTimeout(200)
  out.menuAfterEsc = await page.locator('.siteheader__menu').getAttribute('aria-expanded')
  // dial by keyboard
  await page.locator('.dial input[type=range]').focus()
  for (let k = 0; k < 13; k++) await page.keyboard.press('ArrowRight')
  out.dialAfterKeys = await page.locator('.dial__status').innerText()
  out.dialAriaValueText = await page.locator('.dial input[type=range]').getAttribute('aria-valuetext')
  // ---- product via keyboard only
  await page.goto(BASE + '#/app'); await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300)
  const appStops = []
  for (let k = 0; k < 6; k++) { await page.keyboard.press('Tab'); appStops.push(await page.evaluate(desc)) }
  out.appEmptyStops = appStops
  // focus the create link and Enter
  await page.getByRole('link', { name: '산책 카드 만들기' }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300)
  out.builderInitialFocus = await page.evaluate(desc)
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); out.builderStop2 = await page.evaluate(desc)
  await page.keyboard.type('뽀리'); await page.keyboard.press('Enter'); await page.waitForTimeout(300)
  out.afterEnterFocus = await page.evaluate(desc)
  await page.keyboard.press('Tab'); out.step1Tab1 = await page.evaluate(desc)
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight')
  out.comfortVal = await page.getByLabel('편한 거리(미터)').inputValue()
  await page.keyboard.press('Tab'); out.step1Tab2 = await page.evaluate(desc)
  await page.keyboard.press('Tab'); out.step1Tab3 = await page.evaluate(desc)
  await page.screenshot({ path: SHOTS + 'a-builder-focus.png' })
  // go through remaining steps by clicking via keyboard on 다음
  for (let s = 0; s < 3; s++) { await page.getByRole('button', { name: /다음|카드 미리보기/ }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(250) }
  await page.getByRole('button', { name: '카드 저장하기' }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300)
  out.afterSaveFocus = await page.evaluate(desc)
  // show mode focus return
  await page.getByRole('link', { name: /보여주기/ }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300)
  out.showFocus = await page.evaluate(desc)
  await page.keyboard.press('Tab'); out.showTab2 = await page.evaluate(desc)
  await page.keyboard.press('Escape'); await page.waitForTimeout(300)
  out.afterShowEsc = await page.evaluate(desc)
  // walk dialog
  await page.goto(BASE + '#/app/walk'); await page.waitForTimeout(200)
  await page.getByRole('button', { name: '산책 시작' }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300)
  out.afterStartFocus = await page.evaluate(desc)
  await page.getByRole('button', { name: '마주침 기록' }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300)
  out.dialogFocus = await page.evaluate(desc)
  const trap = []
  for (let k = 0; k < 16; k++) { await page.keyboard.press('Tab'); trap.push((await page.evaluate(() => !!document.activeElement.closest('dialog'))) ) }
  out.dialogTrapAllInside = trap.every(Boolean)
  await page.keyboard.press('Escape'); await page.waitForTimeout(200)
  out.afterDialogEsc = await page.evaluate(desc)
  // save encounter via keyboard -> where does focus go & is toast announced
  await page.getByRole('button', { name: '마주침 기록' }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(200)
  await page.getByRole('radio', { name: '5m', exact: true }).focus(); await page.keyboard.press('Space')
  await page.getByRole('radio', { name: '편안했어요' }).focus(); await page.keyboard.press('Space')
  await page.getByRole('button', { name: '기록하기' }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300)
  out.afterSaveEncounterFocus = await page.evaluate(desc)
  out.toastRegion = await page.locator('.toast').evaluate((e) => e.getAttribute('role') + '/' + e.getAttribute('aria-live') + ' "' + e.innerText + '"')
  // finish -> summary focus
  await page.getByRole('button', { name: '산책 끝내기' }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300)
  out.afterFinishFocus = await page.evaluate(desc)
  // tab bar focus visible check
  await page.goto(BASE + '#/app'); await page.waitForTimeout(200)
  await page.locator('.tabbar a').nth(1).focus(); out.tabbarFocus = await page.evaluate(desc)
  await page.screenshot({ path: SHOTS + 'a-tabbar-focus.png' })
  // route change focus management: after clicking tab, where is focus / is title updated
  await page.keyboard.press('Enter'); await page.waitForTimeout(300)
  out.afterTabNavFocus = await page.evaluate(desc); out.titleAfterNav = await page.title()
  console.log(JSON.stringify(out, null, 1))
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
