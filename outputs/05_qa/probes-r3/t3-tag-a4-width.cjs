const { launch, seed, seedState, card, BASE, SHOTS } = require('/home/user/first/outputs/05_qa/probes-r3/lib.cjs')
;(async () => {
  for (const w of [703, 740, 1000]) {
  const { browser, page } = await launch({ viewport: { width: w, height: 400 } })
  await seed(page, seedState(), '#/app/tag')
  await page.emulateMedia({ media: 'print' })
  const r = await page.evaluate(() => { const mm = (px) => +(px / (96 / 25.4)).toFixed(1); const t = [...document.querySelectorAll('.tag-print')].map((e) => { const b = e.getBoundingClientRect(); return [mm(b.left), mm(b.right)] }); const tags = document.querySelector('.tags'); let p = tags.offsetParent; return { t, vwMm: mm(innerWidth), offsetParent: p && (p.tagName + '.' + p.className), opLeft: p && mm(p.getBoundingClientRect().left) } })
  console.log(w, JSON.stringify(r))
  await browser.close()
  }
})()
