# 동료 및 일반 몬스터 전투 패턴 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 전투 동료 20종과 일반 몬스터 12종의 실제 행동 선택·대상·효과·모션이 각 캐릭터의 역할과 전투 콘셉트에 맞게 작동하도록 정리한다.

**Architecture:** 모든 동료 행동은 `COMPANION_COMBAT_LOADOUTS`와 공용 `executeSkillCommand()`를 사용하고, 새 `CompanionTactics`는 자세에 맞는 실제 스킬과 대상을 결정만 한다. 일반 몬스터는 새 `EnemyActionPlanner`가 의도 UI와 실행이 공유하는 행동을 한 번 확정하며, `CombatAiTurns`는 플레이어와 동료를 구분하지 않는 대상 독립 실행기로 행동을 적용한다. 보스 패턴 컨트롤러는 이 공용 행동 예약·대상 재검증 계약을 재사용한다.

**Tech Stack:** Vanilla JavaScript ES modules, Vitest, happy-dom, 기존 `CombatSkillSystem`, `CombatRankedEffects`, `CombatAiTurns`, `GameState`

## Global Constraints

- 일반 몬스터 12종은 보스처럼 행동 수를 억지로 늘리지 않고, 한 문장으로 설명 가능한 전술 역할을 선명하게 만든다.
- UI에 표시된 적 행동 ID·대상·타격 횟수는 실제 실행과 같아야 한다.
- 적 기술은 플레이어와 동료에게 같은 규칙으로 피해·상태이상·강제 이동을 적용한다.
- 동료의 `attack`, `heal`, `support`, `hold` 자세는 공용 수치 행동을 만들지 않고 실제 로드아웃 스킬을 선택한다.
- 치료 스킬이 없는 동료는 `heal` 자세에서 임의의 HP 회복을 생성하지 않는다.
- 음식·배급·식량 행동은 전투 중 직접 HP 회복으로 사용하지 않고 사기·집중·위력·방어 지원으로 표현한다.
- 동료의 자동 행동도 수동 행동과 같은 위치, 대상, 스태미나, 쿨다운, 효과, FX 파이프라인을 통과한다.
- `motionKey`는 행동 선택 결과에 포함하며 `2026-07-27-combat-motion-overhaul.md`의 의미 행과 일치시킨다.
- 일반 몬스터용 공용 상태는 `_enemyActionState`, 보스 확장 상태는 `_bossActionState`로 구분하되 행동 객체 형식은 공유한다.

---

## 1. 현재 구조에서 확인된 공통 문제

### 1.1 동료 패턴

- `COMPANION_COMBAT_LOADOUTS`에는 20종×3개, 총 60개의 고유 기술이 있다.
- 반면 `BALANCE.combat.companionAuto.classSkills`에는 `npc_nurse`, `npc_soldier`, `npc_doctor` 세 항목만 있다.
- 실제 전투 로드아웃 ID는 `npc_soldier_deserter`, `npc_jisu`, `npc_tower_doctor` 등이므로 `npc_soldier`와 `npc_doctor` 지원 자세는 현재 주요 20종 로드아웃과 직접 연결되지 않는다.
- `_companionAutoHeal()`은 동료의 실제 기술 보유 여부와 무관하게 모든 동료가 플레이어를 공용 수치로 치료할 수 있게 한다.
- `_companionAutoSupport()`는 세 레거시 ID 외의 동료를 모두 기본공격으로 폴백한다.
- `_applyCompanionSkill()`의 `doctor_diagnose`는 `_diagnoseResistBonus`를 기록하지만 이 값을 소비하는 상태이상 판정 경로가 없다.
- `soldier_suppress`는 동료 대상 기본공격 경로에서만 피해를 줄이고 플레이어 대상 `_enemyAttack()`에는 적용되지 않는다.
- `resolveManualCompanionAction()`의 빠른 명령은 `executeSkillCommand()`를 거치지 않아 실제 스킬 카드와 위치·비용·효과가 다르다.
- 피해 기술은 대부분 근접 `[7,12]` 또는 원거리 `[9,15]`로 같아 이름만 다르고 역할 차이가 약하다.

### 1.2 일반 몬스터 패턴

- `_decideNextIntent()`는 쿨다운이 끝난 특수기를 항상 표시하지만 `_runEnemyAI()`는 실행 시 다시 50% 확률을 굴린다.
- 의도가 동료를 대상으로 하면 `_runSingleEnemyTurn()`이 `_enemyAttackCompanion()`을 호출하고, 이 함수는 주석과 실제 구현 모두 기본공격만 지원한다.
- 따라서 동료 대상 특수기, 연속공격, 상태이상, 감염, 강제 이동이 플레이어 대상과 다르게 작동한다.
- `zombie_horde`와 `rabid_dog`의 2회 공격은 동료가 의도 대상일 때 1회로 줄어든다.
- `zombie_acid`의 `forcedMove`와 상태 축적은 플레이어 ID에 고정되어 있다.
- `raider_elite`의 healer 우선 타겟은 `npc_nurse`와 존재하지 않는 레거시 `npc_doctor`만 인식한다.
- `zombie_screamer.timedThreat.counters.silentSuppress`는 데이터에 있지만 실행 경로가 없다.
- `zombie_charger`는 카운트가 1→0이 된 뒤 UI에 “0턴 후 강타”가 보일 수 있어 준비와 발동 상태가 불명확하다.
- `combatProfile`이 있는 네 몬스터는 랭크 UI용 기술 정의와 실제 레거시 AI 실행 정의가 따로 있어 수치·행동이 갈라질 수 있다.

