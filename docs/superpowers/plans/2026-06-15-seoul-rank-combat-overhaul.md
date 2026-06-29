# Seoul Rank Combat Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 플레이어와 최대 2명의 동료를 직접 조작하는 4칸 진형 기반 턴제 전투와 B형 전장 집중 UI를 기존 생존 자원 및 전투 결과 흐름에 통합한다.

**Architecture:** `GameState.combat` 안에 플레이어, NPC, 적을 공통 전투원 형태로 정규화하고, 진형·initiative·스킬·상태·관계·적 AI를 작은 순수 모듈로 분리한다. `CombatSystem`은 전투 상태 전이와 기존 시스템 연결만 조정하며, `CombatUI`는 명령 API만 호출하고 상태를 직접 변경하지 않는다.

**Tech Stack:** JavaScript ES modules, Vitest 4, happy-dom, Vite, 기존 EventBus/StateMachine/GameState, CSS custom properties

---

## 구현 전 확인

- 설계 기준: `docs/superpowers/specs/2026-06-15-seoul-rank-combat-overhaul-design.md`
- 디자인 기준: `DESIGN.md`, `css/variables.css`
- 기존 전투 진입/종료: `js/systems/CombatSystem.js`, `js/screens/Combat.js`, `js/screens/CombatResult.js`
- 기존 전투 UI: `js/ui/CombatUI.js`, `css/screens-combat.css`
- 기존 전투 데이터: `js/data/enemies.js`, `js/data/items_combat.js`, `js/data/npcs.js`, `js/data/gameBalance.js`
- 구현 시작 시 현재 작업 트리의 사용자 변경사항을 다시 확인하고 이 계획과 무관한 파일은 수정하거나 되돌리지 않는다.

## 파일 구조

### 새 파일

- `js/data/combatSkills.js`: 캐릭터 고유 스킬, 공통 이동/방어/도주 스킬 정의
- `js/systems/combat/CombatantAdapter.js`: 원본 게임 상태와 공통 전투원 상태 변환
- `js/systems/combat/FormationSystem.js`: 양 진영 4칸 진형과 위치 검증
- `js/systems/combat/InitiativeSystem.js`: 라운드별 행동 순서 계산
- `js/systems/combat/CombatSkillSystem.js`: 로드아웃, 비용, 대상, 효과 해결
- `js/systems/combat/CombatStatusSystem.js`: 토큰, 지속 상태, 스트레스, 죽음의 문턱
- `js/systems/combat/RelationshipCombatSystem.js`: `bond` 기반 행동 전후 반응
- `js/systems/combat/EnemyCombatAdapter.js`: 기존 적 정의의 스킬/AI 호환
- `tests/unit/CombatantAdapter.test.js`
- `tests/unit/FormationSystem.test.js`
- `tests/unit/InitiativeSystem.test.js`
- `tests/unit/CombatSkillSystem.test.js`
- `tests/unit/CombatStatusSystem.test.js`
- `tests/unit/RelationshipCombatSystem.test.js`
- `tests/unit/EnemyCombatAdapter.test.js`
- `tests/integration/CombatManualParty.int.test.js`
- `tests/integration/CombatFocusedUI.int.test.js`

### 수정 파일

- `js/systems/CombatSystem.js`: 새 전투 상태와 턴 명령 API 연결
- `js/systems/CombatActions.js`: 기존 행동의 호환 래퍼 정리
- `js/ui/CombatUI.js`: B 전장 집중형 렌더와 입력 흐름
- `css/screens-combat.css`: 중앙 전장 중심 레이아웃과 반응형 스타일
- `js/data/gameBalance.js`: initiative, 스트레스, 죽음 저항, 관계 반응 설정값
- `js/data/enemies.js`: 주요 적의 선택적 `combatProfile`
- `js/data/locales.js`: 새 전투 UI와 스킬 한/영 문자열
- `js/data/validate.js`: 스킬과 적 전투 프로필 데이터 검증
- 기존 `tests/unit/CombatSystem_*.test.js`, `tests/integration/CombatPhase*.int.test.js`: 새 계약으로 전환

---

### Task 1: 공통 전투원 어댑터

**Files:**
- Create: `js/systems/combat/CombatantAdapter.js`
- Create: `tests/unit/CombatantAdapter.test.js`
- Modify: `js/data/gameBalance.js`

- [ ] **Step 1: 플레이어, 동료, 적 정규화 실패 테스트 작성**

```js
import { describe, it, expect } from 'vitest';
import { buildCombatants, syncCombatantsToGameState } from '../../js/systems/combat/CombatantAdapter.js';

describe('CombatantAdapter', () => {
  it('플레이어와 최대 2명의 생존 동료를 ally 전투원으로 만든다', () => {
    const gs = {
      player: { hp: { current: 80, max: 100 }, characterId: 'doctor' },
      stats: { stress: { current: 3, max: 10 } },
      companions: ['npc_nurse', 'npc_soldier', 'npc_extra'],
      npcs: { states: {
        npc_nurse: { hp: 40, maxHp: 50, isCompanion: true, bond: 70 },
        npc_soldier: { hp: 0, maxHp: 60, isCompanion: true, bond: 40 },
        npc_extra: { hp: 45, maxHp: 45, isCompanion: true, bond: 20 },
      }},
    };
    const result = buildCombatants(gs, [{ id: 'zombie', currentHp: 30, maxHp: 30 }]);
    expect(Object.keys(result).filter(id => result[id].side === 'ally')).toEqual([
      'player', 'npc_nurse', 'npc_extra',
    ]);
    expect(result.npc_nurse.sourceType).toBe('companion');
    expect(result['enemy:0'].sourceId).toBe('zombie');
  });

  it('동료 HP와 플레이어 HP를 원본 상태로 동기화한다', () => {
    const gs = {
      player: { hp: { current: 80, max: 100 } },
      npcs: { states: { npc_nurse: { hp: 40, maxHp: 50 } } },
    };
    syncCombatantsToGameState(gs, {
      player: { sourceType: 'player', hp: 25, dead: false },
      npc_nurse: { sourceType: 'companion', sourceId: 'npc_nurse', hp: 12, dead: false },
    });
    expect(gs.player.hp.current).toBe(25);
    expect(gs.npcs.states.npc_nurse.hp).toBe(12);
  });
});
```

- [ ] **Step 2: 테스트가 모듈 부재로 실패하는지 확인**

Run: `npx vitest run tests/unit/CombatantAdapter.test.js`

Expected: FAIL with `Failed to load url ... CombatantAdapter.js`

- [ ] **Step 3: 공통 전투원 생성과 원본 동기화 구현**

```js
import BALANCE from '../../data/gameBalance.js';

export function buildCombatants(gs, enemies = []) {
  const combatants = {};
  combatants.player = {
    id: 'player',
    side: 'ally',
    sourceType: 'player',
    sourceId: 'player',
    hp: gs.player.hp.current,
    maxHp: gs.player.hp.max,
    speed: BALANCE.combat.defaultPlayerSpeed,
    stress: gs.stats?.stress?.current ?? 0,
    tokens: {},
    statusEffects: [],
    deathsDoor: false,
    deathResist: BALANCE.combat.deathsDoor.baseResist,
    itemUsedThisTurn: false,
    dead: false,
  };

  const companionIds = (gs.companions ?? [])
    .filter(id => {
      const state = gs.npcs?.states?.[id];
      return state?.isCompanion && (state.hp ?? 0) > 0;
    })
    .slice(0, 2);

  for (const id of companionIds) {
    const state = gs.npcs.states[id];
    combatants[id] = {
      id,
      side: 'ally',
      sourceType: 'companion',
      sourceId: id,
      hp: state.hp,
      maxHp: state.maxHp ?? 50,
      speed: state.combatSpeed ?? BALANCE.combat.defaultCompanionSpeed,
      stress: state.combatStress ?? 0,
      bond: state.bond ?? 0,
      tokens: {},
      statusEffects: [...(state.statusEffects ?? [])],
      deathsDoor: false,
      deathResist: BALANCE.combat.deathsDoor.baseResist,
      itemUsedThisTurn: false,
      dead: false,
    };
  }

  enemies.forEach((enemy, index) => {
    const id = `enemy:${index}`;
    combatants[id] = {
      id,
      side: 'enemy',
      sourceType: 'enemy',
      sourceId: enemy.id ?? enemy.definitionId,
      enemyIndex: index,
      hp: enemy.currentHp,
      maxHp: enemy.maxHp,
      speed: enemy.speed ?? BALANCE.combat.defaultEnemySpeed,
      tokens: {},
      statusEffects: [...(enemy._statusEffects ?? [])],
      dead: enemy.currentHp <= 0,
    };
  });
  return combatants;
}

export function syncCombatantsToGameState(gs, combatants) {
  for (const combatant of Object.values(combatants ?? {})) {
    if (combatant.sourceType === 'player') {
      gs.player.hp.current = Math.max(0, combatant.hp);
    } else if (combatant.sourceType === 'companion') {
      const state = gs.npcs?.states?.[combatant.sourceId];
      if (!state) continue;
      state.hp = Math.max(0, combatant.hp);
      state.statusEffects = [...(combatant.statusEffects ?? [])];
      state.combatStress = combatant.stress ?? 0;
      if (combatant.dead) state.isDead = true;
    }
  }
}
```

