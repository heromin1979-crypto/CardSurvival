# 전체 전투 모션 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 일반 몬스터 12종, 네임드 보스 21종, 플레이어 6종, 전투 동료 20종의 행동 의미와 스프라이트 모션을 일치시키고, 초록색 크로마 픽셀·잘못된 전진·피격/사망 행 혼용·전용 시트 누락을 제거한다.

**Architecture:** 런타임은 동기식 `combatMotionManifest.js`를 단일 기준으로 사용하고, 자산 도구용 `manifest.json`은 동일 데이터에서 생성한다. 스킬과 적 행동은 `motionKey`를 FX 큐에 전달하며, `CombatFxPlayer`는 모션 행 선택과 화면 이동을 분리한다. 자산 제작은 원본 생성물 → 정규화/크로마 제거 → 자동 검사 → 모션 프리뷰 → 게임 내 검수의 승격 파이프라인으로 운영한다.

**Tech Stack:** Vanilla JavaScript ES modules, CSS custom properties/keyframes, Vitest, Node.js, Python/Pillow 기반 기존 자산 도구, Playwright 전투 E2E

## Global Constraints

- `DESIGN.md`와 `css/variables.css`의 다크 생존물 톤, 색상, 크기 토큰을 유지한다.
- 한 셀은 256×256px, 열은 6프레임을 기본으로 유지한다.
- 행 수는 시트별 매니페스트로 결정하며 4행 고정 가정을 제거한다.
- 같은 이미지 행을 공격·치료·피격·사망처럼 의미가 다른 행동에 공유하지 않는다.
- 원거리·치료·버프·소환·함정 설치는 기본적으로 제자리 모션이다.
- 접근 이동은 모션 메타데이터가 `locomotion: 'approach'`인 행동에만 적용한다.
- 기존 이미지 파일을 직접 덮기 전에 `_src.png` 또는 생성 출력물을 보존하고, 표시용 파일만 정규화 파이프라인으로 승격한다.
- 완전 투명 픽셀의 RGB도 0으로 정리하고, 반투명 가장자리의 녹색 번짐까지 검사한다.
- 캐릭터 정체성이 다른 NPC끼리 전용 시트를 공유하지 않는다. 같은 인물임이 데이터에서 확인된 경우에만 명시적 별칭을 허용한다.
- 보스 21종의 행 계약은 최신 전투 패턴과 일치하는 승인된 8행 구조를 사용한다. 기본공격과 일반공격은 같은 개념이며 별도 `normal_*` 행을 만들지 않는다.
- `loop: true`는 `idle`에만 허용한다. 공격·지원·피격·충전·사망 같은 비-idle 행동은 유한 재생 후 idle 또는 hold-last 상태로 복귀한다.

---

## 권장 통합 실행 순서

두 계획은 다음 순서로 실행한다.

1. `2026-07-27-companion-monster-pattern-overhaul.md` Task 1~6으로 공용 적 행동 계약과 일반 몬스터 패턴 확정
2. 같은 문서 Task 7~9로 동료 전술 선택과 20종 기술 효과 확정
3. `2026-07-27-named-boss-pattern-overhaul.md` Task 1~9로 공용 행동 계약을 확장한 보스 패턴 확정
4. 이 문서 Task 1~6으로 공용 모션 레지스트리·FX·자산 품질 게이트 구축
5. 이 문서 Task 7~10으로 일반 몬스터·플레이어·동료·보스 자산을 순차 승격
6. 세 계획의 마지막 검증 Task로 시뮬레이션·E2E·최종 QA 완료

자산부터 교체하지 않고 런타임 계약과 검사기를 먼저 적용해야 잘못된 행 매핑이나 녹색 번짐이 새 시트 전체에 반복되지 않는다.

---

## 1. 실제 파일 기반 모션 감사 결과

### 1.1 현재 자산 커버리지

| 그룹 | 전투 데이터 수 | 전용 시트 매핑 | 누락 |
|---|---:|---:|---:|
| 일반 몬스터 | 12 | 12 | 0 |
| 네임드 보스 | 21 | 7 | 14 |
| 플레이어 직업/성별 조합 | 6 | 1 (`doctor:F`) | 5 |
| 전투 로드아웃 동료 | 20 | 2 (`npc_nurse`, `npc_soldier_deserter`) | 18 |

현재 표시용 시트 22개는 모두 1536×1024, 6×4 구조다. `assets/images/combat/spritesheets/manifest.json`은 없지만 `combatUiAssets.js`는 선택적으로 해당 파일을 fetch한다.

### 1.2 구조적 어색함

- `CombatFxPlayer._playFx()`는 플레이어·동료·적 공격에 `motion-move-forward`를 일괄 추가한다. 총격, 산성액, 포효도 앞으로 미끄러진다.
- 적의 lunge/heavy/spit/advance/scream은 CSS에서 모두 2번째 행을 사용한다.
- 플레이어·동료의 모든 공격은 2번째 행, 치료·버프·승리는 3번째 행, 피격·밀치기·다운·사망·패배는 4번째 행을 공유한다.
- `nurse_companion_sheet.png`의 첫 공격 행은 치료/무릎 동작에 가깝고, 실제 `nurse_scalpel` 공격과 맞지 않는다.
- `CombatFxPlayer`의 `soldier_suppress` 조건은 실제 스킬 ID `soldier_suppressive_fire`와 다르다.
- `CombatFxPlayer._playFx()`에 `case 'status'`가 두 번 있어 뒤쪽 분기는 도달할 수 없다.
- 일반 피격에도 사망 행이 재생되어 캐릭터가 매 타격마다 쓰러지는 인상을 준다.
- 자폭 좀비의 폭발 FX는 본체의 자폭 행을 명시적으로 재생하지 않는다.

