# Player Weapon Magazine and Dual Attack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 플레이어의 총기·석궁에 지속되는 20발 탄창과 전투 중 재장전을 도입하고, 원거리 주무기와 근접 보조무기/맨손 공격을 선택하게 하며, NPC는 탄약을 쓰지 않는 고정 스킬 공격을 유지한다.

**Architecture:** `WeaponAmmoSystem`이 무기 인스턴스의 `loadedAmmo`와 탄약 세트 소비를 단독 소유하고, `WeaponSlotPolicy`가 원거리/근접 슬롯 판정과 구버전 저장 마이그레이션을 공유한다. 랭크 전투는 장비 스킬의 `magazineRound` 비용을 검증·소비하고, 빈 탄창일 때 같은 원거리 카드가 대상 없는 재장전 명령으로 바뀐다. NPC는 장비 카드 대신 `COMPANION_COMBAT_LOADOUTS`만 사용하며 각 전투원의 `combatDamageMultiplier`로 자신의 고정 공격을 보정한다.

**Tech Stack:** ES modules, Vitest 4, happy-dom, Vite 8, 기존 EventBus/I18n/CSS 토큰

## Global Constraints

- 적용 대상은 `combat.requiresAmmo`가 있는 플레이어 장착 무기 전체이며 총기, 석궁, 정밀 석궁을 포함한다.
- 모든 적용 무기의 탄창 용량은 정확히 20발이다.
- 신규 무기와 `loadedAmmo`가 없는 기존 저장 데이터의 무기는 `0/20`으로 시작한다.
- 탄약 카드 `quantity` 1은 20발 세트 1장이며, 빈 탄창 재장전 때만 정확히 1 감소한다.
- 재장전은 전투 행동 1회를 소비하고, 탄창이 1발 이상이면 실행할 수 없다.
- 발사 공격은 명중·빗나감·산탄총 다중 대상 여부와 관계없이 명령 1회당 정확히 1발을 소비한다.
- 총기 근접 폴백과 플레이어 원거리 숙련도의 탄약 미소모 확률을 제거한다.
- `weapon_main`은 `combat.requiresAmmo` 원거리 무기만, `weapon_sub`는 `subtype: melee` 근접 무기만 허용한다.
- 근접 보조무기가 없으면 `basic_strike` 맨손 공격을 제공한다.
- NPC는 탄약 카드, `loadedAmmo`, 재장전, 장착 무기 인스턴스를 사용하지 않는다.
- NPC 고정 공격은 본인의 양수 `companion.combatDmg`를 사용하며 누락·0 이하·비정상 값은 `1.0`으로 처리한다.
- 기존 `DESIGN.md`와 `css/variables.css`의 compact industrial UI 및 `--text-danger`, `--accent-primary` 토큰을 유지한다.
- 실패한 공격·재장전은 탄약, 내구도, 소음, 턴을 소비하지 않는다.

---

## File Map

**Create**

- `js/systems/WeaponAmmoSystem.js` — 탄창 정규화, 발사 가능 검사, 1발 소비, 탄약 세트 탐색과 재장전
- `js/systems/WeaponSlotPolicy.js` — 원거리/근접 슬롯 판정과 저장 데이터 슬롯 복구
- `tests/unit/WeaponAmmoSystem.test.js` — 탄창·탄약 세트 원자성 단위 테스트
- `tests/unit/EquipmentSystem_weaponSlots.test.js` — 엄격한 두 무기 슬롯 규칙 테스트
- `tests/integration/WeaponAmmoCombat.int.test.js` — 발사·빗나감·재장전·턴·잔탄 유지 통합 테스트
- `tests/integration/WeaponAmmoUI.int.test.js` — 카드 표면·상세 모달·전투 명령 덱 상태 테스트

**Modify**

- `js/core/GameState.js` — 신규 무기 `loadedAmmo: 0`, 저장 복원 정규화와 슬롯 마이그레이션
- `js/systems/EquipmentSystem.js` — `WeaponSlotPolicy`를 사용하는 원거리/근접 전용 슬롯
- `js/systems/combat/CombatSkillSystem.js` — 플레이어 이중 공격 loadout, NPC 고정 loadout, `magazineRound` 검증
- `js/systems/combat/CombatRankedEffects.js` — 탄창 1발 소비와 NPC 개별 공격력 배율
- `js/systems/combat/CombatantAdapter.js` — 동료별 `combatDamageMultiplier` 전달
- `js/systems/CombatSystem.js` — 발사 검증 context, 재장전 명령, 레거시 무탄약 폴백 제거
- `js/ui/CombatUI.js` — 공격/재장전/탄약 없음 3상태 렌더와 클릭 처리
- `js/ui/CardFactory.js` — 일반 무기 카드의 `N/20` 배지
- `js/ui/ModalManager.js` — 장전 탄약·호환 탄약·탄약 세트 크기 상세
- `js/ui/EquipmentModal.js` — 원거리 주무기/근접 보조무기 라벨과 아이콘
- `js/data/items_combat.js` — 권총·산탄·석궁·소총 탄약의 20발 세트 설명
- `js/data/legendaryItems.js` — 병합 후 최종 `rifle_ammo` 설명의 20발 세트 의미 유지
- `js/data/locales.js` — 한/영 슬롯, 탄창, 재장전, 오류 메시지
- `css/cards.css` — 잔탄 배지 상태
- `css/screens-combat.css` — 재장전/탄약 없음 전투 카드 상태
- `tests/unit/GameState.test.js` — 생성·직렬화·역직렬화 잔탄 테스트
- `tests/unit/CombatSkillSystem.test.js` — 새 loadout과 탄창 비용 계약
- `tests/unit/CombatantAdapter.test.js` — NPC 개별 배율 정규화
- `tests/unit/CombatSystem_rankedPipeline.test.js` — 탄창 비용과 NPC 피해 배율
- `tests/integration/CombatFocusedUI.int.test.js` — 기존 focused UI 회귀 기대값 조정

---

### Task 1: 무기 인스턴스 탄창 도메인

**Files:**

- Create: `js/systems/WeaponAmmoSystem.js`
- Create: `tests/unit/WeaponAmmoSystem.test.js`
- Modify: `js/core/GameState.js:298-317`
- Modify: `tests/unit/GameState.test.js`

**Interfaces:**

- Produces: `MAGAZINE_CAPACITY: 20`
- Produces: `isMagazineWeapon(definition): boolean`
- Produces: `getMagazineCapacity(definition): number`
- Produces: `getLoadedAmmo(gameState, weaponInstanceId): number`
- Produces: `getMagazineState(gameState, weaponInstanceId): { ok, reason, loadedAmmo, capacity, ammoDefinitionId }`
- Produces: `findCompatibleAmmoPack(gameState, weaponInstanceId): CardInstance|null`
- Produces: `canFire(gameState, weaponInstanceId): MagazineResult`
- Produces: `canReload(gameState, weaponInstanceId): MagazineResult`
- Produces: `consumeRound(gameState, weaponInstanceId): MagazineResult`
- Produces: `reload(gameState, weaponInstanceId): MagazineResult`
- Produces: `normalizeMagazineCards(gameState): void`

- [ ] **Step 1: 탄창 정규화와 신규 무기 초기값의 실패 테스트 작성**

```js
// tests/unit/WeaponAmmoSystem.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  canFire,
  canReload,
  consumeRound,
  getLoadedAmmo,
  isMagazineWeapon,
  reload,
} from '../../js/systems/WeaponAmmoSystem.js';
import GameData from '../../js/data/GameData.js';

function makeState({ loadedAmmo, ammoQuantity = 0 } = {}) {
  const weapon = {
    instanceId: 'pistol_1',
    definitionId: 'pistol',
    durability: 100,
  };
  if (loadedAmmo !== undefined) weapon.loadedAmmo = loadedAmmo;
  const cards = { pistol_1: weapon };
  const boardIds = [];
  if (ammoQuantity > 0) {
    cards.ammo_1 = {
      instanceId: 'ammo_1',
      definitionId: 'pistol_ammo',
      quantity: ammoQuantity,
    };
    boardIds.push('ammo_1');
  }
  return {
    cards,
    getCardDef: vi.fn(id => id === 'pistol_1'
      ? { id: 'pistol', type: 'weapon', subtype: 'firearm', combat: { requiresAmmo: 'pistol_ammo' } }
      : null),
    getBoardCards: () => boardIds.map(id => cards[id]).filter(Boolean),
    removeCardInstance: vi.fn(id => { delete cards[id]; }),
  };
}

describe('WeaponAmmoSystem', () => {
  it.each([
    'pistol',
    'shotgun',
    'crossbow',
    'crossbow_plus',
    'rifle',
    'm4_carbine',
    'confiscated_sniper',
    'warlord_rifle',
    'silenced_pistol',
  ])('%s를 20발 탄창 적용 무기로 판정한다', definitionId => {
    expect(isMagazineWeapon(GameData.items[definitionId])).toBe(true);
  });

  it.each([
    [undefined, 0],
    [-3, 0],
    [Number.NaN, 0],
    [7.9, 7],
    [27, 20],
  ])('loadedAmmo=%p를 %i로 정규화한다', (loadedAmmo, expected) => {
    const gs = makeState({ loadedAmmo });
    expect(getLoadedAmmo(gs, 'pistol_1')).toBe(expected);
    expect(gs.cards.pistol_1.loadedAmmo).toBe(expected);
  });

  it('빈 탄창은 발사할 수 없고 탄약 세트가 있을 때만 재장전 가능하다', () => {
    expect(canFire(makeState({ loadedAmmo: 0 }), 'pistol_1'))
      .toMatchObject({ ok: false, reason: 'empty_magazine' });
    expect(canReload(makeState({ loadedAmmo: 0 }), 'pistol_1'))
      .toMatchObject({ ok: false, reason: 'missing_ammo_pack' });
    expect(canReload(makeState({ loadedAmmo: 0, ammoQuantity: 1 }), 'pistol_1'))
      .toMatchObject({ ok: true, ammoDefinitionId: 'pistol_ammo' });
  });
});
```

`tests/unit/GameState.test.js`에는 다음 계약을 추가한다.

```js
it('탄약 요구 무기 인스턴스를 빈 탄창으로 생성한다', () => {
  const inst = GameState.createCardInstance('pistol');
  expect(inst.loadedAmmo).toBe(0);
  GameState.removeCardInstance(inst.instanceId);
});
```

