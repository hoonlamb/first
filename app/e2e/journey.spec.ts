import { expect, test, type Page } from '@playwright/test'

const errors: string[] = []
test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
})
test.afterEach(() => { expect(errors, errors.join('\n')).toEqual([]) })

const next = (page: Page) => page.getByRole('button', { name: '다음', exact: true }).click()

async function makeCard(page: Page, name = '뽀리') {
  await page.goto('./#/app')
  await expect(page).toHaveURL(/#\/app\/start/)
  await page.getByRole('button', { name: '우리 개 카드 만들기' }).click()
  await page.getByRole('button', { name: '사진 없이 다음' }).click()
  await next(page)
  await expect(page.getByText('이름을 적어 주세요')).toBeVisible()
  await page.getByRole('textbox', { name: /이름/ }).fill(name)
  await next(page)
  await page.getByLabel('편한 거리(미터)').fill('6')
  await expect(page.locator('.ob-comfort__read')).toContainText('6m')
  await next(page)
  await page.locator('label', { hasText: '천천히 인사해요' }).click()
  await page.locator('label', { hasText: '느긋하게' }).click()
  await next(page)
  await page.locator('label', { hasText: '자전거' }).click()
  await page.locator('label', { hasText: '저녁' }).click()
  await page.getByRole('button', { name: '카드 미리보기' }).click()
  await expect(page.getByRole('article', { name: `${name}의 산책 카드 미리보기` })).toBeVisible()
  await page.getByRole('button', { name: '카드 저장하기' }).click()
  await expect(page.getByRole('region', { name: `${name}의 산책 카드` })).toBeVisible()
}

test('site CTA leads to onboarding', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('link', { name: '카드 만들어 보기' }).click()
  await expect(page).toHaveURL(/#\/app\/start/)
  await expect(page.getByRole('button', { name: '우리 개 카드 만들기' })).toBeVisible()
})

test('hi-fi journey: card → show → walk log → 나란히 request → chat → meet → walk → 인증소 → reset', async ({ page }) => {
  await makeCard(page)

  // daily question
  await page.getByRole('radio', { name: /멈춰서 지켜봐요/ }).click()
  await expect(page.locator('.hf-question__tip')).toContainText('관찰하는 친구')

  // show mode
  await page.getByRole('link', { name: /보여주기/ }).click()
  await expect(page).toHaveURL(/#\/app\/show/)
  await page.goBack()

  // walk log
  await page.getByRole('link', { name: /산책 시작/ }).click()
  await expect(page).toHaveURL(/#\/app\/walk/)
  await page.goto('./#/app')

  // 나란히 tab → 두부 → request
  await page.getByRole('navigation', { name: '앱 메뉴' }).getByRole('link', { name: '나란히' }).click()
  await page.locator('a[href$="/app/together/dubu"]').first().click()
  await expect(page).toHaveURL(/#\/app\/together\/dubu/)
  await page.getByRole('button', { name: '나란히 요청하기' }).click()
  const ask = page.getByRole('dialog')
  await ask.getByRole('radio', { name: /저녁/ }).click()
  await ask.getByRole('button', { name: '요청 보내기' }).click()
  await expect(page.getByRole('button', { name: '나란히 요청하기' })).toHaveCount(0) // no duplicate request

  // demo partner accepts (~2.5s) → toast + chat message
  await expect(page.getByRole('status').filter({ hasText: '수락했어요' })).toBeVisible({ timeout: 6000 })
  await page.getByRole('link', { name: '채팅에서 약속 잡기' }).click()
  await expect(page).toHaveURL(/#\/app\/chat\/dubu/)
  await expect(page.getByRole('log')).toContainText('약속 잡아 볼까요?')

  // message + meet
  await page.getByRole('textbox').fill('안녕하세요! 저녁에 괜찮으세요?')
  await page.getByRole('button', { name: '보내기' }).click()
  await expect(page.getByRole('log')).toContainText('저녁에 괜찮으세요?')
  await page.getByRole('button', { name: /더하기/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: /^약속 잡기/ }).click()
  await expect(page).toHaveURL(/#\/app\/chat\/dubu\/meet/)
  await page.locator('.cx-dates [role=radio]').nth(1).click() // tomorrow: no past times
  await page.locator('.cx-time-chip:not([disabled])').first().click()
  await expect(page.locator('.cx-time-chip.is-night').first()).toBeDisabled() // first meet: no night slots
  await page.getByRole('button', { name: /두부아빠님에게 약속 보내기/ }).click()
  await expect(page).toHaveURL(/#\/app\/chat\/dubu$/)
  const meet = page.getByRole('article', { name: /나란히 약속 카드/ })
  await expect(meet.getByRole('link', { name: /나란히 시작/ })).toBeVisible({ timeout: 6000 })
  await meet.getByRole('link', { name: /나란히 시작/ }).click()

  // guided walk: start → calm → tense → step back → leave and resume → stop
  await expect(page).toHaveURL(/#\/app\/together\/dubu\/walk/)
  await page.getByRole('button', { name: /에서 걷기 시작/ }).click()
  await page.getByRole('button', { name: '둘 다 편해요?' }).click()
  await page.getByRole('button', { name: /둘 다 편안했어요/ }).click()
  await page.getByRole('button', { name: /긴장했어요/ }).click()
  await page.getByRole('button', { name: /물러나 다시 걷기/ }).click()
  await page.goto('./#/app')
  await expect(page.getByRole('link', { name: /나란히 걷는 중/ })).toBeVisible()
  await page.getByRole('link', { name: /나란히 걷는 중/ }).click()
  await page.getByRole('button', { name: '잠깐 멈춤' }).click()
  await expect(page.getByRole('button', { name: '계속 걷기' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: '그만하기' }).click()
  await page.getByRole('button', { name: '마치기', exact: true }).click()

  // review sheet → badge modal → 인증소
  const review = page.getByRole('dialog')
  await expect(review.getByRole('button', { name: '후기 남기기' })).toBeDisabled()
  await review.getByRole('button', { name: '다음에 할게요' }).click()
  const badge = page.getByRole('dialog')
  await badge.getByRole('button', { name: '인증소에서 보기' }).click()
  await expect(page).toHaveURL(/#\/app\/badges/)
  await expect(page.locator('main')).toContainText('두부')

  // persistence
  await page.reload()
  await expect(page.locator('main')).toContainText('두부')

  // reset
  await page.goto('./#/app/settings')
  await page.getByRole('button', { name: /체험 데이터 모두 지우기/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: /지우기/ }).click()
  await expect(page).toHaveURL(/#\/app\/start/)
})

test('guarded routes redirect to onboarding', async ({ page }) => {
  await page.goto('./#/app/walk')
  await expect(page).toHaveURL(/#\/app\/start/)
  await page.goto('./#/app/nowhere')
  await expect(page).toHaveURL(/#\/app\/start/)
})

test('brand and case study pages render', async ({ page }) => {
  await page.goto('./#/brand')
  await expect(page.locator('main h1')).toBeVisible()
  await page.goto('./#/case')
  await expect(page.locator('main h1')).toBeVisible()
})