---

## 2. 목표 모션 계약

### 2.1 보스 6×8 고정 계약

| 행 | 키 | 용도 |
|---:|---|---|
| 0 | `idle` | 대기 |
| 1 | `basic_a` | 첫 번째 기본공격 |
| 2 | `basic_b` | 두 번째 기본공격 |
| 3 | `special` | 소환·버프·특수공격 |
| 4 | `ultimate` | HP 30% 필살기 |
| 5 | `hit` | 피격 |
| 6 | `charge` | 예고·집중·필살기 준비 |
| 7 | `death` | 사망 |

### 2.2 플레이어·동료 6×8 기본 계약

| 행 | 키 | 용도 |
|---:|---|---|
| 0 | `idle` | 전투 대기 |
| 1 | `melee` | 근접 공격 |
| 2 | `ranged` | 총격·투척 |
| 3 | `support` | 치료·진단·격려·보급 |
| 4 | `guard` | 방어·엄호·바리케이드 |
| 5 | `move` | 전진·후퇴·회피 |
| 6 | `hit` | 피격·밀치기 |
| 7 | `death` | 다운·사망 |

사용하지 않는 행은 다른 의미의 그림으로 채우지 않는다. 해당 인물에게 없는 행동은 매니페스트에서 가장 가까운 의미의 행으로 명시적 별칭을 둔다. 승리는 `idle`의 비루프 마지막 프레임 정지와 별도 오버레이로 처리하여 사망/지원 행을 재사용하지 않는다.

### 2.3 일반 몬스터 가변 행 계약

일반 몬스터는 필요한 의미만 가진 5~7행 시트를 허용한다. 공통 필수 키는 `idle`, `basic_attack`, `hit`, `death`이며 기술이나 준비 행동이 있는 경우 `skill`, `telegraph`, `wake`, `ultimate` 같은 키를 추가한다.

---

## 3. 대상별 평가와 제작 명세

### 3.1 일반 몬스터 12종

| ID | 확인된 문제 | 목표 모션 키 | 구현 판정 |
|---|---|---|---|
| `zombie_patient_dormant` | 대기 행이 웅크림→기립을 반복해 매 루프마다 다시 깨어남 | `dormant`, `wake`, `basic_attack`, `hit`, `death` | 5행 재구성, 조우 시작에 `wake` 1회 |
| `zombie_common` | 기본 돌진은 자연스럽지만 공격·피격·사망 분리만 4행에 의존 | `idle`, `basic_attack`, `hit`, `death` | 기존 프레임 유지 가능, 매니페스트 등록 |
| `zombie_runner` | 기본공격과 `runner_rush`가 같은 행 | `idle`, `basic_attack`, `telegraph`, `runner_rush`, `hit`, `death` | 6행 확장 |
| `zombie_brute` | 기본 타격과 `slam`이 같은 강타 행 | `idle`, `basic_attack`, `telegraph`, `slam`, `hit`, `death` | 6행 확장 |
| `raider` | 총격하면서 전진 슬라이드 | `idle`, `basic_attack`, `reload`, `hit`, `death` | 제자리 사격, 5행 |
| `raider_elite` | 일반 사격과 `aimed_shot` 예고/발동이 같은 행 | `idle`, `basic_attack`, `aim`, `aimed_shot`, `hit`, `death` | 6행 확장 |
| `zombie_horde` | 군집 공격은 적합하나 행 의미가 암묵적 | `idle`, `basic_attack`, `hit`, `death` | 기존 프레임 유지 가능 |
| `rabid_dog` | 도약은 적합하나 공격 종류 확장 여지가 없음 | `idle`, `basic_attack`, `hit`, `death` | 기존 프레임 유지 가능 |
| `zombie_acid` | 산성액 원거리 공격에도 전진 이동 | `idle`, `basic_attack`, `acid_lash`, `hit`, `death` | 제자리 분사, 5행 |
| `zombie_bloater` | 기본공격·충전·자폭 의미가 같은 행에 섞이고 폭발 시 본체 행 미재생 | `idle`, `basic_attack`, `charge`, `self_destruct`, `hit`, `death` | 6행 확장, 폭발 전에 `self_destruct` 재생 |
| `zombie_screamer` | 일반공격과 소환 포효가 같은 행 | `idle`, `basic_attack`, `charge`, `summon_horde`, `hit`, `death` | 6행 확장 |
| `zombie_charger` | 돌진 준비 루프와 실제 충돌이 분리되지 않음 | `idle`, `basic_attack`, `charge`, `charge_strike`, `hit`, `death` | 6행 확장 |

### 3.2 플레이어 6종

| 캐릭터 | 현재 상태 | 스킬별 모션 |
|---|---|---|
| `doctor:F` | 유일한 전용 시트. 칼 공격·치료·피격이 있으나 4행이라 진단·방어·이동이 분리되지 않음 | `doctor_precise_cut→melee`, `doctor_triage→support`, `doctor_diagnose→support` |
| `soldier:M` | 전용 플레이어 시트 없음 | `soldier_burst_fire→ranged`, `soldier_suppressive_fire→ranged`, `soldier_tactical_shift→move` |
| `firefighter:M` | 전용 시트 없음 | `firefighter_axe_swing→melee`, `firefighter_rescue_guard→guard`, `firefighter_force_advance→move` |
| `homeless:M` | 전용 시트 없음 | `homeless_dirty_fighting→melee`, `homeless_slip_away→move`, `homeless_scavenge_weapon→support` |
| `chef:M` | 전용 시트 없음 | `chef_knife_flurry→melee`, `chef_field_ration→support`, `chef_hot_pan→melee` |
| `engineer:M` | 전용 시트 없음 | `engineer_wrench_strike→melee`, `engineer_improvised_cover→guard`, `engineer_shock_trap→support` |