- [ ] **Step 2: 실패를 확인**

Run:

```powershell
npx vitest run tests/unit/WeaponAmmoSystem.test.js tests/unit/GameState.test.js
```

Expected: `WeaponAmmoSystem.js` 모듈을 찾을 수 없거나 `loadedAmmo`가 `undefined`여서 FAIL.

- [ ] **Step 3: 최소 탄창 시스템과 생성 초기값 구현**

```js
// js/systems/WeaponAmmoSystem.js
import EventBus from '../core/EventBus.js';

export const MAGAZINE_CAPACITY = 20;

export function isMagazineWeapon(definition) {
  return definition?.type === 'weapon'
    && typeof definition?.combat?.requiresAmmo === 'string'
    && definition.combat.requiresAmmo.length > 0;
}

export function getMagazineCapacity(definition) {
  return isMagazineWeapon(definition) ? MAGAZINE_CAPACITY : 0;
}

function failure(reason, state = {}) {
  return { ...state, ok: false, reason };
}

export function getLoadedAmmo(gameState, weaponInstanceId) {
  const instance = gameState?.cards?.[weaponInstanceId];
  if (!instance) return 0;
  const raw = Number.isFinite(instance.loadedAmmo) ? Math.trunc(instance.loadedAmmo) : 0;
  const normalized = Math.min(MAGAZINE_CAPACITY, Math.max(0, raw));
  instance.loadedAmmo = normalized;
  return normalized;
}

export function getMagazineState(gameState, weaponInstanceId) {
  const instance = gameState?.cards?.[weaponInstanceId];
  const definition = instance && typeof gameState?.getCardDef === 'function'
    ? gameState.getCardDef(weaponInstanceId)
    : null;
  if (!instance || !isMagazineWeapon(definition)) {
    return failure('invalid_magazine_weapon', {
      loadedAmmo: 0,
      capacity: 0,
      ammoDefinitionId: null,
    });
  }
  return {
    ok: true,
    reason: null,
    loadedAmmo: getLoadedAmmo(gameState, weaponInstanceId),
    capacity: MAGAZINE_CAPACITY,
    ammoDefinitionId: definition.combat.requiresAmmo,
  };
}
```

`GameState.createCardInstance()`에서 `...overrides` 앞에 기본값을 둬 명시적인 테스트 override는 유지한다.

```js
const instance = {
  instanceId: id,
  definitionId,
  quantity: overrides.quantity ?? 1,
  durability: Math.round(baseDur * durBonus),
  contamination: overrides.contamination ?? def.defaultContamination ?? 0,
  ...(isMagazineWeapon(def) ? { loadedAmmo: 0 } : {}),
  ...overrides,
};
```

- [ ] **Step 4: 재장전과 1발 소비의 원자성 실패 테스트 작성**

```js
it('중첩 탄약 한 세트를 소비해 20발을 장전한다', () => {
  const gs = makeState({ loadedAmmo: 0, ammoQuantity: 6 });
  expect(reload(gs, 'pistol_1')).toMatchObject({ ok: true, loadedAmmo: 20 });
  expect(gs.cards.ammo_1.quantity).toBe(5);
});

it('마지막 탄약 세트를 소비하면 카드 인스턴스를 제거한다', () => {
  const gs = makeState({ loadedAmmo: 0, ammoQuantity: 1 });
  expect(reload(gs, 'pistol_1').ok).toBe(true);
  expect(gs.removeCardInstance).toHaveBeenCalledWith('ammo_1');
  expect(gs.cards.ammo_1).toBeUndefined();
});

it('탄창이 남아 있으면 탄약 세트와 잔탄을 변경하지 않는다', () => {
  const gs = makeState({ loadedAmmo: 3, ammoQuantity: 2 });
  expect(reload(gs, 'pistol_1')).toMatchObject({ ok: false, reason: 'magazine_not_empty' });
  expect(gs.cards.pistol_1.loadedAmmo).toBe(3);
  expect(gs.cards.ammo_1.quantity).toBe(2);
});

it('호환되지 않는 탄약 카드는 재장전에 사용하지 않는다', () => {
  const gs = makeState({ loadedAmmo: 0 });
  gs.cards.rifle_ammo_1 = {
    instanceId: 'rifle_ammo_1',
    definitionId: 'rifle_ammo',
    quantity: 3,
  };
  gs.getBoardCards = () => [gs.cards.rifle_ammo_1];
  expect(reload(gs, 'pistol_1'))
    .toMatchObject({ ok: false, reason: 'missing_ammo_pack' });
  expect(gs.cards.rifle_ammo_1.quantity).toBe(3);
  expect(gs.cards.pistol_1.loadedAmmo).toBe(0);
});

it('발사 명령 하나당 정확히 1발만 소비한다', () => {
  const gs = makeState({ loadedAmmo: 2 });
  expect(consumeRound(gs, 'pistol_1')).toMatchObject({ ok: true, loadedAmmo: 1 });
  expect(consumeRound(gs, 'pistol_1')).toMatchObject({ ok: true, loadedAmmo: 0 });
  expect(consumeRound(gs, 'pistol_1')).toMatchObject({ ok: false, reason: 'empty_magazine' });
});
```

- [ ] **Step 5: 탄약 세트 탐색·재장전·발사 소비 구현**

```js
export function findCompatibleAmmoPack(gameState, weaponInstanceId) {
  const state = getMagazineState(gameState, weaponInstanceId);
  if (!state.ok) return null;
  return (gameState.getBoardCards?.() ?? []).find(card =>
    card?.definitionId === state.ammoDefinitionId && (card.quantity ?? 1) > 0) ?? null;
}

export function canFire(gameState, weaponInstanceId) {
  const state = getMagazineState(gameState, weaponInstanceId);
  if (!state.ok) return state;
  return state.loadedAmmo > 0 ? state : failure('empty_magazine', state);
}

export function canReload(gameState, weaponInstanceId) {
  const state = getMagazineState(gameState, weaponInstanceId);
  if (!state.ok) return state;
  if (state.loadedAmmo > 0) return failure('magazine_not_empty', state);
  const ammoPack = findCompatibleAmmoPack(gameState, weaponInstanceId);
  return ammoPack
    ? { ...state, ammoPack }
    : failure('missing_ammo_pack', state);
}

export function reload(gameState, weaponInstanceId) {
  const check = canReload(gameState, weaponInstanceId);
  if (!check.ok) return check;
  const ammoPack = check.ammoPack;
  const nextQuantity = (ammoPack.quantity ?? 1) - 1;
  gameState.cards[weaponInstanceId].loadedAmmo = MAGAZINE_CAPACITY;
  if (nextQuantity <= 0) {
    gameState.removeCardInstance(ammoPack.instanceId);
    EventBus.emit('cardRemoved', { instanceId: ammoPack.instanceId });
  } else {
    ammoPack.quantity = nextQuantity;
    EventBus.emit('boardChanged', {});
  }
  return {
    ...getMagazineState(gameState, weaponInstanceId),
    consumedAmmoInstanceId: ammoPack.instanceId,
  };
}

export function consumeRound(gameState, weaponInstanceId) {
  const check = canFire(gameState, weaponInstanceId);
  if (!check.ok) return check;
  gameState.cards[weaponInstanceId].loadedAmmo = check.loadedAmmo - 1;
  EventBus.emit('boardChanged', {});
  return getMagazineState(gameState, weaponInstanceId);
}

export function normalizeMagazineCards(gameState) {
  for (const instance of Object.values(gameState?.cards ?? {})) {
    const definition = gameState.getCardDef?.(instance.instanceId);
    if (isMagazineWeapon(definition)) getLoadedAmmo(gameState, instance.instanceId);
  }
}
```

- [ ] **Step 6: 단위 테스트 통과 확인**

Run:

```powershell
npx vitest run tests/unit/WeaponAmmoSystem.test.js tests/unit/GameState.test.js
```

Expected: 두 파일 PASS. 빈 탄창 `0`, 재장전 `20`, `×6 → ×5`, 마지막 세트 제거, 세 번째 발사 거부가 확인된다.

- [ ] **Step 7: 커밋**

```powershell
git add js/systems/WeaponAmmoSystem.js js/core/GameState.js tests/unit/WeaponAmmoSystem.test.js tests/unit/GameState.test.js
git commit -m "feat(combat): 무기 인스턴스 탄창 도메인 추가"
```

---

### Task 2: 엄격한 원거리·근접 슬롯과 저장 마이그레이션

**Files:**

- Create: `js/systems/WeaponSlotPolicy.js`
- Create: `tests/unit/EquipmentSystem_weaponSlots.test.js`
- Modify: `js/systems/EquipmentSystem.js:8-65,141-158`
- Modify: `js/core/GameState.js:748-948`
- Modify: `tests/unit/GameState.test.js`

**Interfaces:**

- Consumes: `isMagazineWeapon(definition): boolean`
- Consumes: `normalizeMagazineCards(gameState): void`
- Produces: `weaponSlotForDefinition(definition): 'weapon_main'|'weapon_sub'|null`
- Produces: `normalizeEquippedWeaponSlots(gameState): { moved: string[], recovered: string[] }`

- [ ] **Step 1: 슬롯 정책의 실패 테스트 작성**

```js
// tests/unit/EquipmentSystem_weaponSlots.test.js
import { beforeEach, describe, expect, it } from 'vitest';
import EquipmentSystem from '../../js/systems/EquipmentSystem.js';
import GameState from '../../js/core/GameState.js';

describe('플레이어 무기 슬롯 정책', () => {
  beforeEach(() => {
    GameState.cards = {
      pistol_1: { instanceId: 'pistol_1', definitionId: 'pistol' },
      crossbow_1: { instanceId: 'crossbow_1', definitionId: 'crossbow' },
      knife_1: { instanceId: 'knife_1', definitionId: 'knife' },
      shield_1: { instanceId: 'shield_1', definitionId: 'reinforced_shield' },
      molotov_1: { instanceId: 'molotov_1', definitionId: 'molotov_cocktail' },
    };
  });

  it.each(['pistol_1', 'crossbow_1'])('%s는 원거리 주무기에만 들어간다', id => {
    expect(EquipmentSystem.canEquip(id, 'weapon_main').ok).toBe(true);
    expect(EquipmentSystem.canEquip(id, 'weapon_sub').ok).toBe(false);
  });

  it('근접 무기는 근접 보조무기에만 들어간다', () => {
    expect(EquipmentSystem.canEquip('knife_1', 'weapon_main').ok).toBe(false);
    expect(EquipmentSystem.canEquip('knife_1', 'weapon_sub').ok).toBe(true);
  });

  it.each(['shield_1', 'molotov_1'])('%s는 두 무기 슬롯 모두 거부한다', id => {
    expect(EquipmentSystem.getSlotsForDef(GameState.getCardDef(id)))
      .not.toEqual(expect.arrayContaining(['weapon_main', 'weapon_sub']));
  });
});
```

