const { launch, BASE, SHOTS } = require('./lib.cjs')
const now = Date.now()
const SEED = { card: { name: '뽀리', size: 'medium', pace: 'slow', greeting: 'slow', comfort: 8, triggers: ['bike', 'kids'], slots: ['evening'], note: '처음엔 옆보다 조금 뒤가 편해요', updatedAt: now },
  walks: [{ id: 'w1', startedAt: now - 3600e3, endedAt: now - 3000e3, encounters: [{ at: now - 3500e3, distance: 5, reaction: 'calm' }] }], activeWalk: null,
  requests: { dubu: { status: 'accepted', at: now - 60e3, slot: 'evening' } },
  bonds: { bori: { neighborId: 'bori', sessions: [{ at: now - 86400e3 * 7, steps: [], closest: null, endedEarly: true }, { at: now - 86400e3, steps: [], closest: 6, endedEarly: false }] } },
  location: 'manual', neighborhood: '망원동' }
const ROUTES = [['site', '#/'], ['brand', '#/brand'], ['case', '#/case'], ['app-home', '#/app'], ['app-walk', '#/app/walk'], ['app-nearby', '#/app/together'], ['app-detail', '#/app/together/dubu'], ['app-together', '#/app/together/dubu/walk'], ['app-bond', '#/app/bond'], ['app-show', '#/app/show'], ['app-builder', '#/app/card/new'], ['app-settings', '#/app/settings']]
const WIDTHS = [360, 390, 768, 1024, 1440]
;(async () => {
  const res = []
  for (const w of WIDTHS) {
    const { browser, page, errors, context } = await launch({ viewport: { width: w, height: w < 800 ? 800 : 900 } })
    await page.goto(BASE)
    await page.evaluate((s) => localStorage.setItem('dangq.demo.v1', JSON.stringify(s)), SEED)
    for (const [name, r] of ROUTES) {
      await page.goto(BASE + r); await page.reload()
      await page.waitForTimeout(name === 'app-nearby' ? 1400 : 700)
      if (name === 'app-builder') { await page.getByLabel('이름').fill('가나다라마바사아자차'); await page.getByRole('button', { name: '다음' }).click(); await page.waitForTimeout(700) }
      // scroll through to trigger lazy things
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)) } window.scrollTo(0, 0) })
      const m = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth
        const over = []
        document.querySelectorAll('body *').forEach((el) => {
          const r = el.getBoundingClientRect(); if (!r.width) return
          const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.position === 'fixed' && cs.display === 'none') return
          // skip content inside horizontally scrollable wrappers
          let p = el.parentElement, inScroller = false
          while (p) { const s = getComputedStyle(p); if (s.overflowX === 'auto' || s.overflowX === 'scroll' || s.overflowX === 'hidden' || s.overflowX === 'clip') { inScroller = true; break } p = p.parentElement }
          if (!inScroller && (r.right > vw + 1 || r.left < -1)) over.push(el.tagName.toLowerCase() + '.' + (el.className && el.className.baseVal === undefined ? el.className : '').toString().split(' ')[0] + ' [' + Math.round(r.left) + '..' + Math.round(r.right) + ']')
        })
        const small = []
        document.querySelectorAll('a[href], button, input, select, textarea, [tabindex="0"], label.choice, label.dial__tab').forEach((el) => {
          let target = el
          if (el.tagName === 'INPUT' && (el.type === 'radio' || el.type === 'checkbox')) { target = el.closest('label') || el }
          const r = target.getBoundingClientRect(); if (!r.width || !r.height) return
          const cs = getComputedStyle(target); if (cs.visibility === 'hidden' || cs.opacity === '0') return
          if (el.classList.contains('skip')) return
          if (r.height < 44 || r.width < 44) small.push((target.innerText || target.getAttribute('aria-label') || target.tagName).trim().replace(/\s+/g, ' ').slice(0, 24) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height))
        })
        // clipped text: elements whose content overflows with overflow hidden / text-overflow
        const clipped = []
        document.querySelectorAll('body *').forEach((el) => {
          const cs = getComputedStyle(el)
          if ((cs.overflow === 'hidden' || cs.overflowX === 'hidden' || cs.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 2 && el.innerText && el.innerText.trim()) clipped.push(el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + ' ' + el.scrollWidth + '>' + el.clientWidth + ' "' + el.innerText.trim().slice(0, 20) + '"')
        })
        return { docScrollW: document.documentElement.scrollWidth, vw, hScroll: document.documentElement.scrollWidth > vw, over: [...new Set(over)].slice(0, 12), small: [...new Set(small)], clipped: clipped.slice(0, 10) }
      })
      res.push({ w, name, ...m })
      await page.screenshot({ path: `${SHOTS}r-${name}-${w}.png`, fullPage: !name.startsWith('app-together') && !name.startsWith('app-show') })
    }
    res.push({ w, errors })
    await browser.close()
  }
  console.log(JSON.stringify(res, null, 0).replace(/\},\{/g, '},\n{'))
})().catch((e) => { console.error(e); process.exit(1) })