### 3.3 전투 동료 20종

각 동료는 `COMPANION_COMBAT_LOADOUTS`의 실제 세 기술을 아래 모션으로 고정한다.

| 동료 ID | 공격 | 역할 행동 | 방어/이동 |
|---|---|---|---|
| `npc_old_survivor` | `old_survivor_cane_strike→melee` | `old_survivor_warning→support` | `old_survivor_hold_line→guard` |
| `npc_nurse` | `nurse_scalpel→melee` | `nurse_triage→support`, `nurse_encourage→support` | `guard` 공용 |
| `npc_soldier_deserter` | `deserter_rifle_shot→ranged`, `deserter_covering_fire→ranged` | 없음 | `deserter_reposition→move` |
| `npc_child` | `child_throw_debris→ranged` | `child_warning→support` | `child_hide→guard` |
| `npc_mechanic` | `mechanic_wrench→melee` | `mechanic_field_repair→support`, `mechanic_tripwire→support` | `guard` 공용 |
| `npc_student` | `student_improvised_strike→melee` | `student_first_aid→support` | `student_quick_step→move` |
| `npc_dog` | `dog_bite→melee` | `dog_track_weakness→support` | `dog_guard→guard` |
| `npc_former_colleague` | `colleague_hammer→melee` | `colleague_teamwork→support` | `colleague_brace→guard` |
| `npc_minjun` | `minjun_pistol→ranged` | `minjun_combat_medicine→support`, `minjun_command→support` | `guard` 공용 |
| `npc_sohee` | `sohee_precise_shot→ranged` | `sohee_focus→support` | `sohee_silent_cover→guard` |
| `npc_jisu` | `jisu_scalpel→melee` | `jisu_emergency_care→support`, `jisu_diagnose→support` | `guard` 공용 |
| `npc_yeongcheol` | `yeongcheol_axe→melee` | `yeongcheol_rally→support` | `yeongcheol_rescue→guard` |
| `npc_daehan` | `daehan_wrench→melee` | `daehan_overcharge→support` | `daehan_barricade→guard` |
| `npc_tower_security` | `security_baton→melee` | `security_taunt→support` | `security_guard→guard` |
| `npc_tower_merchant` | `merchant_hidden_blade→melee` | `merchant_supply→support`, `merchant_bargain→support` | `guard` 공용 |
| `npc_tower_cook` | `tower_cook_knife→melee`, `tower_cook_burn→melee` | `tower_cook_meal→support` | `guard` 공용 |
| `npc_tower_engineer` | `tower_engineer_wrench→melee` | `tower_engineer_trap→support` | `tower_engineer_cover→guard` |
| `npc_tower_doctor` | `tower_doctor_scalpel→melee` | `tower_doctor_triage→support`, `tower_doctor_stimulant→support` | `guard` 공용 |
| `npc_sous_chef` | `sous_chef_cleaver→melee` | `sous_chef_ration→support`, `sous_chef_intimidate→support` | `guard` 공용 |
| `npc_kitchen_helper` | `kitchen_helper_pan→melee` | `kitchen_helper_assist→support` | `kitchen_helper_duck→move` |

`npc_minjun`, `npc_jisu`, `npc_yeongcheol`, `npc_daehan`은 직업이 플레이어 직업과 유사하지만 `js/data/npcs.js`에서 별도 이름과 인물로 정의되므로 플레이어 시트를 재사용하지 않는다.

---

## Task 1: 동기식 모션 매니페스트와 데이터 검증 도입

**Files:**

- Create: `js/data/combatMotionManifest.js`
- Create: `tests/unit/CombatMotionManifest.test.js`
- Modify: `js/data/validate.js`
- Modify: `js/ui/combat/combatUiAssets.js`

- [ ] **Step 1: 현재 누락과 4행 고정을 드러내는 실패 테스트 작성**

검사 대상:

- 일반 몬스터 12종 전부 `ENEMY_SPRITE_KEYS`에 존재
- 보스 21종 전부 전용 `sheetKey` 존재
- 플레이어 6종 전부 `PLAYER_SPRITE_KEYS`에 존재
- 동료 20종 전부 `COMPANION_SPRITE_KEYS`에 존재
- 모든 매핑이 실제 매니페스트 키를 가리킴
- 모든 시트에 `idle`, `hit`, `death` 존재
- 모든 스킬의 `motionKey`가 해당 배우 시트에서 해석 가능

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/unit/CombatMotionManifest.test.js`

Expected: 플레이어 5종, 동료 18종, 보스 14종 전용 매핑 누락으로 실패.

- [ ] **Step 3: 동기식 레지스트리 구현**

```js
export const COMBAT_MOTION_MANIFEST = {
  zombie_common: {
    src: '/assets/images/combat/spritesheets/enemies/zombie_common_sheet.png',
    cols: 6,
    rows: 4,
    motions: {
      idle: { row: 0, loop: true, durationMs: 900, locomotion: 'stationary' },
      basic_attack: { row: 1, loop: false, durationMs: 720, locomotion: 'approach' },
      hit: { row: 2, loop: false, durationMs: 420, locomotion: 'stationary' },
      death: { row: 3, loop: false, durationMs: 900, locomotion: 'stationary', holdLast: true },
    },
  },
};

