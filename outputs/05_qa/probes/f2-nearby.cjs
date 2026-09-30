const { launch, makeCard, BASE, SHOTS } = require('./lib.cjs')
const out = {}
;(async () => {
  // 1) granted
  {
    const { browser, context, page, errors } = await launch({ permissions: ['geolocation'], geolocation: { latitude: 37.556, longitude: 126.901 } })
    await makeCard(page)
    await page.goto(BASE + '#/app/together')
    await page.getByRole('button', { name: '현재 위치로 찾기' }).click()
    await page.waitForTimeout(200)
    out.grantedLoading = await page.locator('main').innerText()
    await page.screenshot({ path: SHOTS + 'f-nearby-loading.png' })
    await page.waitForTimeout(1200)
    out.grantedList = await page.locator('main').innerText()
    await page.screenshot({ path: SHOTS + 'f-nearby-list-390.png', fullPage: true })
    // filters
    await page.getByRole('checkbox', { name: '산책 시간 겹침' }).check()
    out.filterSlot = await page.locator('.nlist li').count()
    await page.getByRole('checkbox', { name: '차분한 인사' }).check()
    out.filterBoth = await page.locator('.nlist li').count()
    out.filterBothText = await page.locator('main').innerText()
    // change hood to 연남동 -> empty
    await page.getByRole('button', { name: '동네 바꾸기' }).click()
    out.hoodRoles = await page.locator('.hoods > *').evaluateAll((els) => els.map((e) => e.tagName + '[role=' + e.getAttribute('role') + ']'))
    await page.getByRole('listitem').filter({ hasText: '연남동' }).click()
    await page.waitForTimeout(1200)
    out.yeonnamText = await page.locator('main').innerText()
    await page.screenshot({ path: SHOTS + 'f-nearby-empty-yeonnam.png', fullPage: true })
    await page.getByRole('button', { name: '조건 풀기' }).click(); await page.waitForTimeout(200)
    out.afterClearFilters = await page.locator('main').innerText()
    // revisit loading delay each time
    await page.goto(BASE + '#/app'); await page.goto(BASE + '#/app/together')
    const t0 = Date.now(); await page.waitForSelector('.nlist, .emptybox'); out.revisitSkeletonMs = Date.now() - t0
    out.errors = errors
    await browser.close()
  }
  // 2) denied (no permission granted -> headless Chromium denies)
  {
    const { browser, context, page, errors } = await launch()
    await makeCard(page)
    await page.goto(BASE + '#/app/together')
    await page.getByRole('button', { name: '현재 위치로 찾기' }).click()
    await page.waitForTimeout(1500)
    out.deniedText = await page.locator('main').innerText()
    await page.screenshot({ path: SHOTS + 'f-nearby-denied.png' })
    await page.reload(); await page.waitForTimeout(500)
    out.deniedAfterReload = await page.locator('main').innerText()
    out.retryButtonAfterDeny = await page.getByRole('button', { name: /현재 위치/ }).count()
    await browser.close()
  }
  // 3) permission granted but position never arrives -> override getCurrentPosition to hang / to return TIMEOUT error
  {
    const { browser, page } = await launch()
    await page.addInitScript(() => { navigator.geolocation.getCurrentPosition = () => {} })
    await makeCard(page)
    await page.goto(BASE + '#/app/together')
    await page.getByRole('button', { name: '현재 위치로 찾기' }).click()
    await page.waitForTimeout(500)
    out.locatingText = await page.locator('main').innerText()
    await page.waitForTimeout(12500)
    out.hangTimeoutText = await page.locator('main').innerText()
    await page.screenshot({ path: SHOTS + 'f-nearby-timeout.png' })
    await browser.close()
  }
  {
    const { browser, page } = await launch()
    await page.addInitScript(() => { navigator.geolocation.getCurrentPosition = (ok, err) => setTimeout(() => err({ code: 3, message: 'Timeout expired', TIMEOUT: 3 }), 300) })
    await makeCard(page)
    await page.goto(BASE + '#/app/together')
    await page.getByRole('button', { name: '현재 위치로 찾기' }).click()
    await page.waitForTimeout(800)
    out.errorCode3Text = await page.locator('main').innerText()
    out.errorCode3Stored = await page.evaluate(() => JSON.parse(localStorage.getItem('dangq.demo.v1')).location)
    await browser.close()
  }
  console.log(JSON.stringify(out, null, 1))
})().catch((e) => { console.log(JSON.stringify(out, null, 1)); console.error(e); process.exit(1) })
