# HospitalSiegeSystem (Phase 4) 구현 계획

> 최종 업데이트: 2026-04-21
> 상태: 계획 확정 → Phase 1 TDD 착수
> 선행 완료: 응급실 허브 증분 1~7 (Pull-First + Day Cap + Timer + Contribution Engine + BoardBridge + DispatchSystem + GuardSystem), 124/124 테스트 통과

## 요구사항 재진술

1. **스케줄러** — 첫 습격 Day 10, 간격 5~7일 랜덤, `baseEnemies 2 + 0.5/습격` (최대 7)
2. **위협 발행** — `siegeTriggered { numEnemies, danger, siegeId }` 발행으로 GuardSystem 훅 활성화
3. **분기** — 플레이어가 보라매 내부(`currentLandmark === 'dongjak'`)에 있으면 CombatSystem 경로, 부재면 GuardSystem 자동 시뮬
4. **패배 후처리** — 환자 1~2명 사망 + ER 구조물 피해 25% + landmark dangerMod +0.05
5. **승리 후처리** — `pistol_ammo` 등 보너스 + 사기 +10
6. **moraleBonus 일일 합산** — 상주 수비대 `guard.moraleBonus` 합산 → 매일 소폭 사기 상승

## 아키텍처 개요

```
HospitalSiegeSystem (오케스트레이터)
    │
    ├─ tpAdvance → _checkSchedule()
    │       └─ 조건 충족 → emit(siegeTriggered)
    │
    ├─ siegeTriggered
    │       ├─ 플레이어 현장: StateMachine.transition('encounter', { isSiege: true })
    │       └─ 부재: (기존) GuardSystem._onSiege 자동 시뮬
    │
    ├─ siegeResolved (GuardSystem / CombatSystem 양쪽 발행)
    │       └─ _onSiegeResolved()
    │               ├─ 패배: 환자 샘플링→patientDied + 구조물 피해 + dangerMod +0.05
    │               └─ 승리: pendingLoot + morale +15
    │
    └─ tpAdvance(day rollover) → _tickMoraleBonus()
            └─ 상주 수비대 moraleBonus 합산 → morale +=
```

## State 스키마 확장

```js
// GameState.flags
nextSiegeDay: number | null,
siegeCount:   number,

// GameState.landmarkOverrides (신규)
{
  [landmarkId]: {
    [subLocationId]: { dangerModDelta: number },
  },
}
```

## Phase 구성

### Phase 1 — BALANCE + GameState 슬라이스
- `gameBalance.js`: `hospitalSiege` 블록 (startDay, intervalDays, intervalVariance, baseEnemies, enemiesPerWave, maxEnemies, dangerLevel, structureDamage, victoryMorale, defeatMorale, casualtiesMin/Max, dangerModDelta, victoryItems)
- `GameState.js`: flags 기본값 + `landmarkOverrides: {}` + `getLandmarkDangerMod(landmarkId, subId)` 헬퍼

### Phase 2 — RED 테스트 (`tests/unit/HospitalSiegeSystem.test.js`)
- init 구독 확인
- Day 10 이전 트리거 없음
- Day 10+ 하루 첫 TP에 `siegeTriggered` 발행
- 적 수 스케일링 (2 → 2.5 → 3 … 최대 7)
- 간격 5~7일 후 nextSiegeDay 업데이트
- 승리 분기: pendingLoot 추가 + morale +15
- 패배 분기: 환자 1~2명 → `patientDied` emit + 구조물 피해 25% 이벤트 + dangerMod 오버라이드 증가
- moraleBonus 일일 합산

### Phase 3 — GREEN 구현 (`js/systems/HospitalSiegeSystem.js`)
- 내부 상태: `_currentDay`, `_siegeCounter`, `_unsubscribeXxx`
- 공개 API: `init()`, `_reset()`, `_checkSchedule()` (private), `_onSiegeResolved(p)` (private)
- 스케줄 로직은 NoiseSystem._checkHordeWave 패턴 복제 + er_unlocked 플래그 + hospital이 "존재함" 조건
- landmark dangerMod 오버라이드: `GameState.landmarkOverrides[lm_boramae_hospital][*]` 각 서브로케이션에 +0.05
- 환자 샘플링: `PatientIntakeSystem._admitted`에서 랜덤 N명 → `patientDied` emit