export function resolveCombatMotion(sheetKey, motionKey) {}
export function spriteRowPercent(row, rows) {}
```

`resolveCombatMotion`은 `aliases`를 최대 1회 해석하고 순환 별칭을 거부한다.

- [ ] **Step 4: 비동기 `_loadSpriteManifest()` 제거**

앱 시작 시 fetch 경합을 없애기 위해 `combatUiAssets.js`가 `COMBAT_MOTION_MANIFEST`를 동기 import하여 `COMBAT_SPRITE_SHEETS`를 생성하게 한다.

- [ ] **Step 5: 데이터 검증기에 행·별칭·파일 경로 검사 추가**

- [ ] **Step 6: 통과 확인**

Run: `npx vitest run tests/unit/CombatMotionManifest.test.js`

- [ ] **Step 7: 커밋**

```bash
git add js/data/combatMotionManifest.js js/data/validate.js js/ui/combat/combatUiAssets.js tests/unit/CombatMotionManifest.test.js
git commit -m "feat(combat): add synchronous motion manifest"
```

---

## Task 2: 스킬과 적 행동에 `motionKey` 계약 추가

**Files:**

- Modify: `js/data/combatSkills.js`
- Modify: `js/data/enemies.js`
- Modify: `js/data/secretEnemies.js`
- Create: `tests/unit/CombatSkillMotionMapping.test.js`

- [ ] **Step 1: 78개 캐릭터 스킬 매핑 실패 테스트 작성**

6명 플레이어 18개와 동료 20명 60개에서 중복 ID를 제거한 실제 `MAPPED_SKILL_IDS` 전부가 `motionKey`를 가져야 한다.

- [ ] **Step 2: `baseSkill()`에 `motionKey` 보존**

```js
motionKey: options.motionKey,
```

`buildMappedSkill()`의 광역 휴리스틱만으로 결정하지 않고 다음 우선순위를 사용한다.

1. `SKILL_MOTION_KEYS[id]`
2. 원거리 피해 → `ranged`
3. 근접 피해 → `melee`
4. 치유/버프/디버프 → `support`
5. 이동 → `move`
6. 방어 → `guard`

- [ ] **Step 3: 일반 몬스터 기술에 명시적 키 추가**

- `runner_rush`
- `slam`
- `aimed_shot`
- `acid_lash`
- `self_destruct`
- `summon_horde`
- `charge_strike`

- [ ] **Step 4: 보스 `motionKey` 검사는 보스 계획의 8행 계약과 연결**

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run tests/unit/CombatSkillMotionMapping.test.js tests/unit/BossPatternData.test.js`

- [ ] **Step 6: 커밋**

```bash
git add js/data/combatSkills.js js/data/enemies.js js/data/secretEnemies.js tests/unit/CombatSkillMotionMapping.test.js
git commit -m "feat(combat): map skills to semantic motion keys"
```

---

## Task 3: FX 페이로드의 배우·대상·모션 의미 보존

**Files:**

- Create: `js/systems/combat/CombatMotionFx.js`
- Create: `tests/unit/CombatMotionFx.test.js`
- Modify: `js/systems/combat/CombatRankedEffects.js`
- Modify: `js/systems/combat/CombatAiTurns.js`
- Modify: `js/systems/CombatSystem.js`

- [ ] **Step 1: 정규 FX 실패 테스트 작성**

```js
expect(createActionFx({
  actor: companion,
  target: enemy,
  skill,
  impactFx: 'slash',
})).toMatchObject({
  kind: 'action',
  actorId: companion.id,
  targetId: enemy.id,
  motionKey: skill.motionKey,
  impactFx: 'slash',
});
```

- [ ] **Step 2: 치유자가 아니라 피치유자가 행동하는 현재 오류를 재현**

동료가 플레이어를 치료할 때 `actorId`는 동료, `targetId`는 플레이어여야 한다.

- [ ] **Step 3: 실패 확인**

Run: `npx vitest run tests/unit/CombatMotionFx.test.js`

- [ ] **Step 4: `createActionFx()` 구현**

공통 필드:

- `kind: 'action'`
- `actorId`, `actorSide`, `actorIndex`
- `targetId`, `targetSide`, `targetIndex`
- `skillId` 또는 `actionId`
- `motionKey`
- `impactFx`
- `damage`, `healing`, `crit`, `miss`, `killed`

- [ ] **Step 5: 기존 FX 생성 지점 교체**

`playerAttack`, `companionAttack`, `companionHeal`, `companionBuff`, `companionSkill`, `enemyAttack`, `enemyAttackCompanion`, `explode`, `summon`을 정규 `action`으로 전환한다. 상태·카메라·부유 텍스트 같은 결과 FX는 유지한다.

- [ ] **Step 6: 레거시 FX 어댑터 추가**

저장된 `fxQueue`나 미전환 경로가 깨지지 않도록 UI 입구에서 기존 kind를 정규 형태로 변환한다.

- [ ] **Step 7: 통과 확인**

Run: `npx vitest run tests/unit/CombatMotionFx.test.js tests/integration/CombatPhase4_animations.int.test.js`

- [ ] **Step 8: 커밋**

```bash
git add js/systems/combat/CombatMotionFx.js js/systems/combat/CombatRankedEffects.js js/systems/combat/CombatAiTurns.js js/systems/CombatSystem.js tests/unit/CombatMotionFx.test.js
git commit -m "refactor(combat): normalize action motion fx payloads"
```

---

## Task 4: 행 재생과 화면 이동을 분리

**Files:**

