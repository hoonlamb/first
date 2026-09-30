const { chromium } = require('/home/user/first/app/node_modules/@playwright/test')
const BASE = process.env.BASE || 'http://127.0.0.1:4180/'
const SHOTS = '/home/user/first/outputs/05_qa/shots/'
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
async function launch(opts = {}) {
  const browser = await chromium.launch({ executablePath: EXE })
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, ...opts })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()) })
  page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url() + ' ' + (r.failure() && r.failure().errorText)))
  page.on('response', (r) => { if (r.status() >= 400) errors.push('http ' + r.status() + ' ' + r.url()) })
  return { browser, context, page, errors }
}
async function makeCard(page, { name = '뽀리', comfort = 8, greeting = '천천히 인사해요', pace = '느긋하게', triggers = [], slots = ['저녁'] } = {}) {
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
  await page.getByRole('button', { name: '카드 미리보기' }).click()
  await page.getByRole('button', { name: /카드 저장하기|고친 내용 저장/ }).click()
  await page.waitForSelector('text=보여주기')
}
module.exports = { launch, makeCard, BASE, SHOTS }
