const { launch, makeCard, BASE, SHOTS } = require('./lib.cjs')
;(async () => {
  const out = {}
  const { browser, page } = await launch({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  await makeCard(page)
  // overwrite check: card exists, open /app/card/new from site CTA
  await page.goto(BASE + '#/'); await page.getByRole('link', { name: '카드 만들어 보기' }).click(); await page.waitForTimeout(300)
  out.newBuilderNameValue = await page.getByLabel('이름').inputValue()
  await page.goto(BASE + '#/app/walk')
  await page.getByRole('button', { name: '산책 시작' }).tap()
  for (const gap of [80, 150, 250]) {
    await page.goto(BASE + '#/app/walk'); await page.waitForTimeout(300)
    await page.getByRole('button', { name: '마주침 기록' }).tap()
    await page.locator('dialog[open]').getByRole('radio', { name: '3m', exact: true }).check()
    await page.locator('dialog[open]').getByRole('radio', { name: '편안했어요' }).check()
    const b = await page.locator('dialog[open]').getByRole('button', { name: '기록하기' }).boundingBox()
    const x = b.x + b.width / 2, y = b.y + b.height / 2
    await page.touchscreen.tap(x, y); await page.waitForTimeout(gap); await page.touchscreen.tap(x, y); await page.waitForTimeout(400)
    out['doubleTap_' + gap + 'ms'] = page.url().split('#')[1]
  }
  // request dialog double tap
  await page.goto(BASE + '#/app/together'); await page.waitForTimeout(200)
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('dangq.demo.v1')); s.neighborhood = '망원동'; s.location = 'manual'; localStorage.setItem('dangq.demo.v1', JSON.stringify(s)) })
  await page.goto(BASE + '#/app/together/bori'); await page.reload(); await page.waitForTimeout(300)
  await page.getByRole('button', { name: '나란히 산책 요청하기' }).tap()
  const b2 = await page.locator('dialog[open]').getByRole('button', { name: '요청 보내기' }).boundingBox()
  await page.touchscreen.tap(b2.x + b2.width / 2, b2.y + b2.height / 2); await page.waitForTimeout(150); await page.touchscreen.tap(b2.x + b2.width / 2, b2.y + b2.height / 2); await page.waitForTimeout(400)
  out.requestDoubleTap = page.url().split('#')[1]
  await page.screenshot({ path: SHOTS + 'f-ghost-tap-request.png' })
  console.log(JSON.stringify(out, null, 1))
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