`BALANCE.combat`에 다음 값을 추가한다.

```js
defaultPlayerSpeed: 5,
defaultCompanionSpeed: 5,
defaultEnemySpeed: 4,
deathsDoor: {
  baseResist: 0.75,
  resistLossPerCheck: 0.10,
  minimumResist: 0.05,
},
```

- [ ] **Step 4: 어댑터 테스트 통과 확인**

Run: `npx vitest run tests/unit/CombatantAdapter.test.js`

Expected: PASS

- [ ] **Step 5: 작업 커밋**

```powershell
git add js/systems/combat/CombatantAdapter.js js/data/gameBalance.js tests/unit/CombatantAdapter.test.js
git commit -m "feat: add normalized combatant adapter"
```

---

### Task 2: 4칸 진형과 빈칸 유지

**Files:**
- Create: `js/systems/combat/FormationSystem.js`
- Create: `tests/unit/FormationSystem.test.js`
- Modify: `tests/unit/CombatSystem_ranks.test.js`

- [ ] **Step 1: 초기 배치, 이동, 위치 검증 실패 테스트 작성**

```js
import { describe, it, expect } from 'vitest';
import {
  createFormations, getRank, moveCombatant, validateSkillPosition,
} from '../../js/systems/combat/FormationSystem.js';

describe('FormationSystem', () => {
  it('아군은 전열부터 배치하고 적의 legacy row를 4칸으로 변환한다', () => {
    const formations = createFormations(
      ['player', 'npc_nurse', 'npc_soldier'],
      [
        { combatantId: 'enemy:0', row: 'front' },
        { combatantId: 'enemy:1', row: 'back' },
      ],
    );
    expect(formations.ally).toEqual([null, 'npc_soldier', 'npc_nurse', 'player']);
    expect(formations.enemy).toEqual(['enemy:0', null, 'enemy:1', null]);
    expect(getRank(formations, 'player')).toBe(1);
  });

  it('이동 후 생긴 빈칸을 자동 압축하지 않는다', () => {
    const formations = { ally: [null, 'npc_soldier', 'npc_nurse', 'player'], enemy: [null, null, null, null] };
    expect(moveCombatant(formations, 'npc_nurse', 4)).toBe(true);
    expect(formations.ally).toEqual(['npc_nurse', 'npc_soldier', null, 'player']);
  });

  it('사용 위치와 대상 위치가 모두 맞아야 한다', () => {
    const formations = { ally: [null, null, 'npc_nurse', 'player'], enemy: ['enemy:0', null, null, null] };
    expect(validateSkillPosition(formations, 'player', 'enemy:0', {
      usableFrom: [1, 2],
      target: { side: 'enemy', ranks: [1] },
    })).toEqual({ ok: true });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/unit/FormationSystem.test.js`

Expected: FAIL because `FormationSystem.js` does not exist

- [ ] **Step 3: 진형 순수 함수 구현**

```js
export function createFormations(allyIds, enemies) {
  const ally = [null, null, null, null];
  allyIds.slice(0, 3).forEach((id, index) => { ally[3 - index] = id; });

  const enemy = [null, null, null, null];
  let frontIndex = 0;
  let backIndex = 2;
  for (const entry of enemies.slice(0, 4)) {
    const target = entry.row === 'back' ? backIndex++ : frontIndex++;
    if (target < 4) enemy[target] = entry.combatantId;
  }
  return { ally, enemy };
}

export function getRank(formations, combatantId) {
  for (const side of ['ally', 'enemy']) {
    const index = formations[side].indexOf(combatantId);
    if (index >= 0) return index + 1;
  }
  return null;
}

export function moveCombatant(formations, combatantId, destinationRank) {
  const side = formations.ally.includes(combatantId) ? 'ally'
    : formations.enemy.includes(combatantId) ? 'enemy' : null;
  const destination = destinationRank - 1;
  if (!side || destination < 0 || destination > 3 || formations[side][destination] !== null) return false;
  const origin = formations[side].indexOf(combatantId);
  formations[side][origin] = null;
  formations[side][destination] = combatantId;
  return true;
}

export function validateSkillPosition(formations, actorId, targetId, skill) {
  const actorRank = getRank(formations, actorId);
  const targetRank = getRank(formations, targetId);
  const targetSide = formations.ally.includes(targetId) ? 'ally' : 'enemy';
  if (!skill.usableFrom.includes(actorRank)) return { ok: false, reason: 'invalid_origin_rank' };
  if (skill.target.side !== targetSide) return { ok: false, reason: 'invalid_target_side' };
  if (!skill.target.ranks.includes(targetRank)) return { ok: false, reason: 'invalid_target_rank' };
  return { ok: true };
}
```

- [ ] **Step 4: 새 진형 테스트와 기존 rank 테스트 실행**

Run: `npx vitest run tests/unit/FormationSystem.test.js tests/unit/CombatSystem_ranks.test.js`

Expected: 새 테스트 PASS, 기존 2열 계약 테스트 FAIL

- [ ] **Step 5: 기존 rank 테스트를 호환 어댑터 검증으로 전환**

`tests/unit/CombatSystem_ranks.test.js`에서 `front/back` 직접 도달 테스트를 제거하고 다음 계약을 검증한다.

```js
it('legacy front/back 적 데이터가 4칸 진형으로 변환된다', () => {
  const formations = createFormations(['player'], [
    { combatantId: 'enemy:0', row: 'front' },
    { combatantId: 'enemy:1', row: 'back' },
  ]);
  expect(getRank(formations, 'enemy:0')).toBe(1);
  expect(getRank(formations, 'enemy:1')).toBe(3);
});
```

- [ ] **Step 6: 진형 테스트 전체 통과 확인**

Run: `npx vitest run tests/unit/FormationSystem.test.js tests/unit/CombatSystem_ranks.test.js`

Expected: PASS

- [ ] **Step 7: 작업 커밋**

```powershell
git add js/systems/combat/FormationSystem.js tests/unit/FormationSystem.test.js tests/unit/CombatSystem_ranks.test.js
git commit -m "feat: add four-rank combat formations"
```

---

### Task 3: 라운드별 initiative

**Files:**
- Create: `js/systems/combat/InitiativeSystem.js`
- Create: `tests/unit/InitiativeSystem.test.js`
- Modify: `js/data/gameBalance.js`
- Modify: `tests/unit/CombatSystem_turnQueue.test.js`
- Modify: `tests/integration/CombatPhase1_initiative.int.test.js`

- [ ] **Step 1: 속도, 난수, 동점, 행동 가능 상태 테스트 작성**

```js
import { describe, it, expect } from 'vitest';
import { buildInitiativeQueue, nextActionableIndex } from '../../js/systems/combat/InitiativeSystem.js';

describe('InitiativeSystem', () => {
  it('speed와 주입한 난수로 내림차순 정렬한다', () => {
    const combatants = {
      player: { id: 'player', speed: 5, dead: false },
      'enemy:0': { id: 'enemy:0', speed: 6, dead: false },
      npc_nurse: { id: 'npc_nurse', speed: 4, dead: false },
    };
    const rolls = [0.2, 0.8, 0.5];
    const queue = buildInitiativeQueue(combatants, () => rolls.shift(), 3);
    expect(queue.map(entry => entry.combatantId)).toEqual(['enemy:0', 'player', 'npc_nurse']);
  });

  it('동점은 combatantId 오름차순으로 고정한다', () => {
    const combatants = {
      b: { id: 'b', speed: 5, dead: false },
      a: { id: 'a', speed: 5, dead: false },
    };
    expect(buildInitiativeQueue(combatants, () => 0, 3).map(x => x.combatantId)).toEqual(['a', 'b']);
  });

  it('사망과 기절 전투원을 건너뛴다', () => {
    const queue = [{ combatantId: 'a' }, { combatantId: 'b' }, { combatantId: 'c' }];
    const combatants = {
      a: { dead: false },
      b: { dead: true },
      c: { dead: false, statusEffects: [{ id: 'stun', effect: { skipTurn: true } }] },
    };
    expect(nextActionableIndex(queue, 0, combatants)).toBe(-1);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/unit/InitiativeSystem.test.js`

Expected: FAIL because module does not exist

- [ ] **Step 3: initiative 모듈 구현**

```js
export function buildInitiativeQueue(combatants, random = Math.random, rollMax = 3) {
  return Object.values(combatants)
    .filter(combatant => !combatant.dead)
    .map(combatant => ({
      combatantId: combatant.id,
      initiative: combatant.speed + Math.floor(random() * (rollMax + 1)),
    }))
    .sort((a, b) => b.initiative - a.initiative || a.combatantId.localeCompare(b.combatantId));
}

export function canAct(combatant) {
  if (!combatant || combatant.dead) return false;
  return !(combatant.statusEffects ?? []).some(status => status.effect?.skipTurn);
}

export function nextActionableIndex(queue, currentIndex, combatants) {
  for (let index = currentIndex + 1; index < queue.length; index++) {
    if (canAct(combatants[queue[index].combatantId])) return index;
  }
  return -1;
}
```

`BALANCE.combat.initiativeRollMax = 3`을 추가한다.

- [ ] **Step 4: 기존 턴 큐 테스트를 새 큐 계약으로 변경**

