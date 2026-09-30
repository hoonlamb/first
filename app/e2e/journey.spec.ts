import { expect, test, type Page } from '@playwright/test'

const errors: string[] = []
test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
})
test.afterEach(() => { expect(errors, errors.join('\n')).toEqual([]) })

async function makeCard(page: Page, name = '뽀리') {
  await page.goto('./#/app')
  await page.getByRole('link', { name: '산책 카드 만들기' }).click()
  await page.getByRole('button', { name: '다음' }).click()
  await expect(page.getByText('이름을 적어 주세요')).toBeVisible()
  await page.getByLabel('이름').fill(name)
  await page.getByRole('button', { name: '다음' }).click()
  await page.getByLabel('편한 거리(미터)').fill('10')
  await expect(page.getByText('10m', { exact: false }).first()).toBeVisible()
  await page.getByRole('button', { name: '다음' }).click()
  await page.getByRole('radio', { name: /천천히 인사해요/ }).check()
  await page.getByRole('radio', { name: '느긋하게' }).check()
  await page.getByRole('button', { name: '다음' }).click()
  await page.getByRole('checkbox', { name: '자전거·킥보드' }).check()
  await page.getByRole('checkbox', { name: '저녁' }).check()
  await page.getByRole('button', { name: '카드 미리보기' }).click()
  await expect(page.getByRole('heading', { name: `${name}의 산책 카드예요.` })).toBeVisible()
  await page.getByRole('button', { name: '카드 저장하기' }).click()
  await expect(page.getByRole('link', { name: /보여주기/ })).toBeVisible()
}

