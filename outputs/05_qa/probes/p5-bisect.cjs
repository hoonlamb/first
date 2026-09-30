const { launch, BASE } = require('./lib.cjs')
;(async () => {
  const { browser, page } = await launch({ viewport: { width: 390, height: 844 } })
  await page.goto(BASE + '#/', { waitUntil: 'load' }); await page.waitForTimeout(3000)
  const r = await page.evaluate(() => {
    const secs = [...document.querySelectorAll('main > section, header.siteheader, footer')]
    const t = (label) => { document.documentElement.style.width = (document.documentElement.style.width === '389px' ? '390px' : '389px'); const s = performance.now(); void document.body.offsetHeight; return [label, Math.round(performance.now() - s)] }
    const res = [t('all'), t('all2')]
    for (const s of secs) {
      secs.forEach((x) => { x.style.display = x === s ? '' : 'none' })
      res.push(t((s.className || s.tagName).split(' ').slice(0, 2).join('.')))
    }
    secs.forEach((x) => { x.style.display = '' })
    // within hero: hide dial svg
    const dial = document.querySelector('.dial'); secs.forEach((x) => { x.style.display = x.classList.contains('hero') ? '' : 'none' })
    res.push(t('hero'))
    dial.style.display = 'none'; res.push(t('hero-no-dial')); dial.style.display = ''
    const svg = document.querySelector('.dial .lanes'); svg.style.display = 'none'; res.push(t('hero-no-lanes-svg')); svg.style.display = ''
    const title = document.querySelector('.hero__title'); title.style.display = 'none'; res.push(t('hero-no-title')); title.style.display = ''
    return res
  })
  console.log(JSON.stringify(r))
  await browser.close()
})()
