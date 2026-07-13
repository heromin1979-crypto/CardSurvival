# 릴리스 게이트 — Phase 1 기준선 확정

> 다음 단계(전투 안정화) 진입 전 통과 조건. 실측 기록은 `BASELINE_2026-07-13.md` 참조.
> 상태: ✅ 통과 · ⚠ 부분(잔여 항목 명시) · ⬜ 미착수

## Gate A — 저장소 정리 ✅

- [x] `.gitignore`에 `tmp/`, `output/`, `outputs/` 추가 (`92b5277`)
- [x] `MONSTER_MOTION_AUDIT.md` 참조 산출물 2종: 재생성 스크립트(`tools/render_monster_motion_preview.py`) 명시로 처리
- [x] `.claude/`(CLAUDE.md가 참조) · `plan/combat-improvement/` → 커밋 결정 (`783d6ee`)
- [x] WIP 61개 파일 → 4커밋 분할, `git status` clean
- [x] 분할 전 백업: `wip-backup-2026-07-13` 브랜치 + 파일 tarball

## Gate B — 데이터 무결성 ✅

- [x] `node js/data/validate.js` Errors 0 (Warnings 219)
- [x] Warnings 219 분류 완료 — 전량 stackConfig 미등록 단일 유형, **비차단** (드랍 검증 단계에서 개별 처리)
- [x] `node tools/editor/check-help-coverage.mjs` 통과 (201개 필드)

## Gate C — 테스트 ✅

- [x] `npm.cmd test` 82파일 935개 전체 통과
- [x] localhost:3000 노이즈 원인 특정·수정 — `combatUiAssets.js` 매니페스트 fetch의 vitest 가드
- [x] 전체 테스트 출력 네트워크 에러 로그 0줄
- [x] E2E 서버 요건 문서화 — `test:e2e:combat`은 vite를 자체 기동(포트 43179), 시뮬레이터는 포트 43555

## Gate D — 전투 기준선 ✅

- [x] `tools/sim/combat/run.mjs --n 100` 현재 커밋 기준 재실행, 리포트 갱신
- [x] 측정 조건 고정 명시 (플레이어 단독·무방어구 하한선)
- [x] 알려진 이슈 이관: DL3 무장 100%, 약탈자 2인조 원거리 13%, DL5 stuck 7셀
- [x] stuck 발생 조건 리포트에 기록

## Gate E — UI 기준선 ⚠

- [x] 1920×1080 focused 전투 스크린샷 확보 (`docs/release/assets/combat-ui-baseline-2026-07-13.png`)
- [x] 겹침/overflow 체크 — 스킬 카드 푸터 클리핑 1건 발견, "UI/플로우 개선" 단계로 이관
- [ ] 모바일/태블릿 출시 범위 결정 — **사용자 결정 필요**
- [ ] DESIGN.md 대비 이탈 여부 정밀 검수 — 디자인 리뷰 세션 별도 필요

## Gate F — 빌드 ✅

- [x] `npm run build:pc` 성공 → `dist/pc/CardSurvival-RuinedCity-PC.exe` (1.44GB)
- [x] 실행 스모크 (CDP): 메인 메뉴 렌더 → 새 게임 → 슬롯 선택 전환 확인
- 후속 과제: assets/images 1.3GB 최적화(WebP), 앱 아이콘·코드사인 미설정 → RC QA 단계

## Gate G — 세이브 호환 ⚠

- [x] 정적 검증: `GameState.js`·`SaveManager.js` 개편 전후 diff 없음 → 스키마 무변경
- [x] 전투 중 세이브는 'main' 강제 복원 구조 확인 (전투 상태 비이월)
- [ ] 실기기 구버전 세이브 이어하기 → 전투 진입 1회 — **수동 확인 필요** (자동화 불가)

## Gate H — i18n ✅

- [x] `combat.*` ko/en 125:125 완전 일치, 스킬 81종·토큰 11종 전수 확인
- [x] validate.js와 중복 여부 확인 — validate는 로케일 키를 검사하지 않으므로 별도 스크립트로 수행

## 다음 단계 진입 판정

Gate A~D, F, H 통과. E·G의 잔여 항목은 코드 게이트가 아닌 **결정/수동 확인** 사안으로
전투 안정화 단계 진행을 차단하지 않음. → **Phase 2(전투 안정화) 진입 가능.**
