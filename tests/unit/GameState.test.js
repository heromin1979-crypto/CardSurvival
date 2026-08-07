import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import GameState from '../../js/core/GameState.js';

// GameState는 싱글턴이므로 초기값 읽기 테스트에 집중한다.
// (mutate 테스트는 TickEngine.test.js에서 격리 환경으로 진행)

describe('GameState 초기 구조 — time', () => {
  it('totalTP 초기값은 0이다', () => {
    expect(GameState.time.totalTP).toBe(0);
  });

  it('day 초기값은 1이다', () => {
    expect(GameState.time.day).toBe(1);
  });

  it('isPaused 초기값은 false다', () => {
    expect(GameState.time.isPaused).toBe(false);
  });
});

describe('GameState 초기 구조 — stats', () => {
  it('hydration current 초기값은 200이다', () => {
    expect(GameState.stats.hydration.current).toBe(200);
  });

  it('모든 stat에 current/max/decayPerTP 필드가 있다', () => {
    const statKeys = ['hydration', 'nutrition', 'temperature', 'morale',
                      'radiation', 'infection', 'fatigue', 'stamina'];
    for (const key of statKeys) {
      expect(GameState.stats[key]).toHaveProperty('current');
      expect(GameState.stats[key]).toHaveProperty('max');
      expect(GameState.stats[key]).toHaveProperty('decayPerTP');
    }
  });
});

describe('GameState 초기 구조 — player', () => {
  it('isAlive 초기값은 true다', () => {
    expect(GameState.player.isAlive).toBe(true);
  });

  it('hp에 current/max 필드가 있다', () => {
    expect(GameState.player.hp).toHaveProperty('current');
    expect(GameState.player.hp).toHaveProperty('max');
  });

  it('traits 초기값은 빈 배열이다', () => {
    expect(Array.isArray(GameState.player.traits)).toBe(true);
  });

  it('skills 객체에 12개 스킬이 정의되어 있다', () => {
    const skillKeys = Object.keys(GameState.player.skills);
    expect(skillKeys.length).toBe(12);
  });

  it('각 skill에 xp/level 필드가 있다', () => {
    for (const skill of Object.values(GameState.player.skills)) {
      expect(skill).toHaveProperty('xp');
      expect(skill).toHaveProperty('level');
    }
  });

  it('탄약 요구 무기 인스턴스를 빈 탄창으로 생성한다', () => {
    const inst = GameState.createCardInstance('pistol');
    expect(inst.loadedAmmo).toBe(0);
    GameState.removeCardInstance(inst.instanceId);
  });
});

describe('GameState 장착 무기 슬롯 저장 마이그레이션', () => {
  let initialSave;

  beforeEach(() => {
    initialSave = GameState.serialize();
  });

  afterEach(() => {
    GameState.deserialize(initialSave);
  });

  it('유효한 원거리 무기의 누락된 loadedAmmo를 0으로 복원한다', () => {
    const save = JSON.parse(GameState.serialize());
    save.cards = {
      pistol_old: { instanceId: 'pistol_old', definitionId: 'pistol' },
    };
    save.player.equipped.weapon_main = 'pistol_old';
    save.board.middle = Array(20).fill(null);
    save.board.bottom = Array(20).fill(null);

    GameState.deserialize(JSON.stringify(save));

    expect(GameState.cards.pistol_old.loadedAmmo).toBe(0);
  });

  it('장전된 탄창과 대기 전리품을 저장 후 다시 불러와도 보존한다', () => {
    const pistol = GameState.createCardInstance('pistol', { loadedAmmo: 7 });
    GameState.player.equipped.weapon_main = pistol.instanceId;
    GameState.pendingLoot = [{
      definitionId: 'scrap_metal',
      quantity: 3,
      contamination: 0,
    }];

    const serialized = GameState.serialize();
    GameState.deserialize(serialized);

    expect(GameState.cards[pistol.instanceId].loadedAmmo).toBe(7);
    expect(GameState.player.equipped.weapon_main).toBe(pistol.instanceId);
    expect(GameState.pendingLoot).toEqual([{
      definitionId: 'scrap_metal',
      quantity: 3,
      contamination: 0,
    }]);
  });

  it.each(['pistol', 'crossbow', 'crossbow_plus'])('%s의 레거시 저장은 빈 탄창으로 마이그레이션한다', definitionId => {
    const save = JSON.parse(GameState.serialize());
    save.cards = {
      weapon_old: { instanceId: 'weapon_old', definitionId },
    };
    save.player.equipped.weapon_main = 'weapon_old';
    save.board.middle = Array(20).fill(null);
    save.board.bottom = Array(20).fill(null);

    GameState.deserialize(JSON.stringify(save));

    expect(GameState.cards.weapon_old.loadedAmmo).toBe(0);
  });

  it('보드가 가득 찬 레거시 무기 슬롯의 회수 전리품을 다음 저장에도 보존한다', () => {
    const save = JSON.parse(GameState.serialize());
    const fillerIds = Array.from({ length: 40 }, (_, index) => `filler_${index}`);
    save.cards = Object.fromEntries([
      ['molotov_old', {
        instanceId: 'molotov_old',
        definitionId: 'molotov_cocktail',
        quantity: 1,
      }],
      ...fillerIds.map(instanceId => [instanceId, {
        instanceId,
        definitionId: 'scrap_metal',
        quantity: 1,
      }]),
    ]);
    save.player.equipped.weapon_sub = 'molotov_old';
    save.board.middle = fillerIds.slice(0, 20);
    save.board.bottom = fillerIds.slice(20, 40);
    save.pendingLoot = [];

    GameState.deserialize(JSON.stringify(save));
    const roundTrip = GameState.serialize();
    GameState.deserialize(roundTrip);

    expect(GameState.player.equipped.weapon_sub).toBeNull();
    expect(GameState.pendingLoot).toEqual(expect.arrayContaining([
      expect.objectContaining({ definitionId: 'molotov_cocktail', quantity: 1 }),
    ]));
  });
});
