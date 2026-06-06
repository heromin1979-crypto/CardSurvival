# 전투 타이밍 압박 적 + 사기 격파 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 타이밍 압박 적 3종(블로터·스크리머·돌진자)과 도구/속성 카운터, 인간 적 사기 격파 승리를 추가해 전투의 매 턴 결정을 다양화한다.

**Architecture:** A안 — enemy 정의에 `timedThreat` 필드를 추가하고, 기존 `_nextIntent` 의도 예고/이니셔티브 바를 카운트다운 표시기로 확장한다. 카운터는 기존 약점(×1.5)·투척물·기절 시스템에 위임한다. 사기 격파는 기존 `morale` 어휘와 flee 경로를 인간 적에게 확장한다.

**Tech Stack:** Vanilla JS (ESM), Vitest(`npm test` = `vitest run`), happy-dom(UI 테스트 `// @vitest-environment happy-dom`).

**Spec:** `docs/superpowers/specs/2026-06-07-combat-timed-threats-design.md`

---

## 파일 구조

| 파일 | 책임 | 변경 |
|---|---|---|
| `js/data/items_combat.js` | 무기 정의 | 수정 — weaponType 어휘 정규화 |
| `js/data/gameBalance.js` | 밸런스 상수 | 수정 — `combat.timedThreats`, `combat.moraleBreak` |
| `js/data/enemies.js` | 적 정의·조우·롤 | 수정 — 신규 적 3종, ENCOUNTER_TABLES, rollEnemy 초기화 |
| `js/data/locales.js` | 영문 i18n | 수정 — 신규 적 `_enemy.*` 영문명 |
| `js/systems/CombatSystem.js` | 전투 로직 | 수정 — 의도 카운트다운·timedThreat 핸들러·틱·처치 분기·사기 격파·인터럽트 |
| `js/ui/CombatUI.js` | 전투 UI | 수정 — 이니셔티브 바 카운트다운 |
| `css/screens-combat.css` | 전투 스타일 | 수정 — charging 점멸 키프레임 |
| `tests/unit/CombatTimedThreats*.test.js` | 단위 테스트 | 신규 |
| `tests/integration/CombatTimedThreats*.int.test.js` | 통합 테스트 | 신규 |

> 신규 적은 카드가 아니므로 `CardFactory.CARD_IMAGES`·`stackConfig` 등록 불필요(enemy `image` 필드 직접 사용). loot는 기존 아이템 id만 사용.

---

## Task 0: weaponType 어휘 정규화 (선행)

카운터·약점 힌트가 작동하려면 모든 무기 `weaponType`이 정규 6종(fire/blade/bullet/blunt/explosive/electric) ∪ {utility}에 속해야 한다. 현재 `sharp`(forged_sword·masamune), `pierce`(pipe_shotgun)가 이탈.

**Files:**
- Create: `tests/unit/CombatWeaponTypeVocab.test.js`
- Modify: `js/data/items_combat.js` (forged_sword·masamune `weaponType: 'sharp'` → `'blade'`, pipe_shotgun `weaponType: 'pierce'` → `'bullet'`)

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/unit/CombatWeaponTypeVocab.test.js
import { describe, it, expect } from 'vitest';
import ITEMS_COMBAT from '../../js/data/items_combat.js';

const ALLOWED = new Set(['fire', 'blade', 'bullet', 'blunt', 'explosive', 'electric', 'utility']);