- Modify: `js/ui/combat/CombatFxPlayer.js`
- Modify: `css/screens-combat.css`
- Create: `tests/unit/CombatFxMotionRouting.test.js`
- Modify: `tests/integration/CombatPhase4_animations.int.test.js`

- [ ] **Step 1: 원거리 제자리 재생 실패 테스트 작성**

총격, 산성액, 포효, 치료, 버프, 소환, 함정 설치에는 `motion-move-forward`가 없어야 한다.

- [ ] **Step 2: 근접 접근 테스트 작성**

`locomotion: 'approach'`인 `melee`, `basic_attack`, `slam`만 접근 이동을 받는다.

- [ ] **Step 3: 실패 확인**

Run: `npx vitest run tests/unit/CombatFxMotionRouting.test.js`

- [ ] **Step 4: 동적 행 재생 함수 구현**

```js
_playSpriteMotion(element, sheetKey, motionKey) {
  const motion = resolveCombatMotion(sheetKey, motionKey);
  element.style.setProperty('--sprite-row-y', `${spriteRowPercent(motion.row, motion.rows)}%`);
  element.style.setProperty('--sprite-duration', `${motion.durationMs}ms`);
  // 비루프는 종료 뒤 idle 또는 holdLast 규칙 적용
}
```

- [ ] **Step 5: CSS 중복 블록 제거**

1858 부근과 2115 부근의 플레이어/동료 행 매핑 중복을 하나로 합치고, 의미별 행 선택기는 제거한다. CSS는 `--sprite-row-y`와 이동/카메라 효과만 담당한다.

- [ ] **Step 6: 중복 `case 'status'` 제거**

- [ ] **Step 7: 통과 확인**

Run: `npx vitest run tests/unit/CombatFxMotionRouting.test.js tests/integration/CombatPhase4_animations.int.test.js tests/integration/CombatUIRankLineup.int.test.js`

- [ ] **Step 8: 커밋**

```bash
git add js/ui/combat/CombatFxPlayer.js css/screens-combat.css tests/unit/CombatFxMotionRouting.test.js tests/integration/CombatPhase4_animations.int.test.js
git commit -m "refactor(combat): separate sprite rows from locomotion"
```

---

## Task 5: 자산 매니페스트 생성과 가변 행 검사 도구 일반화

**Files:**

- Create: `tools/export_combat_motion_manifest.mjs`
- Create: `assets/images/combat/spritesheets/manifest.json`
- Modify: `tools/audit_combat_sprites.mjs`
- Modify: `tools/render_monster_motion_preview.py`
- Modify: `tools/normalize_combat_sprite_sheets.py`
- Modify: `tests/unit/CombatSpriteSheetAssets.test.js`

- [ ] **Step 1: 현재 4행 하드코딩을 드러내는 실패 테스트 작성**

테스트가 각 파일의 `cols`, `rows`, `motions`를 `combatMotionManifest.js`에서 읽고 실제 PNG 크기와 비교하도록 바꾼다.

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/unit/CombatSpriteSheetAssets.test.js`

- [ ] **Step 3: JSON 내보내기 도구 작성**

Run: `node tools/export_combat_motion_manifest.mjs`

Expected: 런타임 매니페스트와 동일한 `assets/images/combat/spritesheets/manifest.json` 생성.

- [ ] **Step 4: 감사·프리뷰·정규화 도구의 상수 제거**

`ROWS = 4`, `height = 1024` 대신 매니페스트를 읽는다. 프리뷰 라벨은 행 번호가 아니라 `motionKey`를 표시한다.

- [ ] **Step 5: 테스트에 JSON/JS 일치 검사 추가**

- [ ] **Step 6: 통과 확인**

Run: `node tools/export_combat_motion_manifest.mjs --check`

Expected: 차이 없음.

Run: `npx vitest run tests/unit/CombatSpriteSheetAssets.test.js`

- [ ] **Step 7: 커밋**

```bash
git add js/data/combatMotionManifest.js assets/images/combat/spritesheets/manifest.json tools/export_combat_motion_manifest.mjs tools/audit_combat_sprites.mjs tools/render_monster_motion_preview.py tools/normalize_combat_sprite_sheets.py tests/unit/CombatSpriteSheetAssets.test.js
git commit -m "build(assets): generalize combat sheet row contracts"
```

---

## Task 6: 초록색 픽셀·반투명 녹색 번짐 제거 파이프라인 강화

**Files:**

- Modify: `tools/normalize_combat_sprite_sheets.py`
- Modify: `tools/audit_combat_sprites.mjs`
- Create: `tests/fixtures/combat-sprites/chroma-fringe.png`
- Create: `tests/fixtures/combat-sprites/legitimate-green.png`
- Create: `tests/unit/CombatSpriteChromaCleanup.test.js`

- [ ] **Step 1: 크로마 가장자리 실패 테스트 작성**

검사 범위:

- 불투명 순녹색
- `alpha > 0`인 픽셀의 녹색 우세 halo
- `alpha === 0`인데 RGB가 남은 hidden color
- 캐릭터 내부의 의도된 저채도 녹색 장비는 보존

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/unit/CombatSpriteChromaCleanup.test.js`

- [ ] **Step 3: 정규화 단계를 분리 구현**

1. 배경과 연결된 고채도 녹색 flood-fill 제거
2. 제거 경계 1~2px의 green spill을 이웃 전경색으로 decontaminate
3. 완전 투명 픽셀 RGB를 `(0, 0, 0)`으로 정리
4. 작은 고립 녹색 점을 연결요소 크기 기준으로 제거
5. 내부 장비색은 배경 연결성·채도·색상각을 함께 사용해 보존

- [ ] **Step 4: CLI에 검사 모드 추가**

