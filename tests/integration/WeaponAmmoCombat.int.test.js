import { afterEach, describe, expect, it, vi } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState from '../../js/core/GameState.js';

function setupPistolCombat({ loadedAmmo = 0, ammoQuantity = 0, enemyHp = 100 } = {}) {
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
  GameState.player.equipped = { weapon_main: 'pistol_1', weapon_sub: null };
  GameState.stats.stamina = { current: 10, max: 10, decayPerTP: 0 };
  GameState.stats.morale = { current: 50, max: 100, decayPerTP: 0 };
  GameState.noise = { level: 0, decayPerTP: 1, influxThreshold: 60, influxTriggered: false };
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
  GameState.combat.formations.ally = [null, null, 'player', null];
}

function selectPistolAndTarget() {
  expect(CombatSystem.selectSkill('equipment:pistol_1')).toBe(true);
  expect(CombatSystem.selectTarget('enemy:0')).toBe(true);
}

afterEach(() => vi.restoreAllMocks());

describe('탄창 기반 원거리 전투 비용', () => {
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

  it('빈 주무기를 재장전하면 탄약 팩 하나를 소비하고 다음 아군 입력으로 진행한다', () => {
    setupPistolCombat({ loadedAmmo: 0, ammoQuantity: 6 });
    const beforeRound = GameState.combat.roundNumber;

    const result = CombatSystem.reloadActiveWeapon('pistol_1');

    expect(result).toMatchObject({ ok: true, turnConsumed: true, loadedAmmo: 20 });
    expect(GameState.cards.ammo_1.quantity).toBe(5);
    expect(GameState.combat.roundNumber).toBeGreaterThanOrEqual(beforeRound);
    expect(GameState.combat.phase).toBe('await_ally_input');
  });

  it('호환 탄약 팩이 없으면 재장전과 턴 상태를 모두 보존한다', () => {
    setupPistolCombat({ loadedAmmo: 0, ammoQuantity: 0 });
    const beforeQueue = structuredClone(GameState.combat.turnQueue);
    const beforeLogLength = GameState.combat.log.length;

    const result = CombatSystem.reloadActiveWeapon('pistol_1');

    expect(result).toMatchObject({
      ok: false,
      reason: 'missing_ammo_pack',
      turnConsumed: false,
    });
    expect(GameState.cards.pistol_1.loadedAmmo).toBe(0);
    expect(GameState.combat.turnQueue).toEqual(beforeQueue);
    expect(GameState.combat.phase).toBe('await_ally_input');
    expect(GameState.combat.lastActionFailure).toBe('missing_ammo_pack');
    expect(GameState.combat.log).toHaveLength(beforeLogLength + 1);
  });

  it('탄창에 한 발이라도 남았으면 재장전하지 않는다', () => {
    setupPistolCombat({ loadedAmmo: 1, ammoQuantity: 2 });

    expect(CombatSystem.reloadActiveWeapon('pistol_1'))
      .toMatchObject({ ok: false, reason: 'magazine_not_empty', turnConsumed: false });
    expect(GameState.cards.ammo_1.quantity).toBe(2);
  });
});