describe('weaponType 어휘 정규화', () => {
  it('모든 무기 weaponType이 정규 어휘에 속한다', () => {
    const offenders = [];
    for (const [id, def] of Object.entries(ITEMS_COMBAT)) {
      if (def?.weaponType && !ALLOWED.has(def.weaponType)) {
        offenders.push(`${id}:${def.weaponType}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- tests/unit/CombatWeaponTypeVocab.test.js`
Expected: FAIL — offenders에 `forged_sword:sharp`, `masamune:sharp`, `pipe_shotgun:pierce` (실제 id는 파일 확인) 포함.

- [ ] **Step 3: items_combat.js 수정**

`js/data/items_combat.js`에서 `weaponType: 'sharp'` 2곳(forged_sword·masamune 류 명검)을 `weaponType: 'blade'`로, `weaponType: 'pierce'` 1곳(pipe_shotgun)을 `weaponType: 'bullet'`로 변경. 다른 줄은 건드리지 않는다(surgical).

- [ ] **Step 4: 통과 확인**

Run: `npm test -- tests/unit/CombatWeaponTypeVocab.test.js`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add tests/unit/CombatWeaponTypeVocab.test.js js/data/items_combat.js
git commit -m "fix(combat): weaponType 어휘 정규화 (sharp→blade, pierce→bullet)"
```

---

## Task 1: gameBalance.js — timedThreats / moraleBreak 상수

**Files:**
- Create: `tests/unit/CombatBalanceConstants.test.js`
- Modify: `js/data/gameBalance.js` (`combat` 객체 내부, `companionAuto` 블록 뒤)

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/unit/CombatBalanceConstants.test.js
import { describe, it, expect } from 'vitest';
import BALANCE from '../../js/data/gameBalance.js';

describe('combat.timedThreats 상수', () => {
  it('블로터/스크리머/돌진자 파라미터 존재', () => {
    const t = BALANCE.combat.timedThreats;
    expect(t.bloater.aoeDamage).toHaveLength(2);
    expect(t.bloater.corpseBurst).toHaveLength(2);
    expect(t.bloater.infectionCloud).toBeGreaterThan(0);
    expect(t.screamer.summonNoise).toBeGreaterThan(0);
    expect(t.charger.strikeDamage).toHaveLength(2);
    expect(t.charger.guardCounterMult).toBeGreaterThan(1);
  });
});

describe('combat.moraleBreak 상수', () => {
  it('rout 임계·사기 피해 파라미터 존재', () => {
    const m = BALANCE.combat.moraleBreak;
    expect(m.routThreshold).toBe(0);
    expect(m.critMoraleDmg).toBeGreaterThan(0);
    expect(m.allyDeathMoraleDmg).toBeGreaterThan(0);
    expect(m.routLootMult).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- tests/unit/CombatBalanceConstants.test.js`
Expected: FAIL — `Cannot read properties of undefined (reading 'bloater')`

- [ ] **Step 3: gameBalance.js 수정**

`js/data/gameBalance.js`의 `combat: { ... }` 안, `companionAuto: { ... }` 블록이 끝나는 `}` 직후에 추가:

```js
    // ── 타이밍 압박 적 (timedThreat) ──
    timedThreats: {
      bloater: {
        aoeDamage:      [25, 40],   // 자폭 광역 피해 (전 아군)
        corpseBurst:    [8, 14],    // 약점 외 처치 + 근접 시 사체 폭발
        infectionCloud: 15,         // 자폭 시 감염 스택
      },
      screamer: {
        summonCount:  [1, 2],       // 소환 적 수
        summonNoise:  25,           // 비명 시 소음 추가
      },
      charger: {
        strikeDamage:    [30, 45],  // 강타 피해
        strikeStun:      1,         // 강타 명중 시 기절 턴
        guardCounterMult: 2.0,      // 돌진 강타 방어 시 반격 보너스 증폭
      },
    },
    // ── 사기 격파 (인간 적) ──
    moraleBreak: {
      routThreshold:    0,    // 사기 ≤ 0 → 도주(rout)
      critMoraleDmg:    25,   // 플레이어 크리티컬 1회당 인간 타겟 사기 감소
      allyDeathMoraleDmg: 30, // 인간 동료 적 사망 목격 시 전체 인간 적 사기 감소
      routLootMult:     0.5,  // 도주한 적 전리품 드롭 확률 배율
    },
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- tests/unit/CombatBalanceConstants.test.js`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add tests/unit/CombatBalanceConstants.test.js js/data/gameBalance.js
git commit -m "feat(combat): timedThreats/moraleBreak 밸런스 상수 추가"
```

---

## Task 2: enemies.js — 신규 적 3종 + 조우 테이블 + rollEnemy 초기화

**Files:**
- Create: `tests/unit/CombatNewEnemies.test.js`
- Modify: `js/data/enemies.js` (ENEMIES 객체에 3종 추가, ENCOUNTER_TABLES DL3~5, rollEnemy)
- Modify: `js/data/locales.js` (영문 `_enemy.*`)

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/unit/CombatNewEnemies.test.js
import { describe, it, expect } from 'vitest';
import ENEMIES, { rollEnemy } from '../../js/data/enemies.js';

describe('신규 적 3종 정의', () => {
  it('zombie_bloater: timedThreat self_destruct, fire/explosive 약점', () => {
    const e = ENEMIES.zombie_bloater;
    expect(e.timedThreat.id).toBe('self_destruct');
    expect(e.timedThreat.chargeTurns).toBe(3);
    expect(e.timedThreat.chargingAttacks).toBe(true);
    expect(e.weaknesses).toEqual(expect.arrayContaining(['fire', 'explosive']));
  });
  it('zombie_screamer: timedThreat summon_horde, chargeTurns 2', () => {
    const e = ENEMIES.zombie_screamer;
    expect(e.timedThreat.id).toBe('summon_horde');
    expect(e.timedThreat.chargeTurns).toBe(2);
  });
  it('zombie_charger: timedThreat charge_strike, chargingAttacks false', () => {
    const e = ENEMIES.zombie_charger;
    expect(e.timedThreat.id).toBe('charge_strike');
    expect(e.timedThreat.chargeTurns).toBe(1);
    expect(e.timedThreat.chargingAttacks).toBe(false);
  });
});

describe('rollEnemy 런타임 초기화', () => {
  it('timedThreat 적은 _chargeRemaining 초기화', () => {
    // DL5는 신규 적 포함 — 50회 굴려 하나라도 _chargeRemaining 보유 확인
    let found = false;
    for (let i = 0; i < 80; i++) {
      const e = rollEnemy(5);
      if (e.timedThreat) {
        expect(e._chargeRemaining).toBe(e.timedThreat.chargeTurns);
        found = true;
      }
    }
    expect(found).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- tests/unit/CombatNewEnemies.test.js`
Expected: FAIL — `Cannot read properties of undefined (reading 'id')`

- [ ] **Step 3: enemies.js — 신규 적 3종 추가**

`js/data/enemies.js`의 `ENEMIES` 객체 끝(`zombie_acid` 정의 뒤, 닫는 `};` 앞)에 추가:

```js
  // ── 블로터 (자폭 감염자) ──────────────────────────────
  zombie_bloater: {
    id: 'zombie_bloater',
    name: '블로터',
    icon: '🤰',
    image: './assets/images/zombie.png',
    type: 'zombie',
    hp: { min: 45, max: 65 },
    attack: { damage: [4, 8], accuracy: 0.55, noiseOnAttack: 4 },
    defense: 0,
    xp: 32,
    lootTable: [
      { definitionId: 'contaminated_water', weight: 30, minQty: 1, maxQty: 1 },
      { definitionId: 'tattered_rags',      weight: 25, minQty: 1, maxQty: 2 },
      { definitionId: 'bone',               weight: 20, minQty: 1, maxQty: 1 },
    ],
    infectionChance: 0.35,
    aiPattern: 'normal',
    specialSkills: [],
    statusInflict: null,
    weaknesses: ['fire', 'explosive'],
    resistances: ['blade', 'bullet'],
    timedThreat: {
      id: 'self_destruct',
      chargeTurns: 3,
      chargingAttacks: true,
      counters: { weakness: ['fire', 'explosive'], stunDelays: true },
    },
    description: '체내 가스가 부푼 감염자. 시간이 지나면 자폭해 광역 감염을 퍼뜨린다. 불·폭발로 빠르게 처리해야 한다.',
    stealthDifficulty: 0.4,
  },

  // ── 스크리머 (소환 신호형) ────────────────────────────
  zombie_screamer: {
    id: 'zombie_screamer',
    name: '스크리머',
    icon: '🗣️',
    image: './assets/images/zombie.png',
    type: 'zombie',
    hp: { min: 30, max: 45 },
    attack: { damage: [5, 9], accuracy: 0.6, noiseOnAttack: 6 },
    defense: 0,
    xp: 28,
    lootTable: [
      { definitionId: 'tattered_rags', weight: 30, minQty: 1, maxQty: 2 },
      { definitionId: 'cloth_scrap',   weight: 25, minQty: 1, maxQty: 2 },
      { definitionId: 'bone',          weight: 20, minQty: 1, maxQty: 1 },
    ],
    infectionChance: 0.25,
    aiPattern: 'normal',
    specialSkills: [],
    statusInflict: null,
    weaknesses: ['bullet', 'fire'],
    resistances: [],
    timedThreat: {
      id: 'summon_horde',
      chargeTurns: 2,
      chargingAttacks: true,
      counters: { silentSuppress: true, stunDelays: true },
    },
    description: '비명으로 동족을 부르는 감염자. 조용히(silent) 처치하면 비명을 막을 수 있다.',
    stealthDifficulty: 0.75,
  },

  // ── 돌진자 (강타 준비형) ──────────────────────────────
  zombie_charger: {
    id: 'zombie_charger',
    name: '돌진자',
    icon: '🐗',
    image: './assets/images/zombie.png',
    type: 'zombie',
    hp: { min: 35, max: 55 },
    attack: { damage: [6, 10], accuracy: 0.6, noiseOnAttack: 7 },
    defense: 1,
    xp: 30,
    lootTable: [
      { definitionId: 'tattered_rags', weight: 30, minQty: 1, maxQty: 2 },
      { definitionId: 'scrap_metal',   weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'bone',          weight: 20, minQty: 1, maxQty: 1 },
    ],
    infectionChance: 0.3,
    aiPattern: 'aggressive',
    specialSkills: [],
    statusInflict: null,
    weaknesses: ['blade', 'fire'],
    resistances: [],
    timedThreat: {
      id: 'charge_strike',
      chargeTurns: 1,
      chargingAttacks: false,
      counters: { stunDelays: true },
    },
    description: '몸을 웅크렸다가 돌진하는 감염자. 강타 준비 중 기절시키거나 방어로 받아쳐야 한다.',
    stealthDifficulty: 0.6,
  },
```

- [ ] **Step 4: enemies.js — ENCOUNTER_TABLES 편입**

DL1·DL2는 변경 없음(초반 학습 보호). DL3·DL4·DL5의 배열에 항목 추가:

DL3 배열에 추가:
```js
    { enemyId: 'zombie_bloater',  weight: 8 },
    { enemyId: 'zombie_screamer', weight: 8 },
    { enemyId: 'zombie_charger',  weight: 10 },
```
DL4 배열에 추가:
```js
    { enemyId: 'zombie_bloater',  weight: 12 },
    { enemyId: 'zombie_screamer', weight: 12 },
    { enemyId: 'zombie_charger',  weight: 13 },
```
DL5 배열에 추가:
```js
    { enemyId: 'zombie_bloater',  weight: 15 },
    { enemyId: 'zombie_screamer', weight: 12 },
    { enemyId: 'zombie_charger',  weight: 15 },
```

- [ ] **Step 5: enemies.js — rollEnemy 초기화 확장**

`rollEnemy`(enemies.js:303) 안의 `return { ...def, currentHp: hp, maxHp: hp, _skillCooldowns: {}, _statusEffects: [] };` 와, 함수 끝 fallback `return { ...ENEMIES['zombie_common'], ... }` 두 곳 모두를 다음 형태로 변경:

```js
      return {
        ...def,
        currentHp: hp,
        maxHp:     hp,
        _skillCooldowns: {},
        _statusEffects:  [],
        _chargeRemaining: def.timedThreat?.chargeTurns ?? null,
        currentMorale:    def.type === 'human' ? (def.morale?.max ?? 100) : null,
      };
```

(fallback 분기는 `def`가 `ENEMIES['zombie_common']`이므로 동일 코드 적용. `def` 지역변수로 추출 후 공통화해도 됨.)

- [ ] **Step 6: locales.js — 영문 적 이름**

`js/data/locales.js`의 `_enemy.boss_*` 블록(1790행대) 근처에 추가:
```js
  '_enemy.zombie_bloater':  'Bloater',
  '_enemy.zombie_screamer': 'Screamer',
  '_enemy.zombie_charger':  'Charger',
```

- [ ] **Step 7: 통과 확인**

Run: `npm test -- tests/unit/CombatNewEnemies.test.js`
Expected: PASS

- [ ] **Step 8: 커밋**

```bash
git add tests/unit/CombatNewEnemies.test.js js/data/enemies.js js/data/locales.js
git commit -m "feat(combat): 타이밍 압박 적 3종 + 조우 테이블 + rollEnemy 초기화"
```

---

## Task 3: _decideNextIntent — timedThreat 카운트다운 의도

**Files:**
- Create: `tests/unit/CombatTimedIntent.test.js`
- Modify: `js/systems/CombatSystem.js` (`_decideNextIntent`, CombatSystem.js:827)

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/unit/CombatTimedIntent.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState    from '../../js/core/GameState.js';

beforeEach(() => {
  GameState.player.hp = { current: 100, max: 100 };
  GameState.player.equipped = {};
  GameState.companions = [];
  GameState.npcs = null;
  GameState.getCardDef = () => null;
});

function makeCombat() {
  return { enemies: [], targetIndex: 0, log: [], playerStatus: [] };
}

describe('_decideNextIntent — timedThreat', () => {
  it('충전 중 블로터: action=timed_threat, 💥 아이콘, countdown 반영', () => {
    const enemy = {
      id: 'zombie_bloater', name: '블로터', currentHp: 50, maxHp: 50,
      aiPattern: 'normal', specialSkills: [], _skillCooldowns: {},
      timedThreat: { id: 'self_destruct', chargeTurns: 3 },
      _chargeRemaining: 2,
    };
    const intent = CombatSystem._decideNextIntent(enemy, makeCombat(), GameState);
    expect(intent.action).toBe('timed_threat');
    expect(intent.iconEmoji).toBe('💥');
    expect(intent.countdown).toBe(2);
    expect(intent.threatId).toBe('self_destruct');
  });

  it('_chargeRemaining null이면 기존 attack 의도', () => {
    const enemy = {
      id: 'e', name: 'E', currentHp: 30, maxHp: 30,
      aiPattern: 'normal', specialSkills: [], _skillCooldowns: {},
      _chargeRemaining: null,
    };
    const intent = CombatSystem._decideNextIntent(enemy, makeCombat(), GameState);
    expect(intent.action).toBe('attack');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- tests/unit/CombatTimedIntent.test.js`
Expected: FAIL — `intent.action` === 'attack' (timed_threat 분기 없음)

- [ ] **Step 3: _decideNextIntent 수정**

`_decideNextIntent`(CombatSystem.js:827) 안, `const target = this._pickTargetByPattern(...)` 다음, `readySkill` 계산 **전에** timedThreat 분기 추가:

```js
    // 타이밍 압박 적: 충전 중이면 카운트다운 의도 우선
    if ((enemy._chargeRemaining ?? null) !== null && enemy.timedThreat) {
      const icon = enemy.timedThreat.id === 'self_destruct' ? '💥'
                 : enemy.timedThreat.id === 'summon_horde'  ? '📣'
                 : '⚡';
      const labelMap = {
        self_destruct: `${enemy._chargeRemaining}턴 후 자폭`,
        summon_horde:  `${enemy._chargeRemaining}턴 후 증원 소환`,
        charge_strike: `${enemy._chargeRemaining}턴 후 강타`,
      };
      return {
        action: 'timed_threat',
        threatId: enemy.timedThreat.id,
        countdown: enemy._chargeRemaining,
        targetType: target?.type ?? 'player',
        targetId: target?.id ?? null,
        iconEmoji: icon,
        label: labelMap[enemy.timedThreat.id] ?? '위협 충전',
        pattern: enemy.aiPattern ?? 'normal',
      };
    }
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- tests/unit/CombatTimedIntent.test.js`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add tests/unit/CombatTimedIntent.test.js js/systems/CombatSystem.js
git commit -m "feat(combat): timedThreat 카운트다운 의도 예고"
```

---

## Task 4: _resolveTimedThreat — 트리거 핸들러 (신규 함수)

**Files:**
- Create: `tests/unit/CombatTimedResolve.test.js`
- Modify: `js/systems/CombatSystem.js` (신규 메서드 `_resolveTimedThreat`, `_runEnemyAI` 뒤에 배치)

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/unit/CombatTimedResolve.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CombatSystem   from '../../js/systems/CombatSystem.js';
import GameState      from '../../js/core/GameState.js';
import SystemRegistry from '../../js/core/SystemRegistry.js';

beforeEach(() => {
  GameState.player.hp = { current: 100, max: 100 };
  GameState.companions = [];
  GameState.npcs = { states: {} };
  GameState.modStat = vi.fn();
  GameState.combat = {
    active: true, enemies: [], targetIndex: 0, log: [],
    playerStatus: [], enemyStatus: [], dangerLevel: 3,
  };
});

describe('_resolveTimedThreat', () => {
  it('self_destruct: 플레이어 광역 피해 + 감염 + 본체 사망', () => {
    const enemy = { id: 'zombie_bloater', name: '블로터', currentHp: 50, maxHp: 50,
      timedThreat: { id: 'self_destruct' }, _chargeRemaining: 0 };
    GameState.combat.enemies = [enemy];
    const hpBefore = GameState.player.hp.current;
    CombatSystem._resolveTimedThreat(enemy);
    expect(GameState.player.hp.current).toBeLessThan(hpBefore);
    expect(enemy.currentHp).toBe(0);
    expect(GameState.modStat).toHaveBeenCalledWith('infection', expect.any(Number));
  });

  it('charge_strike: 단일 강타 + 기절 부여', () => {
    const enemy = { id: 'zombie_charger', name: '돌진자', currentHp: 40, maxHp: 40,
      timedThreat: { id: 'charge_strike' }, _chargeRemaining: 0 };
    GameState.combat.enemies = [enemy];
    const hpBefore = GameState.player.hp.current;
    CombatSystem._resolveTimedThreat(enemy);
    expect(GameState.player.hp.current).toBeLessThan(hpBefore);
    expect(GameState.combat.playerStatus.some(s => s.id === 'stun')).toBe(true);
  });

  it('summon_horde: 적 배열 증가', () => {
    const enemy = { id: 'zombie_screamer', name: '스크리머', currentHp: 30, maxHp: 30,
      timedThreat: { id: 'summon_horde' }, _chargeRemaining: 0 };
    GameState.combat.enemies = [enemy];
    const before = GameState.combat.enemies.length;
    CombatSystem._resolveTimedThreat(enemy);
    expect(GameState.combat.enemies.length).toBeGreaterThan(before);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- tests/unit/CombatTimedResolve.test.js`
Expected: FAIL — `_resolveTimedThreat is not a function`

- [ ] **Step 3: _resolveTimedThreat 구현**

먼저 import 수정 — `js/systems/CombatSystem.js:14`의 `import { rollEnemyGroup } from '../data/enemies.js';`를 `import { rollEnemyGroup, rollEnemy } from '../data/enemies.js';`로 변경(스크리머 소환에 `rollEnemy` 필요).

그다음 `_runEnemyAI(enemy) { ... }` 메서드 정의 **뒤**에 신규 메서드 추가:

```js
  // ── 타이밍 압박 트리거 발동 ─────────────────────────────
  _resolveTimedThreat(enemy) {
    const gs = GameState;
    const T = BALANCE.combat.timedThreats;
    const npcSys = SystemRegistry.get('NPCSystem');

    if (enemy.timedThreat?.id === 'self_destruct') {
      const [dMin, dMax] = T.bloater.aoeDamage;
      const dmg = dMin + Math.floor(Math.random() * (dMax - dMin + 1));
      gs.player.hp.current = Math.max(0, gs.player.hp.current - dmg);
      gs.modStat('infection', T.bloater.infectionCloud);
      gs.combat.lastHit = { target: 'player', damage: dmg, isCrit: false };
      EventBus.emit('playerHit', { damage: dmg });
      for (const id of (gs.companions ?? [])) {
        const st = gs.npcs?.states?.[id];
        if (st && (st.hp ?? 0) > 0 && npcSys?.damageCompanion) npcSys.damageCompanion(id, dmg);
      }
      enemy.currentHp = 0;
      gs.combat.log.push(I18n.t('combatSys.bloaterExplode', { enemy: I18n.enemyName(enemy.id, enemy.name), dmg }));
      return;
    }

    if (enemy.timedThreat?.id === 'charge_strike') {
      const [dMin, dMax] = T.charger.strikeDamage;
      let dmg = dMin + Math.floor(Math.random() * (dMax - dMin + 1));
      const armor = StatSystem.getArmorEffects();
      if (armor.damageReduction > 0) dmg = Math.max(1, Math.floor(dmg * (1 - armor.damageReduction)));
      gs.player.hp.current = Math.max(0, gs.player.hp.current - dmg);
      if (!gs.combat.playerStatus.some(s => s.id === 'stun')) {
        gs.combat.playerStatus.push({ id: 'stun', name: I18n.t('combatSys.stun'), duration: T.charger.strikeStun, effect: {} });
      }
      gs.combat.lastHit = { target: 'player', damage: dmg, isCrit: true };
      EventBus.emit('playerHit', { damage: dmg });
      BodySystem.onCombatHit(dmg, enemy);
      gs.combat.log.push(I18n.t('combatSys.chargerStrike', { enemy: I18n.enemyName(enemy.id, enemy.name), dmg }));
      return;
    }

    if (enemy.timedThreat?.id === 'summon_horde') {
      const [cMin, cMax] = T.screamer.summonCount;
      const count = cMin + Math.floor(Math.random() * (cMax - cMin + 1));
      for (let i = 0; i < count; i++) {
        const add = rollEnemy(gs.combat.dangerLevel ?? 3);
        add._nextIntent = this._decideNextIntent(add, gs.combat, gs);
        gs.combat.enemies.push(add);
        gs.combat.turnQueue?.push({ type: 'enemy', enemyIdx: gs.combat.enemies.length - 1, order: gs.combat.turnQueue.length });
      }
      NoiseSystem.addNoise(T.screamer.summonNoise);
      gs.combat.log.push(I18n.t('combatSys.screamerSummon', { enemy: I18n.enemyName(enemy.id, enemy.name), count }));
      return;
    }
  },
```

> i18n 키 `combatSys.bloaterExplode`·`combatSys.chargerStrike`·`combatSys.screamerSummon`는 Step 4에서 추가. 누락 시 `I18n.t`는 키 문자열을 반환하므로 테스트는 통과하나, 로그 품질을 위해 추가한다.

- [ ] **Step 4: i18n 키 추가**

`js/data/locales.js`의 한글/영문 `combatSys.*` 블록에 각각 추가:
```js
// 한글
'combatSys.bloaterExplode': '💥 {enemy} 자폭! 광역 {dmg} 피해 + 감염 확산',
'combatSys.chargerStrike':  '⚡ {enemy} 강타! {dmg} 피해 + 기절',
'combatSys.screamerSummon': '📣 {enemy} 비명! 감염자 {count}마리 합류',
// 영문
'combatSys.bloaterExplode': '💥 {enemy} self-destructs! {dmg} AoE damage + infection',
'combatSys.chargerStrike':  '⚡ {enemy} charges! {dmg} damage + stun',
'combatSys.screamerSummon': '📣 {enemy} screams! {count} infected join',
```

- [ ] **Step 5: 통과 확인**

Run: `npm test -- tests/unit/CombatTimedResolve.test.js`
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add tests/unit/CombatTimedResolve.test.js js/systems/CombatSystem.js js/data/locales.js
git commit -m "feat(combat): _resolveTimedThreat 트리거 핸들러(자폭/강타/소환)"
```

---

## Task 5: _runSingleEnemyTurn — 충전 틱/발동 통합

**Files:**
- Create: `tests/integration/CombatTimedTick.int.test.js`
- Modify: `js/systems/CombatSystem.js` (`_runSingleEnemyTurn`, CombatSystem.js:863)

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/integration/CombatTimedTick.int.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CombatSystem   from '../../js/systems/CombatSystem.js';
import GameState      from '../../js/core/GameState.js';
import SystemRegistry from '../../js/core/SystemRegistry.js';

beforeEach(() => {
  SystemRegistry.register('NPCSystem', { damageCompanion: vi.fn(), getCompanionCombatBonus: () => 1.0 });
  GameState.player.hp = { current: 100, max: 100 };
  GameState.companions = [];
  GameState.npcs = { states: {} };
  GameState.modStat = vi.fn();
});

function bloater() {
  return {
    id: 'zombie_bloater', name: '블로터', icon: '🤰',
    currentHp: 50, maxHp: 50, aiPattern: 'normal',
    specialSkills: [], _skillCooldowns: {}, attack: { damage: [4, 8], accuracy: 1.0 },
    weaknesses: ['fire'], resistances: [],
    timedThreat: { id: 'self_destruct', chargeTurns: 3, chargingAttacks: true },
    _chargeRemaining: 1,
  };
}

describe('_runSingleEnemyTurn — 충전 틱', () => {
  it('_chargeRemaining > 0 이면 1 감소(발동 안 함)', () => {
    const e = bloater(); e._chargeRemaining = 2;
    GameState.combat = { active: true, enemies: [e], targetIndex: 0, log: [], playerStatus: [], enemyStatus: [], turnQueue: [], dangerLevel: 3 };
    CombatSystem._runSingleEnemyTurn(0);
    expect(e._chargeRemaining).toBe(1);
    expect(e.currentHp).toBe(50); // 자폭 안 함
  });

  it('_chargeRemaining === 0 이면 트리거 발동(자폭→본체 사망)', () => {
    const e = bloater(); e._chargeRemaining = 0;
    GameState.combat = { active: true, enemies: [e], targetIndex: 0, log: [], playerStatus: [], enemyStatus: [], turnQueue: [], dangerLevel: 3 };
    CombatSystem._runSingleEnemyTurn(0);
    expect(e.currentHp).toBe(0);
  });

  it('chargingAttacks false(돌진자)면 충전 중 평타 없음', () => {
    const c = {
      id: 'zombie_charger', name: '돌진자', currentHp: 40, maxHp: 40, aiPattern: 'aggressive',
      specialSkills: [], _skillCooldowns: {}, attack: { damage: [6, 10], accuracy: 1.0 },
      weaknesses: [], resistances: [],
      timedThreat: { id: 'charge_strike', chargeTurns: 1, chargingAttacks: false },
      _chargeRemaining: 1,
    };
    GameState.combat = { active: true, enemies: [c], targetIndex: 0, log: [], playerStatus: [], enemyStatus: [], turnQueue: [], dangerLevel: 3 };
    const hpBefore = GameState.player.hp.current;
    CombatSystem._runSingleEnemyTurn(0);
    expect(GameState.player.hp.current).toBe(hpBefore); // 와인드업: 평타 없음
    expect(c._chargeRemaining).toBe(0);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- tests/integration/CombatTimedTick.int.test.js`
Expected: FAIL — 충전 로직 없어 평타/자폭이 기대와 불일치.

- [ ] **Step 3: _runSingleEnemyTurn 수정**

`_runSingleEnemyTurn(enemyIdx)`(CombatSystem.js:863) 본문 시작 `const enemy = ...; if (!enemy || enemy.currentHp <= 0) return;` **직후**에 충전 분기 삽입:

```js
    // 타이밍 압박: 충전 중/발동 처리
    if ((enemy._chargeRemaining ?? null) !== null) {
      if (enemy._chargeRemaining > 0) {
        if (enemy.timedThreat?.chargingAttacks) {
          const logs = this._runEnemyAI(enemy);
          for (const log of logs) { gs.combat.log.push(log); if (gs.player.hp.current <= 0) return; }
        }
        enemy._chargeRemaining -= 1;
        enemy._nextIntent = this._decideNextIntent(enemy, gs.combat, gs) ?? null;
        return;
      }
      // _chargeRemaining === 0 → 발동
      this._resolveTimedThreat(enemy);
      enemy._chargeRemaining = enemy.timedThreat?.chargeTurns ?? null; // 재충전(생존 시)
      if (enemy.currentHp > 0) enemy._nextIntent = this._decideNextIntent(enemy, gs.combat, gs) ?? null;
      return;
    }
```

(기존 intent 라우팅 로직은 그 아래 유지.)

- [ ] **Step 4: 통과 확인**

Run: `npm test -- tests/integration/CombatTimedTick.int.test.js`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add tests/integration/CombatTimedTick.int.test.js js/systems/CombatSystem.js
git commit -m "feat(combat): 충전 틱/발동 모델(_runSingleEnemyTurn)"
```

---

## Task 6: _onEnemyKilled — 약점 깨끗 처치 / 사체 폭발 / silent 비명 차단

**Files:**
- Create: `tests/unit/CombatKillCounter.test.js`
- Modify: `js/systems/CombatSystem.js` (`_attackAction`에서 처치 시 컨텍스트 전달, `_onEnemyKilled`)

설계: 블로터를 **약점(fire/explosive) 외**로 처치하면서 플레이어가 **근접 무기 사용 중**이면 사체 폭발. 스크리머를 **silent 무기**로 처치하면 비명 차단(차단 자체는 충전을 끝낸 처치이므로 추가 행동 없음 — silent가 아니면 처치 순간 비명이 한 번 터지는 페널티).

`_attackAction`은 처치 직전 사용 무기 컨텍스트를 알고 있으므로, 처치로 이어질 때 `gs.combat._lastKillContext = { weaponType, isSilent, isMelee }`를 세팅하고 `_onEnemyKilled`가 이를 참조한다.

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/unit/CombatKillCounter.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState    from '../../js/core/GameState.js';

beforeEach(() => {
  GameState.player.hp = { current: 100, max: 100 };
  GameState.player.xp = 0;
  GameState.player.characterId = 'firefighter';
  GameState.player.equipped = {};
  GameState.companions = [];
  GameState.npcs = { states: {} };
  GameState.flags = {};
  GameState.modStat = vi.fn();
  GameState.createCardInstance = vi.fn(() => null);
  GameState.placeCardInRow = vi.fn(() => null);
  GameState.cards = {};
  GameState.getCardDef = () => null;
  GameState.combat = { active: true, enemies: [], targetIndex: 0, log: [], rewards: [], playerStatus: [], enemyStatus: [], xpGained: 0 };
});

describe('_onEnemyKilled — 블로터 사체 폭발', () => {
  it('약점 외 + 근접 처치 → 플레이어 추가 피해', () => {
    const e = { id: 'zombie_bloater', name: '블로터', currentHp: 0, maxHp: 50, xp: 32,
      weaknesses: ['fire', 'explosive'], lootTable: [],
      timedThreat: { id: 'self_destruct' } };
    GameState.combat.enemies = [e];
    GameState.combat._lastKillContext = { weaponType: 'blade', isSilent: false, isMelee: true };
    const hpBefore = GameState.player.hp.current;
    CombatSystem._onEnemyKilled(e);
    expect(GameState.player.hp.current).toBeLessThan(hpBefore);
  });

  it('약점(fire) 처치 → 사체 폭발 없음', () => {
    const e = { id: 'zombie_bloater', name: '블로터', currentHp: 0, maxHp: 50, xp: 32,
      weaknesses: ['fire', 'explosive'], lootTable: [],
      timedThreat: { id: 'self_destruct' } };
    GameState.combat.enemies = [e];
    GameState.combat._lastKillContext = { weaponType: 'fire', isSilent: false, isMelee: false };
    const hpBefore = GameState.player.hp.current;
    CombatSystem._onEnemyKilled(e);
    expect(GameState.player.hp.current).toBe(hpBefore);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- tests/unit/CombatKillCounter.test.js`
Expected: FAIL — 약점 외 근접 처치인데 HP 변화 없음.

- [ ] **Step 3: _attackAction — 처치 컨텍스트 기록**

`_attackAction`(CombatSystem.js:302) 안에서 `enemy.currentHp = Math.max(0, enemy.currentHp - finalDmg);`(라인 433) **직후**에 추가:

```js
      if (enemy.currentHp <= 0) {
        const wDef = (weaponId && gs.cards[weaponId]) ? gs.getCardDef(weaponId) : null;
        gs.combat._lastKillContext = {
          weaponType: wDef?.weaponType ?? 'unarmed',
          isSilent:   !!wDef?.tags?.includes('silent'),
          isMelee:    !wDef?.combat?.requiresAmmo,
        };
      }
```

- [ ] **Step 4: _onEnemyKilled — 카운터 분기 추가**

`_onEnemyKilled(enemy)`(CombatSystem.js:1109) 본문 맨 앞(`const gs = GameState;` 다음)에 추가:

```js
    const killCtx = gs.combat._lastKillContext ?? {};
    gs.combat._lastKillContext = null;

    if (enemy.timedThreat?.id === 'self_destruct') {
      const cleanKill = (enemy.weaknesses ?? []).includes(killCtx.weaponType);
      if (!cleanKill && killCtx.isMelee) {
        const [bMin, bMax] = BALANCE.combat.timedThreats.bloater.corpseBurst;
        const burst = bMin + Math.floor(Math.random() * (bMax - bMin + 1));
        gs.player.hp.current = Math.max(0, gs.player.hp.current - burst);
        gs.combat.lastHit = { target: 'player', damage: burst, isCrit: false };
        EventBus.emit('playerHit', { damage: burst });
        gs.combat.log.push(I18n.t('combatSys.bloaterCorpseBurst', { dmg: burst }));
      }
    }
    if (enemy.timedThreat?.id === 'summon_horde' && !killCtx.isSilent) {
      // silent 아니면 처치 순간 1회 비명: 소음만 추가(증원 없이 페널티)
      NoiseSystem.addNoise(BALANCE.combat.timedThreats.screamer.summonNoise);
      gs.combat.log.push(I18n.t('combatSys.screamerDeathCry'));
    }
```

- [ ] **Step 5: i18n 키 추가 (locales.js 한/영)**

```js
'combatSys.bloaterCorpseBurst': '☠️ 사체 폭발! {dmg} 피해 (불·폭발로 처리했어야 했다)',
'combatSys.screamerDeathCry':   '📣 스크리머가 마지막 비명을 질렀다 (소음 급증)',
// 영문
'combatSys.bloaterCorpseBurst': '☠️ Corpse burst! {dmg} damage (should have used fire/explosive)',
'combatSys.screamerDeathCry':   '📣 The screamer let out a final cry (noise spike)',
```

- [ ] **Step 6: 통과 확인**

Run: `npm test -- tests/unit/CombatKillCounter.test.js`
Expected: PASS

- [ ] **Step 7: 커밋**

```bash
git add tests/unit/CombatKillCounter.test.js js/systems/CombatSystem.js js/data/locales.js
git commit -m "feat(combat): 약점 깨끗 처치/사체 폭발/스크리머 비명 차단"
```

---

## Task 7: 사기 격파 (크리티컬 사기 피해 + 동료 사망 + rout)

**Files:**
- Create: `tests/integration/CombatMoraleBreak.int.test.js`
- Modify: `js/systems/CombatSystem.js` (`_attackAction` 크리 시 사기 감소, `_onEnemyKilled` 인간 사망 시 전체 인간 사기 감소, `_processAiTurns` 또는 `_runSingleEnemyTurn`에 rout 체크)

설계: rout 체크는 적 자기 턴 시작에서 수행. 도주한 적은 `currentHp = 0` + `_routed = true`로 마킹해 `_allEnemiesDead`/전리품 로직이 사망과 동일하게 처리하되, 전리품 드롭 확률은 `routLootMult` 배.

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/integration/CombatMoraleBreak.int.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState    from '../../js/core/GameState.js';
import BALANCE      from '../../js/data/gameBalance.js';

beforeEach(() => {
  GameState.player.hp = { current: 100, max: 100 };
  GameState.player.xp = 0;
  GameState.player.characterId = 'soldier';
  GameState.companions = [];
  GameState.npcs = { states: {} };
  GameState.flags = {};
  GameState.modStat = vi.fn();
  GameState.createCardInstance = vi.fn(() => null);
  GameState.placeCardInRow = vi.fn(() => null);
  GameState.cards = {};
  GameState.getCardDef = () => null;
});

describe('사기 격파', () => {
  it('인간 적 사망 시 살아있는 인간 적 사기 감소', () => {
    const dead  = { id: 'raider', name: '약탈자', type: 'human', currentHp: 0, maxHp: 50, xp: 25, currentMorale: 100, lootTable: [] };
    const alive = { id: 'raider', name: '약탈자', type: 'human', currentHp: 40, maxHp: 50, currentMorale: 100, lootTable: [] };
    GameState.combat = { active: true, enemies: [dead, alive], targetIndex: 0, log: [], rewards: [], playerStatus: [], enemyStatus: [], xpGained: 0 };
    CombatSystem._onEnemyKilled(dead);
    expect(alive.currentMorale).toBe(100 - BALANCE.combat.moraleBreak.allyDeathMoraleDmg);
  });

  it('사기 ≤ 0 인 적은 rout 판정으로 currentHp 0', () => {
    const e = { id: 'raider', name: '약탈자', type: 'human', currentHp: 30, maxHp: 50, currentMorale: 0, lootTable: [], attack: { damage: [5, 8], accuracy: 1.0 }, aiPattern: 'aggressive', specialSkills: [], _skillCooldowns: {} };
    GameState.combat = { active: true, enemies: [e], targetIndex: 0, log: [], rewards: [], playerStatus: [], enemyStatus: [], turnQueue: [], dangerLevel: 2 };
    CombatSystem._runSingleEnemyTurn(0);
    expect(e.currentHp).toBe(0);
    expect(e._routed).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- tests/integration/CombatMoraleBreak.int.test.js`
Expected: FAIL — 사기 감소·rout 로직 없음.

- [ ] **Step 3: _onEnemyKilled — 인간 사망 시 사기 전파**

`_onEnemyKilled`(CombatSystem.js:1109)의 Task 6에서 추가한 블록 다음에 추가:

```js
    if (enemy.type === 'human') {
      const mb = BALANCE.combat.moraleBreak;
      for (const other of gs.combat.enemies) {
        if (other !== enemy && other.type === 'human' && other.currentHp > 0 && other.currentMorale != null) {
          other.currentMorale = Math.max(0, other.currentMorale - mb.allyDeathMoraleDmg);
        }
      }
    }
```

- [ ] **Step 4: _attackAction — 크리티컬 시 인간 타겟 사기 감소**

`_attackAction`(CombatSystem.js:302)에서 Task 3-Step3의 처치 컨텍스트 기록 블록 근처(`enemy.currentHp` 차감 후, 크리 판정 `isCrit` 변수 사용 가능 위치)에 추가:

```js
      if (isCrit && enemy.type === 'human' && enemy.currentMorale != null) {
        enemy.currentMorale = Math.max(0, enemy.currentMorale - BALANCE.combat.moraleBreak.critMoraleDmg);
      }
```

- [ ] **Step 5: _runSingleEnemyTurn — rout 체크**

`_runSingleEnemyTurn`(CombatSystem.js:863) 본문 시작, `if (!enemy || enemy.currentHp <= 0) return;` **직후**(충전 분기보다 먼저)에 추가:

```js
    // 사기 격파: 사기 소진 시 도주(rout)
    if (enemy.type === 'human' && enemy.currentMorale != null
        && enemy.currentMorale <= BALANCE.combat.moraleBreak.routThreshold) {
      enemy._routed = true;
      enemy.currentHp = 0;
      gs.combat.log.push(I18n.t('combatSys.enemyRout', { enemy: I18n.enemyName(enemy.id, enemy.name) }));
      return;
    }
```

- [ ] **Step 6: _onEnemyKilled — rout 전리품 배율**

`_onEnemyKilled`의 loot 루프(CombatSystem.js:1141)에서 `if (Math.random() < BALANCE.combat.enemyDropChance)`를 다음으로 변경:

```js
      const dropChance = enemy._routed
        ? BALANCE.combat.enemyDropChance * BALANCE.combat.moraleBreak.routLootMult
        : BALANCE.combat.enemyDropChance;
      if (Math.random() < dropChance) {
```

- [ ] **Step 7: i18n 키 + raider 사기 데이터**

`js/data/enemies.js`의 `raider`·`raider_elite`에 `morale: { min: 80, max: 120 }`(raider), `morale: { min: 110, max: 150 }`(raider_elite) 추가.
`locales.js`:
```js
'combatSys.enemyRout': '🏳️ {enemy}이(가) 전의를 잃고 도주했다!',
// 영문
'combatSys.enemyRout': '🏳️ {enemy} lost their will and fled!',
```

- [ ] **Step 8: 통과 확인**

Run: `npm test -- tests/integration/CombatMoraleBreak.int.test.js`
Expected: PASS

- [ ] **Step 9: 커밋**

```bash
git add tests/integration/CombatMoraleBreak.int.test.js js/systems/CombatSystem.js js/data/enemies.js js/data/locales.js
git commit -m "feat(combat): 인간 적 사기 격파 승리(크리/동료사망/도주)"
```

---

## Task 8: 인터럽트 — electric 기절로 충전 지연/리셋

**Files:**
- Create: `tests/unit/CombatChargeInterrupt.test.js`
- Modify: `js/systems/CombatSystem.js` (`_attackAction` 기절 부여 지점 — 무기 `statusInflict` stun 처리)

설계: 무기의 `statusInflict.id === 'stun'`(stun_baton 등)이 충전 중(`_chargeRemaining > 0`, `counters.stunDelays`) 적에게 명중하면 `charge_strike`는 리셋(`chargeTurns`로 복원), 그 외(self_destruct/summon_horde)는 +1 지연.

현재 `_attackAction`은 무기 `statusInflict`를 적에게 부여하는 로직이 명시적이지 않다(코드 확인 결과 적 statusInflict 부여는 enemy→player 방향만 존재). 따라서 무기→적 stun 부여 + 인터럽트를 함께 추가한다.

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/unit/CombatChargeInterrupt.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState    from '../../js/core/GameState.js';

beforeEach(() => {
  GameState.player.hp = { current: 100, max: 100 };
  GameState.player.equipped = { weapon_main: 'baton_inst' };
  GameState.companions = [];
  GameState.npcs = { states: {} };
  GameState.flags = {};
  GameState.modStat = vi.fn();
  GameState.cards = { baton_inst: { instanceId: 'baton_inst', definitionId: 'stun_baton', durability: 100, _quality: 'normal' } };
  GameState.getCardDef = (id) => id === 'baton_inst' ? {
    id: 'stun_baton', weaponType: 'electric',
    combat: { damage: [14, 26], accuracy: 1.0, noiseOnUse: 2, durabilityLoss: 6, critChance: 0,
      statusInflict: { id: 'stun', name: '기절', duration: 1, chance: 1.0 } },
    tags: ['weapon', 'melee', 'silent'],
  } : null;
});

describe('충전 인터럽트', () => {
  it('charge_strike 적이 기절하면 _chargeRemaining 리셋', () => {
    const c = { id: 'zombie_charger', name: '돌진자', currentHp: 999, maxHp: 999, defense: 0,
      weaknesses: [], resistances: [], _statusEffects: [],
      timedThreat: { id: 'charge_strike', chargeTurns: 1, counters: { stunDelays: true } },
      _chargeRemaining: 0 };
    GameState.combat = { active: true, enemies: [c], targetIndex: 0, log: [], playerStatus: [], enemyStatus: [], playerGuard: null };
    CombatSystem._attackAction('melee', 'baton_inst', c);
    expect(c._chargeRemaining).toBe(1);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- tests/unit/CombatChargeInterrupt.test.js`
Expected: FAIL — `_chargeRemaining` 여전히 0.

- [ ] **Step 3: _attackAction — 무기 stun 부여 + 인터럽트**

`_attackAction`(CombatSystem.js:302)에서 명중(`if (hit) { ... }`) 블록 안, `enemy.currentHp` 차감 직후에 추가:

```js
      // 무기 기절 부여 + 충전 적 인터럽트
      const wInst = (weaponId && gs.cards[weaponId]) ? gs.getCardDef(weaponId) : null;
      const stunDef = wInst?.combat?.statusInflict;
      if (stunDef?.id === 'stun' && enemy.currentHp > 0 && Math.random() < (stunDef.chance ?? 1)) {
        if ((enemy._chargeRemaining ?? null) !== null && enemy.timedThreat?.counters?.stunDelays) {
          enemy._chargeRemaining = enemy.timedThreat.id === 'charge_strike'
            ? enemy.timedThreat.chargeTurns
            : enemy._chargeRemaining + 1;
          enemy._nextIntent = this._decideNextIntent(enemy, gs.combat, gs) ?? null;
          gs.combat.log.push(I18n.t('combatSys.chargeInterrupt', { enemy: I18n.enemyName(enemy.id, enemy.name) }));
        }
      }
```

- [ ] **Step 4: i18n 키 추가 (locales.js)**

```js
'combatSys.chargeInterrupt': '⚡ {enemy}의 위협 충전을 끊었다!',
// 영문
'combatSys.chargeInterrupt': '⚡ Interrupted {enemy}\'s threat charge!',
```

- [ ] **Step 5: 통과 확인**

Run: `npm test -- tests/unit/CombatChargeInterrupt.test.js`
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add tests/unit/CombatChargeInterrupt.test.js js/systems/CombatSystem.js js/data/locales.js
git commit -m "feat(combat): electric 기절로 위협 충전 인터럽트"
```

---

## Task 9: CombatUI — 이니셔티브 바 카운트다운

**Files:**
- Create: `tests/integration/CombatTimedHud.int.test.js`
- Modify: `js/ui/CombatUI.js` (`_renderInitiativeBar`, CombatUI.js:118)

- [ ] **Step 1: 실패 테스트 작성**

```js
// @vitest-environment happy-dom
// tests/integration/CombatTimedHud.int.test.js
import { describe, it, expect } from 'vitest';
import CombatUI  from '../../js/ui/CombatUI.js';
import GameState from '../../js/core/GameState.js';

describe('이니셔티브 바 — 타이밍 압박 카운트다운', () => {
  it('countdown 있는 적: init-countdown span + 숫자, charging 클래스(임박)', () => {
    const combat = {
      turnQueue: [
        { type: 'player', order: 0 },
        { type: 'enemy', enemyIdx: 0, order: 1 },
      ],
      activeIdx: 0, roundNumber: 1,
      enemies: [{
        id: 'zombie_bloater', name: '블로터', icon: '🤰',
        currentHp: 50, maxHp: 50,
        _nextIntent: { iconEmoji: '💥', label: '1턴 후 자폭', countdown: 1 },
      }],
    };
    const html = CombatUI._renderInitiativeBar(combat, GameState);
    expect(html).toContain('init-countdown');
    expect(html).toContain('charging');   // countdown <= 1 → 점멸 강조
    expect(html).toContain('>1<');        // 카운트다운 숫자
  });

  it('countdown 없으면 init-countdown 미렌더', () => {
    const combat = {
      turnQueue: [{ type: 'player', order: 0 }, { type: 'enemy', enemyIdx: 0, order: 1 }],
      activeIdx: 0, roundNumber: 1,
      enemies: [{ id: 'e', name: '좀비', icon: '🧟', currentHp: 30, maxHp: 30,
        _nextIntent: { iconEmoji: '🗡', label: '플레이어 공격' } }],
    };
    const html = CombatUI._renderInitiativeBar(combat, GameState);
    expect(html).not.toContain('init-countdown');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- tests/integration/CombatTimedHud.int.test.js`
Expected: FAIL — `init-countdown` 미존재.

- [ ] **Step 3: _renderInitiativeBar 수정**

`_renderInitiativeBar`(CombatUI.js:118)의 enemy 분기에서 `intentIcon`/`intentLabel`을 세팅하는 블록에 countdown 추출 추가:

```js
          if (!dead && e._nextIntent) {
            intentIcon  = e._nextIntent.iconEmoji ?? '';
            intentLabel = e._nextIntent.label ?? '';
            countdown   = e._nextIntent.countdown ?? null;   // 신규
          }
```

슬롯 상단에 `let countdown = null;` 선언 추가(intentIcon 선언부 근처). cls 배열 빌드 직후, countdown 임박이면 charging 추가:

```js
      if (countdown != null && countdown <= 1) cls.push('charging');
```

`intentHtml` 다음에 countdown HTML 추가하고 슬롯 템플릿에 삽입:

```js
      const countdownHtml = countdown != null
        ? `<span class="init-countdown">${countdown}</span>`
        : '';
```

슬롯 반환 템플릿의 `${intentHtml}` 다음 줄에 `${countdownHtml}` 삽입.

- [ ] **Step 4: 통과 확인**

Run: `npm test -- tests/integration/CombatTimedHud.int.test.js`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add tests/integration/CombatTimedHud.int.test.js js/ui/CombatUI.js
git commit -m "feat(combat): 이니셔티브 바 타이밍 압박 카운트다운 표시"
```

---

## Task 10: CSS — charging 점멸 키프레임

**Files:**
- Modify: `css/screens-combat.css`

- [ ] **Step 1: charging 스타일 추가**

`css/screens-combat.css` 끝에 추가(기존 `.init-slot`/`.init-intent` 셀렉터 네이밍 확인 후 일치):

```css
.init-countdown {
  font-size: 11px;
  font-weight: 700;
  color: #ff5a3c;
  margin-left: 2px;
}
.init-slot.charging {
  animation: init-charge-pulse 0.7s ease-in-out infinite;
}
@keyframes init-charge-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 90, 60, 0.0); }
  50%      { box-shadow: 0 0 8px 2px rgba(255, 90, 60, 0.7); }
}
```

- [ ] **Step 2: 수동 확인 (테스트 없음 — 시각 요소)**

Run: `npm run dev:web` → DL4 구역 전투 진입 → 블로터/돌진자 조우 시 이니셔티브 슬롯 카운트다운 숫자·임박 점멸 육안 확인.

- [ ] **Step 3: 커밋**

```bash
git add css/screens-combat.css
git commit -m "style(combat): charging 카운트다운 점멸 애니메이션"
```

---

## Task 11: 통합 검증

**Files:** 없음 (실행/측정만)

- [ ] **Step 1: 데이터 검증**

Run: `node js/data/validate.js`
Expected: 오류 없음 (신규 적 loot id가 기존 아이템 참조하는지 확인).

- [ ] **Step 2: 전체 테스트**

Run: `npm test`
Expected: 신규 테스트 포함 전체 PASS, 0 실패.

- [ ] **Step 3: 치사율 시뮬 재측정 (신규 적 반영)**

`testdata/sim_combat_lethality.mjs`에 신규 적 3종을 적별 분석에 포함하도록 적 목록을 확장(파일 내 적 정의/임포트 경로 확인). 실행:
Run: `node testdata/sim_combat_lethality.mjs`
Expected: 신규 적 단독 전사율이 동 DL 기존 적 대비 +10%p 이내(스펙 §7 가드레일). 초과 시 `gameBalance.combat.timedThreats` 수치 조정 후 재측정.

- [ ] **Step 4: 수동 플레이 확인**

`npm run dev:web` → DL4 진입 → 블로터(자폭 카운트다운→화염병 카운터), 스크리머(silent 처치 비명 차단), 돌진자(방어 반격/전기 인터럽트), 약탈자 사기 격파(연쇄 도주) 각 1회 육안 확인.

- [ ] **Step 5: 최종 커밋(필요 시 밸런스 조정)**

```bash
git add -A
git commit -m "test(combat): 타이밍 압박 적 시뮬 재측정 + 밸런스 조정"
```

---

## Self-Review 메모

- **스펙 커버리지:** §3 아키텍처(Task 3·5·9) / §4 3종(Task 2·4·5) / §5 사기 격파(Task 7) / §6 어휘 정리(Task 0) / §7 가드레일(Task 11-3) / §8 검증(Task 11) — 전 항목 대응 태스크 존재.
- **타입 일관성:** `_chargeRemaining`·`currentMorale`·`_routed`·`_lastKillContext`·`timedThreat.{id,chargeTurns,chargingAttacks,counters}`·intent `{action:'timed_threat',countdown,threatId}` — 태스크 간 명칭 일치 확인.
- **인터럽트 의존성:** Task 8은 무기 `statusInflict.stun`을 적에게 부여하는 로직을 신규 추가(기존엔 enemy→player만 존재). stun_baton 외 `nailed_hammer`도 `statusInflict.stun`을 가지므로 동일 경로로 동작.
- **미채택(추후 검토):** 임계 소음 격노·인터럽트 공통 규칙 일반화·소프트 장갑 부위 조준은 스펙 §9에 기록, 본 계획 범위 외.
