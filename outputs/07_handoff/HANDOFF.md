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
npm run dev            # http://localhost:5173  (#/ 사이트, #/app 하이파이 앱, #/brand, #/case)
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
| `app/src/hifi/` | **하이파이 앱(2026-10-01, 구 `src/product` 대체).** `HfApp.tsx` 라우트·가드·탭바·데모 응답, `hifi.css` 앱 전용 토큰(`.hf` 범위: pink-500 #FF4375 채움 / pink-600 #D42A58 흰 글자 버튼·링크 / pink-700 #C0244F 연분홍 위 글자), `ui/kit.tsx` 공용 컴포넌트, `screens/*` 화면 |
| `app/src/lib/chat.ts`, `badges.ts`, `places.ts` | 채팅·약속(Meet), 인증소 배지, 멍슐랭 장소(가상, 공원 제외) |
| `app/public/photos/` | 원본 팀 Figma 사진(1x, 라이선스 미기록) — **비공개 프로토타입 전용, 공개 전 교체 필수** (`outputs/10_hifi/photo-sources.md`) |
| `outputs/10_hifi/` | 원본 Figma 스펙 추출(`figma-spec.md`), 참조 화면 |
| `app/e2e/journey.spec.ts`, `rules.spec.ts` | 하이파이 여정 E2E(온보딩→나란히 요청→채팅→약속→가이드 산책→인증소→초기화), 나란히·조사 규칙 단위 테스트 (20/20) |
| `app/src/styles/fonts/dangq-sans.woff2` | 사이트 문구 전용 폰트 서브셋. 문구를 바꾸면 `python3 scripts/subset-font.py`를 다시 실행 |
| `#/app/tag` | 리드줄 태그 인쇄(휴대폰 없는 보여주기) |
| `app/film/`, `app/scripts/record-film.mjs` | 출시 영상 컴포지션과 녹화 스크립트(빌드 제외) |
| `outputs/` | 조사(01), 감사(02), 전략(03), 브랜드(04), 검수(05), 영상(08), Figma(09) |

## 4. 핵심 규칙 (바꾸기 전에 읽을 것)
- **흰 글자를 signal(#FF6A2B) 위에 쓰지 않는다.** signal 위 글자는 ink.
- paper 위에서 signal 색 텍스트가 필요하면 `--signal-ink`를 쓴다.
- 상태색(calm/alert/react)은 **반드시 텍스트 라벨과 함께** 쓴다.
- 거리 → 반응 규칙은 `reactionAt(distance, comfort)` 하나만 쓴다. 기준: `≥comfort` 편안, `≥50%` 경계, 그 미만 회피.
- **나란히 규칙은 `lib/demo.ts`의 `planFor()` 한 곳에만 있다.** 사이트, 앱, 브랜드 가이드, 키비주얼이 모두 이 규칙을 따른다. 바꾸면 `e2e/rules.spec.ts`를 함께 고친다.
  - 시작 거리: 먼 쪽 편한 거리 +2m 이상이면서, 첫날 하한의 1.5배 이상인 단계값
  - 첫 만남 하한: max(6m, 60%)
  - 두 번째부터 하한: max(3m, 40%)
  - 단계당 좁히는 폭: 35% 이내
  - 다음 회차 시작: 지난번 편안했던 거리보다 한 단계 멀리
  - 인사: 두 번째 만남부터, 둘 다 인사를 원하고 둘 다 편한 거리가 8m 이하일 때만
  - 둘 중 한 마리라도 편한 거리가 12m 이상: 훈련사 동행만 가능(준비 중)
  - 진행 중인 세션은 `activeTogether`로 저장되어, 화면을 떠나거나 새로고침해도 이어진다.
- **거리 표기:** 미터 옆에 항상 걸음 수를 붙인다. `korean.ts`의 `distanceWords`, 큰 걸음 ≈0.8m.
- **이름 뒤 조사:** 항상 `josa()`를 쓴다. 조사를 하드코딩하지 않는다.
- **카드 거리 제안:** 넓히는 제안이 줄이는 제안보다 먼저다. 줄이는 제안은 편안한 마주침 3회 이상, 산책 2회 이상일 때만 한다(`store.ts suggestComfort`).
- 체험 모드 표기(배지, 자동 응답 안내)를 지우지 않는다. 실제 전송·예약·결제처럼 보이게 만들지 않는다.

## 5. 체험 모드의 한계 (실서비스 전 필수)
- 이웃·수락(2.5초)·약속 확정(1.5초)·채팅 답장은 시연용이다. 서버, 매칭, 알림은 없다.
- 첫 만남 시작 시간 상한(서울 월별 일몰 −1시간)은 근사치다(S82, 검증 필요).
- 사진은 원본 Figma에서 가져온 저해상도(1x) 이미지다. 공개 전 라이선스 확인된 고해상도 사진으로 교체.
- 위치 권한은 실제로 묻지만 좌표는 저장하지 않고, 동네는 고정 데이터를 쓴다.
- 신고·차단, 보호자 인증, 결제, 위치정보법·개인정보 검토, 상표 조사, 훈련사 제휴는 모두 미구현이다.
- 사용자 인터뷰는 0건이다. 모든 니즈는 가설이다. 전략 수정 조건은 `outputs/03_strategy/strategy.md` §3.

## 6. 다음 행동 (우선순위)
1. 반려견 보호자 8~10명과 인터뷰하고, 카드 필드와 거리 개념이 이해되는지 검증한다.
2. 인용 수치(★)를 원문과 대조한다(`outputs/01_research/sources.md`).
3. 배포 대상을 정하고 승인을 받는다(아래 7).
4. 실서비스 설계: 카드 공유 링크(QR), 신고·차단, 서버 저장.

## 7. 배포
- 비공개 미리보기(소유자만 열람): https://claude.ai/artifact/ULrWBYxwqW2tMJm7rQt5Mw
  - `app/dist`를 그대로 올린 것이다. 첫 화면은 `#/app`(하이파이 앱)으로 연다. 소개 사이트·케이스 스터디는 앱 하단 링크.
  - 미리보기 창의 보안 제약 때문에 두 기능이 동작하지 않는다.
    - 위치 권한: 자동으로 거부되며, 거부 흐름으로 처리된다.
    - 태그의 '인쇄하기': 아무 일도 일어나지 않는다. 로컬이나 실제 배포에서는 정상 동작한다.
- 현재 **공개 배포하지 않았다**(승인 필요).
- `app/dist`는 정적 파일이라 Netlify, Vercel, GitHub Pages, Cloudflare Pages 어디든 올릴 수 있다.
- 기존 djdb.kr 운영 사이트는 교체하지 않는다.

## 8. 기여와 출처
- **기존 팀 작업:** 2인 팀 '댕큐'. Figma 기준 강지훈·신수연. 원본 파일 `4dPmKvcezjlNoqSP5rw4A1`은 수정하지 않았다.
  - 팀 작업의 결과물: 조사, IA, UI, 기존 브랜드(핑크 #FF4375, 워드마크), 슬라이드.
  - 공개 페이지에는 팀원 실명을 쓰지 않았다. 동의를 받으면 추가할 수 있다.
- **이번 개인 확장(리프로젝트):** 사용자와 AI 에이전트가 협업했다.
  - 조사·전략 재정의, 브랜드 체계(AD2), 제품 설계·구현, 사이트, 케이스 스터디, 키비주얼·응용물, 영상, 검수.
  - 병렬로 돌린 역할: 리서치, Figma 감사, 브랜드 자산, Figma 정리, 독립 검수 2회.
- **서체:** Pretendard(SIL OFL 1.1). 서브셋과 윤곽선 변환은 라이선스가 허용한다.
- **이미지·음악:** 모든 그래픽은 코드로 그렸다. 스톡, AI 생성 이미지, 음악은 쓰지 않았다.
  - 케이스 스터디의 기존 작업 캡처는 메뉴 구조 1장뿐이다. 출처를 모르는 마스코트는 가렸다.
- **통계:** `outputs/01_research/sources.md`. ★ 표시는 보도를 통해 인용한 것이라 원문 대조가 필요하다.
- **DJDB:** 사용자 스크린샷 1장으로 원리만 참고했다(`outputs/02_audit/djdb/`). 사이트에 직접 접속해 분석하지는 못했다.

## 9. Figma
- 새 파일: https://www.figma.com/design/hVf75nORi4pMlShmha3Hts
- 이미지 프레임은 비어 있다. `mcp.figma.com` 업로드가 차단되었기 때문이다. `outputs/09_figma/README.md`의 노드 ID 목록을 보고 PNG를 넣으면 된다.
