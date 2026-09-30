const { launch, BASE, SHOTS } = require('./lib.cjs')
const fs = require('fs')
const AXE = fs.readFileSync('/tmp/claude-0/-home-user-first/6f7743f5-51d8-549e-a904-c4dc33e9827f/scratchpad/node_modules/axe-core/axe.min.js', 'utf8')
const now = Date.now()
const SEED = { card: { name: '뽀리', size: 'medium', pace: 'slow', greeting: 'slow', comfort: 8, triggers: ['bike'], slots: ['evening'], note: '', updatedAt: now }, walks: [], activeWalk: { id: 'a', startedAt: now, endedAt: 0, encounters: [{ at: now, distance: 5, reaction: 'alert' }] }, requests: { dubu: { status: 'accepted', at: now - 9e4, slot: 'evening' } }, bonds: { bori: { neighborId: 'bori', sessions: [{ at: now, steps: [], closest: 6, endedEarly: false }] } }, location: 'manual', neighborhood: '망원동' }
const PASS_SEED = { ...SEED, card: { ...SEED.card, greeting: 'pass' } }
;(async () => {
  const out = {}
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const { browser, page } = await launch({ viewport: { width: w, height: h } })
    await page.goto(BASE); await page.evaluate((s) => localStorage.setItem('dangq.demo.v1', JSON.stringify(s)), SEED)
    const routes = ['#/', '#/brand', '#/case', '#/app', '#/app/walk', '#/app/together', '#/app/together/dubu', '#/app/together/dubu/walk', '#/app/bond', '#/app/show', '#/app/card/edit', '#/app/settings', 'SHOWPASS']
    for (const r of routes) {
      if (r === 'SHOWPASS') { await page.evaluate((s) => localStorage.setItem('dangq.demo.v1', JSON.stringify(s)), PASS_SEED); await page.goto(BASE + '#/app/show') } else await page.goto(BASE + r)
      await page.reload(); await page.waitForTimeout(r.includes('together') ? 1400 : 900)
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)) } window.scrollTo(0, 0) })
      await page.waitForTimeout(700) // let stepin/rise animations finish
      await page.addScriptTag({ content: AXE })
      const res = await page.evaluate(async () => {
        const r = await axe.run(document, { resultTypes: ['violations'], runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } })
        return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes.slice(0, 4).map((n) => n.target.join(' ') + ' :: ' + (n.any[0] && n.any[0].message || n.failureSummary || '').slice(0, 160)) }))
      })
      const heads = await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3,h4')].filter((h) => h.getClientRects().length).map((h) => h.tagName + ':' + h.innerText.replace(/\s+/g, ' ').slice(0, 24)))
      out[w + ' ' + r] = { violations: res, headings: heads.slice(0, 14), h1count: heads.filter((x) => x.startsWith('H1')).length }
    }
    await browser.close()
  }
  fs.writeFileSync(__dirname + '/a1-out.json', JSON.stringify(out, null, 1))
  for (const [k, v] of Object.entries(out)) console.log(k, 'h1=' + v.h1count, v.violations.map((x) => `${x.id}(${x.impact},${x.n})`).join(' '))
})()
