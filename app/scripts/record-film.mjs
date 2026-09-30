// Records the launch film: real product interactions inside film/index.html. Run with the dev server on :5173.
import { chromium } from '@playwright/test'
import fs from 'node:fs'
const OUT = process.argv[2] ?? '/tmp/film'
fs.rmSync(OUT, { recursive: true, force: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } } })
const p = await ctx.newPage()
const t0 = Date.now()
const mark = (l) => console.log(((Date.now() - t0) / 1000).toFixed(1), l)
await p.goto('http://127.0.0.1:5173/film/')
await p.evaluate(() => localStorage.clear())
const f = p.frameLocator('#app')
const frame = () => p.frame({ url: /5173\/#/ }) ?? p.frames()[1]
const wait = (ms) => p.waitForTimeout(ms)
const go = async (hash) => { await frame().evaluate((h) => { location.hash = h }, hash); await wait(350) }
await wait(1500)
mark('start')
// 1 — problem: approaching dog on the hero dial
await p.evaluate(() => cap(1))
await f.locator('.dial__stage').scrollIntoViewIfNeeded()
await frame().evaluate(() => window.scrollBy(0, -60))
await wait(700)
const range = f.locator('.dial input[type=range]')
for (const v of [4, 8, 11, 13, 15, 17, 19]) { await range.fill(String(v)); await wait(380) }
await wait(900)
// 2 — card
mark('card')
await p.evaluate(() => cap(2))
await go('/app/card/new')
await f.getByLabel('이름').pressSequentially('뽀리', { delay: 140 })
await wait(300)
await f.getByRole('button', { name: '다음' }).click()
await wait(500)
const c = f.getByLabel('편한 거리(미터)')
for (const v of [14, 12, 10, 8]) { await c.fill(String(v)); await wait(260) }
await wait(500)
await f.getByRole('button', { name: '다음' }).click(); await wait(600)
await f.getByRole('button', { name: '다음' }).click(); await wait(350)
await f.getByRole('checkbox', { name: '자전거·킥보드' }).check(); await wait(250)
await f.getByRole('button', { name: '카드 미리보기' }).click(); await wait(1300)
await f.getByRole('button', { name: '카드 저장하기' }).click(); await wait(500)
// 3 — show mode
mark('show')
await p.evaluate(() => cap(3))
await f.getByRole('link', { name: /보여주기/ }).click()
await wait(2300)
await f.getByRole('button', { name: '닫기' }).click()
// 4 — 나란히 (request pre-accepted: the real request flow waits 2.5s for the demo reply)
mark('together')
await p.evaluate(() => cap(4))
await frame().evaluate(() => {
  const s = JSON.parse(localStorage.getItem('dangq.demo.v1'))
  s.neighborhood = '망원동'; s.location = 'manual'
  s.requests = { dubu: { status: 'accepted', at: Date.now(), slot: 'evening' } }
  localStorage.setItem('dangq.demo.v1', JSON.stringify(s))
})
await frame().evaluate(() => { location.hash = '/app/together/dubu/walk'; location.reload() })
await wait(1200)
await f.getByRole('button', { name: /에서 걷기 시작/ }).click(); await wait(1000)
for (let k = 0; k < 4; k++) {
  if (!(await f.getByRole('button', { name: '지금 확인' }).count())) break
  await f.getByRole('button', { name: '지금 확인' }).click(); await wait(350)
  await f.getByRole('button', { name: /둘 다 편안했어요/ }).click(); await wait(800)
}
if (await f.getByRole('button', { name: '짧게 인사했어요' }).count()) { await f.getByRole('button', { name: '짧게 인사했어요' }).click() }
await wait(1100)
// 5 — bond
mark('bond')
await p.evaluate(() => cap(5))
await f.getByRole('link', { name: '사이 기록 보기' }).click()
await wait(2000)
mark('end')
await p.evaluate(() => end())
await wait(3000)
mark('done')
await ctx.close(); await b.close()
console.log(fs.readdirSync(OUT))