`tests/unit/CombatSystem_turnQueue.test.js`는 `_buildTurnQueue`, `_advanceTurn` 내부 함수 대신 `buildInitiativeQueue`, `nextActionableIndex`를 검증하도록 교체한다. `tests/integration/CombatPhase1_initiative.int.test.js`의 예상 entry도 `{ combatantId, initiative }`로 변경한다.

- [ ] **Step 5: initiative 관련 테스트 실행**

Run: `npx vitest run tests/unit/InitiativeSystem.test.js tests/unit/CombatSystem_turnQueue.test.js tests/integration/CombatPhase1_initiative.int.test.js`

Expected: PASS

- [ ] **Step 6: 작업 커밋**

```powershell
git add js/systems/combat/InitiativeSystem.js js/data/gameBalance.js tests/unit/InitiativeSystem.test.js tests/unit/CombatSystem_turnQueue.test.js tests/integration/CombatPhase1_initiative.int.test.js
git commit -m "feat: recalculate combat initiative each round"
```

---

### Task 4: 데이터 기반 스킬과 장비 로드아웃

**Files:**
- Create: `js/data/combatSkills.js`
- Create: `js/systems/combat/CombatSkillSystem.js`
- Create: `tests/unit/CombatSkillSystem.test.js`
- Modify: `js/data/characters.js`
- Modify: `js/data/npcs.js`
- Modify: `js/data/validate.js`

- [ ] **Step 1: 3개 고유 스킬과 2개 장비 스킬 로드아웃 테스트 작성**

```js
import { describe, it, expect } from 'vitest';
import {
  buildAllyLoadout, buildEquipmentSkill, validateSkillCommand,
} from '../../js/systems/combat/CombatSkillSystem.js';

describe('CombatSkillSystem loadout', () => {
  it('캐릭터 스킬 3개와 장비 스킬 최대 2개를 반환한다', () => {
    const gs = {
      player: { characterId: 'doctor', equipped: { weapon_main: 'knife_inst', weapon_sub: 'pistol_inst' } },
      cards: {
        knife_inst: { instanceId: 'knife_inst', definitionId: 'knife', durability: 80 },
        pistol_inst: { instanceId: 'pistol_inst', definitionId: 'pistol', durability: 90 },
      },
      getCardDef: id => ({
        knife_inst: { id: 'knife', icon: 'K', combat: { damage: [8, 14], accuracy: 0.8, durabilityLoss: 2 } },
        pistol_inst: { id: 'pistol', icon: 'P', combat: { damage: [20, 30], accuracy: 0.7, requiresAmmo: 'pistol_ammo' } },
      })[id],
    };
    const skills = buildAllyLoadout({ sourceType: 'player' }, gs);
    expect(skills).toHaveLength(5);
    expect(skills.slice(0, 3).every(skill => skill.source === 'character')).toBe(true);
    expect(skills.slice(3).every(skill => skill.source === 'equipment')).toBe(true);
  });

  it('legacy combat 필드를 장비 스킬로 변환한다', () => {
    const skill = buildEquipmentSkill('knife_inst', {
      id: 'knife',
      combat: { damage: [8, 14], accuracy: 0.8, durabilityLoss: 2, noiseOnUse: 1 },
    });
    expect(skill.effects[0]).toEqual({ type: 'damage', value: [8, 14] });
    expect(skill.costs.durability).toBe(2);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/unit/CombatSkillSystem.test.js`

Expected: FAIL because skill modules do not exist

- [ ] **Step 3: 최소 스킬 데이터 계약 작성**

`js/data/combatSkills.js`에 각 플레이어 직업과 직접 전투 가능한 NPC의 고유 스킬 3개를 선언한다. 첫 구현은 다음 효과 타입만 사용한다.

```js
export const COMBAT_SKILLS = {
  doctor_precise_cut: {
    id: 'doctor_precise_cut',
    nameKey: 'combatSkill.doctorPreciseCut',
    icon: 'SCALPEL',
    source: 'character',
    usableFrom: [1, 2],
    target: { side: 'enemy', ranks: [1, 2], count: 1 },
    costs: { stamina: 5 },
    accuracy: 0.9,
    effects: [{ type: 'damage', value: [8, 12] }],
  },
  doctor_triage: {
    id: 'doctor_triage',
    nameKey: 'combatSkill.doctorTriage',
    icon: 'MEDICAL',
    source: 'character',
    usableFrom: [2, 3, 4],
    target: { side: 'ally', ranks: [1, 2, 3, 4], count: 1 },
    costs: { stamina: 8 },
    accuracy: 1,
    effects: [{ type: 'heal', value: [10, 15] }],
  },
  doctor_diagnose: {
    id: 'doctor_diagnose',
    nameKey: 'combatSkill.doctorDiagnose',
    icon: 'SCAN',
    source: 'character',
    usableFrom: [2, 3, 4],
    target: { side: 'enemy', ranks: [1, 2, 3, 4], count: 1 },
    costs: { stamina: 6 },
    accuracy: 1,
    effects: [{ type: 'token', token: 'vulnerable', stacks: 1 }],
  },
};

export const CHARACTER_COMBAT_LOADOUTS = {
  doctor: ['doctor_precise_cut', 'doctor_triage', 'doctor_diagnose'],
  soldier: ['soldier_burst_fire', 'soldier_suppressive_fire', 'soldier_tactical_shift'],
  firefighter: ['firefighter_axe_swing', 'firefighter_rescue_guard', 'firefighter_force_advance'],
  homeless: ['homeless_dirty_fighting', 'homeless_slip_away', 'homeless_scavenge_weapon'],
  chef: ['chef_knife_flurry', 'chef_field_ration', 'chef_hot_pan'],
  engineer: ['engineer_wrench_strike', 'engineer_improvised_cover', 'engineer_shock_trap'],
};

export const COMPANION_COMBAT_LOADOUTS = {
  npc_old_survivor: ['old_survivor_cane_strike', 'old_survivor_warning', 'old_survivor_hold_line'],
  npc_nurse: ['nurse_scalpel', 'nurse_triage', 'nurse_encourage'],
  npc_soldier_deserter: ['deserter_rifle_shot', 'deserter_covering_fire', 'deserter_reposition'],
  npc_child: ['child_throw_debris', 'child_hide', 'child_warning'],
  npc_mechanic: ['mechanic_wrench', 'mechanic_field_repair', 'mechanic_tripwire'],
  npc_student: ['student_improvised_strike', 'student_first_aid', 'student_quick_step'],
  npc_dog: ['dog_bite', 'dog_guard', 'dog_track_weakness'],
  npc_former_colleague: ['colleague_hammer', 'colleague_brace', 'colleague_teamwork'],
  npc_minjun: ['minjun_pistol', 'minjun_combat_medicine', 'minjun_command'],
  npc_sohee: ['sohee_precise_shot', 'sohee_silent_cover', 'sohee_focus'],
  npc_jisu: ['jisu_scalpel', 'jisu_emergency_care', 'jisu_diagnose'],
  npc_yeongcheol: ['yeongcheol_axe', 'yeongcheol_rescue', 'yeongcheol_rally'],
  npc_daehan: ['daehan_wrench', 'daehan_barricade', 'daehan_overcharge'],
  npc_tower_security: ['security_baton', 'security_guard', 'security_taunt'],
  npc_tower_merchant: ['merchant_hidden_blade', 'merchant_supply', 'merchant_bargain'],
  npc_tower_cook: ['tower_cook_knife', 'tower_cook_meal', 'tower_cook_burn'],
  npc_tower_engineer: ['tower_engineer_wrench', 'tower_engineer_cover', 'tower_engineer_trap'],
  npc_tower_doctor: ['tower_doctor_scalpel', 'tower_doctor_triage', 'tower_doctor_stimulant'],
  npc_sous_chef: ['sous_chef_cleaver', 'sous_chef_ration', 'sous_chef_intimidate'],
  npc_kitchen_helper: ['kitchen_helper_pan', 'kitchen_helper_assist', 'kitchen_helper_duck'],
};
```

위 맵에서 참조하는 모든 스킬 ID를 `COMBAT_SKILLS`에 선언한다. 환자와 일시적 구조 대상처럼 `canRecruit: true`가 아닌 NPC는 전투 로드아웃 대상에서 제외한다. 오래된 세이브에서 맵에 없는 동료 ID가 들어온 경우에만 공통 `basic_strike`, `guard`, `reposition`을 사용한다.

- [ ] **Step 4: 로드아웃과 장비 스킬 어댑터 구현**

