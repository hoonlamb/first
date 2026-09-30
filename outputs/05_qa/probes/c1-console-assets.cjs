const { launch, BASE, SHOTS } = require('./lib.cjs')
;(async () => {
  const { browser, page, errors } = await launch({ viewport: { width: 1440, height: 900 } })
  const res = {}
  for (const r of ['#/', '#/brand', '#/case', '#/app', '#/nope', '#/app/nope']) {
    errors.length = 0
    await page.goto(BASE + r, { waitUntil: 'load' })
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)) } })
    await page.waitForTimeout(800)
    const imgs = await page.evaluate(() => [...document.images].map((i) => ({ src: i.currentSrc || i.src, ok: i.complete && i.naturalWidth > 0 })).filter((i) => !i.ok))
    console.error('done', r)
    res[r] = { url: page.url(), title: await page.title(), errors: [...errors], brokenImgs: imgs }
  }
  // video
  await page.goto(BASE + '#/case', { waitUntil: 'load' })
  const v = page.locator('video')
  await v.scrollIntoViewIfNeeded()
  res.video = await page.evaluate(async () => {
    const v = document.querySelector('video')
    const can = v.canPlayType('video/mp4; codecs="avc1.640028"')
    v.muted = true
    let playErr = null
    try { await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error('play() pending after 6s')), 6000))]) } catch (e) { playErr = String(e) }
    await new Promise((r) => setTimeout(r, 2500))
    return { canPlay: can, playErr, readyState: v.readyState, currentTime: v.currentTime, duration: v.duration, err: v.error && v.error.code, vw: v.videoWidth, poster: v.poster, hasCaptionsTrack: v.querySelectorAll('track').length }
  })
  await page.screenshot({ path: SHOTS + 'c-case-video.png' })
  // brand downloads + TOC hash
  await page.goto(BASE + '#/brand', { waitUntil: 'load' })
  res.downloads = await page.evaluate(() => [...document.querySelectorAll('.bd-downloads a')].map((a) => a.getAttribute('href') + ' download=' + a.hasAttribute('download')))
  const tocHref = await page.locator('.bd-toc a').first().getAttribute('href')
  res.tocHref = tocHref
  // open toc href directly as a URL (e.g. shared link / new tab)
  await page.goto(BASE + tocHref); await page.waitForTimeout(500)
  res.tocDeepLink = { url: page.url(), h1: await page.locator('h1').first().innerText() }
  // tabular nums check
  await page.goto(BASE + '#/', { waitUntil: 'load' })
  res.tnum = await page.evaluate(() => { const el = document.querySelector('.dial__num'); const cs = getComputedStyle(el); const bcs = getComputedStyle(document.body); return { ffs: cs.fontFeatureSettings, fvn: cs.fontVariantNumeric, bodyFfs: bcs.fontFeatureSettings } })
  res.tnumWidth = await page.evaluate(() => { const s = document.createElement('span'); s.className = 'num dial__num'; document.querySelector('.dial__status').appendChild(s); s.textContent = '11'; const a = s.getBoundingClientRect().width; s.textContent = '88'; const b = s.getBoundingClientRect().width; s.remove(); return { w11: a, w88: b } })
  console.log(JSON.stringify(res, null, 1))
  await browser.close()
})()