```text
python tools/normalize_combat_sprite_sheets.py --check-chroma <sheet>
```

출력은 파일별 `opaqueGreen`, `fringeGreen`, `hiddenRgb`, `removedComponents`를 JSON으로 제공한다.

- [ ] **Step 5: 회귀 테스트 통과**

Run: `npx vitest run tests/unit/CombatSpriteChromaCleanup.test.js tests/unit/CombatSpriteSheetAssets.test.js`

- [ ] **Step 6: 현재 표시용 시트 전체 점검**

Run: `node tools/audit_combat_sprites.mjs --check`

Expected: 초록 크로마 관련 실패 0.

- [ ] **Step 7: 커밋**

```bash
git add tools/normalize_combat_sprite_sheets.py tools/audit_combat_sprites.mjs tests/fixtures/combat-sprites tests/unit/CombatSpriteChromaCleanup.test.js
git commit -m "fix(assets): remove combat sprite chroma spill"
```

---

## Task 7: 일반 몬스터 12종 모션 재구성

**Files:**

- Modify: `js/data/combatMotionManifest.js`
- Modify: `assets/images/combat/spritesheets/enemies/*_sheet.png`
- Modify: `assets/images/combat/spritesheets/manifest.json`
- Create: `docs/analysis/NORMAL_ENEMY_MOTION_QA.md`
- Modify: `tests/unit/CombatSpriteSheetAssets.test.js`

- [ ] **Step 1: 12종 목표 키를 매니페스트에 입력**

3.1 표의 키를 정확히 사용하고, 기존 4행 유지 대상도 명시적 행 매핑을 둔다.

- [ ] **Step 2: `zombie_patient_dormant` 시작 연출 결선**

조우 시작 FX에 `wake`를 한 번 넣고 이후 idle은 웅크린 미세 호흡 또는 완전히 일어난 대기 중 데이터 의도에 맞는 한 상태로 고정한다. 한 루프 안에서 수면과 기립을 왕복하지 않는다.

- [ ] **Step 3: 예고/발동 분리 대상 제작**

- `zombie_runner`
- `zombie_brute`
- `raider_elite`
- `zombie_bloater`
- `zombie_screamer`
- `zombie_charger`

- [ ] **Step 4: 원거리 제자리 대상 제작**

- `raider`
- `raider_elite`
- `zombie_acid`
- `zombie_screamer`

- [ ] **Step 5: 자폭 시퀀스 검증**

`zombie_bloater`의 `self_destruct`가 본체 팽창/파열 행 → 폭발 오버레이 → 본체 제거 순서로 보이게 한다.

- [ ] **Step 6: 자동 품질 검사**

Run: `node tools/audit_combat_sprites.mjs --check`

Expected: 크기, 채움, 발 고정, 프레임 가장자리, 크로마 검사 통과.

- [ ] **Step 7: 12종 프리뷰 생성 및 수동 판정 기록**

Run: `python tools/render_monster_motion_preview.py --group normal --out output/combat/normal_enemy_motion_preview.png`

`docs/analysis/NORMAL_ENEMY_MOTION_QA.md`에 각 모션을 `통과/재작업`으로 기록하고 재작업 항목이 0일 때만 승격한다.

- [ ] **Step 8: 커밋**

```bash
git add js/data/combatMotionManifest.js assets/images/combat/spritesheets/enemies assets/images/combat/spritesheets/manifest.json docs/analysis/NORMAL_ENEMY_MOTION_QA.md tests/unit/CombatSpriteSheetAssets.test.js
git commit -m "feat(assets): rebuild normal enemy combat motions"
```

---

## Task 8: 플레이어 6종 전용 시트 제작과 결선

**Files:**

- Modify: `js/data/combatMotionManifest.js`
- Modify: `js/ui/combat/combatUiAssets.js`
- Modify: `assets/images/combat/spritesheets/doctor_f_sheet.png`
- Create: `assets/images/combat/spritesheets/soldier_m_sheet.png`
- Create: `assets/images/combat/spritesheets/firefighter_m_sheet.png`
- Create: `assets/images/combat/spritesheets/homeless_m_sheet.png`
- Create: `assets/images/combat/spritesheets/chef_m_sheet.png`
- Create: `assets/images/combat/spritesheets/engineer_m_sheet.png`
- Create: `docs/analysis/PLAYER_MOTION_QA.md`
- Modify: `tests/unit/CombatMotionManifest.test.js`

- [ ] **Step 1: 여섯 `characterId:gender` 매핑을 테스트에 고정**

```js
{
  'doctor:F': 'doctor_f',
  'soldier:M': 'soldier_m',
  'firefighter:M': 'firefighter_m',
  'homeless:M': 'homeless_m',
  'chef:M': 'chef_m',
  'engineer:M': 'engineer_m',
}
```

- [ ] **Step 2: 기존 초상화·컷아웃과 외형 기준 대조**

직업 장비, 성별, 주무기 실루엣을 현재 캐릭터 이미지와 일치시킨다. 다른 직업의 얼굴·복장을 복제하지 않는다.

- [ ] **Step 3: 6×8 시트 제작**

2.2의 행 계약을 따르고, 3.2의 실제 스킬이 해당 행을 사용하도록 매핑한다.

- [ ] **Step 4: `doctor_f` 재구성**

기존 칼질과 치료 프레임을 가능한 범위에서 재사용하되 피격과 사망, 치료와 진단, 이동을 분리한다.

- [ ] **Step 5: 자동 검사**

Run: `node tools/audit_combat_sprites.mjs --check`

- [ ] **Step 6: 전 직업 프리뷰와 게임 내 검수**