---

## 2. 일반 몬스터 12종 패턴 평가

| 몬스터 | 현재 콘셉트 평가 | 확인된 어색함 | 개선 방향 |
|---|---|---|---|
| `zombie_patient_dormant` | 잠복 중 처치하면 기습을 막는 대응 창은 좋음 | 깨어나기만 하고 이후 일반 좀비와 같아 “기습”의 위협이 약함 | `dormant→wake→startled_lunge` 1회 흐름. 기상 후 첫 공격만 명중 보정, 기상 전 처치 가능 |
| `zombie_common` | 느린 기본 감염자 기준점으로 적합 | 구조적 오류 외 고유 패턴 문제 없음 | 가장 단순한 기본공격만 유지해 다른 변종의 기준으로 사용 |
| `zombie_runner` | 이동으로 피하는 예고형 2연타가 속도 콘셉트와 적합 | 표시된 `runner_rush`가 실제로 기본공격이 될 수 있고 동료 대상이면 2연타 소실 | 행동·대상·2회 타격을 예약하고 동일하게 실행 |
| `zombie_brute` | 느린 강타, 이동 회피, 블록 시 기절 방지가 명확함 | `defensive` AI가 원거리 플레이어를 노리는 명칭·행동 불일치, 동료 대상 강타 불가 | 패턴명을 `frontline_breaker`로 변경하고 전열 우선, `slam`에 밀치기 추가 |
| `raider` | 약한 대상을 노리는 원거리 인간 적으로 무난함 | 총격 외 선택지가 없어 인간 적의 판단성이 약함 | 기본형 유지하되 엄폐된 대상보다 노출·저HP 대상을 우선하는 명시적 `opportunist` 타겟 정책 |
| `raider_elite` | 후열 정조준, 이동 회피, 피격 취소가 가장 완성도 높은 일반 패턴 | 실제 healer 판별이 일부 ID에 고정되고, 의도/실행 재추첨 문제가 있음 | 로드아웃의 `heal` 효과 보유 여부로 healer 판별, 정조준 대상 스냅샷 유지 |
| `zombie_horde` | 2회 공격과 전열 분산이 군집 콘셉트에 적합 | UI는 대상 하나만 표시하고 동료 대상 분기에서 2회 공격이 사라짐 | `targetIds` 2개를 의도에 표시하고 두 타격을 순차 실행 |
| `rabid_dog` | 저HP 추적, 2연속 물기, 출혈·감염이 적합 | 동료 대상이면 1회만 공격하며 동료에는 출혈/감염이 적용되지 않음 | 같은 대상 2연타를 예약하고 상태이상은 행동당 1회만 판정 |
| `zombie_acid` | 후열에서 약해진 대상을 노리고 끌어내는 역할이 명확함 | 강제 이동·산성 화상이 플레이어에 고정됨 | 예약된 `targetId`에 끌기·상태 축적 적용, 원거리 분사는 제자리 모션 |
| `zombie_bloater` | 3턴 자폭, 공격하며 팽창, 불·폭발·기절 대응이 적합 | 충전·기본공격·자폭의 시각 및 행동 상태 구분이 약함 | `charging`과 `ready` 상태 분리, 자폭 본체 모션 완료 후 광역 피해 |
| `zombie_screamer` | 후열 소환 카운트다운과 조용한 처치 요구가 적합 | 선언된 `silentSuppress`가 작동하지 않고 일반 공격과 비명이 같은 의미로 처리됨 | `silentSuppress`를 제거하고 “기절로 1턴 지연·조용한 처치 시 사망 소음 없음”만 실제 카운터로 명시 |
| `zombie_charger` | 준비 중 공격하지 않고 다음 행동에 돌진하는 역할이 적합 | “0턴 후” 표시, 대상이 플레이어에 고정, 충돌 후 위치 의미가 없음 | `telegraphing(1)→ready` 상태로 표시하고 예약 대상에 피해·밀치기 적용 |

### 일반 몬스터 합격 기준

- 기준 유지 가능: `zombie_common`, `raider`
- 콘셉트는 좋고 실행 통합 필요: `zombie_runner`, `zombie_brute`, `raider_elite`, `zombie_horde`, `rabid_dog`, `zombie_acid`, `zombie_bloater`, `zombie_screamer`, `zombie_charger`
- 콘셉트 보강 필요: `zombie_patient_dormant`

---

## 3. 동료 20종 패턴 평가

