# 댕큐 리프로젝트 — 현재 상태 (컨텍스트 복구용)

## 단계
- [ ] A. 기존 자료 감사·기회 탐색 (Figma 감사 에이전트 / 리서치 에이전트 병렬 진행 중)
- [ ] B. 전략·아트 디렉션 선택
- [ ] C. 대표 화면 + 핵심 인터랙션 첫 구현
- [ ] D. 전체 여정·브랜드 응용 완성
- [ ] E. 독립 검수 → 수정 → 재검증 → 납품

## 환경 제약 (확인된 사실)
- djdb.kr: 클라우드 환경 네트워크 정책으로 차단(HTTP CONNECT 403, 2026-09-30). **DJDB는 미확인 상태**. 사용자가 허용 도메인 추가 시 재분석.
- 로컬 `outputs/figma-project-review/`, `outputs/채팅 인수인계/`: 저장소가 비어 있어 **존재하지 않음**.
- Figma 파일 4dPmKvcezjlNoqSP5rw4A1: 읽기 가능. 페이지 4개(1217 / WEEK 12-1119 1차완성 / 작업보드 / 아이폰 이모티콘). 기존 파일은 수정 금지.
- npm·pypi 접근 가능, Chromium(Playwright) 사용 가능, ffmpeg는 imageio-ffmpeg로 확보 가능.

## 확정 결정
- 기술: Vite + React + TypeScript, HashRouter(정적 배포 호환). 위치 `app/`.

## 파일 소유
- outputs/01_research/* : 리서치 에이전트
- outputs/02_audit/* : Figma 감사 에이전트
- outputs/03_strategy, 04_brand, app/ : 총괄
- outputs/05_qa : 독립 검수 에이전트
