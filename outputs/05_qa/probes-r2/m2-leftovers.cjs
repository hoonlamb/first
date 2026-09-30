// R-06 brand TOC deep link, R-02 codec, together screen theme screenshot, dial copy at 3m for 콩이
const { launch, seed, seedState, card, BASE, SHOTS, now } = require('./lib.cjs')
;(async () => {
  const out = {}
  const { browser, page, errors } = await launch()
  await page.goto(BASE + '#/brand'); await page.waitForTimeout(800)
  out.R06_tocHref = await page.locator('a[href^="#"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')).filter((h) => !h.startsWith('#/') && h !== '#main').slice(0, 3))
  const p2 = await page.context().newPage(); await p2.goto(BASE + out.R06_tocHref[0]); await p2.waitForTimeout(800)
  out.R06_deepLink = { url: p2.url(), h1: await p2.locator('h1').first().innerText() }
  await page.goto(BASE + '#/case'); await page.waitForTimeout(500)
  out.R02 = await page.evaluate(async () => { const v = document.querySelector('video'); return { sources: v.querySelectorAll('source').length, canPlay: v.canPlayType('video/mp4; codecs="avc1.640028"'), fallbackLink: !!document.querySelector('.case__film a[href$=".mp4"]') } })
  await seed(page, seedState({ requests: { dubu: { status: 'accepted', at: now - 9e4, slot: 'evening' } } }), '#/app/together/dubu/walk')
  await page.getByRole('button', { name: /에서 걷기 시작/ }).click(); await page.waitForTimeout(400)
  out.X06_togetherBg = await page.evaluate(() => [getComputedStyle(document.querySelector('.product__frame')).backgroundColor, getComputedStyle(document.querySelector('.together__stage')).backgroundColor])
  await page.screenshot({ path: SHOTS + 'x06-together-walking-390.png' })
  await page.goto(BASE + '#/'); await page.waitForTimeout(500)
  await page.getByRole('radio', { name: /콩이/ }).check({ force: true }); await page.locator('.dial input[type=range]').fill('3'); await page.waitForTimeout(200)
  out.dial_kong_3m = await page.locator('.dial__status').innerText()
  out.errors = errors
  console.log(JSON.stringify(out, null, 1))
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