```js
import {
  COMBAT_SKILLS,
  CHARACTER_COMBAT_LOADOUTS,
  COMPANION_COMBAT_LOADOUTS,
} from '../../data/combatSkills.js';

export function buildEquipmentSkill(instanceId, definition) {
  const combat = definition?.combat;
  if (!combat) return null;
  return {
    id: `equipment:${instanceId}`,
    nameKey: null,
    fallbackName: definition.name ?? definition.id,
    icon: definition.icon ?? 'WEAPON',
    source: 'equipment',
    equipmentInstanceId: instanceId,
    usableFrom: combat.requiresAmmo ? [2, 3, 4] : [1, 2],
    target: { side: 'enemy', ranks: combat.requiresAmmo ? [1, 2, 3, 4] : [1, 2], count: definition.multiTarget ?? 1 },
    costs: {
      ammo: combat.requiresAmmo ?? null,
      durability: combat.durabilityLoss ?? 0,
      noise: combat.noiseOnUse ?? 0,
    },
    accuracy: combat.accuracy ?? 0.7,
    critChance: combat.critChance ?? 0,
    critMultiplier: combat.critMultiplier ?? 1.5,
    effects: [{ type: 'damage', value: combat.damage ?? [1, 2] }],
  };
}

export function buildAllyLoadout(combatant, gs) {
  const sourceId = combatant.sourceType === 'player'
    ? gs.player.characterId : combatant.sourceId;
  const mappedIds = combatant.sourceType === 'player'
    ? CHARACTER_COMBAT_LOADOUTS[sourceId]
    : COMPANION_COMBAT_LOADOUTS[sourceId];
  const characterIds = mappedIds ?? ['basic_strike', 'guard', 'reposition'];
  const characterSkills = characterIds.map(id => COMBAT_SKILLS[id]).filter(Boolean).slice(0, 3);
  const equippedIds = combatant.sourceType === 'player'
    ? [gs.player.equipped?.weapon_main, gs.player.equipped?.weapon_sub]
    : [gs.npcs?.states?.[combatant.sourceId]?.equippedWeapon, gs.npcs?.states?.[combatant.sourceId]?.equippedTool];
  const equipmentSkills = equippedIds
    .filter(Boolean)
    .map(id => buildEquipmentSkill(id, gs.getCardDef(id)))
    .filter(Boolean)
    .slice(0, 2);
  return [...characterSkills, ...equipmentSkills];
}
```

- [ ] **Step 5: 데이터 검증 추가**

`js/data/validate.js`에서 모든 스킬에 `id`, 길이 1 이상의 `usableFrom`, `target.side`, 길이 1 이상의 `target.ranks`, 알려진 `effects[].type`이 있는지 검사한다. 캐릭터/NPC 로드아웃은 정확히 3개의 존재하는 스킬 ID를 참조해야 한다.

- [ ] **Step 6: 스킬 테스트와 데이터 검증 실행**

Run: `npx vitest run tests/unit/CombatSkillSystem.test.js`

Run: `node js/data/validate.js`

Expected: PASS, data validation exits with code 0

- [ ] **Step 7: 작업 커밋**

```powershell
git add js/data/combatSkills.js js/systems/combat/CombatSkillSystem.js js/data/characters.js js/data/npcs.js js/data/validate.js tests/unit/CombatSkillSystem.test.js
git commit -m "feat: add data-driven combat skill loadouts"
```

---

### Task 5: 스킬 명령, 자원 소비, 무료 전투 아이템

**Files:**
- Modify: `js/systems/combat/CombatSkillSystem.js`
- Modify: `js/systems/CombatActions.js`
- Modify: `tests/unit/CombatSkillSystem.test.js`
- Create: `tests/integration/CombatManualParty.int.test.js`

- [ ] **Step 1: 검증 실패 시 무변경과 아이템 1회 제한 테스트 작성**

```js
function makeSkillContext({
  ammo = 1,
  durability = 80,
  noise = 10,
  medicalQuantity = 1,
} = {}) {
  const state = { ammo, durability, noise, medicalQuantity, hp: 20 };
  return {
    state,
    activeCombatantId: 'player',
    combatants: {
      player: { id: 'player', side: 'ally', hp: 20, maxHp: 30, dead: false, itemUsedThisTurn: false },
      'enemy:0': { id: 'enemy:0', side: 'enemy', hp: 30, maxHp: 30, dead: false },
    },
    skillsById: {
      'equipment:pistol_inst': {
        id: 'equipment:pistol_inst',
        equipmentInstanceId: 'pistol_inst',
        usableFrom: [1],
        target: { side: 'enemy', ranks: [1] },
        costs: { ammo: 'pistol_ammo', durability: 1, noise: 20 },
        accuracy: 1,
        effects: [{ type: 'damage', value: [10, 10] }],
      },
    },
    validatePosition: () => ({ ok: true }),
    getStamina: () => 100,
    getAmmo: () => state.ammo,
    getDurability: () => state.durability,
    consumeCosts: () => {
      state.ammo -= 1;
      state.durability -= 1;
      state.noise += 20;
    },
    applyEffect: () => {},
    consumeCombatItem: () => {
      if (state.medicalQuantity < 1) return { ok: false, reason: 'item_unavailable' };
      state.medicalQuantity -= 1;
      state.hp += 5;
      return { ok: true, effects: [{ type: 'heal', value: 5 }] };
    },
  };
}

it('탄약 부족 시 명령을 거부하고 내구도와 소음을 변경하지 않는다', () => {
  const context = makeSkillContext({ ammo: 0, durability: 80, noise: 10 });
  const result = executeSkillCommand(context, {
    actorId: 'player',
    skillId: 'equipment:pistol_inst',
    targetId: 'enemy:0',
  }, () => 0);
  expect(result).toEqual({ ok: false, reason: 'insufficient_ammo' });
  expect(context.state).toMatchObject({ ammo: 0, durability: 80, noise: 10 });
});

it('전투 아이템은 행동을 소비하지 않지만 차례당 한 번만 사용한다', () => {
  const context = makeSkillContext({ medicalQuantity: 2 });
  expect(useCombatItem(context, 'player', 'bandage_inst')).toMatchObject({ ok: true });
  expect(context.combatants.player.itemUsedThisTurn).toBe(true);
  expect(context.state.medicalQuantity).toBe(1);
  expect(useCombatItem(context, 'player', 'bandage_inst')).toEqual({
    ok: false, reason: 'item_already_used',
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/unit/CombatSkillSystem.test.js`

Expected: FAIL because execution functions are absent

- [ ] **Step 3: 명령 검증과 효과 해결 구현**

`CombatSkillSystem.js`에 다음 공개 API를 추가한다.

```js
export function validateSkillCommand(context, command) {
  const actor = context.combatants[command.actorId];
  const target = context.combatants[command.targetId];
  const skill = context.skillsById[command.skillId];
  if (!actor || actor.dead) return { ok: false, reason: 'invalid_actor' };
  if (context.activeCombatantId !== actor.id) return { ok: false, reason: 'not_active_actor' };
  if (!target || target.dead) return { ok: false, reason: 'invalid_target' };
  if (!skill) return { ok: false, reason: 'invalid_skill' };
  const position = context.validatePosition(actor.id, target.id, skill);
  if (!position.ok) return position;
  if (skill.costs?.stamina && context.getStamina(actor) < skill.costs.stamina) {
    return { ok: false, reason: 'insufficient_stamina' };
  }
  if (skill.costs?.ammo && context.getAmmo(skill.costs.ammo) < 1) {
    return { ok: false, reason: 'insufficient_ammo' };
  }
  if (skill.costs?.durability && context.getDurability(skill.equipmentInstanceId) < skill.costs.durability) {
    return { ok: false, reason: 'insufficient_durability' };
  }
  return { ok: true, actor, target, skill };
}

export function executeSkillCommand(context, command, random = Math.random) {
  const validation = validateSkillCommand(context, command);
  if (!validation.ok) return validation;
  const { actor, target, skill } = validation;
  context.consumeCosts(actor, skill);
  const hit = random() <= skill.accuracy;
  if (!hit) return { ok: true, hit: false, turnConsumed: true };
  for (const effect of skill.effects) context.applyEffect(effect, actor, target, random);
  return { ok: true, hit: true, turnConsumed: true };
}

export function useCombatItem(context, actorId, itemInstanceId) {
  const actor = context.combatants[actorId];
  if (!actor || actor.dead) return { ok: false, reason: 'invalid_actor' };
  if (context.activeCombatantId !== actorId) return { ok: false, reason: 'not_active_actor' };
  if (actor.itemUsedThisTurn) return { ok: false, reason: 'item_already_used' };
  const result = context.consumeCombatItem(itemInstanceId, actor);
  if (!result.ok) return result;
  actor.itemUsedThisTurn = true;
  return { ok: true, turnConsumed: false, effects: result.effects };
}
```

- [ ] **Step 4: 기존 `CombatActions.js`를 효과 어댑터로 연결**

`guardAction`, `throwableAction`, `applyMultiTarget`는 새 `applyEffect` 처리기에서 호출 가능한 호환 함수로 유지한다. `companionAttack`, `companionHeal`, `tickCompanionCooldowns`는 아직 삭제하지 않고 `@deprecated` JSDoc을 붙이며 새 UI 호출에서 제외한다.

- [ ] **Step 5: 직접 조작 통합 테스트 작성**

`tests/integration/CombatManualParty.int.test.js`에서 플레이어와 동료 2명의 큐를 만들고, 각 아군 ID로 스킬 명령이 성공하며 동료 턴이 자동 해결되지 않는지 검증한다.

- [ ] **Step 6: 관련 테스트 실행**

Run: `npx vitest run tests/unit/CombatSkillSystem.test.js tests/integration/CombatManualParty.int.test.js`

Expected: PASS

- [ ] **Step 7: 작업 커밋**

```powershell
git add js/systems/combat/CombatSkillSystem.js js/systems/CombatActions.js tests/unit/CombatSkillSystem.test.js tests/integration/CombatManualParty.int.test.js
git commit -m "feat: execute manual ally combat skills"
```

---

### Task 6: 토큰, 지속 상태, 스트레스, 죽음의 문턱