| 동료 | 현재 구성 평가 | 어색하거나 중복된 부분 | 목표 전술 패턴 |
|---|---|---|---|
| `npc_old_survivor` | 지팡이·경고·전열 유지가 경험 많은 생존자와 맞음 | `warning`과 `hold_line`이 모두 단순 방어라 선택 차이가 약함 | 경고는 아군 `dodge`, 전열 유지는 자신/전열 `block`으로 대상 차별화 |
| `npc_nurse` | 메스·치료·격려 구성이 명확함 | 치료가 단일 HP 회복이고 출혈 환자 우선성이 없음 | 가장 위험한 아군 우선, `triage`는 소량 회복+출혈 제거, 격려는 스트레스 감소 |
| `npc_soldier_deserter` | 소총·엄호·재배치가 역할에 적합 | 소총 사격과 엄호 사격의 수치·효과가 완전히 같음 | 엄호 사격은 낮은 피해+`hesitation`, 재배치는 자기 후퇴+`dodge` |
| `npc_child` | 숨기·경고는 비전투원 콘셉트와 맞음 | 돌 던지기가 소총과 같은 `[9,15]`, `hide`로 다른 아군까지 방어 가능 | 돌은 낮은 피해+망설임, 숨기는 자기 전용, 경고는 아군 회피 지원 |
| `npc_mechanic` | 렌치·와이어는 정비사와 맞음 | `field_repair`가 생체 HP를 치료 | HP 회복을 제거하고 임시 방호물(`block`) 보강으로 변경 |
| `npc_student` | 즉흥 공격·응급처치·빠른 이동의 초보 만능형 | 세 기술이 다른 동료의 기본 템플릿과 동일 | 낮은 수치 대신 비용이 가볍고, 빠른 이동에 자기 `dodge` 부여 |
| `npc_dog` | 물기·보호·추적이 매우 잘 맞음 | 보호 행동의 위치 개입이 없음 | 물기는 낮은 확률 출혈, 보호는 전열 이동+대상 `block`, 추적은 `marked` |
| `npc_former_colleague` | 망치·버티기·팀워크가 건설 동료와 맞음 | 전부 기본 템플릿이라 중량감이 약함 | 망치는 낮은 명중/높은 피해, 버티기는 강한 `block`, 팀워크는 `accuracy` |
| `npc_minjun` | 군의관의 사격·야전 치료·지휘가 선명함 | 지휘가 격려와 동일한 스트레스 감소 | 지휘는 아군 `focus`+소량 스트레스 감소로 전투 지휘 차별화 |
| `npc_sohee` | 정밀 사격·엄호·집중은 기능적으로 성립 | 약사·항바이러스 전문가 정체성이 거의 없음 | 정밀 사격에 `marked`, 엄호에 저소음/방어, 집중은 자기 `focus` |
| `npc_jisu` | 메스·응급치료·진단이 의사 역할과 맞음 | 간호사와 수치가 거의 동일 | 응급치료는 큰 단일 회복+출혈 제거, 진단은 적 `vulnerable` |
| `npc_yeongcheol` | 도끼·구조·격려가 소방관과 맞음 | `rescue`가 일반 HP 회복으로 구현됨 | 부상 아군을 후열로 이동시키고 `block` 부여, HP 회복은 제거 |
| `npc_daehan` | 렌치·바리케이드·과충전이 제작 전문가와 맞음 | 일반 정비사/타워 정비공과 수치가 동일 | 바리케이드 2 `block`, 과충전 `power`, 렌치는 제어 상태 적 보너스 |
| `npc_tower_security` | 진압봉·경계·도발 역할이 명확함 | 도발 토큰을 아무 아군에게 붙일 수 있음 | 도발은 자기 전용+`block`, 진압봉은 낮은 확률 `stun` |
| `npc_tower_merchant` | 숨은 칼·물자·흥정이 캐릭터성과 맞음 | `merchant_supply`가 이유 없이 HP를 회복 | 물자는 `improvised` 또는 `dodge` 지원, 흥정은 적 `hesitation` |
| `npc_tower_cook` | 칼·뜨거운 조리도구 공격이 적합 | 전투 중 식사가 즉시 HP를 회복 | 식사는 스트레스 감소+`strength`, 화상 공격은 근접 `melee` 모션 |
| `npc_tower_engineer` | 렌치·엄폐·함정이 설비 정비공과 맞음 | 일반 정비사와 유사하지만 방어형 정체성은 유지 가능 | 엄폐는 강한 `block`, 함정은 `rooted`, 공격은 기본 |
| `npc_tower_doctor` | 메스·치료·각성제가 명확함 | 치료가 다른 의료진과 동일 | 중간 회복+상태 제거, 각성제는 `speed`로 행동 순서 지원 |
| `npc_sous_chef` | 식칼과 위압은 리더형 부주방장에 맞음 | 배급이 HP 회복, 적에게 `stress`는 적 스트레스 모델이 없어 실효가 불명확 | 배급은 `strength`/`accuracy`, 위압은 적 `hesitation` |
| `npc_kitchen_helper` | 프라이팬·보조·몸 낮추기가 초보 지원형과 맞음 | 보조가 HP 회복, `duck`으로 다른 아군을 이동시킬 수 있음 | 보조는 `accuracy` 또는 `dodge`, 몸 낮추기는 자기 후퇴+`dodge` |

### 동료 합격 기준

- 콘셉트가 비교적 선명하고 수치 차별화만 필요: 늙은 생존자, 간호사, 떠돌이 개, 전 건설 동료, 강민준, 이지수, 정대한, 경비대장, 타워 정비공, 타워 의사
- 기술 효과 재설계 필요: 탈영병, 아이, 정비사, 대학생, 한소희, 박영철, 상인, 주방장, 부주방장, 주방 보조
- 특히 즉시 수정할 항목:
  - 아이의 돌 던지기와 소총의 동일 피해
  - 치료 능력 없는 동료의 공용 자동 치료
  - `mechanic_field_repair`, `yeongcheol_rescue`, `merchant_supply`, `tower_cook_meal`, `sous_chef_ration`, `kitchen_helper_assist`의 획일적 HP 회복
  - `deserter_rifle_shot`과 `deserter_covering_fire`의 완전 동일 효과
  - `sous_chef_intimidate`의 적 대상 `stress`

---

## Task 1: 패턴 데이터 계약과 현재 문제를 테스트로 고정

