// Visual tour of hi-fi screens with a rich seeded state → /tmp/hft/*.png + contact sheets
import { chromium } from '@playwright/test'
import fs from 'node:fs'
fs.mkdirSync('/tmp/hft', { recursive: true })
const now = Date.now()
const state = {
  card: { name: '뽀리', size: 'medium', pace: 'slow', greeting: 'slow', comfort: 8, triggers: ['bike', 'kids'], slots: ['evening', 'morning'], note: '처음엔 옆보다 조금 뒤가 편해요', photo: 'photos/dog-03-bori-terrier.jpg', breed: '믹스', age: 4, sex: 'm', updatedAt: 1 },
  walks: [{ id: 'w1', startedAt: now - 86400000, endedAt: now - 86400000 + 1800000, encounters: [{ at: 1, distance: 5, reaction: 'calm' }, { at: 2, distance: 3, reaction: 'alert' }] }],
  activeWalk: null, requests: { dubu: { status: 'accepted', at: 0, slot: 'evening' } },
  bonds: { kong: { neighborId: 'kong', sessions: [{ at: now - 7 * 86400000, steps: [], closest: 6, endedEarly: false }] } },
  location: 'manual', neighborhood: '망원동', activeTogether: null, hidden: [],
  threads: { dubu: [{ id: 'm1', from: 'me', at: now - 600000, text: '안녕하세요! 뽀리와 나란히 걸어 보고 싶어요.' }, { id: 'm2', from: 'them', at: now - 500000, text: '좋아요! 두부도 첫날은 멀리서 걷는 게 편할 거예요. 약속 잡아 볼까요?' }] },
  meets: {}, reviews: [], badges: ['card', 'first-walk'], saved: ['mangwon-park'], answers: {}, seen: {},
}
const shots = [
  ['01-home', '/app'], ['02-home-scroll', '/app', 900], ['03-places', '/app/places'], ['04-place', '/app/places/mangwon-park'],
  ['05-together', '/app/together'], ['06-profile', '/app/together/dubu'], ['07-chatlist', '/app/chat'], ['08-thread', '/app/chat/dubu'],
  ['09-meet', '/app/chat/dubu/meet'], ['10-walk-intro', '/app/together/dubu/walk'], ['11-badges', '/app/badges'], ['12-me', '/app/me'],
  ['13-show', '/app/show'], ['14-tag', '/app/tag'], ['15-walklog', '/app/walk'], ['16-settings', '/app/settings'],
]
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
await p.goto('http://127.0.0.1:5173/?t=' + now)
await p.evaluate((s) => localStorage.setItem('dangq.demo.v1', JSON.stringify(s)), state)
for (const [name, hash, scroll] of shots) {
  await p.goto(`http://127.0.0.1:5173/?t=${Date.now()}#${hash}`); await p.waitForTimeout(1300)
  if (scroll) { await p.evaluate((y) => { (document.getElementById('hf-scroll') || document.scrollingElement).scrollTo(0, y) }, scroll); await p.waitForTimeout(400) }
  await p.screenshot({ path: `/tmp/hft/${name}.png` })
}
// onboarding (fresh)
await p.evaluate(() => localStorage.clear()); await p.goto(`http://127.0.0.1:5173/?t=${Date.now()}#/app/start`); await p.waitForTimeout(1200)
await p.screenshot({ path: '/tmp/hft/00-start.png' })
console.log('errors:', errs.length ? [...new Set(errs)].join('\n') : 'none'); await b.close()