**Files:**
- Create: `js/systems/combat/CombatStatusSystem.js`
- Create: `tests/unit/CombatStatusSystem.test.js`
- Modify: `js/data/gameBalance.js`
- Modify: `js/data/locales.js`

- [ ] **Step 1: 핵심 상태 전이 실패 테스트 작성**

```js
import { describe, it, expect } from 'vitest';
import {
  addToken, consumeToken, applyDamage, healCombatant, addStress, tickStatusEffects,
} from '../../js/systems/combat/CombatStatusSystem.js';

describe('CombatStatusSystem', () => {
  it('방어 토큰을 1회 소비해 피해를 절반으로 줄인다', () => {
    const target = { hp: 30, maxHp: 30, tokens: { block: 1 }, dead: false };
    expect(applyDamage(target, 10, () => 0)).toMatchObject({ damage: 5 });
    expect(target.tokens.block).toBe(0);
    expect(target.hp).toBe(25);
  });

  it('아군 HP 0은 죽음의 문턱에 진입한다', () => {
    const target = { side: 'ally', hp: 8, maxHp: 30, tokens: {}, deathsDoor: false, deathResist: 0.75, dead: false };
    expect(applyDamage(target, 10, () => 0)).toMatchObject({ enteredDeathsDoor: true });
    expect(target.hp).toBe(0);
    expect(target.dead).toBe(false);
  });

  it('죽음의 문턱 추가 피격에서 저항 실패 시 사망한다', () => {
    const target = { side: 'ally', hp: 0, maxHp: 30, tokens: {}, deathsDoor: true, deathResist: 0.75, dead: false };
    expect(applyDamage(target, 2, () => 0.99)).toMatchObject({ died: true });
    expect(target.dead).toBe(true);
  });

  it('스트레스 10에서 낮은 주사위는 각성, 높은 주사위는 붕괴를 만든다', () => {
    const resolveTarget = { stress: 9, hp: 30, maxHp: 30, tokens: {} };
    expect(addStress(resolveTarget, 1, () => 0.01)).toMatchObject({ event: 'resolve' });
    const meltdownTarget = { stress: 9, hp: 30, maxHp: 30, tokens: {} };
    expect(addStress(meltdownTarget, 1, () => 0.99)).toMatchObject({ event: 'meltdown' });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/unit/CombatStatusSystem.test.js`

Expected: FAIL because module does not exist

- [ ] **Step 3: 상태 시스템 구현**

```js
import BALANCE from '../../data/gameBalance.js';

export function addToken(target, tokenId, stacks = 1) {
  target.tokens ??= {};
  target.tokens[tokenId] = Math.max(0, (target.tokens[tokenId] ?? 0) + stacks);
}

export function consumeToken(target, tokenId, stacks = 1) {
  const available = target.tokens?.[tokenId] ?? 0;
  const consumed = Math.min(available, stacks);
  if (target.tokens) target.tokens[tokenId] = available - consumed;
  return consumed;
}

export function applyDamage(target, rawDamage, random = Math.random) {
  let damage = rawDamage;
  if (consumeToken(target, 'block', 1)) damage = Math.ceil(damage * 0.5);
  if (target.side !== 'ally') {
    target.hp = Math.max(0, target.hp - damage);
    if (target.hp === 0) target.dead = true;
    return { damage, died: target.dead };
  }
  if (target.deathsDoor) {
    const survived = random() <= target.deathResist;
    target.deathResist = Math.max(
      BALANCE.combat.deathsDoor.minimumResist,
      target.deathResist - BALANCE.combat.deathsDoor.resistLossPerCheck,
    );
    if (!survived) target.dead = true;
    return { damage, resistedDeath: survived, died: target.dead };
  }
  target.hp = Math.max(0, target.hp - damage);
  if (target.hp === 0) {
    target.deathsDoor = true;
    return { damage, enteredDeathsDoor: true, died: false };
  }
  return { damage, died: false };
}

export function healCombatant(target, amount) {
  if (target.dead) return { healed: 0 };
  const before = target.hp;
  target.hp = Math.min(target.maxHp, Math.max(1, target.hp + amount));
  if (target.hp > 0) target.deathsDoor = false;
  return { healed: target.hp - before };
}

export function addStress(target, amount, random = Math.random) {
  target.stress = Math.min(10, Math.max(0, (target.stress ?? 0) + amount));
  if (target.stress < 10) return { event: null };
  const resolve = random() < BALANCE.combat.stress.resolveChance;
  target.stress = resolve
    ? BALANCE.combat.stress.afterResolve
    : BALANCE.combat.stress.afterMeltdown;
  addToken(target, resolve ? 'strength' : 'vulnerable', 1);
  return { event: resolve ? 'resolve' : 'meltdown' };
}

export function tickStatusEffects(target, random = Math.random) {
  const events = [];
  const remaining = [];
  for (const status of target.statusEffects ?? []) {
    const periodicDamage = status.effect?.hpLossPerRound
      ?? Math.max(0, -(status.effect?.hpPerRound ?? 0));
    if (periodicDamage > 0) {
      events.push({
        statusId: status.id,
        ...applyDamage(target, periodicDamage, random),
      });
    }
    const nextDuration = (status.duration ?? 1) - 1;
    if (nextDuration > 0) remaining.push({ ...status, duration: nextDuration });
  }
  target.statusEffects = remaining;
  return events;
}
```

`tickStatusEffects`는 기존 `effect.hpPerRound`, `effect.hpLossPerRound`, `duration`을 한 경로에서 처리하고 만료 상태를 제거한다.

- [ ] **Step 4: 밸런스와 문자열 추가**

```js
stress: {
  resolveChance: 0.10,
  afterResolve: 4,
  afterMeltdown: 2,
},
```

`js/data/locales.js`에 죽음의 문턱, 사망 저항, 붕괴, 각성, 토큰 이름을 한/영으로 추가한다.

- [ ] **Step 5: 상태 테스트 실행**

Run: `npx vitest run tests/unit/CombatStatusSystem.test.js`

Expected: PASS

- [ ] **Step 6: 작업 커밋**

```powershell
git add js/systems/combat/CombatStatusSystem.js js/data/gameBalance.js js/data/locales.js tests/unit/CombatStatusSystem.test.js
git commit -m "feat: add combat tokens stress and deaths door"
```

---

### Task 7: 관계 반응과 bond 연동

**Files:**
- Create: `js/systems/combat/RelationshipCombatSystem.js`
- Create: `tests/unit/RelationshipCombatSystem.test.js`
- Modify: `js/data/gameBalance.js`
- Modify: `js/data/locales.js`

- [ ] **Step 1: 긍정/부정 반응 및 1회 제한 테스트 작성**

```js
import { describe, it, expect } from 'vitest';
import {
  getRelationshipSkillEffects,
  resolveRelationshipReaction,
} from '../../js/systems/combat/RelationshipCombatSystem.js';

function makeRelationshipContext({ bond, random }) {
  return {
    actionSequence: 1,
    random: () => random,
    resolvedRelationshipPhases: new Set(),
    getAlliesExcept: actorId => [
      { id: actorId === 'player' ? 'npc_nurse' : 'player', dead: false },
    ],
    getBond: () => bond,
    applyRelationshipReaction: () => {},
  };
}

describe('RelationshipCombatSystem', () => {
  it('높은 bond에서 지원 반응을 만든다', () => {
    const context = makeRelationshipContext({ bond: 90, random: 0.01 });
    expect(resolveRelationshipReaction(context, {
      phase: 'after',
      actorId: 'player',
      targetId: 'npc_nurse',
      actionId: 'doctor_triage',
    })).toMatchObject({ type: 'support', sourceId: 'npc_nurse' });
  });

  it('낮은 bond에서 방해 반응을 만들고 같은 행동에서 두 번 판정하지 않는다', () => {
    const context = makeRelationshipContext({ bond: 5, random: 0.01 });
    const event = { phase: 'before', actorId: 'player', targetId: 'enemy:0', actionId: 'basic_strike' };
    expect(resolveRelationshipReaction(context, event)?.type).toBe('interfere');
    expect(resolveRelationshipReaction(context, event)).toBeNull();
  });

  it('스킬 relationshipModifiers를 bond 구간에 맞게 적용한다', () => {
    const skill = {
      relationshipModifiers: [
        { minBond: 61, effect: { type: 'stress', value: -1 } },
        { maxBond: 30, effect: { type: 'stress', value: 1 } },
      ],
    };
    expect(getRelationshipSkillEffects(skill, 80)).toEqual([{ type: 'stress', value: -1 }]);
    expect(getRelationshipSkillEffects(skill, 10)).toEqual([{ type: 'stress', value: 1 }]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/unit/RelationshipCombatSystem.test.js`

Expected: FAIL because module does not exist

- [ ] **Step 3: 관계 반응 구현**