**Files:**

- Create: `tests/unit/CompanionPatternData.test.js`
- Create: `tests/unit/NormalEnemyPatternData.test.js`
- Modify: `js/data/validate.js`

**Interfaces:**

- Consumes: `COMPANION_COMBAT_LOADOUTS`, `COMBAT_SKILLS`, `ENEMIES`
- Produces: 동료 전술·일반 몬스터 행동 데이터의 검증 규칙

- [ ] **Step 1: 동료 패턴 fixture 계약 실패 테스트 작성**

```js
const result = validateCompanionPatternData({
  loadouts: { npc_test: ['test_attack', 'test_heal', 'test_guard'] },
  skills: {
    test_attack: { tacticalRole: 'damage', motionKey: 'melee', effects: [{ type: 'damage', value: [1, 2] }] },
    test_heal: { tacticalRole: 'heal', motionKey: 'support', effects: [{ type: 'heal', value: [1, 2] }] },
    test_guard: { tacticalRole: 'guard', motionKey: 'guard', effects: [{ type: 'guard', value: 0.2 }] },
  },
  tactics: { npc_test: { preferredStance: 'heal', priorities: [{ role: 'heal' }] } },
});
expect(result).toEqual([]);
```

- [ ] **Step 2: 일반 몬스터 fixture 계약 실패 테스트 작성**

정상 fixture가 오류 0을 반환하고, `patternProfile.targetPolicy` 누락, 기본 행동 `motionKey` 누락, 허용되지 않은 `timedThreat.counters.silentSuppress`가 각각 명시적 오류를 반환하도록 검사한다.

- [ ] **Step 3: 실패 확인**

Run: `npx vitest run tests/unit/CompanionPatternData.test.js tests/unit/NormalEnemyPatternData.test.js`

Expected: `validateCompanionPatternData`, `validateNormalEnemyPatternData` export가 없어 실패.

- [ ] **Step 4: `validate.js`에 교차 참조 검증 추가**

- 자세가 참조하는 역할의 스킬이 로드아웃에 실제 존재
- `selfOnly` 기술의 대상 진영은 `ally`
- `heal` 역할은 실제 `heal` 효과 포함
- 음식/배급 기술에 `heal` 효과 금지
- 적 타겟 정책과 대상 진영 일치
- `timedThreat.counters`는 `stunDelays`, `quietKill`, `weakness`만 허용

두 검증기는 전달받은 fixture만 검사한다. 실제 전체 로스터 완전성은 일반 몬스터 Task 6과 동료 Task 9에서 검증한다.

- [ ] **Step 5: fixture 테스트 통과 확인**

Run: `npx vitest run tests/unit/CompanionPatternData.test.js tests/unit/NormalEnemyPatternData.test.js`

Expected: 두 테스트 파일 모두 통과.

- [ ] **Step 6: 커밋**

```bash
git add tests/unit/CompanionPatternData.test.js tests/unit/NormalEnemyPatternData.test.js js/data/validate.js
git commit -m "test(combat): define companion and monster pattern contracts"
```

---

## Task 2: 공용 적 행동 예약기 구현

**Files:**

- Create: `js/systems/combat/EnemyActionPlanner.js`
- Create: `tests/unit/EnemyActionPlanner.test.js`

**Interfaces:**

- Produces: `createEnemyActionState()`, `commitEnemyAction(input)`, `advanceEnemyAction(input)`, `retargetCommittedAction(input)`
- Consumed by: `CombatAiTurns`, `BossPatternController`

- [ ] **Step 1: 의도와 실행이 같은 객체를 공유하는 실패 테스트 작성**

```js
const state = commitEnemyAction({
  enemy,
  candidates,
  random: () => 0.1,
});

expect(state.committedAction).toEqual({
  actionId: 'runner_rush',
  category: 'special',
  state: 'telegraphing',
  targetIds: ['player'],
  remainingTelegraphTurns: 1,
  hitCount: 2,
  motionKey: 'runner_rush',
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/unit/EnemyActionPlanner.test.js`

- [ ] **Step 3: 공용 행동 형식 구현**

```js
export function createEnemyActionState() {
  return { committedAction: null };
}

export function commitEnemyAction({
  enemy,
  candidates,
  cooldowns,
  random = Math.random,
}) {}

export function advanceEnemyAction({ state, stunned = false }) {}
export function retargetCommittedAction({ action, candidates }) {}
```

- [ ] **Step 4: 재타겟 규칙 구현**

예약 대상이 죽었을 때만 같은 `targetPolicy`로 재선정한다. 행동 종류, 타격 수, 기술 ID는 다시 추첨하지 않는다.

- [ ] **Step 5: 보스 컨트롤러가 소비할 공개 계약을 테스트로 고정**

`EnemyActionPlanner.test.js`에서 반환 객체의 `actionId`, `category`, `state`, `targetIds`, `remainingTelegraphTurns`, `hitCount`, `motionKey`를 고정한다. 이후 `BossPatternController`는 일반 행동 선택 함수 전체를 복제하지 않고 이 형식을 사용해 보스 우선순위와 필살기 예약만 확장한다.

- [ ] **Step 6: 통과 확인**

Run: `npx vitest run tests/unit/EnemyActionPlanner.test.js`

- [ ] **Step 7: 커밋**

```bash
git add js/systems/combat/EnemyActionPlanner.js tests/unit/EnemyActionPlanner.test.js
git commit -m "feat(combat): share committed enemy action planning"
```

