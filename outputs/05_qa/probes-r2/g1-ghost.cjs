// F-01: touch double-tap on sheet/confirm buttons must not hit what is underneath (80/150/250ms)
const { launch, seed, seedState, getS, hash, BASE, SHOTS, now } = require('./lib.cjs')
async function dbl(page, name, gap) {
  const b = await page.locator('dialog[open]').getByRole('button', { name, exact: true }).boundingBox()
  const x = b.x + b.width / 2, y = b.y + b.height / 2
  await page.touchscreen.tap(x, y); await page.waitForTimeout(gap); await page.touchscreen.tap(x, y); await page.waitForTimeout(500)
  return { x: Math.round(x), y: Math.round(y) }
}
;(async () => {
  const out = {}
  const { browser, page, errors } = await launch({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 })
  for (const gap of [80, 150, 250]) {
    const r = {}
    await seed(page, seedState(), '#/app/together/dubu')
    await page.getByRole('button', { name: '나란히 산책 요청하기' }).tap(); await page.waitForTimeout(300)
    r.pt = await dbl(page, '요청 보내기', gap)
    r.request = { url: hash(page), req: !!(await getS(page)).requests.dubu }
    // walk discard confirm (tab bar is underneath on mobile)
    await seed(page, seedState(), '#/app/walk')
    await page.getByRole('button', { name: '산책 시작' }).tap(); await page.waitForTimeout(200)
    await page.getByRole('button', { name: '기록 안 하고 끝내기' }).tap(); await page.waitForTimeout(300)
    r.discardPt = await dbl(page, '기록 안 하기', gap)
    r.discard = { url: hash(page), active: (await getS(page)).activeWalk }
    // together stop confirm
    await seed(page, seedState({ requests: { dubu: { status: 'accepted', at: now - 9e4, slot: 'evening' } } }), '#/app/together/dubu/walk')
    await page.getByRole('button', { name: /에서 걷기 시작/ }).tap(); await page.waitForTimeout(200)
    await page.getByRole('button', { name: '그만하기' }).tap(); await page.waitForTimeout(300)
    r.stopPt = await dbl(page, '마치기', gap)
    const s = await getS(page)
    r.stop = { url: hash(page), sessions: s.bonds.dubu && s.bonds.dubu.sessions.length }
    // hide neighbour confirm
    await seed(page, seedState(), '#/app/together/bori')
    await page.getByRole('button', { name: '이 이웃 숨기기' }).tap(); await page.waitForTimeout(300)
    r.hidePt = await dbl(page, '숨기기', gap)
    r.hide = { url: hash(page) }
    out['gap' + gap] = r
  }
  await page.screenshot({ path: SHOTS + 'g-ghost-after-hide.png' })
  out.errors = errors
  console.log(JSON.stringify(out, null, 1))
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
