# 의사(이지수) 플레이 경험 개선 계획 — 8개 개선안

> 최종 업데이트: 2026-04-22
> 상태: **Wave 3 진행 중 (W3-1 작업 중)**
> 선행 완료: HospitalSiegeSystem Phase 4 + EmergencyRoomModal UI + 페르소나 5→13 확장 (160/160 테스트 통과)

## 배경

의사 캐릭터 Day 1~30 시뮬레이션 결과, 8개 주요 문제점 식별:
1. Day 10 첫 습격 필패 디자인 (guard 페르소나 확보 확률 ~15%)
2. 원정-환자 허브 이중 손실 (세브란스 원정 5일 간 사기 -10+ 누적)
3. 환자 기여 타입 무작위 (전략 빌드 불가)
4. 사기 이코노미 단방향 (패널티 빈발, 회복 빈약)
5. 의사 전투 약자인데 현장 분기만 존재
6. Day 10/Day 30 이벤트 중첩
7. 루팅 -1/일 영구 감소 비가시 (실제로는 미구현)
8. 시간(TP 72) 감각 추상적

## 실행 계획 — 3 Wave

### Wave 1 — 상수·플래그 조정 ✅ 완료 (commit b7fd2fc)

| # | 태스크 | 수정 대상 | 상태 |
|---|-------|---------|------|
| W1-1 (#4) | 사기 리밸런스 | PatientIntakeSystem, HospitalSiegeSystem, gameBalance.js | ✅ |
| W1-2 (#5) | Day10↔30 중첩 완화 | HospitalSiegeSystem._checkSchedule | ✅ |
| W1-3 (#8) | 시간대 HUD 아이콘 | NightSystem / Main.js 렌더 루프 | ✅ |

### Wave 2 — 시스템 수정·퀘스트 추가 ✅ 완료 (commit e13fd7a)

| # | 태스크 | 수정 대상 | 상태 |
|---|-------|---------|------|
| W2-1 (#2) | 간호사 자동 대행 + tryIntake 위치 체크 | PatientIntakeSystem, npcs.js | ✅ |
| W2-2 (#1) | 튜토리얼 습격 + Day7 예고 | mq_doctor_shared, HospitalSiegeSystem | ✅ |
| W2-3 (#3a) | 환자 롤 기여 타입 가중치 | PatientIntakeSystem._rollPersona | ✅ |

### Wave 3 — 신규 모달·미니게임 🚧 진행 중

| # | 태스크 | 수정 대상 | 상태 |
|---|-------|---------|------|
| W3-1 (#3b) | 환자 기여 타입 선택권 UI | ContributionChoiceModal 신규, 환자 스키마 altContributions, PatientIntakeSystem._pendingChoices/chooseContribution | 🚧 작업 중 (미커밋) |
| W3-1b (#5) | 의사 특권 — 습격 패배 완화 | gameBalance.doctorPrivilege, HospitalSiegeSystem._applyDefeat (사망자 -1, 사기 ×0.75) | 🚧 작업 중 (미커밋) |
| W3-2 (#7) | 서브로케이션 루팅 고갈 구현+UI | GameState, ExploreSystem, LandmarkModal | 🚧 Phase A/B/C 완료 (226/226) |
| W3-3 (#5) | 의사 전용 대피 미니게임 | HospitalSiegeSystem, Encounter.js | ⏳ 대기 |

### W3-2 상세 계획 (#7 서브로케이션 루팅 고갈)

4단계로 분리 — 점진 배포:

| Phase | 범위 | 파일 | 상태 |
|------|------|------|------|
| **A** | GameState 스키마·헬퍼·세이브 호환·테스트 | GameState.js, gameBalance.js, GameState_subLocationStock.test.js | ✅ 완료 (25/25) |
| **B** | ExploreSystem 통합 + QuestSystem 보라매 하드코드 대체 | ExploreSystem.js, QuestSystem.js, ExploreSystem_subLocationStock.test.js | ✅ 완료 (9/9) |
| **C** | ExploreSystem tpAdvance 리스너 + 자동 일자 감소 | ExploreSystem.js, ExploreSystem_dayDecay.test.js | ✅ 완료 (7/7) |
| D | LandmarkModal UI 재고 배지 (🪙 X/Y, 색상, 고갈 disable) | LandmarkModal.js, CSS | ⏳ 대기 |

**Phase A 채택된 설계 결정**:
- 스키마: `subLocationStock: { [subLocId]: { stock, baseStock, lastDecayDay } }`
- 일자 감소 정책: **건너뛴 day 수와 무관하게 1회당 1만 감소** (lastDecayDay 중복 차감 방지)
- 감소량 상수: `BALANCE.explore.stockDecayPerDay = 1`
- 초기 baseStock: sub-loc `lootCount[1]` (max) 기준 lazy-init (Phase B에서 연결)
- `flags.boramae_depleted` 스텁: **Phase B에서 대체 완료** — 플래그는 1회성 가드로만 유지, 실제 감소는 `subLocationStock`으로 이관

**Phase A 검증 증거**:
- 신규 테스트 25/25 통과 (GameState_subLocationStock.test.js)
- 전체 테스트 210/210 통과 (회귀 없음)
- `node --input-type=module js/data/validate.js` → ✅ ALL CLEAR (Errors: 0)

## Wave별 검증

- 각 Wave 완료 시 `node --input-type=module js/data/validate.js` ALL CLEAR
- 각 Wave 완료 시 `npx vitest run` 전체 통과
- 각 Wave 종료마다 `feat:` 커밋

## 이전 계획

→ `prompt_plan.old2.md` (HospitalSiegeSystem Phase 4 기록)
→ `prompt_plan.old.md` (Wave 1 이전 전체 기획)
