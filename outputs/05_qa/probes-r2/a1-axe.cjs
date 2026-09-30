// axe-core (wcag2a/aa, 21, 22aa, best-practice) at 390 and 1440 over 15 screens
const { launch, seed, seedState, card, BASE, SHOTS, now } = require('./lib.cjs')
const fs = require('fs')
const AXE = fs.readFileSync('/tmp/claude-0/-home-user-first/6f7743f5-51d8-549e-a904-c4dc33e9827f/scratchpad/node_modules/axe-core/axe.min.js', 'utf8')
const SEED = seedState({ card: card({ triggers: ['bike'] }), activeWalk: { id: 'a', startedAt: now, endedAt: 0, encounters: [{ at: now, distance: 5, reaction: 'alert' }] }, requests: { dubu: { status: 'accepted', at: now - 9e4, slot: 'evening' } }, bonds: { bori: { neighborId: 'bori', sessions: [{ at: now, steps: [], closest: 8, endedEarly: false }] } }, hidden: ['kong'] })
;(async () => {
  const out = {}
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const { browser, page } = await launch({ viewport: { width: w, height: h } })
    const routes = ['#/', '#/brand', '#/case', '#/app', '#/app/walk', '#/app/together', '#/app/together/dubu', '#/app/together/mango', '#/app/together/dubu/walk', '#/app/bond', '#/app/show', '#/app/tag', '#/app/card/edit', '#/app/settings', 'EMPTY']
    for (const r of routes) {
      if (r === 'EMPTY') await seed(page, seedState({ card: null }), '#/app')
      else await seed(page, SEED, r)
      await page.waitForTimeout(r.includes('together') ? 1300 : 600)
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)) } window.scrollTo(0, 0) })
      await page.waitForTimeout(600)
      await page.addScriptTag({ content: AXE })
      const res = await page.evaluate(async () => {
        const r = await axe.run(document, { resultTypes: ['violations'], runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } })
        return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes.slice(0, 5).map((n) => n.target.join(' ') + ' :: ' + (n.any[0] && n.any[0].message || n.failureSummary || '').slice(0, 140)) }))
      })
      const heads = await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3,h4')].filter((h) => h.getClientRects().length || h.classList.contains('sr-only')).map((h) => h.tagName + ':' + h.innerText.replace(/\s+/g, ' ').slice(0, 24)))
      out[w + ' ' + r] = { violations: res, h1count: heads.filter((x) => x.startsWith('H1')).length, headings: heads.slice(0, 8) }
    }
    await browser.close()
  }
  fs.writeFileSync(__dirname + '/a1-out.json', JSON.stringify(out, null, 1))
  for (const [k, v] of Object.entries(out)) console.log(k, 'h1=' + v.h1count, v.violations.map((x) => `${x.id}(${x.impact},${x.n})`).join(' '))
})().catch((e) => { console.error(e); process.exit(1) })