- [ ] **Step 2: 실패 확인**

Run:

```powershell
npx vitest run tests/unit/EquipmentSystem_weaponSlots.test.js
```

Expected: 현재 `weapon_main`이 근접 무기를 허용하고 `weapon_sub`가 총기·투척·방패를 허용해 FAIL.

- [ ] **Step 3: 공유 슬롯 판정 구현 후 EquipmentSystem 연결**

```js
// js/systems/WeaponSlotPolicy.js
import { isMagazineWeapon } from './WeaponAmmoSystem.js';

export function weaponSlotForDefinition(definition) {
  if (isMagazineWeapon(definition)) return 'weapon_main';
  if (definition?.type === 'weapon' && definition?.subtype === 'melee') return 'weapon_sub';
  return null;
}
```

`EquipmentSystem`의 무기 슬롯은 predicate를 사용하도록 만든다.

```js
const SLOT_RULES = {
  weapon_main: { predicate: def => weaponSlotForDefinition(def) === 'weapon_main' },
  weapon_sub: { predicate: def => weaponSlotForDefinition(def) === 'weapon_sub' },
};

function ruleAcceptsDefinition(rule, def) {
  if (typeof rule.predicate === 'function') return rule.predicate(def);
  if (rule.accepts) {
    return rule.accepts.some(a => a.type === def.type && a.subtypes.includes(def.subtype));
  }
  return def.type === rule.type && rule.subtypes.includes(def.subtype);
}
```

`canEquip()`와 `getSlotsForDef()` 모두 `ruleAcceptsDefinition()`을 호출해 UI 후보와 실제 장착 검증의 불일치를 막는다.

- [ ] **Step 4: 저장 슬롯 교환·이동·복구의 실패 테스트 작성**

```js
it('구버전 반대 슬롯과 누락 잔탄을 역직렬화할 때 정규화한다', () => {
  const save = JSON.parse(GameState.serialize());
  save.cards = {
    pistol_old: { instanceId: 'pistol_old', definitionId: 'pistol', durability: 90 },
    knife_old: { instanceId: 'knife_old', definitionId: 'knife', durability: 80 },
  };
  save.player.equipped.weapon_main = 'knife_old';
  save.player.equipped.weapon_sub = 'pistol_old';
  save.board.middle = Array(20).fill(null);
  save.board.bottom = Array(20).fill(null);
  save.pendingLoot = [];

  GameState.deserialize(JSON.stringify(save));

  expect(GameState.player.equipped.weapon_main).toBe('pistol_old');
  expect(GameState.player.equipped.weapon_sub).toBe('knife_old');
  expect(GameState.cards.pistol_old.loadedAmmo).toBe(0);
});

it('부적합 방패를 장착 해제해 보드로 복구한다', () => {
  const save = JSON.parse(GameState.serialize());
  save.cards = {
    shield_old: { instanceId: 'shield_old', definitionId: 'reinforced_shield', durability: 75 },
  };
  save.player.equipped.weapon_sub = 'shield_old';
  save.board.middle = Array(20).fill(null);
  save.board.bottom = Array(20).fill(null);

  GameState.deserialize(JSON.stringify(save));

  expect(GameState.player.equipped.weapon_sub).toBeNull();
  expect(GameState.getBoardCards().map(card => card.instanceId)).toContain('shield_old');
});

it('보드가 가득 차면 부적합 장비를 pendingLoot로 보존한다', () => {
  const save = JSON.parse(GameState.serialize());
  const fillerIds = Array.from({ length: 20 }, (_, index) => `filler_${index}`);
  save.cards = Object.fromEntries([
    ['shield_old', {
      instanceId: 'shield_old',
      definitionId: 'reinforced_shield',
      durability: 75,
    }],
    ...fillerIds.map(instanceId => [instanceId, {
      instanceId,
      definitionId: 'scrap_metal',
      quantity: 1,
    }]),
  ]);
  save.player.equipped.weapon_sub = 'shield_old';
  save.board.middle = fillerIds;
  save.pendingLoot = [];

  GameState.deserialize(JSON.stringify(save));

  expect(GameState.player.equipped.weapon_sub).toBeNull();
  expect(GameState.pendingLoot).toEqual(expect.arrayContaining([
    expect.objectContaining({ definitionId: 'reinforced_shield', quantity: 1 }),
  ]));
});
```

- [ ] **Step 5: 슬롯 정규화와 GameState 복원 훅 구현**

```js
// js/systems/WeaponSlotPolicy.js
function recoverToBoardOrPending(gameState, instanceId) {
  if (!gameState?.cards?.[instanceId]) return false;
  if (gameState.placeCardInRow(instanceId, 'middle')) return true;
  const instance = gameState.cards[instanceId];
  gameState.pendingLoot = [...(gameState.pendingLoot ?? []), {
    definitionId: instance.definitionId,
    quantity: instance.quantity ?? 1,
    contamination: instance.contamination ?? 0,
  }];
  delete gameState.cards[instanceId];
  return true;
}

export function normalizeEquippedWeaponSlots(gameState) {
  const equipped = gameState?.player?.equipped;
  if (!equipped) return { moved: [], recovered: [] };
  const ids = [equipped.weapon_main, equipped.weapon_sub].filter(Boolean);
  equipped.weapon_main = null;
  equipped.weapon_sub = null;
  const moved = [];
  const recovered = [];
  for (const instanceId of [...new Set(ids)]) {
    const slot = weaponSlotForDefinition(gameState.getCardDef?.(instanceId));
    if (slot && !equipped[slot]) {
      equipped[slot] = instanceId;
      moved.push(instanceId);
    } else {
      recoverToBoardOrPending(gameState, instanceId);
      recovered.push(instanceId);
    }
  }
  return { moved, recovered };
}
```

`GameState.deserialize()`에서는 `this.cards = d.cards ?? {}`와 `this.pendingLoot = d.pendingLoot ?? []`가 모두 끝난 뒤 다음 순서로 호출한다.

```js
normalizeMagazineCards(this);
normalizeEquippedWeaponSlots(this);
this._compactRow('middle');
this._compactRow('bottom');
this._updateEncumbrance();
```

- [ ] **Step 6: 슬롯 및 저장 테스트 통과 확인**

Run:

```powershell
npx vitest run tests/unit/EquipmentSystem_weaponSlots.test.js tests/unit/GameState.test.js
```

Expected: 총기/석궁은 main만, 근접은 sub만 허용되고 반대 슬롯 저장은 교환되며 방패는 보드로 복구되어 PASS.

- [ ] **Step 7: 커밋**

```powershell
git add js/systems/WeaponSlotPolicy.js js/systems/EquipmentSystem.js js/core/GameState.js tests/unit/EquipmentSystem_weaponSlots.test.js tests/unit/GameState.test.js
git commit -m "feat(equipment): 원거리와 근접 무기 슬롯 분리"
```

---

### Task 3: 플레이어 이중 공격과 NPC 고정 loadout

**Files:**

- Modify: `js/systems/combat/CombatSkillSystem.js:137-376`
- Modify: `tests/unit/CombatSkillSystem.test.js:48-106,286-386,669-1014`

**Interfaces:**

- Consumes: `weaponSlotForDefinition(definition)`
- Produces: 장비 원거리 스킬 `ammoDefinitionId: string`, `costs.magazineRound: 1`
- Produces: 장비 근접 스킬 `ammoDefinitionId: null`, `costs.magazineRound: 0`
- Consumes callback: `context.canFireWeapon(actor, skill): { ok: boolean, reason?: string }`
- Keeps: `buildAllyLoadout(combatant, gs): CombatSkill[]`

- [ ] **Step 1: 새 loadout과 NPC 고정 공격의 실패 테스트 작성**

```js
it('원거리 주무기와 근접 보조무기를 함께 제공한다', () => {
  const gs = makeGameState();
  gs.player.equipped = {
    weapon_main: 'pistol_instance',
    weapon_sub: 'knife_instance',
  };
  expect(buildAllyLoadout({ sourceType: 'player' }, gs).map(skill => skill.id))
    .toEqual([
      'equipment:pistol_instance',
      'equipment:knife_instance',
      'doctor_triage',
      'doctor_diagnose',
    ]);
});

it('근접 보조무기가 없으면 원거리 공격과 맨손 공격을 함께 제공한다', () => {
  const gs = makeGameState();
  gs.player.equipped = { weapon_main: 'pistol_instance', weapon_sub: null };
  expect(buildAllyLoadout({ sourceType: 'player' }, gs).map(skill => skill.id))
    .toEqual([
      'equipment:pistol_instance',
      'basic_strike',
      'doctor_triage',
      'doctor_diagnose',
    ]);
});

it('NPC 장착 필드가 있어도 캐릭터 고정 loadout만 사용한다', () => {
  const gs = makeGameState();
  expect(buildAllyLoadout({
    sourceType: 'companion',
    sourceId: 'npc_nurse',
  }, gs).map(skill => skill.id)).toEqual([
    ...COMPANION_COMBAT_LOADOUTS.npc_nurse,
    'guard',
    'reposition',
  ]);
});
```

- [ ] **Step 2: 탄창 비용 검증의 실패 테스트 작성**

