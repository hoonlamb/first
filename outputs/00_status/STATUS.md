# 댕큐 리프로젝트 — 현재 상태 (컨텍스트 복구용)

## 단계
- [x] A. 기존 자료 감사·기회 탐색 — `01_research/`, `02_audit/`
- [x] B. 전략·아트 디렉션 선택 — `03_strategy/strategy.md`, `04_brand/art-direction/decision.md`
- [x] C. 대표 화면 + 핵심 인터랙션 첫 구현 — `app/` (거리 다이얼, 카드, 나란히)
- [x] D. 전체 여정·브랜드 응용 — 사이트/제품/브랜드 가이드/케이스 스터디/키비주얼/영상/Figma
- [ ] E. 독립 검수(1차 진행 중) → 수정 → 재검증 → 납품

## 확정 결정
- 전략: 방향 B(산책 성향 카드 + 기록)를 코어로, D(나란히 첫 산책)를 첫 만남 형식으로. A(매칭)는 부가 기능.
- 핵심 문장: "가까워지는 데는 순서가 있어요." / 이름 '댕큐' 유지(= 거리를 지켜 줘서 고마워), 영문 DANGQ.
- 아트 디렉션: AD2 '나란히 두 선'. 토큰은 `app/src/styles/tokens.css`에만 둔다.
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

## 다음 행동
1. QA 1차 결과 반영 → 재검증 기록(`05_qa/`)
2. 케이스 스터디 08 검수 섹션 수치 갱신
3. 배포 대상 승인 요청