각 직업에서 세 고유 스킬, 공용 `guard`, `reposition`, 피격, 다운, 승리를 재생한다. `PLAYER_MOTION_QA.md`에 기술 ID별 판정을 기록한다.

- [ ] **Step 7: 통과 확인**

Run: `npx vitest run tests/unit/CombatMotionManifest.test.js tests/unit/CombatSpriteSheetAssets.test.js tests/integration/CombatFocusedUI.int.test.js`

- [ ] **Step 8: 커밋**

```bash
git add js/data/combatMotionManifest.js js/ui/combat/combatUiAssets.js assets/images/combat/spritesheets/doctor_f_sheet.png assets/images/combat/spritesheets/soldier_m_sheet.png assets/images/combat/spritesheets/firefighter_m_sheet.png assets/images/combat/spritesheets/homeless_m_sheet.png assets/images/combat/spritesheets/chef_m_sheet.png assets/images/combat/spritesheets/engineer_m_sheet.png docs/analysis/PLAYER_MOTION_QA.md
git commit -m "feat(assets): add six player combat motion sheets"
```

---

## Task 9: 동료 20종 전용 시트 제작과 결선

**Files:**

- Modify: `js/data/combatMotionManifest.js`
- Modify: `js/ui/combat/combatUiAssets.js`
- Modify: `assets/images/combat/spritesheets/nurse_companion_sheet.png`
- Modify: `assets/images/combat/spritesheets/soldier_companion_sheet.png`
- Create: `assets/images/combat/spritesheets/companions/*_sheet.png`
- Create: `docs/analysis/COMPANION_MOTION_QA.md`
- Modify: `tests/unit/CombatMotionManifest.test.js`

- [ ] **Step 1: 20개 로드아웃 ID 전용 매핑을 테스트로 고정**

`Object.keys(COMPANION_COMBAT_LOADOUTS)`와 `COMPANION_SPRITE_KEYS`의 전투 대상 키 집합이 같아야 한다.

- [ ] **Step 2: 기존 간호사 시트 의미 수정**

`nurse_scalpel`은 `melee`, `nurse_triage`와 `nurse_encourage`는 `support`로 분리한다. 현재 첫 행의 치료 같은 동작을 공격에 사용하지 않는다.

- [ ] **Step 3: 기존 탈영병 시트 확장**

소총 사격, 엄호 사격, 재배치를 `ranged`, `ranged`, `move`로 분리한다.

- [ ] **Step 4: 나머지 18종 6×8 제작**

3.3 표의 스킬별 키를 사용한다. `npc_dog`는 적 `rabid_dog`의 상처·감염 외형을 재사용하지 않고 아군 개의 외형을 유지한다.

- [ ] **Step 5: 자동 검사**

Run: `node tools/audit_combat_sprites.mjs --check`

- [ ] **Step 6: 전 동료 프리뷰와 게임 내 검수**

동료별 세 스킬, 피격, 다운을 재생하고 `COMPANION_MOTION_QA.md`에 60개 스킬 ID의 판정을 기록한다.

- [ ] **Step 7: 통과 확인**

Run: `npx vitest run tests/unit/CombatMotionManifest.test.js tests/unit/CombatSpriteSheetAssets.test.js tests/integration/CombatUIRankLineup.int.test.js`

- [ ] **Step 8: 커밋**

```bash
git add js/data/combatMotionManifest.js js/ui/combat/combatUiAssets.js assets/images/combat/spritesheets/nurse_companion_sheet.png assets/images/combat/spritesheets/soldier_companion_sheet.png assets/images/combat/spritesheets/companions docs/analysis/COMPANION_MOTION_QA.md
git commit -m "feat(assets): add dedicated companion combat motions"
```

---

## Task 10: 보스 21종 8행 시트 제작과 행동 키 결선

**Files:**

- Modify: `js/data/combatMotionManifest.js`
- Modify: `js/ui/combat/combatUiAssets.js`
- Modify: `assets/images/combat/spritesheets/enemies/boss_*_sheet.png`
- Modify: `assets/images/combat/spritesheets/enemies/food_warlord_sheet.png`
- Create: `docs/analysis/BOSS_MOTION_QA.md`
- Modify: `tests/unit/CombatMotionManifest.test.js`

- [ ] **Step 1: 보스 계획의 21종 `motionKey`와 8행 계약 일치 테스트**

각 보스의 `basicAttacks[0]`은 `basic_a`, `basicAttacks[1]`은 `basic_b`,
`specialSkill`은 `special`, `ultimate`은 `ultimate` 행으로 해석되어야 한다.
예고 중에는 `charge`, 피격은 `hit`, 사망은 `death`를 사용한다.

- [ ] **Step 2: 기존 전용 시트를 6×8로 확장**

`boss_feral_dog_alpha`는 현재 포효 행을 `special`로 이동하고, `basic_a`에는
직접 물기, `basic_b`에는 할퀴기/도약, `ultimate`에는 사냥 돌진,
`charge`에는 돌진 준비를 별도로 제작한다.

- [ ] **Step 3: 누락된 14종 전용 시트 제작**

타입별 `zombie_common`, `raider`, `rabid_dog` 폴백을 사용하지 않는다.

- [ ] **Step 4: 두 기본공격의 시각 차이 검증**

모든 보스는 데이터의 두 기본공격 차이와 대응하는 `basic_a`, `basic_b` 행을
각각 가진다. 빈 그림, 동일 프레임 복제, 다른 의미 행의 별칭으로 두 행을
채우지 않는다.

- [ ] **Step 5: 자동 검사와 21종 프리뷰**