```js
it('원거리 장비 스킬은 보드 탄약 비용 대신 탄창 1발 계약을 가진다', () => {
  const skill = buildEquipmentSkill(
    'pistol_instance',
    makeGameState().getCardDef('pistol_instance'),
  );
  expect(skill.ammoDefinitionId).toBe('pistol_ammo');
  expect(skill.costs).toMatchObject({
    magazineRound: 1,
    durability: 1,
    noise: 30,
  });
  expect(skill.costs.ammo).toBeUndefined();
});

it('빈 탄창 원거리 명령은 효과와 비용 전에 거부한다', () => {
  const ctx = makeCommandContext({
    skillsById: {
      shot: {
        id: 'shot',
        equipmentInstanceId: 'pistol_instance',
        costs: { magazineRound: 1 },
        usableFrom: [1],
        target: { side: 'enemy', ranks: [1], count: 1 },
        effects: [{ type: 'damage', value: [5, 5] }],
      },
    },
    canFireWeapon: vi.fn(() => ({ ok: false, reason: 'empty_magazine' })),
  });
  expect(validateSkillCommand(ctx, {
    actorId: 'player',
    targetId: 'zombie',
    skillId: 'shot',
  })).toEqual({ ok: false, reason: 'empty_magazine' });
  expect(ctx.consumeCosts).not.toHaveBeenCalled();
});
```

- [ ] **Step 3: 실패 확인**

Run:

```powershell
npx vitest run tests/unit/CombatSkillSystem.test.js
```

Expected: 기존 NPC 장비 스킬 대체, 원거리 `costs.ammo`, 원거리만 있을 때 맨손 미제공 때문에 FAIL.

- [ ] **Step 4: loadout과 비용 계약 구현**

```js
// buildEquipmentSkill 반환값의 비용/메타
ammoDefinitionId: ammoId,
costs: {
  magazineRound: ranged ? 1 : 0,
  durability: nonnegative(combat.durabilityLoss),
  noise: nonnegative(combat.noiseOnUse),
},
```

플레이어 공격은 슬롯별로 만들고 근접 슬롯이 비면 맨손을 추가한다.

```js
function buildPlayerAttackSkills(gs) {
  const attacks = [];
  const mainId = gs?.player?.equipped?.weapon_main;
  const subId = gs?.player?.equipped?.weapon_sub;
  const mainDef = mainId ? gs.getCardDef?.(mainId) : null;
  const subDef = subId ? gs.getCardDef?.(subId) : null;
  if (weaponSlotForDefinition(mainDef) === 'weapon_main') {
    const ranged = buildEquipmentSkill(mainId, mainDef);
    if (ranged) attacks.push(ranged);
  }
  if (weaponSlotForDefinition(subDef) === 'weapon_sub') {
    const melee = buildEquipmentSkill(subId, subDef);
    if (melee) attacks.push(melee);
  } else {
    const unarmed = getCombatSkill('basic_strike');
    if (unarmed) attacks.push(cloneValue(unarmed));
  }
  return attacks;
}
```

동료 분기는 장비 조회를 완전히 제거한다.

```js
if (combatant?.sourceType === 'companion') {
  const fixedSkills = getCharacterSkillIds(combatant, gs)
    .map(getCombatSkill)
    .filter(Boolean)
    .map(cloneValue);
  const commonUtilitySkills = ['guard', 'reposition']
    .map(getCombatSkill)
    .filter(Boolean)
    .map(cloneValue);
  return [...fixedSkills, ...commonUtilitySkills];
}
```

검증은 `magazineRound`가 있을 때만 새 callback을 호출한다.

```js
const magazineRoundCost = positiveCost(skill.costs?.magazineRound);
if (magazineRoundCost > 0) {
  if (typeof ctx.canFireWeapon !== 'function') {
    return commandFailure('invalid_context');
  }
  const fireCheck = ctx.canFireWeapon(actor, skill);
  if (!fireCheck?.ok) {
    return commandFailure(fireCheck?.reason ?? 'empty_magazine');
  }
}
```

- [ ] **Step 5: CombatSkillSystem 테스트 통과 확인**

Run:

```powershell
npx vitest run tests/unit/CombatSkillSystem.test.js
```

Expected: 플레이어 `[원거리, 근접]` 또는 `[원거리, 맨손]`, NPC 고정 스킬, `magazineRound: 1` 검증이 모두 PASS.

- [ ] **Step 6: 커밋**

```powershell
git add js/systems/combat/CombatSkillSystem.js tests/unit/CombatSkillSystem.test.js
git commit -m "feat(combat): 플레이어 이중 공격과 NPC 고정 스킬 분리"
```

---

### Task 4: 랭크 전투 발사 비용과 NPC 개별 공격력

**Files:**

- Modify: `js/systems/combat/CombatantAdapter.js:4-52`
- Modify: `js/systems/combat/CombatRankedEffects.js:20-75,339-390`
- Modify: `js/systems/CombatSystem.js:335-383`
- Modify: `tests/unit/CombatantAdapter.test.js`
- Modify: `tests/unit/CombatSystem_rankedPipeline.test.js`
- Create: `tests/integration/WeaponAmmoCombat.int.test.js`

**Interfaces:**

- Consumes: `canFire(GameState, instanceId)`
- Consumes: `consumeRound(GameState, instanceId)`
- Produces context callback: `canFireWeapon(actor, skill)`
- Produces combatant field: `combatDamageMultiplier: number`

- [ ] **Step 1: 랭크 발사 비용과 빗나감 소비의 실패 테스트 작성**

```js
// tests/unit/CombatSystem_rankedPipeline.test.js
it('플레이어 원거리 명령 비용은 장착 무기의 탄창에서 1발을 소비한다', () => {
  setupRankedCombat();
  GameState.cards = {
    pistol_1: {
      instanceId: 'pistol_1',
      definitionId: 'pistol',
      loadedAmmo: 2,
      durability: 100,
    },
  };
  GameState.player.equipped = { weapon_main: 'pistol_1', weapon_sub: null };
  const result = CombatSystem._consumeRankedCosts(
    GameState.combat.combatants.player,
    {
      equipmentInstanceId: 'pistol_1',
      costs: { magazineRound: 1, durability: 0, noise: 0 },
    },
  );
  expect(result.ok).toBe(true);
  expect(GameState.cards.pistol_1.loadedAmmo).toBe(1);
});

it('빈 탄창 비용 실패는 스태미나와 소음을 먼저 소비하지 않는다', () => {
  setupRankedCombat();
  GameState.cards = {
    pistol_1: {
      instanceId: 'pistol_1',
      definitionId: 'pistol',
      loadedAmmo: 0,
      durability: 100,
    },
  };
  const result = CombatSystem._consumeRankedCosts(
    GameState.combat.combatants.player,
    {
      equipmentInstanceId: 'pistol_1',
      costs: { magazineRound: 1, stamina: 3, noise: 40 },
    },
  );
  expect(result).toMatchObject({ ok: false, reason: 'empty_magazine' });
  expect(GameState.stats.stamina.current).toBe(10);
});
```

`tests/integration/WeaponAmmoCombat.int.test.js`에는 실제 `CombatSystem._setupCombat()`을 사용하는 공용 fixture를 먼저 정의한다.

```js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState from '../../js/core/GameState.js';

function setupPistolCombat({
  loadedAmmo = 0,
  ammoQuantity = 0,
  enemyHp = 100,
} = {}) {
  GameState.cards = {
    pistol_1: {
      instanceId: 'pistol_1',
      definitionId: 'pistol',
      loadedAmmo,
      durability: 100,
      contamination: 0,
    },
  };
  GameState.board.middle = Array(20).fill(null);
  GameState.board.bottom = Array(20).fill(null);
  if (ammoQuantity > 0) {
    GameState.cards.ammo_1 = {
      instanceId: 'ammo_1',
      definitionId: 'pistol_ammo',
      quantity: ammoQuantity,
      durability: 100,
      contamination: 0,
    };
    GameState.board.middle[0] = 'ammo_1';
  }
  GameState.player.hp = { current: 100, max: 100 };
  GameState.player.characterId = 'doctor';
  GameState.player.equipped = {
    weapon_main: 'pistol_1',
    weapon_sub: null,
  };
  GameState.stats.stamina = { current: 10, max: 10, decayPerTP: 0 };
  GameState.stats.morale = { current: 50, max: 100, decayPerTP: 0 };
  GameState.noise = {
    level: 0,
    decayPerTP: 1,
    influxThreshold: 60,
    influxTriggered: false,
  };
  GameState.companions = [];
  GameState.npcs = { states: {} };
  GameState.flags = {};
  CombatSystem._setupCombat({
    enemies: [{
      id: 'zombie_common',
      name: '감염자',
      currentHp: enemyHp,
      maxHp: enemyHp,
      speed: 1,
      row: 'front',
      defense: 0,
      attack: { damage: [0, 0], accuracy: 0 },
      specialSkills: [],
      weaknesses: [],
      resistances: [],
      _skillCooldowns: {},
      _statusEffects: [],
      lootTable: [],
    }],
    dangerLevel: 1,
  });
}

function selectPistolAndTarget() {
  expect(CombatSystem.selectSkill('equipment:pistol_1')).toBe(true);
  expect(CombatSystem.selectTarget('enemy:0')).toBe(true);
}

afterEach(() => vi.restoreAllMocks());

it.each([
  ['명중', 0],
  ['빗나감', 0.999],
])('%s해도 원거리 명령당 한 발만 소비한다', (_label, roll) => {
  setupPistolCombat({ loadedAmmo: 2 });
  const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(roll);
  selectPistolAndTarget();
  const result = CombatSystem.confirmAction();
  randomSpy.mockRestore();
  expect(result.ok).toBe(true);
  expect(GameState.cards.pistol_1.loadedAmmo).toBe(1);
});
```

- [ ] **Step 2: NPC 개별 공격 배율의 실패 테스트 작성**

```js
// tests/unit/CombatantAdapter.test.js
it('동료 정의의 양수 combatDmg를 개별 공격 배율로 복사한다', () => {
  const gs = makeGameState();
  gs.companions = ['npc_soldier_deserter'];
  gs.npcs.states.npc_soldier_deserter = {
    hp: 60,
    maxHp: 60,
    isCompanion: true,
  };
  expect(buildCombatants(gs).npc_soldier_deserter.combatDamageMultiplier).toBe(1.4);
});

it('combatDmg가 0 이하이면 개별 공격 배율 1.0을 사용한다', () => {
  const result = buildCombatants(makeGameState());
  expect(result.npc_nurse.combatDamageMultiplier).toBe(1);
});
```