---

## Task 3: 대상 독립 적 행동 실행기 구현

**Files:**

- Create: `js/systems/combat/EnemyActionExecutor.js`
- Create: `tests/unit/EnemyActionExecutor.test.js`
- Modify: `js/systems/combat/CombatAiTurns.js`

**Interfaces:**

- Consumes: 공용 committed action, `targetIds`
- Produces: `executeEnemyAction({ enemy, action, services, random })`

- [ ] **Step 1: 플레이어·동료 대칭 실패 테스트 작성**

같은 산성 기술을 플레이어와 동료에게 사용했을 때 피해, 상태이상, 강제 이동이 같은 규칙으로 적용되어야 한다.

- [ ] **Step 2: 연속공격 실패 테스트 작성**

러너·광견·호드가 동료를 대상으로 해도 `hitCount`만큼 실행되어야 한다.

- [ ] **Step 3: 실패 확인**

Run: `npx vitest run tests/unit/EnemyActionExecutor.test.js`

- [ ] **Step 4: 대상 독립 서비스 구현**

```js
export function executeEnemyAction({
  enemy,
  action,
  services,
  random = Math.random,
}) {}
```

`services`는 다음 함수를 요구한다.

```js
{
  damageTarget(targetId, amount, options),
  addStatus(targetId, status),
  moveTarget(targetId, distance),
  emitFx(payload),
  addLog(message),
}
```

- [ ] **Step 5: `_enemyAttackCompanion()`의 별도 계산 제거**

함수는 호환 어댑터로만 남기거나 삭제하고, 플레이어·동료 모두 `damageTarget()`을 통과시킨다.

- [ ] **Step 6: 상태이상 행동당 1회 규칙**

2연타는 피해를 두 번 주되 출혈·감염 같은 상태는 행동 완료 후 한 번만 판정한다.

- [ ] **Step 7: 통과 확인**

Run: `npx vitest run tests/unit/EnemyActionExecutor.test.js tests/integration/CombatTelegraph.int.test.js tests/integration/CombatTimedTick.int.test.js`

- [ ] **Step 8: 커밋**

```bash
git add js/systems/combat/EnemyActionExecutor.js js/systems/combat/CombatAiTurns.js tests/unit/EnemyActionExecutor.test.js
git commit -m "refactor(combat): execute enemy actions against any ally"
```

---

## Task 4: 일반 몬스터 의도 UI와 다중 대상 표시 통합

**Files:**

- Modify: `js/systems/combat/CombatAiTurns.js`
- Modify: `js/ui/CombatUI.js`
- Modify: `js/data/locales.js`
- Create: `tests/integration/CombatNormalEnemyIntent.int.test.js`

**Interfaces:**

- Consumes: `enemy._enemyActionState.committedAction`
- Produces: 실제 실행과 동일한 intent view model

- [ ] **Step 1: 특수기 재추첨 회귀 테스트 작성**

의도 결정 후 `Math.random()` 값을 바꿔도 `runner_rush`가 기본공격으로 바뀌지 않아야 한다.

- [ ] **Step 2: 다중 대상 의도 테스트 작성**

`zombie_horde`는 `targetIds`와 `hitCount: 2`를 UI에 제공하고 두 대상 이름을 표시해야 한다.

- [ ] **Step 3: 실패 확인**

Run: `npx vitest run tests/integration/CombatNormalEnemyIntent.int.test.js`

- [ ] **Step 4: `_decideNextIntent()`를 view 변환으로 축소**

행동 선택은 `EnemyActionPlanner`에서만 하고 `_decideNextIntent()`는 committed action을 라벨·아이콘·카운트다운으로 변환한다.

- [ ] **Step 5: 인텐트 라벨 한·영 추가**

`wake`, `multi_hit`, `multi_target`, `charging`, `ready`, `quiet_kill_counter`를 한·영 쌍으로 추가한다.

- [ ] **Step 6: 통과 확인**

Run: `npx vitest run tests/integration/CombatNormalEnemyIntent.int.test.js tests/unit/CombatTimedIntent.test.js`

- [ ] **Step 7: 커밋**

```bash
git add js/systems/combat/CombatAiTurns.js js/ui/CombatUI.js js/data/locales.js tests/integration/CombatNormalEnemyIntent.int.test.js
git commit -m "feat(combat): display committed normal enemy intents"
```

---

## Task 5: 타이밍 위협 상태와 실제 카운터 정리

**Files:**

- Modify: `js/data/enemies.js`
- Modify: `js/systems/combat/EnemyActionPlanner.js`
- Modify: `js/systems/combat/CombatAiTurns.js`
- Modify: `tests/unit/CombatTimedIntent.test.js`
- Modify: `tests/unit/CombatChargeInterrupt.test.js`
- Create: `tests/integration/CombatTimedThreatCounters.int.test.js`

**Interfaces:**

- Consumes: `timedThreat.counters`
- Produces: `telegraphing` 또는 `ready` 상태와 실행 가능한 카운터만 포함한 데이터

- [ ] **Step 1: 0턴 표시 금지 실패 테스트 작성**

`charge_strike`는 `countdown: 0` 대신 `state: 'ready'`, 라벨 “다음 행동에 돌진”을 반환해야 한다.

- [ ] **Step 2: 스크리머 카운터 테스트 작성**

- 기절: 카운트다운 1 증가
- 조용한 공격: 카운트다운 변화 없음
- 조용한 처치: 사망 소음 및 추가 소환 없음