```js
import BALANCE from '../../data/gameBalance.js';

export function getRelationshipSkillEffects(skill, bond) {
  return (skill.relationshipModifiers ?? [])
    .filter(modifier => (modifier.minBond == null || bond >= modifier.minBond)
      && (modifier.maxBond == null || bond <= modifier.maxBond))
    .map(modifier => modifier.effect);
}

export function resolveRelationshipReaction(context, event) {
  const key = `${context.actionSequence}:${event.phase}`;
  context.resolvedRelationshipPhases ??= new Set();
  if (context.resolvedRelationshipPhases.has(key)) return null;
  context.resolvedRelationshipPhases.add(key);

  const candidates = context.getAlliesExcept(event.actorId).filter(ally => !ally.dead);
  for (const ally of candidates) {
    const bond = context.getBond(event.actorId, ally.id);
    const positiveChance = bond >= 61 ? BALANCE.combat.relationship.positiveChance : 0;
    const negativeChance = bond <= 30 ? BALANCE.combat.relationship.negativeChance : 0;
    const roll = context.random();
    if (roll < positiveChance) {
      const reaction = { type: 'support', sourceId: ally.id, targetId: event.actorId, phase: event.phase };
      context.applyRelationshipReaction(reaction, event);
      return reaction;
    }
    if (roll < positiveChance + negativeChance) {
      const reaction = { type: 'interfere', sourceId: ally.id, targetId: event.actorId, phase: event.phase };
      context.applyRelationshipReaction(reaction, event);
      return reaction;
    }
  }
  return null;
}
```

`BALANCE.combat.relationship`에 `positiveChance: 0.18`, `negativeChance: 0.15`, `supportStressHeal: 1`, `interfereStress: 1`을 추가한다.

- [ ] **Step 4: 관계 테스트 실행**

Run: `npx vitest run tests/unit/RelationshipCombatSystem.test.js`

Expected: PASS

- [ ] **Step 5: 작업 커밋**

```powershell
git add js/systems/combat/RelationshipCombatSystem.js js/data/gameBalance.js js/data/locales.js tests/unit/RelationshipCombatSystem.test.js
git commit -m "feat: add bond-based combat reactions"
```

---

### Task 8: 기존 적 호환 어댑터와 의도

**Files:**
- Create: `js/systems/combat/EnemyCombatAdapter.js`
- Create: `tests/unit/EnemyCombatAdapter.test.js`
- Modify: `js/data/enemies.js`
- Modify: `js/data/validate.js`
- Modify: `tests/unit/CombatSystem_enemyIntent.test.js`
- Modify: `tests/unit/CombatTimedIntent.test.js`
- Modify: `tests/unit/CombatTimedResolve.test.js`

- [ ] **Step 1: legacy 적과 전용 프로필 테스트 작성**

```js
import { describe, it, expect } from 'vitest';
import { buildEnemyProfile, decideEnemyIntent } from '../../js/systems/combat/EnemyCombatAdapter.js';

describe('EnemyCombatAdapter', () => {
  it('legacy attack과 row를 기본 스킬과 시작 rank로 변환한다', () => {
    const profile = buildEnemyProfile({
      id: 'zombie_common',
      row: 'front',
      attack: { damage: [5, 8], accuracy: 0.7 },
      aiPattern: 'normal',
    });
    expect(profile.startRank).toBe(1);
    expect(profile.skills[0].effects[0]).toEqual({ type: 'damage', value: [5, 8] });
  });

  it('combatProfile이 legacy 필드보다 우선한다', () => {
    const profile = buildEnemyProfile({
      id: 'zombie_charger',
      attack: { damage: [1, 2] },
      combatProfile: {
        speed: 8,
        startRank: 3,
        skillIds: ['charger_prepare', 'charger_strike'],
        ai: 'charger',
      },
    });
    expect(profile.speed).toBe(8);
    expect(profile.skillIds).toEqual(['charger_prepare', 'charger_strike']);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/unit/EnemyCombatAdapter.test.js`

Expected: FAIL because module does not exist

- [ ] **Step 3: 적 프로필과 의도 결정 구현**

```js
import BALANCE from '../../data/gameBalance.js';

export function buildEnemyProfile(enemy) {
  if (enemy.combatProfile) {
    return {
      speed: enemy.combatProfile.speed ?? BALANCE.combat.defaultEnemySpeed,
      startRank: enemy.combatProfile.startRank ?? 1,
      skillIds: [...enemy.combatProfile.skillIds],
      ai: enemy.combatProfile.ai ?? enemy.aiPattern ?? 'normal',
    };
  }
  return {
    speed: enemy.speed ?? BALANCE.combat.defaultEnemySpeed,
    startRank: enemy.row === 'back' ? 3 : 1,
    ai: enemy.aiPattern ?? 'normal',
    skills: [{
      id: `enemy:${enemy.id}:basic_attack`,
      usableFrom: enemy.attackType === 'ranged' ? [1, 2, 3, 4] : [1, 2],
      target: { side: 'ally', ranks: enemy.attackType === 'ranged' ? [1, 2, 3, 4] : [1, 2], count: 1 },
      accuracy: enemy.attack?.accuracy ?? BALANCE.combat.enemyBaseAccuracy,
      effects: [{ type: 'damage', value: enemy.attack?.damage ?? BALANCE.combat.enemyDefaultDamage }],
    }],
  };
}

export function decideEnemyIntent(context, enemyId) {
  const profile = context.enemyProfiles[enemyId];
  const candidates = context.getUsableEnemySkills(enemyId, profile);
  const skill = context.pickSkill(profile.ai, candidates);
  const targetId = context.pickTarget(profile.ai, enemyId, skill);
  return skill && targetId ? { enemyId, skillId: skill.id, targetId } : null;
}
```

- [ ] **Step 4: 주요 적 전용 `combatProfile` 추가**

`zombie_bloater`, `zombie_screamer`, `zombie_charger`, `raider_elite`에만 전용 프로필을 추가한다. 기존 timed threat 수치와 현재 테스트가 기대하는 충전, 소환, 자폭 결과는 유지한다.

- [ ] **Step 5: 데이터 검증과 적 테스트 실행**

Run: `npx vitest run tests/unit/EnemyCombatAdapter.test.js tests/unit/CombatSystem_enemyIntent.test.js tests/unit/CombatTimedIntent.test.js tests/unit/CombatTimedResolve.test.js`

Run: `node js/data/validate.js`

Expected: PASS

- [ ] **Step 6: 작업 커밋**

```powershell
git add js/systems/combat/EnemyCombatAdapter.js js/data/enemies.js js/data/validate.js tests/unit/EnemyCombatAdapter.test.js tests/unit/CombatSystem_enemyIntent.test.js tests/unit/CombatTimedIntent.test.js tests/unit/CombatTimedResolve.test.js
git commit -m "feat: adapt legacy enemies to ranked combat"
```

---

### Task 9: CombatSystem 오케스트레이션 전환

**Files:**
- Modify: `js/systems/CombatSystem.js`
- Modify: `js/systems/CombatActions.js`
- Modify: `tests/integration/CombatManualParty.int.test.js`
- Modify: `tests/integration/CombatPhase2_stance.int.test.js`
- Modify: `tests/integration/CombatPhase3_enemyIntent.int.test.js`
- Modify: `tests/integration/CombatTimedTick.int.test.js`

- [ ] **Step 1: 공개 명령 API 통합 테스트 작성**

```js
function makeEnemy() {
  return {
    id: 'zombie_common',
    name: '감염자',
    currentHp: 30,
    maxHp: 30,
    speed: 4,
    row: 'front',
    attack: { damage: [4, 6], accuracy: 1 },
    specialSkills: [],
    weaknesses: [],
    resistances: [],
  };
}

function setupPartyWithCompanion() {
  GameState.player.hp = { current: 100, max: 100 };
  GameState.player.characterId = 'doctor';
  GameState.companions = ['npc_nurse'];
  GameState.npcs = {
    states: {
      npc_nurse: {
        hp: 50,
        maxHp: 50,
        isCompanion: true,
        bond: 70,
        combatSpeed: 50,
      },
    },
  };
}

function advanceToCombatant(combatantId) {
  const index = GameState.combat.turnQueue.findIndex(entry => entry.combatantId === combatantId);
  GameState.combat.activeTurnIndex = index;
  GameState.combat.activeCombatantId = combatantId;
  CombatSystem.beginActiveTurn();
}

it('아군 차례는 입력을 기다리고 적 차례는 의도를 자동 해결한다', () => {
  CombatSystem._setupCombat({ enemies: [makeEnemy()], dangerLevel: 1 });
  const firstId = GameState.combat.turnQueue[0].combatantId;
  const first = GameState.combat.combatants[firstId];
  if (first.side === 'ally') {
    expect(GameState.combat.phase).toBe('await_ally_input');
    expect(CombatSystem.selectSkill(first.skillIds[0])).toBe(true);
  } else {
    CombatSystem.processUntilAllyTurn();
    expect(GameState.combat.combatants[GameState.combat.activeCombatantId].side).toBe('ally');
  }
});

it('동료 턴에서 stance 자동 행동을 호출하지 않는다', () => {
  setupPartyWithCompanion();
  CombatSystem._setupCombat({ enemies: [makeEnemy()], dangerLevel: 1 });
  advanceToCombatant('npc_nurse');
  expect(GameState.combat.phase).toBe('await_ally_input');
  expect(GameState.combat.activeCombatantId).toBe('npc_nurse');
});
```

- [ ] **Step 2: 기존 코드에서 테스트 실패 확인**

Run: `npx vitest run tests/integration/CombatManualParty.int.test.js`

Expected: FAIL because the old system auto-runs companion turns

- [ ] **Step 3: `_setupCombat`을 정규화 상태 생성으로 전환**

