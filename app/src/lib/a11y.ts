/** Move focus to the current screen's heading (or main) after a view change, so keyboard/screen-reader users land on the new content. */
export function focusMainHeading(selector?: string) {
  requestAnimationFrame(() => {
    const main = document.getElementById('main')
    if (!main) return
    const target = (selector ? document.querySelector<HTMLElement>(selector) : null) ?? main.querySelector<HTMLElement>('h1') ?? main
    if (!target.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: false })
  })
}

const TITLES: [RegExp, string][] = [
  [/^\/brand/, '브랜드 가이드'],
  [/^\/case/, '케이스 스터디'],
  [/^\/app\/card\/new/, '카드 만들기'],
  [/^\/app\/card\/edit/, '카드 고치기'],
  [/^\/app\/show/, '보여주기'],
  [/^\/app\/walk/, '산책'],
  [/^\/app\/together\/[^/]+\/walk/, '나란히 산책 중'],
  [/^\/app\/together\/[^/]+/, '나란히 계획'],
  [/^\/app\/together/, '나란히 이웃'],
  [/^\/app\/bond/, '사이 기록'],
  [/^\/app\/settings/, '설정'],
  [/^\/app\/tag/, '리드줄 태그'],
  [/^\/app/, '산책 카드'],
]
export function titleFor(path: string) {
  const hit = TITLES.find(([re]) => re.test(path))
  if (!hit) return '댕큐 DANGQ — 가까워지는 데는 순서가 있어요'
  return `${hit[1]} · 댕큐${path.startsWith('/app') ? ' 체험' : ''}`
}