```js
// tests/unit/CombatSystem_rankedPipeline.test.js
it('동료 자신의 combatDamageMultiplier를 고정 스킬 피해에 한 번만 적용한다', () => {
  const combat = setupRankedCombat({ enemies: [makeEnemy({ defense: 0 })] });
  const actor = makeCombatant({
    sourceType: 'companion',
    combatDamageMultiplier: 1.4,
  });
  const target = combat.combatants['enemy:0'];
  CombatSystem._applyRankedDamageEffect(
    { type: 'damage', value: [10, 10] },
    actor,
    target,
    () => 0,
    { hit: true, crit: false, skill: { id: 'deserter_rifle_shot' } },
  );
  expect(target.hp).toBe(16);
});

it('NPC 고정 스킬 비용은 플레이어 탄창과 탄약 세트를 변경하지 않는다', () => {
  setupRankedCombat();
  GameState.cards = {
    pistol_1: {
      instanceId: 'pistol_1',
      definitionId: 'pistol',
      loadedAmmo: 2,
      durability: 100,
    },
    ammo_1: {
      instanceId: 'ammo_1',
      definitionId: 'pistol_ammo',
      quantity: 3,
    },
  };
  const actor = makeCombatant({
    sourceType: 'companion',
    sourceId: 'npc_soldier_deserter',
  });
  const result = CombatSystem._consumeRankedCosts(actor, {
    id: 'deserter_rifle_shot',
    costs: { noise: 10 },
  });
  expect(result.ok).toBe(true);
  expect(GameState.cards.pistol_1.loadedAmmo).toBe(2);
  expect(GameState.cards.ammo_1.quantity).toBe(3);
});
```

- [ ] **Step 3: 실패 확인**

Run:

```powershell
npx vitest run tests/unit/CombatantAdapter.test.js tests/unit/CombatSystem_rankedPipeline.test.js tests/integration/WeaponAmmoCombat.int.test.js
```

Expected: 현재 보드 탄약이 줄고 `combatDamageMultiplier`가 없어 FAIL.

- [ ] **Step 4: 랭크 context와 비용 순서 구현**

`CombatSystem._commandContext()`에서 보드 탄약 합산 callback을 제거하고 현재 주무기 검증을 추가한다.

```js
canFireWeapon: (actor, skill) => {
  if (actor?.sourceType !== 'player') return { ok: false, reason: 'invalid_actor' };
  const instanceId = skill?.equipmentInstanceId;
  if (GameState.player?.equipped?.weapon_main !== instanceId) {
    return { ok: false, reason: 'invalid_weapon' };
  }
  return canFire(GameState, instanceId);
},
```

`_consumeRankedCosts()`는 다른 비용보다 탄창을 먼저 원자적으로 소비한다.

```js
const magazineRound = skill?.costs?.magazineRound ?? 0;
if (magazineRound > 0) {
  if (actor?.sourceType !== 'player') {
    return { ok: false, reason: 'invalid_actor' };
  }
  const roundResult = consumeRound(gs, skill?.equipmentInstanceId);
  if (!roundResult.ok) return roundResult;
}

const stamina = skill?.costs?.stamina ?? 0;
if (stamina > 0 && actor?.sourceType === 'player' && gs.stats?.stamina) {
  gs.stats.stamina.current = Math.max(
    0,
    (gs.stats.stamina.current ?? 0) - stamina,
  );
}

const noise = skill?.costs?.noise ?? 0;
if (noise > 0) NoiseSystem.addNoise(noise);
```

이후 내구도 블록은 `const isMeleeEquipment = magazineRound <= 0`으로 판정하고 현재 `durSaveChance`, 파손 알림, `removeCardInstance()` 순서를 유지한다. 원거리 숙련도 `ammoSave` 분기와 보드 `ammoInst.quantity` 차감 코드는 삭제한다.

- [ ] **Step 5: NPC 배율 전달·적용 구현**

```js
// CombatantAdapter.js 동료 combatant
const configuredCombatDmg = NPCS[id]?.companion?.combatDmg;
const combatDamageMultiplier = Number.isFinite(configuredCombatDmg)
  && configuredCombatDmg > 0
  ? configuredCombatDmg
  : 1;

combatants[id] = {
  id,
  side: 'ally',
  sourceType: 'companion',
  sourceId: id,
  hp: state.hp,
  maxHp: state.maxHp ?? NPCS[id]?.maxHp ?? 50,
  speed: state.combatSpeed ?? BALANCE.combat.defaultCompanionSpeed,
  dodge: state.combatDodge ?? BALANCE.combat.defaultCompanionDodge,
  stress: state.combatStress ?? 0,
  bond: state.bond ?? 0,
  combatDamageMultiplier,
  tokens: {},
  statusEffects: [...(state.statusEffects ?? [])],
  deathsDoor: false,
  deathResist: BALANCE.combat.deathsDoor.baseResist,
  itemUsedThisTurn: false,
  dead: false,
};
```

`CombatRankedEffects._applyRankedDamageEffect()`는 치명타 뒤, 위치·토큰·방어보다 앞에서 동료 본인 배율을 한 번 적용한다.

```js
if (actor?.sourceType === 'player') {
  damage = this._applyPlayerDamageSuite(damage, skill, weaponDef);
} else if (actor?.sourceType === 'companion') {
  const multiplier = Number.isFinite(actor.combatDamageMultiplier)
    && actor.combatDamageMultiplier > 0
    ? actor.combatDamageMultiplier
    : 1;
  damage = Math.floor(damage * multiplier);
}
```

동료 분기에서는 `NPCSystem.getCompanionCombatBonus()`를 호출하지 않는다.

- [ ] **Step 6: 랭크 및 통합 테스트 통과 확인**

Run:

```powershell
npx vitest run tests/unit/CombatantAdapter.test.js tests/unit/CombatSystem_rankedPipeline.test.js tests/integration/WeaponAmmoCombat.int.test.js
```

Expected: 명중·빗나감 모두 `2 → 1`, 빈 탄창 무비용 실패, 탈영병 `10 × 1.4 = 14` 피해가 PASS.

- [ ] **Step 7: 커밋**

```powershell
git add js/systems/combat/CombatantAdapter.js js/systems/combat/CombatRankedEffects.js js/systems/CombatSystem.js tests/unit/CombatantAdapter.test.js tests/unit/CombatSystem_rankedPipeline.test.js tests/integration/WeaponAmmoCombat.int.test.js
git commit -m "feat(combat): 탄창 발사 비용과 NPC 개별 공격력 적용"
```

---

### Task 5: 재장전 명령과 레거시 총기 근접 폴백 차단

**Files:**

- Modify: `js/systems/CombatSystem.js:293-383,594-655,1210-1395`
- Modify: `tests/integration/WeaponAmmoCombat.int.test.js`
- Modify: `tests/unit/CombatWeaponStatusInflict.test.js`
- Modify: `js/data/locales.js`

**Interfaces:**

- Consumes: `canReload(GameState, instanceId)`
- Consumes: `reload(GameState, instanceId)`
- Produces: `CombatSystem.reloadActiveWeapon(instanceId): { ok, reason?, turnConsumed, loadedAmmo? }`

- [ ] **Step 1: 재장전 성공·실패·턴 소비의 실패 테스트 작성**

```js
it('빈 주무기를 재장전하면 세트 하나를 소비하고 다음 턴으로 진행한다', () => {
  setupPistolCombat({ loadedAmmo: 0, ammoQuantity: 6 });
  const beforeRound = GameState.combat.roundNumber;
  const result = CombatSystem.reloadActiveWeapon('pistol_1');
  expect(result).toMatchObject({ ok: true, turnConsumed: true, loadedAmmo: 20 });
  expect(GameState.cards.ammo_1.quantity).toBe(5);
  expect(GameState.combat.roundNumber).toBeGreaterThanOrEqual(beforeRound);
  expect(GameState.combat.phase).toBe('await_ally_input');
});

it('탄약 세트가 없으면 재장전과 턴을 모두 소비하지 않는다', () => {
  setupPistolCombat({ loadedAmmo: 0, ammoQuantity: 0 });
  const beforeQueue = structuredClone(GameState.combat.turnQueue);
  const result = CombatSystem.reloadActiveWeapon('pistol_1');
  expect(result).toMatchObject({
    ok: false,
    reason: 'missing_ammo_pack',
    turnConsumed: false,
  });
  expect(GameState.cards.pistol_1.loadedAmmo).toBe(0);
  expect(GameState.combat.turnQueue).toEqual(beforeQueue);
  expect(GameState.combat.phase).toBe('await_ally_input');
});

it('탄창이 남은 무기는 재장전할 수 없다', () => {
  setupPistolCombat({ loadedAmmo: 1, ammoQuantity: 2 });
  expect(CombatSystem.reloadActiveWeapon('pistol_1'))
    .toMatchObject({ ok: false, reason: 'magazine_not_empty', turnConsumed: false });
  expect(GameState.cards.ammo_1.quantity).toBe(2);
});
```

- [ ] **Step 2: 레거시 발사 실패와 산탄총 1발 소비 테스트 작성**

```js
it('레거시 shoot는 빈 탄창에서 피해·라운드·내구도·소음을 소비하지 않는다', () => {
  const enemy = makeEnemy();
  GameState.cards.weapon_1 = {
    instanceId: 'weapon_1',
    definitionId: 'pistol',
    loadedAmmo: 0,
    durability: 100,
  };
  GameState.getCardDef = id => id === 'weapon_1'
    ? {
        id: 'pistol',
        name: 'Pistol',
        type: 'weapon',
        subtype: 'firearm',
        combat: {
          damage: [10, 10],
          accuracy: 1,
          noiseOnUse: 30,
          durabilityLoss: 1,
          requiresAmmo: 'pistol_ammo',
        },
      }
    : null;
  GameState.noise = { level: 0, decayPerTP: 1, influxThreshold: 60 };
  GameState.combat = {
    active: true,
    enemies: [enemy],
    targetIndex: 0,
    round: 0,
    log: [],
    playerStatus: [],
    enemyStatus: [],
  };
  const before = {
    hp: enemy.currentHp,
    round: GameState.combat.round,
    durability: GameState.cards.weapon_1.durability,
    noise: GameState.noise.level,
  };
  expect(CombatSystem.resolveAction('shoot', 'weapon_1')).toBe(false);
  expect({
    hp: enemy.currentHp,
    round: GameState.combat.round,
    durability: GameState.cards.weapon_1.durability,
    noise: GameState.noise.level,
  }).toEqual(before);
});

it('레거시 산탄총 다중 대상 공격도 탄창은 한 발만 소비한다', () => {
  const enemies = [makeEnemy(), { ...makeEnemy(), id: 'zombie_second' }];
  GameState.cards.weapon_1 = {
    instanceId: 'weapon_1',
    definitionId: 'shotgun',
    loadedAmmo: 2,
    durability: 100,
  };
  GameState.getCardDef = id => id === 'weapon_1'
    ? {
        id: 'shotgun',
        name: 'Shotgun',
        type: 'weapon',
        subtype: 'firearm',
        multiTarget: 2,
        weaponType: 'bullet',
        tags: ['weapon', 'firearm'],
        combat: {
          damage: [10, 10],
          accuracy: 1,
          noiseOnUse: 10,
          durabilityLoss: 0,
          requiresAmmo: 'shotgun_ammo',
          critChance: 0,
        },
      }
    : null;
  GameState.noise = { level: 0, decayPerTP: 1, influxThreshold: 60 };
  GameState.combat = {
    active: true,
    enemies,
    targetIndex: 0,
    round: 0,
    log: [],
    playerStatus: [],
    enemyStatus: [],
    fxQueue: [],
    playerGuard: null,
  };
  vi.spyOn(Math, 'random').mockReturnValue(0);
  CombatSystem._attackAction('shoot', 'weapon_1', enemies[0]);
  expect(GameState.cards.weapon_1.loadedAmmo).toBe(1);
  vi.restoreAllMocks();
});
```