`CombatSystem._setupCombat`에서 다음 순서로 상태를 생성한다.

```js
const combatants = buildCombatants(gs, enemies);
const allyIds = Object.values(combatants).filter(c => c.side === 'ally').map(c => c.id);
const enemyEntries = Object.values(combatants)
  .filter(c => c.side === 'enemy')
  .map(c => ({ combatantId: c.id, row: enemies[c.enemyIndex]?.row ?? 'front' }));
const formations = createFormations(allyIds, enemyEntries);

gs.combat = {
  active: true,
  phase: 'round_start',
  combatants,
  formations,
  turnQueue: [],
  activeTurnIndex: 0,
  activeCombatantId: null,
  roundNumber: 0,
  selectedSkillId: null,
  selectedTargetId: null,
  pendingIntentByEnemy: {},
  relationshipEvents: [],
  log: [encounterLabel],
  fxQueue: [],
  enemies,
  nodeId: data.nodeId ?? null,
  dangerLevel,
  _encounterData: data,
  _isNew: true,
};
this.startRound();
```

- [ ] **Step 4: 라운드와 공개 명령 API 구현**

`CombatSystem`에 다음 메서드를 추가한다.

```js
startRound()
beginActiveTurn()
selectSkill(skillId)
selectTarget(targetId)
cancelSelection()
useCombatItem(itemInstanceId)
confirmAction()
advanceTurn()
processUntilAllyTurn()
```

`confirmAction()`은 `executeSkillCommand`를 호출하고, 승패 판정 후 살아 있으면 `advanceTurn()`을 호출한다. `processUntilAllyTurn()`은 적 차례만 자동 처리하며 동료를 포함한 모든 아군 차례에서 반환한다.

- [ ] **Step 5: 전투 종료 동기화 연결**

`_resolveVictory`, `_resolveDefeat`, 도주 성공 직전에 `syncCombatantsToGameState(gs, gs.combat.combatants)`를 호출한다. 플레이어 `dead`이면 기존 `EndingSystem.triggerDeathEnding`을 호출하고, 동료 `dead`이면 해당 NPC 상태에 사망을 반영한다.

- [ ] **Step 6: stance 통합 테스트를 수동 동료 계약으로 교체**

`tests/integration/CombatPhase2_stance.int.test.js`는 stance 버튼과 자동 행동 검증을 제거하고 다음을 검증한다.

```js
expect(GameState.combat.activeCombatantId).toBe('npc_nurse');
expect(GameState.combat.phase).toBe('await_ally_input');
expect(CombatSystem.selectSkill('nurse_triage')).toBe(true);
```

- [ ] **Step 7: 전투 통합 테스트 실행**

Run: `npx vitest run tests/integration/CombatManualParty.int.test.js tests/integration/CombatPhase2_stance.int.test.js tests/integration/CombatPhase3_enemyIntent.int.test.js tests/integration/CombatTimedTick.int.test.js`

Expected: PASS

- [ ] **Step 8: 작업 커밋**

```powershell
git add js/systems/CombatSystem.js js/systems/CombatActions.js tests/integration/CombatManualParty.int.test.js tests/integration/CombatPhase2_stance.int.test.js tests/integration/CombatPhase3_enemyIntent.int.test.js tests/integration/CombatTimedTick.int.test.js
git commit -m "refactor: orchestrate ranked manual party combat"
```

---

### Task 10: B형 전장 집중 CombatUI

**Files:**
- Modify: `js/ui/CombatUI.js`
- Create: `tests/integration/CombatFocusedUI.int.test.js`
- Modify: `tests/integration/CombatPhase1_initiative.int.test.js`
- Modify: `tests/integration/CombatPhase4_animations.int.test.js`

- [ ] **Step 1: 전장, 진형, 행동 바, 팝오버 구조 테스트 작성**

```js
// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import CombatUI from '../../js/ui/CombatUI.js';
import GameState from '../../js/core/GameState.js';

function setupFocusedCombatState(gs) {
  gs.combat = {
    active: true,
    phase: 'await_ally_input',
    roundNumber: 1,
    activeCombatantId: 'player',
    activeTurnIndex: 0,
    selectedSkillId: null,
    inspectedCombatantId: null,
    formations: {
      ally: [null, null, 'npc_nurse', 'player'],
      enemy: ['enemy:0', null, null, null],
    },
    combatants: {
      player: {
        id: 'player', side: 'ally', hp: 80, maxHp: 100, stress: 2,
        tokens: {}, statusEffects: [], skillIds: ['s1', 's2', 's3', 's4', 's5'],
      },
      npc_nurse: {
        id: 'npc_nurse', side: 'ally', hp: 40, maxHp: 50, stress: 1,
        tokens: {}, statusEffects: [], skillIds: [],
      },
      'enemy:0': {
        id: 'enemy:0', side: 'enemy', hp: 30, maxHp: 30,
        tokens: {}, statusEffects: [],
      },
    },
    skillsById: Object.fromEntries(
      ['s1', 's2', 's3', 's4', 's5'].map(id => [id, {
        id, fallbackName: id, usableFrom: [1],
        target: { side: 'enemy', ranks: [1] },
      }]),
    ),
    turnQueue: [
      { combatantId: 'player', initiative: 8 },
      { combatantId: 'enemy:0', initiative: 5 },
    ],
    pendingIntentByEnemy: {
      'enemy:0': { enemyId: 'enemy:0', skillId: 'enemy_attack', targetId: 'player' },
    },
    log: [],
    fxQueue: [],
  };
}

describe('Combat focused UI', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="screen-combat"></div>';
    CombatUI._screen = document.getElementById('screen-combat');
    setupFocusedCombatState(GameState);
    CombatUI.render();
  });

  it('상시 좌우 상세 패널 없이 중앙 전장과 양측 4칸을 렌더한다', () => {
    expect(document.querySelector('.combat-player-panel')).toBeNull();
    expect(document.querySelector('.combat-enemy-panel')).toBeNull();
    expect(document.querySelector('.combat-battlefield')).not.toBeNull();
    expect(document.querySelectorAll('.formation-slot.ally')).toHaveLength(4);
    expect(document.querySelectorAll('.formation-slot.enemy')).toHaveLength(4);
  });

  it('현재 아군의 스킬 5개와 무료 아이템 슬롯을 렌더한다', () => {
    expect(document.querySelectorAll('.combat-skill-button')).toHaveLength(5);
    expect(document.querySelector('.combat-item-slot')).not.toBeNull();
  });

  it('전투원 선택 시 상세 팝오버를 표시한다', () => {
    document.querySelector('[data-combatant-id="enemy:0"]').click();
    expect(document.querySelector('.combat-detail-popover')).not.toBeNull();
  });
});
```

- [ ] **Step 2: 기존 UI에서 실패 확인**

Run: `npx vitest run tests/integration/CombatFocusedUI.int.test.js`

Expected: FAIL because the old three-panel DOM is rendered

- [ ] **Step 3: 렌더 책임을 작은 함수로 분리**

`CombatUI.js`에 다음 순수 렌더 함수를 만든다.

```js
_renderTopHud(combat, gs)
_renderInitiativeBar(combat)
_renderFormationSide(side, combat)
_renderCombatant(combatantId, combat)
_renderSkillBar(activeCombatant, combat)
_renderCombatItemSlot(activeCombatant, combat)
_renderDetailPopover(selectedCombatantId, combat)
_renderEventTicker(combat)
```

`_renderInternal()`은 다음 뼈대만 조립한다.

```js
this._screen.innerHTML = `
  <div class="combat-wrap combat-focused">
    ${this._renderTopHud(combat, gs)}
    ${this._renderInitiativeBar(combat)}
    <main class="combat-battlefield" style="background-image:url('${BATTLE_BG}')">
      ${this._renderFormationSide('ally', combat)}
      <div class="combat-stage-center">${this._renderEventTicker(combat)}</div>
      ${this._renderFormationSide('enemy', combat)}
      ${this._renderDetailPopover(combat.inspectedCombatantId, combat)}
    </main>
    <footer class="combat-command-deck">
      ${this._renderSkillBar(combat.combatants[combat.activeCombatantId], combat)}
      ${this._renderCombatItemSlot(combat.combatants[combat.activeCombatantId], combat)}
      <button class="combat-common-command" data-command="move">이동</button>
      <button class="combat-common-command" data-command="flee">도주</button>
    </footer>
  </div>`;
```

- [ ] **Step 4: 선택, 취소, 확인 입력 연결**

- 스킬 클릭: `CombatSystem.selectSkill(skillId)`
- 전투원 클릭: 선택된 스킬이 있으면 `selectTarget`, 없으면 `inspectedCombatantId` 변경
- 같은 유효 대상 재클릭 또는 확인 버튼: `confirmAction`
- `Escape`: `cancelSelection`
- 아이템 클릭: `useCombatItem`
- FX 재생 중에는 `.is-input-locked`를 추가하고 명령을 거부

- [ ] **Step 5: 기존 initiative와 animation 통합 테스트 전환**

기존 테스트는 `entry.type` 대신 `combatantId`를 사용하고, `.init-slot`, `.dmg-popup`, `.fx-*`의 핵심 계약은 유지한다.

- [ ] **Step 6: UI 통합 테스트 실행**

Run: `npx vitest run tests/integration/CombatFocusedUI.int.test.js tests/integration/CombatPhase1_initiative.int.test.js tests/integration/CombatPhase4_animations.int.test.js`

