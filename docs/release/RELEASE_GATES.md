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

## Gate E — UI 기준선 ✅

- [x] 1920×1080 focused 전투 스크린샷 확보 (`docs/release/assets/combat-ui-baseline-2026-07-13.png`)
- [x] 겹침/overflow 체크 — 스킬 카드 푸터 클리핑 1건 발견, "UI/플로우 개선" 단계로 이관
- [x] 모바일/태블릿 출시 범위 결정 — **당장 출시 계획 없음(PC 전용)**, 2026-07-14 확정
- [x] DESIGN.md 대비 이탈 여부 정밀 검수 — 게이트 차단 아님, "UI/플로우 개선" 단계의 디자인 리뷰로 이관

## Gate F — 빌드 ✅

- [x] `npm run build:pc` 성공 → `dist/pc/CardSurvival-RuinedCity-PC.exe` (1.44GB)
- [x] 실행 스모크 (CDP): 메인 메뉴 렌더 → 새 게임 → 슬롯 선택 전환 확인
- 후속 과제: assets/images 1.3GB 최적화(WebP), 앱 아이콘·코드사인 미설정 → RC QA 단계

## Gate G — 세이브 호환 ✅

- [x] 정적 검증: `GameState.js`·`SaveManager.js` 개편 전후 diff 없음 → 스키마 무변경
- [x] 전투 중 세이브는 'main' 강제 복원 구조 확인 (전투 상태 비이월)
- [x] 실기기 구버전 세이브 이어하기 수동 확인 — 사용자 확인 완료 (2026-07-14)

## Gate H — i18n ✅

- [x] `combat.*` ko/en 125:125 완전 일치, 스킬 81종·토큰 11종 전수 확인
- [x] validate.js와 중복 여부 확인 — validate는 로케일 키를 검사하지 않으므로 별도 스크립트로 수행

## 다음 단계 진입 판정

Gate A~H 전체 통과 (E·G 잔여 항목은 2026-07-14 사용자 결정·확인으로 종결).
→ **Phase 1 종료, Phase 2(전투 안정화) 진입.**

---

# Phase 2 게이트 — 전투 안정화 (2026-07-14 실행)

계획: `plan/combat-improvement/2026-07-14_phase2_전투_안정화_계획.md`
확정 측정: `--n 1000` × 2조건 (하한선 `COMBAT_SIM_REPORT.md` / 실플레이 `COMBAT_SIM_REPORT_PARTY.md`)

| 지표 | 목표 | 실측 (n=1000) | 판정 |
|------|------|--------------|------|
| stuck | 0 또는 드라이버 한계 판명 | **0셀 / 84,000회** | ✅ |
| DL1 승률 | 90%+ | 92~100% | ✅ |
| DL3 무장 승률 | 60~75% | 소음45 하한선 60~72% (소총 92) | ✅ (소총은 상위 티어 프리미엄) |
| 평균 라운드 | 4~7 | DL3 소음45 4.1~5.6 | ✅ |
| DL5 실플레이 | 40~60% | 58~94% | ⚠ 잔여 과잉 — 몬스터 패턴 단계 이관 |
| 테스트 | green 유지 + 회귀 추가 | 944개 통과 (+9 신규) | ✅ |

## Track별 결과

- **Track A ✅** (`8474b41`) — stuck 원인은 드라이버 한계가 아닌 **엔진 버그**:
  적이 자기 턴에 죽는 경로(자폭/rout)에서 승리 미결선 + 랭크 동기화 누락.
  수정 + red-green 회귀 테스트 + 시뮬 stuck 사유 계측(`--dump-stuck`).
- **Track B ✅** (`51c493b`) — 표시 전용 랭크 인텐트(pendingIntentByEnemy) 제거,
  실행 경로 `_nextIntent` 단일 소스화. UI 폴백 분기 제거 + 배지 회귀 테스트.
- **Track C ✅** (`acdc334`) — dodge 0.9 캡, 방어 관통 바닥, 프리뷰 정직성
  (preview==실판정 프로필+경계 굴림), 상태이상 저장소 분리 단일 틱.
- **Track D ✅** (`045e5cd`, `249c865`) — 인접 랭크 스왑(원거리 봉인 교착 해소),
  조우 규모 파티 스케일링(솔로 불변), 시뮬 소음/방어구/동료 축 확장.
- **Track E(선택) → 보류** — CombatSystem 2,166줄 등 기계적 분할과
  `RelationshipCombatSystem` 결선, deprecated `CombatActions` 정리는
  몬스터 패턴 단계에서 동작 변경이 또 들어오므로 그 이후로 연기.

## 이관 항목 (몬스터 패턴 개선 단계)

1. DL5 실플레이 58~94% → 40~60% 하향 (패턴 재설계와 함께 조정해야 재작업 없음)
2. 약탈자 2인조 무기 상성 스프레드 (권총 14% vs 소총 66%) 검토
3. 실플레이 장기전(맨손 25라운드) — 3v2 전투 템포 검토
