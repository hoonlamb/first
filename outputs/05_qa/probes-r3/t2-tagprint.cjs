// 리드줄 태그 print CSS: size in mm, visibility of other content, page count, long name/pass greeting
const { launch, seed, seedState, card, BASE, SHOTS } = require('./lib.cjs')
const fs = require('fs')
;(async () => {
  const out = {}
  const { browser, page } = await launch({ viewport: { width: 390, height: 844 } })
  for (const [label, c] of [['slow', card()], ['pass-longname', card({ greeting: 'pass', name: '가나다라마바사아자차', comfort: 20 })], ['hello-bldg', card({ greeting: 'hello', name: '뚫훑', comfort: 1 })]]) {
    await seed(page, seedState({ card: c }), '#/app/tag')
    await page.emulateMedia({ media: 'print' })
    const m = await page.evaluate(() => {
      const mm = (px) => +(px / (96 / 25.4)).toFixed(1)
      const tags = [...document.querySelectorAll('.tag-print')].map((t) => { const r = t.getBoundingClientRect(); return { w: mm(r.width), h: mm(r.height), x: mm(r.left), y: mm(r.top), overflow: t.scrollHeight > t.clientHeight + 1 || t.scrollWidth > t.clientWidth + 1 } })
      const visibleOther = [...document.querySelectorAll('body *')].filter((e) => !e.closest('.tags') && getComputedStyle(e).visibility === 'visible' && e.getBoundingClientRect().width > 0 && !e.querySelector('.tags')).map((e) => e.tagName + '.' + e.className).slice(0, 5)
      const ask = document.querySelector('.tag-print__ask'); const cs = getComputedStyle(ask)
      return { tags, visibleOther, docHeightMm: mm(document.documentElement.scrollHeight), askFont: cs.fontSize, distFont: getComputedStyle(document.querySelector('.tag-print__dist')).fontSize, bg: getComputedStyle(document.querySelector('.tag-print')).backgroundColor, printAdjust: getComputedStyle(document.querySelector('.tag-print')).printColorAdjust }
    })
    await page.screenshot({ path: SHOTS + `tag-print-media-${label}.png` })
    const pdf = await page.pdf({ format: 'A4', printBackground: false })
    fs.writeFileSync(`/home/user/first/outputs/05_qa/shots-r3/tag-print-${label}.pdf`, pdf)
    m.pdfPages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length
    out[label] = m
    await page.emulateMedia({ media: 'screen' })
  }
  console.log(JSON.stringify(out, null, 1))
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