- [ ] **Step 3: 실패 확인**

Run:

```powershell
npx vitest run tests/integration/WeaponAmmoCombat.int.test.js tests/unit/CombatWeaponStatusInflict.test.js
```

Expected: `reloadActiveWeapon` 부재와 레거시 근접 폴백 때문에 FAIL.

- [ ] **Step 4: 대상 없는 재장전 명령 구현**

```js
reloadActiveWeapon(instanceId) {
  const combat = GameState.combat;
  const active = combat?.combatants?.[combat.activeCombatantId];
  if (
    !combat?.active
    || combat.phase !== 'await_ally_input'
    || active?.sourceType !== 'player'
    || GameState.player?.equipped?.weapon_main !== instanceId
  ) {
    return { ok: false, reason: 'invalid_reload_actor', turnConsumed: false };
  }

  const check = canReload(GameState, instanceId);
  if (!check.ok) {
    combat.lastActionFailure = check.reason;
    this._pushCombatLog(this._rankedFailureMessage(check.reason));
    return { ...check, turnConsumed: false };
  }

  const result = reload(GameState, instanceId);
  if (!result.ok) return { ...result, turnConsumed: false };
  combat.actionSequence = (combat.actionSequence ?? 0) + 1;
  this._pushCombatLog(I18n.t('combatSys.reloaded', {
    ammo: result.loadedAmmo,
    capacity: result.capacity,
  }));
  this._resolveRelationshipAfterAction(combat.activeCombatantId);
  this.advanceTurn();
  this.processUntilAllyTurn();
  return { ...result, turnConsumed: true };
},
```

`_rankedFailureMessage()`에 `empty_magazine`, `missing_ammo_pack`, `magazine_not_empty`, `invalid_weapon`, `invalid_reload_actor`를 추가한다.

- [ ] **Step 5: 레거시 경로 사전 검증과 1발 소비 구현**

`resolveAction()`이 `round`를 증가시키기 전에 발사를 검사한다.

```js
if (action === 'shoot') {
  const fireCheck = canFire(gs, weaponInstanceId);
  if (!fireCheck.ok) {
    EventBus.emit('notify', {
      message: I18n.t('combatSys.emptyMagazine'),
      type: 'warn',
    });
    return false;
  }
}
```

`_attackAction()`의 보드 탄약 탐색, 원거리 마스터리 `ammoSave`, `noAmmoMeleeDamage` 폴백을 삭제하고 원거리 무기 데이터가 확정된 직후 한 번만 소비한다.

```js
if (isRanged) {
  const roundResult = consumeRound(gs, weaponId);
  if (!roundResult.ok) return I18n.t('combatSys.emptyMagazine');
  if (weaponInst._suppressor) {
    noise = Math.max(
      0,
      Math.round(noise * (1 - Math.min(1, weaponInst._noiseReduction ?? 0.5))),
    );
  }
  accuracy = Math.min(1, accuracy + SkillSystem.getBonus('ranged', 'accBonus'));
  critChance = Math.min(1, critChance + SkillSystem.getBonus('ranged', 'critBonus'));
}
```

- [ ] **Step 6: 한/영 메시지 갱신**

```js
// ko
'combatSys.noAmmo':           '탄약이 없어 발사할 수 없습니다.',
'combatSys.emptyMagazine':    '탄창이 비었습니다. 재장전이 필요합니다.',
'combatSys.reloaded':         '재장전 완료 ({ammo}/{capacity})',
'combatSys.missingAmmoPack':  '호환 탄약 세트가 없습니다.',
'combatSys.magazineNotEmpty': '탄창이 비어 있을 때만 재장전할 수 있습니다.',

// en
'combatSys.noAmmo':           'Cannot fire without ammunition.',
'combatSys.emptyMagazine':    'Magazine empty. Reload required.',
'combatSys.reloaded':         'Reloaded ({ammo}/{capacity})',
'combatSys.missingAmmoPack':  'No compatible ammo pack.',
'combatSys.magazineNotEmpty': 'Reloading requires an empty magazine.',
```

- [ ] **Step 7: 재장전과 레거시 회귀 테스트 통과 확인**

Run:

```powershell
npx vitest run tests/integration/WeaponAmmoCombat.int.test.js tests/unit/CombatWeaponStatusInflict.test.js
```

Expected: 성공 재장전만 행동을 소비하고, 빈 탄창 shoot가 무비용 실패하며, 산탄 다중 대상이 한 발만 소비해 PASS.

- [ ] **Step 8: 커밋**

```powershell
git add js/systems/CombatSystem.js js/data/locales.js tests/integration/WeaponAmmoCombat.int.test.js tests/unit/CombatWeaponStatusInflict.test.js
git commit -m "feat(combat): 전투 재장전 명령과 빈 탄창 차단 추가"
```

---

### Task 6: 일반 카드·상세 모달·장비 화면 표시

**Files:**

- Modify: `js/ui/CardFactory.js:1341-1440`
- Modify: `js/ui/ModalManager.js:259-310,420-455`
- Modify: `js/ui/EquipmentModal.js:82-92`
- Modify: `js/data/items_combat.js:220-245,521-528`
- Modify: `js/data/legendaryItems.js:601-608`
- Modify: `js/data/locales.js`
- Modify: `css/cards.css:120-145,316-350`
- Create: `tests/integration/WeaponAmmoUI.int.test.js`

**Interfaces:**

- Consumes: `getMagazineState(GameState, instanceId)`
- Consumes: `findCompatibleAmmoPack(GameState, instanceId)`
- Produces DOM: `.card-ammo-badge.loaded|empty`
- Produces modal rows: `modal.loadedAmmo`, `modal.compatibleAmmo`, `modal.ammoPackSize`

- [ ] **Step 1: 카드·모달 표시 실패 테스트 작성**

```js
// tests/integration/WeaponAmmoUI.int.test.js
// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import CardFactory from '../../js/ui/CardFactory.js';
import ModalManager from '../../js/ui/ModalManager.js';
import GameState from '../../js/core/GameState.js';
import GameData from '../../js/data/GameData.js';

describe('무기 탄창 카드 UI', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="modal-overlay"><div id="modal-box"></div></div>';
    ModalManager._overlay = document.getElementById('modal-overlay');
    ModalManager._box = document.getElementById('modal-box');
    GameState.cards = {
      pistol_1: {
        instanceId: 'pistol_1',
        definitionId: 'pistol',
        loadedAmmo: 0,
        durability: 100,
        contamination: 0,
      },
    };
  });

  it('일반 카드에 빈 탄창 0/20 배지를 표시한다', () => {
    const html = CardFactory._buildInner(GameState.cards.pistol_1, GameData.items.pistol);
    expect(html).toContain('card-ammo-badge empty');
    expect(html).toContain('0/20');
  });

  it('상세 모달에 장전 탄약과 호환 탄약을 표시한다', () => {
    ModalManager.showCardInspect('pistol_1');
    expect(ModalManager._overlay.textContent).toContain('장전 탄약');
    expect(ModalManager._overlay.textContent).toContain('0/20');
    expect(ModalManager._overlay.textContent).toContain('권총 탄약');
  });

  it('탄약 카드는 1세트가 20발임을 표시한다', () => {
    GameState.cards.ammo_1 = {
      instanceId: 'ammo_1',
      definitionId: 'pistol_ammo',
      quantity: 6,
      durability: 100,
      contamination: 0,
    };
    ModalManager.showCardInspect('ammo_1');
    expect(ModalManager._overlay.textContent).toContain('1세트 = 20발');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run:

```powershell
npx vitest run tests/integration/WeaponAmmoUI.int.test.js
```

Expected: 잔탄 배지와 모달 행이 없어 FAIL.

- [ ] **Step 3: 일반 카드 잔탄 배지와 CSS 구현**

```js
// CardFactory._buildInner()
const magazine = def?.combat?.requiresAmmo
  ? getMagazineState(GameState, inst.instanceId)
  : null;
const ammoBadge = magazine?.ok
  ? `<span class="card-ammo-badge ${magazine.loadedAmmo === 0 ? 'empty' : 'loaded'}">
       ${magazine.loadedAmmo}/${magazine.capacity}
     </span>`
  : '';
