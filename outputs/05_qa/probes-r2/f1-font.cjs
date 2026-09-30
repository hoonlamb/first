// Font subset: which font renders user-typed glyphs outside the static subset ('뚫훑'), and what gets downloaded
const { launch, seed, seedState, card, BASE, SHOTS } = require('./lib.cjs')
;(async () => {
  const out = {}
  for (const route of ['#/', '#/app', '#/brand', '#/case']) {
    const { browser, page } = await launch()
    const fonts = []
    page.on('response', async (r) => { if (r.url().endsWith('.woff2')) fonts.push(r.url().split('/').pop().slice(0, 34) + ':' + Math.round((await r.body().catch(() => Buffer.alloc(0))).length / 1024) + 'K') })
    await page.goto(BASE + route); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800)
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)) } })
    await page.waitForTimeout(800)
    out['load ' + route] = fonts.slice()
    await browser.close()
  }
  const { browser, page, context } = await launch()
  const fonts = []
  page.on('response', (r) => { if (r.url().endsWith('.woff2')) fonts.push(r.url().split('/').pop().slice(0, 34)) })
  await seed(page, seedState({ card: null }), '#/app/card/new')
  await page.waitForTimeout(500); fonts.length = 0
  await page.getByLabel('이름').fill('뚫훑'); await page.getByRole('button', { name: '다음' }).click(); await page.waitForTimeout(1500)
  const cdp = await context.newCDPSession(page)
  await cdp.send('DOM.enable'); await cdp.send('CSS.enable')
  const { root } = await cdp.send('DOM.getDocument')
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: 'h1' })
  const pf = await cdp.send('CSS.getPlatformFontsForNode', { nodeId })
  out.builderH1 = await page.locator('h1').innerText()
  out.builderH1Fonts = pf.fonts
  out.fontsFetchedAfterTyping = fonts
  await page.locator('h1').screenshot({ path: SHOTS + 'f-font-fallback-h1.png' })
  // card face name
  await page.goto(BASE + '#/app/card/new'); await page.reload(); await page.getByLabel('이름').fill('뚫훑'); for (let k = 0; k < 4; k++) { await page.getByRole('button', { name: /다음|카드 미리보기/ }).click(); await page.waitForTimeout(150) }
  await page.waitForTimeout(800)
  const n2 = (await cdp.send('DOM.querySelector', { nodeId: (await cdp.send('DOM.getDocument')).root.nodeId, selector: '.cardface__name' })).nodeId
  out.cardNameFonts = (await cdp.send('CSS.getPlatformFontsForNode', { nodeId: n2 })).fonts
  await page.locator('.cardface').screenshot({ path: SHOTS + 'f-font-fallback-card.png' })
  // offline fallback: block Pretendard dynamic subsets
  const p3 = await context.newPage()
  await p3.route(/PretendardVariable\.subset/, (r) => r.abort())
  await p3.goto(BASE + '#/app/card/new'); await p3.getByLabel('이름').fill('뚫훑'); await p3.getByRole('button', { name: '다음' }).click(); await p3.waitForTimeout(1200)
  const cdp3 = await context.newCDPSession(p3); await cdp3.send('DOM.enable'); await cdp3.send('CSS.enable')
  const n3 = (await cdp3.send('DOM.querySelector', { nodeId: (await cdp3.send('DOM.getDocument')).root.nodeId, selector: 'h1' })).nodeId
  out.h1FontsWhenSubsetBlocked = (await cdp3.send('CSS.getPlatformFontsForNode', { nodeId: n3 })).fonts
  await p3.locator('h1').screenshot({ path: SHOTS + 'f-font-fallback-h1-subset-blocked.png' })
  console.log(JSON.stringify(out, null, 1))
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