- [ ] **Step 3: 실패 확인**

Run: `npx vitest run tests/integration/CombatTimedThreatCounters.int.test.js tests/unit/CombatTimedIntent.test.js`

- [ ] **Step 4: 실행되지 않는 `silentSuppress` 제거**

데이터를 `counters: { quietKill: true, stunDelays: true }`로 바꾸고 설명과 UI도 같은 의미를 사용한다.

- [ ] **Step 5: 블로터·차저 상태 전이 통일**

- 블로터: `charging(3→2→1)→ready→self_destruct`
- 스크리머: `charging(3→2→1)→ready→summon_horde`
- 차저: `telegraphing(1)→ready→charge_strike`

- [ ] **Step 6: 통과 확인**

Run: `npx vitest run tests/integration/CombatTimedThreatCounters.int.test.js tests/unit/CombatTimedIntent.test.js tests/unit/CombatChargeInterrupt.test.js tests/integration/CombatTimedTick.int.test.js tests/unit/CombatTimedResolve.test.js`

- [ ] **Step 7: 커밋**

```bash
git add js/data/enemies.js js/systems/combat/EnemyActionPlanner.js js/systems/combat/CombatAiTurns.js tests/unit/CombatTimedIntent.test.js tests/unit/CombatChargeInterrupt.test.js tests/integration/CombatTimedThreatCounters.int.test.js
git commit -m "fix(combat): align timed threat states and counters"
```

---

## Task 6: 일반 몬스터 12종 패턴 데이터 개편

**Files:**

- Modify: `js/data/enemies.js`
- Modify: `js/systems/combat/EnemyCombatAdapter.js`
- Modify: `js/data/locales.js`
- Modify: `tests/unit/NormalEnemyPatternData.test.js`
- Modify: `tests/unit/CombatNewEnemies.test.js`

**Interfaces:**

- Produces: 2절 평가표와 일치하는 `patternProfile`, 기술 대상·타격·모션 데이터

- [ ] **Step 1: 각 몬스터의 전술 역할 입력**

```js
patternProfile: {
  role: 'frontline_breaker',
  targetPolicy: 'frontmost',
}
```

허용 역할:

- `ambusher`
- `baseline`
- `skirmisher`
- `frontline_breaker`
- `opportunist`
- `sniper`
- `swarm`
- `predator`
- `timed_bomber`
- `summoner`
- `charger`

- [ ] **Step 2: 기술별 실행 데이터를 완성**

`targetPolicy`, `hitCount`, `telegraph`, `effects`, `motionKey`를 행동 객체에 함께 둔다. `EnemyCombatAdapter.buildEnemyProfile()`은 `combatProfile`에 복제된 기술보다 이 행동 데이터를 먼저 읽어 랭크 UI용 스킬을 생성하게 수정한다.

- [ ] **Step 3: 환자 좀비의 1회 기상 공격 구현 데이터**

`wakeTurns: 1`, `firstActionId: 'startled_lunge'`, 첫 공격 후 기본공격으로 돌아가는 플래그를 둔다.

- [ ] **Step 4: 몬스터별 테스트를 표 기반으로 작성**

`Object.keys(ENEMIES)`가 12종인지 확인하고, 12종 각각의 역할, 타겟 정책, 타격 수, 예고, 카운터를 검사한다.

- [ ] **Step 5: 데이터 검증**

Run: `node --input-type=module js/data/validate.js`

Expected: 일반 몬스터 패턴 오류 0.

- [ ] **Step 6: 테스트 통과**

Run: `npx vitest run tests/unit/NormalEnemyPatternData.test.js tests/unit/CombatNewEnemies.test.js tests/integration/CombatNormalEnemyIntent.int.test.js`

- [ ] **Step 7: 커밋**

```bash
git add js/data/enemies.js js/systems/combat/EnemyCombatAdapter.js js/data/locales.js tests/unit/NormalEnemyPatternData.test.js tests/unit/CombatNewEnemies.test.js
git commit -m "feat(combat): clarify twelve normal enemy patterns"
```

---

## Task 7: 동료 전술 프로필과 자세별 선택기 구현

**Files:**

- Create: `js/data/companionTactics.js`
- Create: `js/systems/combat/CompanionTactics.js`
- Create: `tests/unit/CompanionTactics.test.js`
- Modify: `js/data/validate.js`

**Interfaces:**

- Produces: `COMPANION_TACTICS`, `planCompanionTurn(input)`
- Consumed by: `CombatAiTurns.resolveManualCompanionAction()`, `CombatSystem.processUntilAllyTurn()`

- [ ] **Step 1: 실제 로드아웃만 선택하는 실패 테스트 작성**

```js
const plan = planCompanionTurn({
  npcId: 'npc_nurse',
  stance: 'heal',
  skills: nurseSkills,
  allies,
  enemies,
  canUse: () => true,
});

expect(plan).toEqual({
  skillId: 'nurse_triage',
  targetId: 'npc_wounded',
  reason: 'lowest_hp_ally',
});
```

- [ ] **Step 2: 치료 미보유 동료의 폴백 테스트 작성**

`npc_soldier_deserter`가 `heal` 자세여도 임의 회복을 만들지 않고 `deserter_reposition` 또는 공격을 선택해야 한다.

- [ ] **Step 3: 실패 확인**

Run: `npx vitest run tests/unit/CompanionTactics.test.js`

- [ ] **Step 4: 20종 프로필 입력**

