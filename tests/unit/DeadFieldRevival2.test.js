// === 2차 사문화 필드 배선 ===
// 데이터 전수 감사에서 나온 세 건. 셋 다 선언은 있는데 읽는 코드가 없었다.
//   1. 레전더리 음식 4종의 thirst/hunger — 실제 필드는 hydration/nutrition이고 부호도 반대다
//   2. 적 33종의 attack.noiseOnAttack — 적 공격이 소음을 전혀 내지 않았다
//   3. 도구 8종의 onUse.durabilityPerUse — 아무리 써도 닳지 않았다
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ITEMS from '../../js/data/items.js';
import ENEMIES from '../../js/data/enemies.js';
import SECRET_ENEMIES from '../../js/data/secretEnemies.js';

const LEGENDARY_FOOD = ['pristine_spring_water', 'survivors_cache', 'civil_defense_cache', 'survivors_feast'];

describe('1. 레전더리 음식 — 허기·갈증 효과', () => {
  it.each(LEGENDARY_FOOD)('%s에 죽은 필드가 남아 있지 않다', id => {
    const c = ITEMS[id].onConsume;
    expect(c.thirst).toBeUndefined();
    expect(c.hunger).toBeUndefined();
  });

  it('선언값이 부호를 뒤집어 정상 필드로 옮겨졌다', () => {
    expect(ITEMS.pristine_spring_water.onConsume).toMatchObject({ hydration: 100 });
    expect(ITEMS.survivors_cache.onConsume).toMatchObject({ nutrition: 30, hydration: 30 });
    expect(ITEMS.civil_defense_cache.onConsume).toMatchObject({ nutrition: 40, hydration: 40 });
    expect(ITEMS.survivors_feast.onConsume).toMatchObject({ nutrition: 100, hydration: 100 });
  });

  it('원래 동작하던 다른 효과는 그대로다', () => {
    expect(ITEMS.survivors_feast.onConsume).toMatchObject({
      hp: 100, fatigue: -100, morale: 30, infection: -20,
    });
    expect(ITEMS.pristine_spring_water.onConsume).toMatchObject({ hp: 20, infection: -15 });
  });

  it('회복 수치는 양수다 — 이 게임의 hydration/nutrition 규약', () => {
    for (const id of LEGENDARY_FOOD) {
      const c = ITEMS[id].onConsume;
      if (c.hydration != null) expect(c.hydration).toBeGreaterThan(0);
      if (c.nutrition != null) expect(c.nutrition).toBeGreaterThan(0);
    }
  });
});

describe('2. 적 공격 소음', () => {
  let CombatSystem;
  let NoiseSystem;

  beforeEach(async () => {
    CombatSystem = (await import('../../js/systems/CombatSystem.js')).default;
    NoiseSystem  = (await import('../../js/systems/NoiseSystem.js')).default;
    const GameState = (await import('../../js/core/GameState.js')).default;
    GameState.combat = {
      active: true, enemies: [], targetIndex: 0, log: [], fxQueue: [],
      playerStatus: [], enemyStatus: [], battlefieldStatuses: [], combatants: {},
    };
    GameState.player.hp = { current: 500, max: 500 };
    GameState.companions = [];
  });

  const enemyWithNoise = (noise = 4) => ({
    id: 'test_zombie', name: '좀비', type: 'zombie',
    currentHp: 100, maxHp: 100, defense: 0, _statusEffects: [],
    attack: { damage: [5, 5], accuracy: 1.0, noiseOnAttack: noise },
  });

  it('적 정의 33종이 noiseOnAttack을 선언하고 있다', () => {
    const n = [...Object.values(ENEMIES), ...Object.values(SECRET_ENEMIES)]
      .filter(e => e?.attack?.noiseOnAttack != null).length;
    expect(n).toBe(33);
  });

  it('기본 공격이 명중하면 선언한 만큼 소음이 오른다', () => {
    const spy = vi.spyOn(NoiseSystem, 'addNoise').mockImplementation(() => {});
    CombatSystem._enemyAttack(enemyWithNoise(4));
    expect(spy).toHaveBeenCalledWith(4);
    vi.restoreAllMocks();
  });

  it('빗나가면 소음이 오르지 않는다', () => {
    const spy = vi.spyOn(NoiseSystem, 'addNoise').mockImplementation(() => {});
    const miss = { ...enemyWithNoise(4), attack: { damage: [5, 5], accuracy: 0, noiseOnAttack: 4 } };
    CombatSystem._enemyAttack(miss);
    expect(spy).not.toHaveBeenCalledWith(4);
    vi.restoreAllMocks();
  });

  it('선언이 없는 적은 소음을 내지 않는다', () => {
    const spy = vi.spyOn(NoiseSystem, 'addNoise').mockImplementation(() => {});
    const silent = { ...enemyWithNoise(), attack: { damage: [5, 5], accuracy: 1.0 } };
    CombatSystem._enemyAttack(silent);
    expect(spy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});

describe('3. 도구 사용 내구도', () => {
  const TOOLS = ['lighter', 'stone_knife', 'kitchen_knife', 'mortar_pestle',
                 'clay_pot', 'iron_pot', 'trowel', 'sickle'];

  it.each(TOOLS)('%s가 durabilityPerUse를 선언한다', id => {
    expect(ITEMS[id].onUse?.durabilityPerUse).toBeGreaterThan(0);
  });

  it('제작 단계 완료 시 보드 도구가 닳는다', async () => {
    const CraftSystem = (await import('../../js/systems/CraftSystem.js')).default;
    const GameState = (await import('../../js/core/GameState.js')).default;

    const before = 100;
    GameState.cards = { t1: { instanceId: 't1', definitionId: 'mortar_pestle', durability: before } };
    GameState.board = { top: [], environment: [], middle: ['t1'], bottom: [] };

    const worn = CraftSystem._wearRequiredTools(['mortar_pestle']);

    expect(worn).toBe(1);
    expect(GameState.cards.t1.durability).toBe(before - ITEMS.mortar_pestle.onUse.durabilityPerUse);
  });

  it('durabilityPerUse가 없는 도구는 닳지 않는다', async () => {
    const CraftSystem = (await import('../../js/systems/CraftSystem.js')).default;
    const GameState = (await import('../../js/core/GameState.js')).default;

    GameState.cards = { w1: { instanceId: 'w1', definitionId: 'workbench', durability: 100 } };
    GameState.board = { top: [], environment: [], middle: ['w1'], bottom: [] };

    CraftSystem._wearRequiredTools(['workbench']);
    expect(GameState.cards.w1.durability).toBe(100);
  });

  it('내구도가 0이 되면 도구가 제거된다', async () => {
    const CraftSystem = (await import('../../js/systems/CraftSystem.js')).default;
    const GameState = (await import('../../js/core/GameState.js')).default;

    GameState.cards = { t1: { instanceId: 't1', definitionId: 'mortar_pestle', durability: 1 } };
    GameState.board = { top: [], environment: [], middle: ['t1'], bottom: [] };

    CraftSystem._wearRequiredTools(['mortar_pestle']);
    expect(GameState.cards.t1).toBeUndefined();
  });

  it('보드에 도구가 없으면(구역 설치 구조물 사용) 아무것도 닳지 않는다', async () => {
    const CraftSystem = (await import('../../js/systems/CraftSystem.js')).default;
    const GameState = (await import('../../js/core/GameState.js')).default;

    GameState.cards = {};
    GameState.board = { top: [], environment: [], middle: [], bottom: [] };

    expect(CraftSystem._wearRequiredTools(['mortar_pestle'])).toBe(0);
  });
});
