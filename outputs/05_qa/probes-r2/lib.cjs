// Round-2 probe helpers. Preview must be running: npx vite preview --port 4181 --host 127.0.0.1
const { chromium } = require('/home/user/first/app/node_modules/@playwright/test')
const BASE = process.env.BASE || 'http://127.0.0.1:4181/'
const SHOTS = '/home/user/first/outputs/05_qa/shots-r2/'
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const KEY = 'dangq.demo.v1'
async function launch(opts = {}) {
  const browser = await chromium.launch({ executablePath: EXE })
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, ...opts })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()) })
  page.on('requestfailed', (r) => { const f = r.failure() && r.failure().errorText; if (f !== 'net::ERR_ABORTED') errors.push('requestfailed: ' + r.url() + ' ' + f) })
  page.on('response', (r) => { if (r.status() >= 400) errors.push('http ' + r.status() + ' ' + r.url()) })
  return { browser, context, page, errors }
}
const now = Date.now()
const card = (o = {}) => ({ name: '뽀리', size: 'medium', pace: 'slow', greeting: 'slow', comfort: 8, triggers: [], slots: ['evening'], note: '', updatedAt: now, ...o })
const seedState = (o = {}) => ({ card: card(), walks: [], activeWalk: null, requests: {}, bonds: {}, location: 'manual', neighborhood: '망원동', activeTogether: null, hidden: [], ...o })
async function seed(page, state, route = '#/app') {
  await page.goto(BASE + '#/app/settings')
  await page.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [KEY, state])
  await page.reload(); await page.waitForTimeout(150)
  await page.goto(BASE + route); await page.waitForTimeout(400)
}
const getS = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY)
const hash = (page) => page.url().split('#')[1]
async function makeCard(page, { name = '뽀리', comfort = 8, greeting = '천천히 인사해요', pace = '느긋하게', triggers = [], slots = ['저녁'], note = '' } = {}) {
  await page.goto(BASE + '#/app/card/new')
  await page.getByLabel('이름').fill(name)
  await page.getByRole('button', { name: '다음' }).click()
  await page.getByLabel('편한 거리(미터)').fill(String(comfort))
  await page.getByRole('button', { name: '다음' }).click()
  await page.getByRole('radio', { name: new RegExp(greeting) }).check()
  await page.getByRole('radio', { name: pace }).check()
  await page.getByRole('button', { name: '다음' }).click()
  for (const t of triggers) await page.getByRole('checkbox', { name: t }).check()
  for (const s of slots) await page.getByRole('checkbox', { name: s }).check()
  if (note) await page.getByLabel(/한마디/).fill(note)
  await page.getByRole('button', { name: '카드 미리보기' }).click()
  await page.getByRole('button', { name: /카드 저장하기|고친 내용 저장/ }).click()
  const dlg = page.locator('dialog[open]')
  if (await dlg.count()) await dlg.getByRole('button', { name: '새 카드로 바꾸기' }).click()
  await page.waitForSelector('text=보여주기')
}
module.exports = { launch, makeCard, seed, seedState, card, getS, hash, BASE, SHOTS, KEY, now }