```js
export const COMPANION_TACTICS = {
  npc_nurse: {
    preferredStance: 'heal',
    priorities: [
      { role: 'heal', when: 'ally_below_60' },
      { role: 'support', when: 'ally_stress_6_plus' },
      { role: 'damage' },
    ],
  },
};
```

- [ ] **Step 5: 자세별 공통 선택 규칙 구현**

- `attack`: `damage` 우선
- `heal`: 사용 가능한 `heal` → `guard` → `damage`
- `support`: 유효한 `control/support` → `guard` → `damage`
- `hold`: 자기 또는 보호 대상에게 `guard`
- `manual`: 자동 계획 없음

- [ ] **Step 6: 중복 버프·무효 상태 회피**

이미 `block`, `focus`, `marked`, `vulnerable`, `rooted`가 충분한 대상에게 같은 지원기를 반복 사용하지 않는다.

- [ ] **Step 7: 통과 확인**

Run: `npx vitest run tests/unit/CompanionTactics.test.js tests/unit/CompanionPatternData.test.js`

- [ ] **Step 8: 커밋**

```bash
git add js/data/companionTactics.js js/systems/combat/CompanionTactics.js js/data/validate.js tests/unit/CompanionTactics.test.js
git commit -m "feat(combat): plan companion turns from real loadouts"
```

---

## Task 8: 동료 빠른 자세와 수동 스킬을 단일 실행 파이프라인으로 통합

**Files:**

- Modify: `js/systems/combat/CombatAiTurns.js`
- Modify: `js/systems/CombatSystem.js`
- Modify: `js/ui/CombatUI.js`
- Modify: `js/data/gameBalance.js`
- Modify: `tests/unit/CombatSystem_companionStance.test.js`
- Modify: `tests/integration/CombatPhase2_stance.int.test.js`
- Create: `tests/integration/CombatCompanionTactics.int.test.js`

**Interfaces:**

- Consumes: `planCompanionTurn()`, `executeSkillCommand()`
- Produces: `_executePlannedCompanionAction(plan)`

- [ ] **Step 1: 공용 치료·레거시 클래스 스킬 제거 실패 테스트 작성**

`_companionAutoHeal()`, `_applyCompanionSkill()`, `BALANCE.combat.companionAuto.classSkills` 없이 실제 `combat.skillsById` 기술이 실행되는지 검사한다.

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/integration/CombatCompanionTactics.int.test.js`

- [ ] **Step 3: 계획 행동 실행 함수 구현**

```js
_executePlannedCompanionAction(plan) {
  return executeSkillCommand(this._commandContext(), {
    actorId: GameState.combat.activeCombatantId,
    skillId: plan.skillId,
    targetId: plan.targetId,
  });
}
```

- [ ] **Step 4: 자세의 의미를 명확히 결선**

- `manual`: 현재처럼 스킬 카드 선택을 기다림
- 나머지 자세: 동료 턴 도달 시 `planCompanionTurn()`으로 한 번 자동 실행
- UI의 빠른 명령 버튼: 자세를 영구 변경하지 않고 이번 턴 계획을 요청

- [ ] **Step 5: 레거시 상태 제거**

- `_suppressMult`, `_suppressRemaining`
- `_diagnoseResistBonus`, `_diagnoseRemaining`
- `companionAuto.classSkills`
- 공용 `healAmount`

같은 효과는 실제 토큰·상태 효과로 대체한다.

- [ ] **Step 6: 통과 확인**

Run: `npx vitest run tests/unit/CombatSystem_companionStance.test.js tests/integration/CombatPhase2_stance.int.test.js tests/integration/CombatCompanionTactics.int.test.js tests/integration/CombatManualParty.int.test.js`

- [ ] **Step 7: 커밋**

```bash
git add js/systems/combat/CombatAiTurns.js js/systems/CombatSystem.js js/ui/CombatUI.js js/data/gameBalance.js tests/unit/CombatSystem_companionStance.test.js tests/integration/CombatPhase2_stance.int.test.js tests/integration/CombatCompanionTactics.int.test.js
git commit -m "refactor(combat): run companion tactics through skill commands"
```

---

## Task 9: 동료 20종 기술 효과 개별화

**Files:**

- Modify: `js/data/combatSkills.js`
- Modify: `js/data/companionTactics.js`
- Modify: `js/data/locales.js`
- Modify: `js/systems/combat/CombatSkillSystem.js`
- Modify: `js/ui/CombatUI.js`
- Modify: `tests/unit/CompanionPatternData.test.js`
- Modify: `tests/unit/CombatSkillSystem.test.js`
- Create: `tests/unit/CompanionSkillIdentity.test.js`

**Interfaces:**

- Produces: 3절 평가표와 일치하는 60개 기술

- [ ] **Step 1: 획일적 효과를 잡는 실패 테스트 작성**

- `Object.keys(COMPANION_COMBAT_LOADOUTS)`가 20종이며 총 60개 기술
- 20종 모두 `COMPANION_TACTICS` 보유
- 60개 기술 모두 `tacticalRole`과 `motionKey` 보유
- `child_throw_debris` 최대 피해가 소총보다 낮음
- `deserter_covering_fire`에 `hesitation`
- `mechanic_field_repair`에 `heal` 없음
- `yeongcheol_rescue`에 `move`와 `guard`
- 음식/배급 기술에 `heal` 없음
- `sous_chef_intimidate`가 `hesitation` 사용
- `selfOnly` 기술은 자신 외 대상을 거부

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/unit/CompanionSkillIdentity.test.js`

