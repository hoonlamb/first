const { launch, BASE } = require('./lib.cjs')
;(async () => {
  const { browser, page, errors } = await launch({ viewport: { width: 1440, height: 900 } })
  for (const r of ['#/brand', '#/case']) {
    await page.goto(BASE + r, { waitUntil: 'load' })
    for (const img of await page.locator('img').all()) { await img.scrollIntoViewIfNeeded(); await page.waitForTimeout(150) }
    await page.waitForTimeout(1500)
    const st = await page.evaluate(() => [...document.images].map((i) => [i.getAttribute('src'), i.complete && i.naturalWidth > 0, i.naturalWidth + 'x' + i.naturalHeight, i.getAttribute('width') + 'x' + i.getAttribute('height')]))
    console.log(r, JSON.stringify(st))
  }
  console.log('errors', errors)
  await browser.close()
})()