Run: `node tools/audit_combat_sprites.mjs --check`

Run: `python tools/render_monster_motion_preview.py --group boss --out output/combat/boss_motion_preview.png`

- [ ] **Step 6: 기술별 수동 판정**

기본공격 A/B, 특수기, 필살기, 피격, 충전, 사망을 `BOSS_MOTION_QA.md`에 기록한다.

- [ ] **Step 7: 통과 확인**

Run: `npx vitest run tests/unit/BossPatternData.test.js tests/unit/CombatMotionManifest.test.js tests/unit/CombatSpriteSheetAssets.test.js tests/integration/CombatBossIntent.int.test.js`

- [ ] **Step 8: 커밋**

```bash
git add js/data/combatMotionManifest.js js/ui/combat/combatUiAssets.js assets/images/combat/spritesheets/enemies docs/analysis/BOSS_MOTION_QA.md
git commit -m "feat(assets): add semantic motion rows for named bosses"
```

---

## Task 11: 프레임 타이밍·피격·다운·승리 상태 정리

**Files:**

- Modify: `js/ui/combat/CombatFxPlayer.js`
- Modify: `js/ui/combat/combatUiAssets.js`
- Modify: `css/screens-combat.css`
- Create: `tests/integration/CombatMotionLifecycle.int.test.js`

- [ ] **Step 1: 비루프 종료 동작 실패 테스트**

- 공격 종료 후 `idle`
- 피격 종료 후 `idle`
- 사망은 마지막 프레임 유지
- 다운 상태는 `death` 행의 지정 프레임 유지
- 승리는 `idle` 행의 마지막 프레임과 승리 오버레이 유지
- 빠른 FX 모드에서도 타이머 정리

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/integration/CombatMotionLifecycle.int.test.js`

- [ ] **Step 3: 모션 타이머를 요소별로 관리**

같은 배우가 연속 행동할 때 이전 cleanup 타이머가 새 모션을 idle로 되돌리지 않도록 `WeakMap<Element, timer>`를 사용한다.

- [ ] **Step 4: `skipFxQueue()` 정리 강화**

큐 타이머뿐 아니라 진행 중인 모션 cleanup을 정리하고 현재 전투 상태에 맞는 idle/death 프레임으로 복구한다.

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run tests/integration/CombatMotionLifecycle.int.test.js tests/integration/CombatPhase4_animations.int.test.js`

- [ ] **Step 6: 커밋**

```bash
git add js/ui/combat/CombatFxPlayer.js js/ui/combat/combatUiAssets.js css/screens-combat.css tests/integration/CombatMotionLifecycle.int.test.js
git commit -m "fix(combat): stabilize sprite motion lifecycle"
```

---

## Task 12: 전체 전투 화면 E2E와 최종 품질 게이트

**Files:**

- Modify: `tests/e2e/combat-screen.playwright.mjs`
- Modify: `tests/e2e/combat-full.playwright.mjs`
- Create: `docs/analysis/COMBAT_MOTION_FINAL_QA.md`

- [ ] **Step 1: E2E 시나리오 추가**

- 원거리 플레이어 공격에 전진 없음
- 간호사 메스 공격과 치료가 다른 행
- 일반 피격과 사망이 다른 행
- `zombie_patient_dormant` wake 1회
- `zombie_bloater` 자폭 본체 모션
- `boss_feral_dog_alpha` 기본 물기 A·도약/할퀴기 B·포효·필살기가 모두 다른 행
- 모션 속도 2배와 건너뛰기 후 상태 복구

- [ ] **Step 2: 핵심 단위·통합 테스트**

Run: `npx vitest run tests/unit/CombatMotionManifest.test.js tests/unit/CombatSkillMotionMapping.test.js tests/unit/CombatMotionFx.test.js tests/unit/CombatFxMotionRouting.test.js tests/unit/CombatSpriteChromaCleanup.test.js tests/unit/CombatSpriteSheetAssets.test.js tests/integration/CombatMotionLifecycle.int.test.js tests/integration/CombatPhase4_animations.int.test.js`

Expected: 전부 통과.

- [ ] **Step 3: 전체 프로젝트 테스트**

Run: `npm test`

Expected: 전체 통과.

- [ ] **Step 4: 웹 빌드**

Run: `npm run build:web`

Expected: Vite production build 성공.

- [ ] **Step 5: 전투 E2E**

Run: `npm run test:e2e:combat`

Run: `npm run test:e2e:combat:full`

Expected: 두 시나리오 모두 성공.

- [ ] **Step 6: 최종 자산 감사**

Run: `node tools/export_combat_motion_manifest.mjs --check`

Run: `node tools/audit_combat_sprites.mjs --check`

Expected:

- 런타임 JS와 JSON 매니페스트 차이 0
- 누락 시트 0
- 크기/행 오류 0
- 빈 프레임 0
- 가장자리 잘림 0
- 불투명 초록 픽셀 0
- 반투명 녹색 번짐 0

- [ ] **Step 7: 최종 QA 문서 작성**

`COMBAT_MOTION_FINAL_QA.md`에 59개 전투 대상과 실제 재생한 행동, 자동 검사 결과, 남은 폴백 수를 기록한다. 승인 기준은 “전용 시트 누락 0, 의미 없는 행 공유 0, 크로마 오류 0”이다.

- [ ] **Step 8: 커밋**

```bash
git add tests/e2e/combat-screen.playwright.mjs tests/e2e/combat-full.playwright.mjs docs/analysis/COMBAT_MOTION_FINAL_QA.md
git commit -m "test(combat): verify complete motion roster"
```