- [ ] **Step 3: 개별 override를 효과까지 확장**

```js
const SKILL_OVERRIDES = {
  child_throw_debris: {
    damage: [3, 6],
    appendEffects: [{ type: 'token', token: 'hesitation', stacks: 1 }],
  },
  deserter_covering_fire: {
    damage: [5, 9],
    appendEffects: [{ type: 'token', token: 'hesitation', stacks: 1 }],
  },
  yeongcheol_rescue: {
    replaceEffects: [
      { type: 'move', distance: 1 },
      { type: 'guard', value: 0.35 },
    ],
  },
};
```

- [ ] **Step 4: 음식 계열 전투 효과 변경**

- `tower_cook_meal`: 스트레스 감소+`strength`
- `sous_chef_ration`: `strength`+`accuracy`

- [ ] **Step 5: 자기 전용 대상 계약 추가**

- `child_hide`
- `deserter_reposition`
- `student_quick_step`
- `sohee_focus`
- `security_taunt`
- `kitchen_helper_duck`

- [ ] **Step 6: 자기 전용 대상 검증과 UI 필터 구현**

`validateSkillCommand()`은 `skill.target.selfOnly === true && command.targetId !== command.actorId`이면 `invalid_target`을 반환한다. `CombatUI`는 해당 기술 선택 시 행동자만 선택 가능한 대상으로 표시한다.

- [ ] **Step 7: 한·영 설명을 실제 효과와 맞춤**

- [ ] **Step 8: 통과 확인**

Run: `node --input-type=module js/data/validate.js`

Run: `npx vitest run tests/unit/CompanionSkillIdentity.test.js tests/unit/CompanionPatternData.test.js tests/unit/CombatSkillSystem.test.js`

- [ ] **Step 9: 커밋**

```bash
git add js/data/combatSkills.js js/data/companionTactics.js js/data/locales.js js/systems/combat/CombatSkillSystem.js js/ui/CombatUI.js tests/unit/CompanionPatternData.test.js tests/unit/CombatSkillSystem.test.js tests/unit/CompanionSkillIdentity.test.js
git commit -m "feat(combat): individualize twenty companion kits"
```

---

## Task 10: 패턴·모션·밸런스 통합 검증

**Files:**

- Create: `tools/simulate_companion_monster_patterns.mjs`
- Create: `docs/analysis/COMPANION_MONSTER_PATTERN_QA.md`
- Modify: `tests/e2e/combat-full.playwright.mjs`

**Interfaces:**

- Consumes: 최종 동료 전술 프로필, 일반 몬스터 패턴, `motionKey`
- Produces: 20종×12종 시뮬레이션 보고서와 E2E 검증

- [ ] **Step 1: 결정적 시뮬레이터 작성**

각 동료를 대표 몬스터 조합과 500회씩 전투시켜 다음을 기록한다.

- 실제 사용한 세 기술의 분포
- 무효 대상·무효 위치 선택 횟수
- 같은 지원기 낭비 사용 횟수
- 치료 미보유 동료의 치유 횟수
- 표시된 적 행동과 실제 행동 불일치
- 동료 대상 시 소실된 타격·상태이상 횟수

- [ ] **Step 2: 허용 기준 고정**

- 의도/실행 행동 ID 불일치 0
- 의도/실행 대상 불일치 0
- 치료 미보유 동료의 치유 0
- 무효 기술 선택 0
- 동료 대상 연속공격 타격 소실 0
- 데이터에만 있고 실행되지 않는 카운터 0
- 모든 실행 행동에 유효한 `motionKey`

- [ ] **Step 3: E2E 대표 조합 추가**

- 간호사 대 산성 좀비: 치료·출혈 제거와 포식자 타겟
- 탈영병 대 정예 약탈자: 엄호 사격·정조준 취소
- 아이 대 광견: 자기 숨기와 낮은 피해
- 소방관 대 차저: 구조 이동·돌진 대상 밀치기
- 정비사 대 블로터: 와이어 지연과 방호물
- 개 대 호드: 보호·다중 대상 의도

- [ ] **Step 4: 핵심 테스트 실행**

Run: `npx vitest run tests/unit/CompanionPatternData.test.js tests/unit/NormalEnemyPatternData.test.js tests/unit/EnemyActionPlanner.test.js tests/unit/EnemyActionExecutor.test.js tests/unit/CompanionTactics.test.js tests/unit/CompanionSkillIdentity.test.js tests/integration/CombatNormalEnemyIntent.int.test.js tests/integration/CombatTimedThreatCounters.int.test.js tests/integration/CombatCompanionTactics.int.test.js`

Expected: 전부 통과.

- [ ] **Step 5: 전체 테스트와 빌드**

Run: `npm test`

Run: `npm run build:web`

Expected: 전체 테스트와 Vite production build 성공.

- [ ] **Step 6: 시뮬레이션 보고서 생성**

Run: `node tools/simulate_companion_monster_patterns.mjs --runs 500 --out docs/analysis/COMPANION_MONSTER_PATTERN_QA.md`

- [ ] **Step 7: 전투 E2E**

Run: `npm run test:e2e:combat:full`

- [ ] **Step 8: 커밋**

```bash
git add tools/simulate_companion_monster_patterns.mjs docs/analysis/COMPANION_MONSTER_PATTERN_QA.md tests/e2e/combat-full.playwright.mjs
git commit -m "test(combat): verify companion and monster pattern identity"
```
