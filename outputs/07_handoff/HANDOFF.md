# 댕큐(DANGQ) 리프로젝트 — 인수인계

> 다른 개발자나 AI가 이 문서 하나로 이어받을 수 있게 정리했다. 상태의 최신본은 `outputs/00_status/STATUS.md`.

## 1. 한 줄 요약
기존 팀 프로젝트 '댕큐'(개 사진 스와이프 매칭)를 **"가까워지는 데는 순서가 있어요"** 라는 거리 중심 서비스로 재정의했다.
- 산책 카드: 우리 개의 편한 거리를 알려 준다.
- 나란히 첫 산책: 훈련사의 병행 산책 기법을 단계형 가이드로 만든 것이다.
- 사이 기록: 좁혀진 거리를 기억한다.

## 2. 실행
```bash
cd app
npm install
npm run dev            # http://localhost:5173  (#/ 사이트, #/app 제품, #/brand, #/case)
npm run build          # dist/ — 정적 호스팅 어디든 (base './', HashRouter)
npx vite preview       # 빌드 결과 확인
npx playwright test    # E2E (desktop + mobile). Chromium 경로: /opt/pw-browsers/... 또는 PW_CHROMIUM 환경변수
```
- 타입 검사: `npx tsc -b`
- 린트: `npx oxlint src`

## 3. 구조
| 경로 | 내용 |
|---|---|
| `app/src/styles/tokens.css` | 디자인 토큰(색·타입·간격·모션). **모든 색은 여기서만.** JSON 사본은 `outputs/04_brand/tokens.json` |
| `app/src/components/` | `Lanes`(두 선 = 거리, 브랜드 핵심 그래픽), `Dog`(자세로 감정 표현: calm/alert/react), `Logo`/`Mark`, `CardFace`(산책 카드) |
| `app/src/lib/store.ts` | 상태·타입·라벨 문구(단일 출처)·localStorage 저장(`dangq.demo.v1`)·`reactionAt` 규칙 |
| `app/src/lib/demo.ts` | 시연용 이웃 6마리, 호환도 `fit()`, 시작 거리 `startDistance()`, 단계 `ladder()` |
| `app/src/site/` | 브랜드 사이트(Home, DistanceDial, Brand, CaseStudy, SiteChrome) |
| `app/src/product/` | 체험 모드 앱 화면들. `ProductApp.tsx`가 라우트와 가드 |
| `app/e2e/journey.spec.ts` | 핵심 여정 E2E |
| `app/film/`, `app/scripts/record-film.mjs` | 출시 영상 컴포지션과 녹화 스크립트(빌드 제외) |
| `outputs/` | 조사(01), 감사(02), 전략(03), 브랜드(04), 검수(05), 영상(08), Figma(09) |

## 4. 핵심 규칙 (바꾸기 전에 읽을 것)
- **흰 글자를 signal(#FF6A2B) 위에 쓰지 않는다.** signal 위 글자는 ink.
- paper 위에서 signal 색 텍스트가 필요하면 `--signal-ink`를 쓴다.
- 상태색(calm/alert/react)은 **반드시 텍스트 라벨과 함께** 쓴다.
- 거리 → 반응 규칙은 `reactionAt(distance, comfort)` 하나만 쓴다. 기준: `≥comfort` 편안, `≥50%` 경계, 그 미만 회피.
- 나란히 산책 규칙:
  - 시작 거리 = max(두 개의 편한 거리) + 2m 이상인 단계값
  - 긴장하면 물러나기가 기본 선택지
  - 어느 단계에서 끝나도 기록하고, 다음번은 마지막으로 편안했던 거리에서 시작한다.
- 체험 모드 표기(배지, 자동 응답 안내)를 지우지 않는다. 실제 전송·예약·결제처럼 보이게 만들지 않는다.

## 5. 체험 모드의 한계 (실서비스 전 필수)
- 이웃과 수락 응답은 시연용이다. 서버, 매칭, 알림은 없다.
- 위치 권한은 실제로 묻지만 좌표는 저장하지 않고, 동네는 고정 데이터를 쓴다.
- 신고·차단, 보호자 인증, 결제, 위치정보법·개인정보 검토, 상표 조사, 훈련사 제휴는 모두 미구현이다.
- 사용자 인터뷰는 0건이다. 모든 니즈는 가설이다. 전략 수정 조건은 `outputs/03_strategy/strategy.md` §3.

## 6. 다음 행동 (우선순위)
1. 반려견 보호자 8~10명과 인터뷰하고, 카드 필드와 거리 개념이 이해되는지 검증한다.
2. 인용 수치(★)를 원문과 대조한다(`outputs/01_research/sources.md`).
3. 배포 대상을 정하고 승인을 받는다(아래 7).
4. 실서비스 설계: 카드 공유 링크(QR), 신고·차단, 서버 저장.

## 7. 배포
- 현재 **공개 배포하지 않았다**(승인 필요).
- `app/dist`는 정적 파일이라 Netlify, Vercel, GitHub Pages, Cloudflare Pages 어디든 올릴 수 있다.
- 기존 djdb.kr 운영 사이트는 교체하지 않는다.
