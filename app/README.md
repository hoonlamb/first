# 댕큐(DANGQ) — 사이트와 체험 모드 제품

`npm install` → `npm run dev` (http://localhost:5173)
- `#/` 브랜드 사이트 · `#/app` 체험 모드 · `#/brand` 브랜드 가이드 · `#/case` 케이스 스터디
- 빌드 `npm run build` (정적 파일, HashRouter, base `./`)
- 테스트 `npx playwright test` (E2E + 나란히 규칙 단위 테스트)
- 문구를 바꾸면 `python3 scripts/subset-font.py`로 폰트 서브셋을 다시 만든다(fonttools, brotli 필요).

인수인계 전체: `../outputs/07_handoff/HANDOFF.md`