test('hero distance dial reacts and leads to the product', async ({ page }) => {
  await page.goto('./')
  const status = page.locator('.dial__status')
  await expect(status).toContainText('편안해요')
  const range = page.locator('.dial input[type=range]')
  await range.fill('14') // 7m for 뽀리(8m)
  await expect(status).toContainText('귀가 섰어요')
  await range.fill('20') // 1m
  await expect(status).toContainText('너무 가까워요')
  await page.getByRole('radio', { name: /망고/ }).check()
  await expect(page.locator('.dial__truth')).toContainText('15m')
  await page.getByRole('link', { name: /우리 개의 거리로 카드 만들기/ }).click()
  await expect(page).toHaveURL(/#\/app\/card\/new/)
})

test('full journey: card → show → walk → nearby → 나란히 → 사이 → persist → reset', async ({ page }) => {
  await makeCard(page)
  // show mode
  await page.getByRole('link', { name: /보여주기/ }).click()
  await expect(page.getByText('냄새 먼저, 손은 나중에')).toBeVisible()
  await expect(page.getByRole('button', { name: '닫기' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('link', { name: /보여주기/ })).toBeVisible()

  // walk + encounter validation + suggestion
  await page.getByRole('link', { name: '산책', exact: true }).click()
  await page.getByRole('button', { name: '산책 시작' }).click()
  await page.getByRole('button', { name: '마주침 기록' }).click()
  await page.getByRole('button', { name: '기록하기' }).click()
  await expect(page.getByRole('alert')).toContainText('거리와 반응')
  await page.getByRole('radio', { name: '5m', exact: true }).check()
  await page.getByRole('radio', { name: '편안했어요' }).check()
  await page.getByRole('button', { name: '기록하기' }).click()
  await expect(page.locator('.enc')).toHaveCount(1)
  await page.getByRole('button', { name: '산책 끝내기' }).click()
  await expect(page.getByText(/5m.*에서도 편안했어요/)).toBeVisible()
  await page.getByRole('button', { name: '카드를 5m로 바꾸기' }).click()
  await expect(page.getByRole('status').filter({ hasText: '5m로 바꿨어요' })).toBeVisible()

  // nearby: location denied → manual → list → filter empty → detail → request
  // simulate the user denying the location prompt (headless leaves the real prompt pending)
  await page.evaluate(() => {
    navigator.geolocation.getCurrentPosition = (_ok, err) => err?.({ code: 1, message: 'denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError)
  })
  await page.getByRole('link', { name: '나란히', exact: true }).click()
  await page.getByRole('button', { name: '현재 위치로 찾기' }).click()
  await expect(page.getByRole('heading', { name: '위치 없이도 찾을 수 있어요.' })).toBeVisible()
  await page.getByRole('listitem').filter({ hasText: '망원동' }).click()
  await expect(page.getByRole('heading', { name: /나란히 걸을 이웃/ })).toBeVisible()
  await page.getByRole('checkbox', { name: '산책 시간 겹침' }).check()
  await page.getByRole('checkbox', { name: '차분한 인사' }).check()
  const cards = page.locator('.ncard')
  const n = await cards.count()
  if (n === 0) {
    await expect(page.getByText('조건에 맞는 이웃이 없어요.')).toBeVisible()
    await page.getByRole('button', { name: '조건 풀기' }).click()
  }
  await page.locator('.ncard').filter({ hasText: '두부' }).click()
  await page.getByRole('button', { name: '나란히 산책 요청하기' }).click()
  await page.getByRole('radio', { name: '저녁' }).check()
  await page.getByRole('button', { name: '요청 보내기' }).click()
  await expect(page.getByText('요청을 보냈어요.')).toBeVisible()
  await expect(page.getByRole('button', { name: '나란히 산책 요청하기' })).toHaveCount(0) // no duplicate request
  await expect(page.getByRole('button', { name: '나란히 산책 시작' })).toBeVisible({ timeout: 6000 })
  await page.getByRole('button', { name: '나란히 산책 시작' }).click()

  // guided walk: calm → tense → step back → calm → stop
  await page.getByRole('button', { name: /에서 걷기 시작/ }).click()
  await page.getByRole('button', { name: '지금 확인' }).click()
  await page.getByRole('button', { name: /둘 다 편안했어요/ }).click()
  await page.getByRole('button', { name: '지금 확인' }).click()
  await page.getByRole('button', { name: '한쪽이 긴장했어요' }).click()
  await page.getByRole('button', { name: /로 물러나 다시 걷기/ }).click()
  await page.getByRole('button', { name: '잠깐 멈춤' }).click()
  await expect(page.getByRole('button', { name: '계속 걷기' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: '오늘은 여기까지' }).click()
  await page.getByRole('button', { name: '마치기' }).click()
  await expect(page.getByRole('heading', { name: /까지 나란히 걸었어요/ })).toBeVisible()
  await page.getByRole('link', { name: '사이 기록 보기' }).click()
  await expect(page.locator('.bond')).toHaveCount(1)
  await expect(page.locator('.bond__next')).toContainText('m')

  // persistence
  await page.reload()
  await expect(page.locator('.bond')).toHaveCount(1)

  // reset
  await page.getByRole('link', { name: '설정' }).click()
  await page.getByRole('button', { name: '체험 데이터 모두 지우기' }).click()
  await page.getByRole('button', { name: '모두 지우기', exact: true }).click()
  await expect(page.getByRole('heading', { name: /우리 개의 거리부터/ })).toBeVisible()
})

test('guarded routes, builder cancel, 404 fallbacks', async ({ page }) => {
  await page.goto('./#/app/walk')
  await expect(page.getByText('산책 카드를 먼저 만들어야')).toBeVisible()
  await page.getByRole('link', { name: '산책 카드 만들기' }).click()
  await page.getByLabel('이름').fill('콩')
  await page.getByRole('button', { name: '나가기' }).click()
  await expect(page.getByRole('heading', { name: '작성 중인 내용이 있어요' })).toBeVisible()
  await page.getByRole('button', { name: '계속 쓰기' }).click()
  await expect(page.getByLabel('이름')).toHaveValue('콩')
  await page.goto('./#/nowhere')
  await expect(page.getByRole('heading', { name: /가까워지는 데는/ })).toBeVisible()
})

test('brand and case study pages render', async ({ page }) => {
  await page.goto('./#/brand')
  await expect(page.locator('main h1')).toBeVisible()
  await page.goto('./#/case')
  await expect(page.locator('main h1')).toBeVisible()
})
