# 댕큐 리프로젝트 — 현재 상태 (컨텍스트 복구용)

## 단계
- [x] A. 기존 자료 감사·기회 탐색 — `01_research/`, `02_audit/`
- [x] B. 전략·아트 디렉션 선택 — `03_strategy/strategy.md`, `04_brand/art-direction/decision.md`
- [x] C. 대표 화면 + 핵심 인터랙션 첫 구현 — `app/` (거리 다이얼, 카드, 나란히)
- [x] D. 전체 여정·브랜드 응용 — 사이트/제품/브랜드 가이드/케이스 스터디/키비주얼/영상/Figma
- [x] E. 독립 검수 3회(1차 51건 → 2차 재확인+신규 17건 → 3차 재확인: 중대 0) → 수정 → 자동 테스트 18/18 → 납품 준비
- [x] F. 하이파이 프로토타입(2026-10-01) — 원본 댕큐 비주얼(핑크·Pretendard·iOS 문법·사진 카드) 계승·정제, 새 전략 + 원본 기능 재배치(멍슐랭·채팅·약속·인증소). 독립 QA(메이저 7 전부 수정, `05_qa/qa-hifi.md`), 테스트 20/20, 미리보기 재게시

## 확정 결정
- 전략: 방향 B(산책 성향 카드 + 기록)를 코어로, D(나란히 첫 산책)를 첫 만남 형식으로. A(매칭)는 부가 기능.
- 핵심 문장: "가까워지는 데는 순서가 있어요." / 이름 '댕큐' 유지(= 거리를 지켜 줘서 고마워), 영문 DANGQ.
- 아트 디렉션: 사이트·브랜드 가이드는 AD2 '나란히 두 선'(`app/src/styles/tokens.css`). **앱은 원본 핑크 계승(`app/src/hifi/hifi.css`)** — 사이트·가이드를 핑크로 맞출지 사용자 결정 대기.
- 기술: Vite + React + TS, HashRouter, localStorage(`dangq.demo.v1`), Playwright E2E.
- 사운드: 사용하지 않음.

## 환경 제약 (사실)
- djdb.kr 직접 접속 불가(네트워크 정책). DJDB는 사용자 스크린샷 1장만 분석(`02_audit/djdb/`).
- mcp.figma.com 업로드 차단 → 새 Figma 파일에 이미지가 비어 있음(`09_figma/README.md`).
- 브라우저는 Chromium만 검증 가능.

## 산출물 위치
| 항목 | 위치 |
|---|---|
| 사이트·제품 | `app/` (`npm run dev`) |
| 브랜드 가이드 | `#/brand`, `outputs/04_brand/brand-guide.md`, `tokens.json` |
| 자산 | `outputs/04_brand/assets/` (+ `app/public/brand/`) |
| 영상 | `outputs/08_video/dangq-launch-1080p.mp4` |
| 케이스 스터디 | `#/case` |
| Figma | https://www.figma.com/design/hVf75nORi4pMlShmha3Hts (새 파일, 원본 미수정) |
| 인수인계 | `outputs/07_handoff/HANDOFF.md` |
| 검수 | `outputs/05_qa/` |

## 다음 행동 (사용자 결정 필요)
1. 공개 배포 대상 승인(Netlify 등). 현재는 비공개 미리보기만.
2. mcp.figma.com 허용 또는 수동으로 Figma 이미지 채우기.
3. 실제 보호자 인터뷰(8~10명), 행동 전문가 검토, 상표 조사(KIPRIS).
4. Safari/Firefox/실기기, 실제 인쇄 확인.
5. 소개 사이트·브랜드 가이드·영상(AD2 잉크/오렌지)을 앱의 핑크 비주얼로 통일할지.
6. 앱 사진 교체(원본 Figma 1x, 라이선스 미기록).