### Phase 4 — 플레이어 현장 분기
- `siegeTriggered` 구독측 분기는 GuardSystem이 이미 처리 (자동 시뮬)
- 플레이어 현장이면 HospitalSiegeSystem이 `StateMachine.transition('encounter', { enemies, isSiege: true, siegeId })` 호출
- CombatSystem의 `combatEnd` 훅에서 `_encounterData.isSiege === true`면 `siegeResolved` 발행 (GuardSystem 후처리 우회)
- HospitalSiegeSystem은 siegeResolved를 한 번만 처리

### Phase 5 — main.js 부트스트랩
- `import HospitalSiegeSystem`
- `HospitalSiegeSystem.init()` + `SystemRegistry.register('HospitalSiegeSystem', HospitalSiegeSystem)`
- 순서: NPCSystem → PatientIntakeSystem → DispatchSystem → GuardSystem → **HospitalSiegeSystem** (siegeResolved 구독 순서)

### Phase 6 — 전체 테스트 검증
- `npx vitest run` 전 통과 (143+)
- `validate.js` 무영향
- 실 런타임 부트스트랩 스모크

## 새 이벤트 명세

| 이벤트 | 페이로드 | 발행처 |
|---|---|---|
| `siegeTriggered` | `{ numEnemies, danger, siegeId, scheduledDay }` | HospitalSiegeSystem |
| `siegeResolved` | `{ outcome, casualties, defenseRating, threat }` | GuardSystem 또는 CombatSystem |
| `hospitalRewards` | `{ items: [{id, qty}], morale }` | HospitalSiegeSystem |
| `hospitalDamaged` | `{ structureDamage, landmarkDangerDelta }` | HospitalSiegeSystem |

## 리스크

- **HIGH**: 플레이어 현장 CombatSystem 통합 — `data.isSiege` 플래그 → combatEnd 훅에서 분기 필요
- **MEDIUM**: `landmarkOverrides` 저장/로드 직렬화 영향 — Phase 1에서 getCurrentSeed 호환성 확인 필요
- **LOW**: moraleBonus 책임 분리 — HospitalSiegeSystem에서 전담 (GuardSystem은 식량만 담당)

## 복잡도: MEDIUM
- 백엔드: 4~5시간 / 테스트: 2시간 / 통합: 1시간 = **7~8시간**

## 변경 파일 예상 (7~8개)

1. `js/data/gameBalance.js` — hospitalSiege 블록
2. `js/core/GameState.js` — flags + landmarkOverrides + getter
3. `js/systems/HospitalSiegeSystem.js` (신규)
4. `js/systems/CombatSystem.js` — isSiege 플래그 후처리
5. `js/main.js` — 시스템 등록
6. `tests/unit/HospitalSiegeSystem.test.js` (신규, ~12 tests)
7. `tests/unit/HospitalSiege_integration.test.js` (신규, ~5 tests)
8. (선택) `js/systems/PatientIntakeSystem.js` — `sampleAdmittedForCasualty()` 헬퍼 export

---

## 이전 계획

### DispatchSystem (T2) + GuardSystem (T3) 구현 계획

> 완료 상태: Phase 1~6 전부 완료, 124/124 테스트 통과 (2026-04-21 커밋 a7cf542 포함)

완치된 환자(`PatientIntakeSystem._rescued` 로스터)에게 **sponsor 외 2가지 역할**:
- **Dispatch (T2)**: NPC를 특정 구로 파견 → N일 후 루트 반환
- **Guard (T3)**: 병원 상주 → 조우 감소 + 습격 자동 전투

완료 산출물:
- `js/systems/DispatchSystem.js` (신규, ~204 lines)
- `js/systems/GuardSystem.js` (신규, ~225 lines)
- `patient_lee_junho_16` (dispatch 샘플), `patient_yoon_taehyun_27` (guard 샘플)
- `PatientIntakeSystem` dispatch/guard 분기
- `validate.js` 스키마 확장
- 27 신규 테스트 (14 Dispatch + 13 Guard + 6 Integration)