Expected: PASS

- [ ] **Step 7: 작업 커밋**

```powershell
git add js/ui/CombatUI.js tests/integration/CombatFocusedUI.int.test.js tests/integration/CombatPhase1_initiative.int.test.js tests/integration/CombatPhase4_animations.int.test.js
git commit -m "feat: render focused ranked combat UI"
```

---

### Task 11: 산업 디자인 CSS와 반응형 UI

**Files:**
- Modify: `css/screens-combat.css`
- Modify: `css/variables.css` only if an equivalent token does not already exist
- Modify: `testdata/combat-test.html` only after preserving current user changes

- [ ] **Step 1: 기존 디자인 토큰 재확인**

Run: `rg -n -- "--bg|--surface|--accent|--text|--border|--danger|--success" css/variables.css`

Expected: 전투 UI에 사용할 기존 색상, 경계선, 텍스트 토큰 목록 출력

- [ ] **Step 2: 3패널 레이아웃을 전장 집중 그리드로 교체**

`css/screens-combat.css`에서 `.combat-main`, `.combat-player-panel`, `.combat-enemy-panel` 중심 규칙을 제거하고 다음 구조를 적용한다.

```css
.combat-focused {
  min-height: 100%;
  display: grid;
  grid-template-rows: auto auto minmax(360px, 1fr) auto;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.combat-battlefield {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(120px, 0.35fr) minmax(0, 1fr);
  align-items: end;
  overflow: hidden;
  border-block: 1px solid var(--border-dim);
  background-size: cover;
  background-position: center;
}

.combat-formation {
  display: grid;
  grid-template-columns: repeat(4, minmax(72px, 1fr));
  align-items: end;
  min-width: 0;
}

.formation-slot {
  min-height: 220px;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  border-bottom: 2px solid color-mix(in srgb, var(--accent) 28%, transparent);
}

.formation-slot.is-valid-target {
  outline: 2px solid var(--accent);
  outline-offset: -4px;
}

.combat-command-deck {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: color-mix(in srgb, var(--bg-primary) 92%, transparent);
  border-top: 1px solid var(--border-default);
}

.combat-skill-bar {
  display: grid;
  grid-template-columns: repeat(5, minmax(110px, 1fr));
  gap: var(--space-xs);
}

.combat-skill-button,
.combat-item-slot,
.combat-common-command {
  min-height: 64px;
  border: 1px solid var(--border-default);
  background: var(--surface-raised);
  color: var(--text-primary);
  font-family: var(--font-mono);
}
```

- [ ] **Step 3: 토큰, 스트레스, 죽음의 문턱 시각 상태 추가**

색상만으로 구분하지 않도록 `.combat-token`에 아이콘/짧은 텍스트를 표시하고, `.is-deaths-door`에는 점선 테두리와 경고 라벨을 함께 사용한다. 적 의도는 전투원 상단의 `.combat-intent`에 표시한다.

- [ ] **Step 4: 반응형 규칙 추가**

```css
@media (max-width: 1279px) {
  .combat-formation {
    grid-template-columns: repeat(4, minmax(58px, 1fr));
  }
  .combat-skill-bar {
    grid-template-columns: repeat(5, minmax(92px, 1fr));
  }
}

@media (max-width: 959px) {
  .combat-battlefield {
    grid-template-columns: minmax(0, 1fr) 72px minmax(0, 1fr);
  }
  .combat-command-deck {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .combat-skill-bar {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
  }
  .combat-skill-button {
    flex: 0 0 128px;
    min-height: 56px;
    scroll-snap-align: start;
  }
  .combat-detail-popover {
    position: fixed;
    inset: auto 0 0;
    max-width: none;
  }
}
```

- [ ] **Step 5: Vite에서 3개 뷰포트 수동 확인**

Run: `npm run dev:web -- --host 127.0.0.1`

Browser checks:

- `1280x720`: 스킬 5개가 한 줄이며 전투원과 겹치지 않음
- `1024x768`: 행동 순서와 팝오버가 전장을 가리지 않음
- `768x1024`: 스킬 바 가로 스크롤과 하단 상세 시트 동작

Expected: 가로 페이지 스크롤 없음, 모든 클릭 영역 40px 이상, 상시 좌우 상세 패널 없음

- [ ] **Step 6: 작업 커밋**

```powershell
git add css/screens-combat.css css/variables.css
git commit -m "style: apply focused industrial combat layout"
```

`testdata/combat-test.html`에 기존 사용자 변경이 있으면 별도 커밋으로 섞지 않고 필요한 부분만 후속 작업에서 조정한다.

---

### Task 12: 회귀 정리, 데이터 검증, 플레이테스트

**Files:**
- Modify: `js/systems/CombatSystem.js`
- Modify: `js/systems/CombatActions.js`
- Modify: `js/ui/CombatUI.js`
- Modify: affected combat tests
- Modify: `testdata/combat-test.html` only if required for browser scenarios

- [ ] **Step 1: 전투 관련 전체 테스트 실행**

Run:

```powershell
npx vitest run tests/unit/Combat*.test.js tests/unit/FormationSystem.test.js tests/unit/InitiativeSystem.test.js tests/unit/RelationshipCombatSystem.test.js tests/unit/EnemyCombatAdapter.test.js tests/integration/Combat*.test.js
```

Expected: PASS

- [ ] **Step 2: 전체 테스트와 데이터 검증 실행**

Run: `npm test`

Run: `node js/data/validate.js`

Expected: 모든 Vitest 테스트 PASS, data validation exit code 0

- [ ] **Step 3: 웹 빌드 확인**

Run: `npm run build:web`

Expected: Vite build succeeds without unresolved imports or CSS parse errors

- [ ] **Step 4: 브라우저 전투 시나리오 플레이테스트**

`combat-test.html` 또는 프로젝트의 기존 전투 진입 경로에서 다음 시나리오를 실행한다.

1. 플레이어 단독 대 일반 적
2. 플레이어 + 동료 1명 대 전열/후열 적
3. 플레이어 + 동료 2명 대 timed threat 적
4. 아군 이동 후 빈칸 유지
5. 탄약 부족과 내구도 부족 행동 거부
6. 무료 아이템 사용 후 같은 차례 스킬 실행
7. 죽음의 문턱 진입, 회복, 사망 저항
8. 스트레스 붕괴 또는 각성
9. 긍정/부정 관계 반응
10. 도주, 승리, 플레이어 패배, 동료 사망 결과

Expected: 콘솔 오류 없음, 입력 중복 없음, 전투 결과 화면과 원본 상태가 일치함

- [ ] **Step 5: 구형 자동 동료 흐름 제거**

모든 테스트와 플레이테스트가 통과한 뒤에만 다음을 제거한다.

- `CombatSystem._runCompanionTurn`
- `_companionAutoAttack`, `_companionHold`, `_companionAutoHeal`, `_companionAutoSupport`
- stance 렌더 및 이벤트 바인딩
- 새 코드에서 호출되지 않는 `companionAttack`, `companionHeal`, `tickCompanionCooldowns`
- `BALANCE.combat.companionAuto`, companion action cooldown 상수

Run: `rg -n "companionAuto|_runCompanionTurn|stance-btn|companionAttack|companionHeal" js tests css`

Expected: 마이그레이션 문서나 과거 테스트 설명을 제외한 실행 코드 참조 없음

- [ ] **Step 6: 제거 후 전체 검증 재실행**

Run: `npm test`

Run: `node js/data/validate.js`

Run: `npm run build:web`

Expected: 모두 성공

- [ ] **Step 7: 최종 작업 커밋**

```powershell
git add js/systems/CombatSystem.js js/systems/CombatActions.js js/ui/CombatUI.js js/data/gameBalance.js js/data/locales.js js/data/validate.js tests testdata/combat-test.html
git commit -m "test: verify ranked combat overhaul"
```

---

## 완료 검증 체크리스트

- [ ] 플레이어와 최대 2명의 동료가 모두 수동 입력을 기다린다.
- [ ] 아군과 적군 4칸 진형에서 빈칸이 유지된다.
- [ ] 매 라운드 initiative가 다시 계산된다.
- [ ] 캐릭터 스킬 3개와 장비 스킬 2개가 렌더되고 실행된다.
- [ ] 전투 아이템은 차례당 한 번 무료 행동으로 사용된다.
- [ ] 탄약, 내구도, 스태미나, 소음이 기존 게임 상태와 동기화된다.
- [ ] 토큰과 기존 지속 상태가 같은 전투원 모델에서 처리된다.
- [ ] 모든 아군에게 죽음의 문턱과 사망 저항이 적용된다.
- [ ] 스트레스 붕괴와 낮은 확률의 각성이 동작한다.
- [ ] `bond` 기반 지원과 방해 반응이 행동당 최대 한 번 발생한다.
- [ ] 기존 일반 적은 어댑터로 동작하고 주요 적은 전용 프로필을 사용한다.
- [ ] B 전장 집중형 UI가 1280px, 1024px, 768px에서 조작 가능하다.
- [ ] 승리, 도주, 패배, 보상, 습격, 엔딩 흐름이 회귀하지 않는다.
- [ ] `npm test`, 데이터 검증, 웹 빌드, 브라우저 플레이테스트가 모두 통과한다.