```

`card-header` 안에서 품질·오염 배지와 함께 `${ammoBadge}`를 렌더한다.

```css
.card-ammo-badge {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.card-ammo-badge.loaded { color: var(--accent-primary); }
.card-ammo-badge.empty  { color: var(--text-danger); }
```

- [ ] **Step 4: 상세 모달과 장비 라벨 구현**

```js
// ModalManager.showCardInspect()
if (def.combat?.requiresAmmo) {
  const magazine = getMagazineState(GameState, instanceId);
  const ammoDef = GameData.items[def.combat.requiresAmmo];
  stats.push([
    I18n.t('modal.loadedAmmo'),
    `${magazine.loadedAmmo}/${magazine.capacity}`,
    magazine.loadedAmmo === 0 ? 'danger' : '',
  ]);
  stats.push([
    I18n.t('modal.compatibleAmmo'),
    I18n.itemName(ammoDef?.id, ammoDef?.name ?? def.combat.requiresAmmo),
  ]);
}
if (def.subtype === 'ammo') {
  stats.push([I18n.t('modal.ammoPackSize'), I18n.t('modal.twentyRounds')]);
}
```

장비 슬롯 표시는 다음 값으로 변경한다.

```js
// EquipmentModal.js
weapon_main: { i18nKey: 'equip.weaponMain', icon: '🎯', row: 5, col: 'left' },
weapon_sub:  { i18nKey: 'equip.weaponSub', icon: '⚔️', row: 5, col: 'right' },

// ModalManager.showCardInspect()
const slotLabels = {
  head: I18n.t('equip.head'),
  body: I18n.t('equip.body'),
  hands: I18n.t('equip.hands'),
  backpack: I18n.t('equip.backpack'),
  weapon_main: I18n.t('equip.weaponMain'),
  weapon_sub: I18n.t('equip.weaponSub'),
  boots: I18n.t('equip.boots'),
};
```

```js
// ko
'equip.weaponMain':       '원거리 주무기',
'equip.weaponSub':        '근접 보조무기',
'modal.loadedAmmo':       '장전 탄약',
'modal.compatibleAmmo':   '호환 탄약',
'modal.ammoPackSize':     '탄약 세트',
'modal.twentyRounds':     '1세트 = 20발',

// en
'equip.weaponMain':       'Ranged Weapon',
'equip.weaponSub':        'Melee Sidearm',
'modal.loadedAmmo':       'Loaded Ammo',
'modal.compatibleAmmo':   'Compatible Ammo',
'modal.ammoPackSize':     'Ammo Pack',
'modal.twentyRounds':     '1 pack = 20 rounds',
```

- [ ] **Step 5: 탄약 데이터 설명을 20발 세트 의미로 갱신**

```js
// items_combat.js
description: '권총 재장전에 사용하는 20발 탄약 세트. 카드 1장으로 빈 탄창을 가득 채운다.'
description: '산탄총 재장전에 사용하는 20발 탄약 세트. 카드 1장으로 빈 탄창을 가득 채운다.'
description: '석궁 재장전에 사용하는 20발 볼트 세트. 카드 1장으로 빈 탄창을 가득 채운다.'
description: '소총 재장전에 사용하는 20발 탄약 세트. 카드 1장으로 빈 탄창을 가득 채운다.'
```

`legendaryItems.js`의 최종 병합 `rifle_ammo.description`에도 같은 20발 세트 문장을 넣어 `items_combat.js` 설명이 덮어써져도 의미가 유지되게 한다.

- [ ] **Step 6: UI 테스트와 데이터 검증 통과 확인**

Run:

```powershell
npx vitest run tests/integration/WeaponAmmoUI.int.test.js tests/unit/ItemCardIssues.test.js
node --input-type=module js/data/validate.js
```

Expected: 카드 `0/20`, 상세 모달의 호환 탄약, 탄약 카드 `1세트 = 20발`, 데이터 검증 PASS.

- [ ] **Step 7: 커밋**

```powershell
git add js/ui/CardFactory.js js/ui/ModalManager.js js/ui/EquipmentModal.js js/data/items_combat.js js/data/legendaryItems.js js/data/locales.js css/cards.css tests/integration/WeaponAmmoUI.int.test.js
git commit -m "feat(ui): 무기 잔탄과 탄약 세트 정보 표시"
```

---

### Task 7: 전투 명령 덱의 공격·재장전·탄약 없음 상태

**Files:**

- Modify: `js/ui/CombatUI.js:456-507,620-650`
- Modify: `css/screens-combat.css:438-535`
- Modify: `tests/integration/CombatFocusedUI.int.test.js`
- Modify: `tests/integration/WeaponAmmoUI.int.test.js`

**Interfaces:**

- Consumes: `getMagazineState(GameState, instanceId)`
- Consumes: `canReload(GameState, instanceId)`
- Consumes: `CombatSystem.reloadActiveWeapon(instanceId)`
- Produces DOM: `data-command="attack"|"reload"`, `.is-reload`, `.is-empty`

- [ ] **Step 1: 전투 카드 3상태의 실패 테스트 작성**

```js
// tests/integration/WeaponAmmoUI.int.test.js 추가 import와 fixture
import CombatUI from '../../js/ui/CombatUI.js';
import CombatSystem from '../../js/systems/CombatSystem.js';

function setupFocusedPistolUi({
  loadedAmmo = 0,
  ammoQuantity = 0,
  melee = false,
} = {}) {
  document.body.innerHTML = '<div id="screen-combat"></div>';
  CombatUI._screen = document.getElementById('screen-combat');
  GameState.cards = {
    pistol_1: {
      instanceId: 'pistol_1',
      definitionId: 'pistol',
      loadedAmmo,
      durability: 100,
      contamination: 0,
    },
  };
  if (melee) {
    GameState.cards.knife_1 = {
      instanceId: 'knife_1',
      definitionId: 'knife',
      durability: 100,
      contamination: 0,
    };
  }
  GameState.board.middle = Array(20).fill(null);
  GameState.board.bottom = Array(20).fill(null);
  if (ammoQuantity > 0) {
    GameState.cards.ammo_1 = {
      instanceId: 'ammo_1',
      definitionId: 'pistol_ammo',
      quantity: ammoQuantity,
      durability: 100,
      contamination: 0,
    };
    GameState.board.middle[0] = 'ammo_1';
  }
  GameState.player.hp = { current: 100, max: 100 };
  GameState.player.characterId = 'doctor';
  GameState.player.equipped = {
    weapon_main: 'pistol_1',
    weapon_sub: melee ? 'knife_1' : null,
  };
  GameState.stats.stamina = { current: 10, max: 10, decayPerTP: 0 };
  GameState.stats.morale = { current: 50, max: 100, decayPerTP: 0 };
  GameState.companions = [];
  GameState.npcs = { states: {} };
  GameState.flags = {};
  CombatSystem._setupCombat({
    enemies: [{
      id: 'zombie_common',
      name: '감염자',
      currentHp: 100,
      maxHp: 100,
      speed: 1,
      row: 'front',
      defense: 0,
      attack: { damage: [0, 0], accuracy: 0 },
      specialSkills: [],
      weaknesses: [],
      resistances: [],
      _skillCooldowns: {},
      _statusEffects: [],
      lootTable: [],
    }],
    dangerLevel: 1,
  });
}

it('잔탄이 있으면 원거리 공격 카드에 N/20을 표시하고 대상 선택을 시작한다', () => {
  setupFocusedPistolUi({ loadedAmmo: 2, ammoQuantity: 0 });
  CombatUI.render();
  const button = document.querySelector('[data-skill-id="equipment:pistol_1"]');
  expect(button.dataset.command).toBe('attack');
  expect(button.textContent).toContain('잔탄 2/20');
  expect(button.disabled).toBe(false);
});

it('빈 탄창과 탄약 세트가 있으면 같은 카드가 대상 없는 재장전으로 바뀐다', () => {
  setupFocusedPistolUi({ loadedAmmo: 0, ammoQuantity: 1 });
  CombatUI.render();
  const button = document.querySelector('[data-skill-id="equipment:pistol_1"]');
  expect(button.dataset.command).toBe('reload');
  expect(button.classList.contains('is-reload')).toBe(true);
  expect(button.textContent).toContain('재장전');
  expect(button.textContent).toContain('20발 세트 1개 소비');
  button.click();
  expect(GameState.cards.pistol_1.loadedAmmo).toBe(20);
});

it('빈 탄창과 탄약 세트가 없으면 원거리 카드가 비활성화된다', () => {
  setupFocusedPistolUi({ loadedAmmo: 0, ammoQuantity: 0 });
  CombatUI.render();
  const button = document.querySelector('[data-skill-id="equipment:pistol_1"]');
  expect(button.classList.contains('is-empty')).toBe(true);
  expect(button.textContent).toContain('탄약 없음');
  expect(button.disabled).toBe(true);
});

it('원거리 카드가 비활성이어도 근접 보조무기 카드는 활성 상태다', () => {
  setupFocusedPistolUi({ loadedAmmo: 0, ammoQuantity: 0, melee: true });
  CombatUI.render();
  expect(document.querySelector('[data-skill-id="equipment:pistol_1"]').disabled).toBe(true);
  expect(document.querySelector('[data-skill-id="equipment:knife_1"]').disabled).toBe(false);
});
```

- [ ] **Step 2: 실패 확인**

Run:

```powershell
npx vitest run tests/integration/WeaponAmmoUI.int.test.js tests/integration/CombatFocusedUI.int.test.js
```

Expected: 모든 원거리 카드가 기존 `탄약 1` 공격 카드로만 렌더돼 FAIL.

- [ ] **Step 3: 원거리 카드 표시 모델 구현**

`CombatUI`에 DOM과 분리된 helper를 추가한다.

```js
_magazineActionState(activeCombatant, skill) {
  if (
    activeCombatant?.sourceType !== 'player'
    || (skill?.costs?.magazineRound ?? 0) <= 0
    || !skill?.equipmentInstanceId
  ) return null;

  const magazine = getMagazineState(GameState, skill.equipmentInstanceId);
  if (!magazine.ok) return { mode: 'empty', disabled: true, magazine };
  if (magazine.loadedAmmo > 0) {
    return { mode: 'attack', disabled: false, magazine };
  }
  const reloadCheck = canReload(GameState, skill.equipmentInstanceId);
  return reloadCheck.ok
    ? { mode: 'reload', disabled: false, magazine }
    : { mode: 'empty', disabled: true, magazine };
},
```

`_renderSkillBar()`에서 다음 규칙으로 기존 label/stat/disabled를 덮어쓴다.

```js
const magazineAction = this._magazineActionState(activeCombatant, skill);
const command = magazineAction?.mode === 'reload' ? 'reload' : 'attack';
const isEmpty = magazineAction?.mode === 'empty';
const displayLabel = magazineAction?.mode === 'reload'
  ? I18n.t('combat.reload')
  : magazineAction?.mode === 'empty'
    ? I18n.t('combat.noAmmo')
    : label;
const ammoDetail = magazineAction?.mode === 'reload'
  ? I18n.t('combat.reloadPackCost')
  : magazineAction
    ? I18n.t('combat.loadedAmmo', {
        ammo: magazineAction.magazine.loadedAmmo,
        capacity: magazineAction.magazine.capacity,
      })
    : null;

const reloadMode = magazineAction?.mode === 'reload';
const invalidOrigin = !reloadMode
  && Array.isArray(skill.usableFrom)
  && activeRank !== null
  && !skill.usableFrom.includes(activeRank);
const disabled = magazineAction?.disabled === true
  || invalidOrigin
  || combat.phase !== 'await_ally_input';
const magazineClass = reloadMode
  ? ' is-reload'
  : magazineAction?.mode === 'empty'
    ? ' is-empty'
    : '';

return `
  <button class="combat-skill-button combat-action-card${selected}${magazineClass}${invalidOrigin ? ' disabled' : ''}"
          data-skill-id="${this._escape(skillId)}"
          data-command="${command}"
          data-weapon-instance-id="${this._escape(skill.equipmentInstanceId ?? '')}"
          title="${this._escape(title)}"
          ${disabled ? 'disabled' : ''}>
    <span class="action-cost">1</span>
    <span class="skill-name">${this._escape(displayLabel)}</span>
    <span class="skill-range">${this._escape(rangeLabel)}</span>
    <span class="skill-icon">${this._skillIconHtml(skill.icon, isAttack)}</span>
    <span class="skill-detail skill-stats">
      ${ammoDetail ? `<span class="skill-stat">${this._escape(ammoDetail)}</span>` : statRows.join('')}
    </span>
    ${invalidOrigin ? '<span class="skill-lock">(위치 변경 필요)</span>' : ''}
  </button>`;
```

재장전은 위치 제한과 무관하므로 `mode === 'reload'`일 때 `invalidOrigin`을 disabled 조건에 포함하지 않는다. 공격 상태는 기존 rank 제한을 그대로 적용한다.

- [ ] **Step 4: 클릭 처리와 전투 카드 CSS 구현**

```js
button.addEventListener('click', () => {
  if (button.disabled) return;
  if (button.dataset.command === 'reload') {
    CombatSystem.reloadActiveWeapon(button.dataset.weaponInstanceId);
    if (GameState.combat?.active) this.render();
    return;
  }
  if (CombatSystem.selectSkill(button.dataset.skillId)) this.render();
});
```

```css
.combat-skill-button.is-reload {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}

.combat-skill-button.is-empty {
  color: var(--text-danger);
  border-color: var(--text-danger);
  cursor: not-allowed;
  opacity: 0.52;
}
```

- [ ] **Step 5: 전투 UI 한/영 문자열 추가**

```js
// ko
'combat.reload':         '재장전',
'combat.noAmmo':         '탄약 없음',
'combat.reloadPackCost': '20발 세트 1개 소비',
'combat.loadedAmmo':     '잔탄 {ammo}/{capacity}',

// en
'combat.reload':         'Reload',
'combat.noAmmo':         'No Ammo',
'combat.reloadPackCost': 'Consumes 1 × 20-round pack',
'combat.loadedAmmo':     'Ammo {ammo}/{capacity}',
```

- [ ] **Step 6: focused UI 테스트 통과 확인**

Run:

```powershell
npx vitest run tests/integration/WeaponAmmoUI.int.test.js tests/integration/CombatFocusedUI.int.test.js
```

Expected: 공격 `2/20`, 재장전 활성, 탄약 없음 비활성, 근접 독립 활성 상태가 모두 PASS.

- [ ] **Step 7: 커밋**

```powershell
git add js/ui/CombatUI.js css/screens-combat.css js/data/locales.js tests/integration/WeaponAmmoUI.int.test.js tests/integration/CombatFocusedUI.int.test.js
git commit -m "feat(ui): 전투 공격 카드를 재장전 상태와 연동"
```

---

### Task 8: 저장 지속성·전체 회귀·빌드 검증

**Files:**

- Modify: `tests/integration/WeaponAmmoCombat.int.test.js`
- Modify: `tests/integration/WeaponAmmoUI.int.test.js`
- Modify: `tests/unit/GameState.test.js`

**Interfaces:**

- Verifies: `loadedAmmo` 직렬화·역직렬화 왕복
- Verifies: 전투 종료·장착 해제·교체가 잔탄을 바꾸지 않음
- Verifies: UI 우회 호출도 빈 탄창 공격을 거부

- [ ] **Step 1: 지속성과 우회 방지 회귀 테스트 완성**

```js
it('잔탄은 저장 왕복 뒤에도 유지된다', () => {
  const pistol = GameState.createCardInstance('pistol', { loadedAmmo: 7 });
  GameState.player.equipped.weapon_main = pistol.instanceId;
  const serialized = GameState.serialize();
  GameState.deserialize(serialized);
  expect(GameState.cards[pistol.instanceId].loadedAmmo).toBe(7);
});

it('무기 해제와 재장착은 잔탄을 바꾸지 않는다', () => {
  GameState.board.middle = Array(20).fill(null);
  GameState.board.bottom = Array(20).fill(null);
  GameState.player.equipped.weapon_main = null;
  const pistol = GameState.createCardInstance('pistol', { loadedAmmo: 9 });
  expect(GameState.placeCardInRow(pistol.instanceId, 'middle')).toBe(true);
  expect(EquipmentSystem.equip(pistol.instanceId, 'weapon_main')).toBe(true);
  expect(EquipmentSystem.unequip('weapon_main')).toBe(true);
  expect(GameState.cards[pistol.instanceId].loadedAmmo).toBe(9);
  expect(EquipmentSystem.equip(pistol.instanceId, 'weapon_main')).toBe(true);
  expect(GameState.cards[pistol.instanceId].loadedAmmo).toBe(9);
});

it('전투 종료 뒤에도 무기 인스턴스 잔탄을 유지한다', () => {
  setupPistolCombat({ loadedAmmo: 2, enemyHp: 1 });
  vi.spyOn(Math, 'random').mockReturnValue(0);
  selectPistolAndTarget();
  CombatSystem.confirmAction();
  expect(GameState.combat.active).toBe(false);
  expect(GameState.cards.pistol_1.loadedAmmo).toBe(1);
  vi.restoreAllMocks();
});

it('UI를 거치지 않은 confirmAction도 빈 탄창 공격을 거부한다', () => {
  setupPistolCombat({ loadedAmmo: 0, ammoQuantity: 1 });
  GameState.combat.selectedSkillId = 'equipment:pistol_1';
  GameState.combat.selectedTargetId = 'enemy:0';
  GameState.combat.phase = 'confirm_action';
  const beforeHp = GameState.combat.combatants['enemy:0'].hp;
  const beforeDurability = GameState.cards.pistol_1.durability;
  const beforeNoise = GameState.noise.level;
  const beforeActor = GameState.combat.activeCombatantId;
  const result = CombatSystem.confirmAction();
  expect(result).toMatchObject({ ok: false, reason: 'empty_magazine' });
  expect(GameState.combat.combatants['enemy:0'].hp).toBe(beforeHp);
  expect(GameState.cards.pistol_1.loadedAmmo).toBe(0);
  expect(GameState.cards.pistol_1.durability).toBe(beforeDurability);
  expect(GameState.noise.level).toBe(beforeNoise);
  expect(GameState.combat.activeCombatantId).toBe(beforeActor);
});

it('원거리 무기 카드가 파괴되면 그 인스턴스의 잔탄도 함께 제거된다', () => {
  const pistol = GameState.createCardInstance('pistol', { loadedAmmo: 11 });
  GameState.removeCardInstance(pistol.instanceId);
  expect(GameState.cards[pistol.instanceId]).toBeUndefined();
});
```

- [ ] **Step 2: 관련 테스트 묶음 실행**

Run:

```powershell
npx vitest run tests/unit/WeaponAmmoSystem.test.js tests/unit/EquipmentSystem_weaponSlots.test.js tests/unit/GameState.test.js tests/unit/CombatSkillSystem.test.js tests/unit/CombatantAdapter.test.js tests/unit/CombatSystem_rankedPipeline.test.js tests/unit/CombatWeaponStatusInflict.test.js tests/integration/WeaponAmmoCombat.int.test.js tests/integration/WeaponAmmoUI.int.test.js tests/integration/CombatFocusedUI.int.test.js
```

Expected: 지정한 모든 테스트 파일 PASS.

- [ ] **Step 3: 데이터 검증 실행**

Run:

```powershell
node --input-type=module js/data/validate.js
```

Expected: 프로세스 종료 코드 `0`, 데이터 계약 오류 없음.

- [ ] **Step 4: 전체 Vitest 실행**

Run:

```powershell
npm test
```

Expected: 전체 테스트 PASS. 기존 `costs.ammo`, 동료 장비 loadout, main 근접 무기 기대값이 남아 있다면 새 계약에 맞게 해당 fixture만 수정하고 제품 코드를 되돌리지 않는다.

- [ ] **Step 5: 웹 빌드 실행**

Run:

```powershell
npm run build:web
```

Expected: Vite build 종료 코드 `0`, unresolved import와 CSS 구문 오류 없음.

- [ ] **Step 6: 기존 전투 브라우저 검증 실행**

Run:

```powershell
npm run test:e2e:combat
```

Expected: `combat-screen:ok`와 스크린샷 경로가 출력되고, 공격 가능한 첫 카드를 선택해 전투가 진행된다.

- [ ] **Step 7: 작업 트리와 diff 검사**

Run:

```powershell
git diff --check
git status --short
```

Expected: `git diff --check` 출력 없음. `.claude/settings.local.json`은 계속 미추적 상태로 남고 이번 기능 파일만 수정 목록에 존재한다.

- [ ] **Step 8: 최종 테스트 보강 커밋**

```powershell
git add tests/unit/GameState.test.js tests/integration/WeaponAmmoCombat.int.test.js tests/integration/WeaponAmmoUI.int.test.js
git commit -m "test(combat): 탄창 지속성과 전투 회귀 검증"
```

- [ ] **Step 9: 최종 커밋 상태 확인**

Run:

```powershell
git status --short
git log --oneline -8
```

Expected: 기능 관련 변경은 모두 커밋됐고, 사용자 소유 `.claude/settings.local.json`만 미추적 상태로 표시된다.
