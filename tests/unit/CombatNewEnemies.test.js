// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { afterEach, vi } from 'vitest';
import GameState from '../../js/core/GameState.js';
import ENEMIES, { instantiateEnemy, rollEnemy } from '../../js/data/enemies.js';
import CombatSystem from '../../js/systems/CombatSystem.js';
import { buildEnemyProfile } from '../../js/systems/combat/EnemyCombatAdapter.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('신규 적 3종 정의', () => {
  it('zombie_bloater: timedThreat self_destruct, fire/explosive 약점', () => {
    const e = ENEMIES.zombie_bloater;
    expect(e.timedThreat.id).toBe('self_destruct');
    expect(e.timedThreat.chargeTurns).toBe(3);
    expect(e.timedThreat.chargingAttacks).toBe(true);
    expect(e.weaknesses).toEqual(expect.arrayContaining(['fire', 'explosive']));
  });
  it('zombie_screamer: timedThreat summon_horde, chargeTurns 3 (후열 소환수)', () => {
    const e = ENEMIES.zombie_screamer;
    expect(e.timedThreat.id).toBe('summon_horde');
    expect(e.timedThreat.chargeTurns).toBe(3);
    expect(e.position).toBe('back');
    expect(e.attackType).toBe('ranged');
  });
  it('zombie_charger: timedThreat charge_strike, chargingAttacks false', () => {
    const e = ENEMIES.zombie_charger;
    expect(e.timedThreat.id).toBe('charge_strike');
    expect(e.timedThreat.chargeTurns).toBe(1);
    expect(e.timedThreat.chargingAttacks).toBe(false);
  });
});

describe('전열/후열 배치 정의', () => {
  it('후열 적 3종: position back + attackType ranged', () => {
    for (const id of ['zombie_acid', 'zombie_screamer', 'raider_elite']) {
      expect(ENEMIES[id].position).toBe('back');
      expect(ENEMIES[id].attackType).toBe('ranged');
    }
  });
  it('일반 좀비는 position 미지정 → 전열 기본값', () => {
    expect(ENEMIES.zombie_common.position).toBeUndefined();
    const inst = rollEnemy(1);
    expect(['front', 'back']).toContain(inst.row);
  });
});

describe('rollEnemy 런타임 초기화', () => {
  it('인스턴스는 row 필드를 가진다 (position 기반)', () => {
    for (let i = 0; i < 40; i++) {
      const e = rollEnemy(4);
      expect(e.row).toBe(e.position ?? 'front');
    }
  });
  it('timedThreat 적은 _chargeRemaining 초기화', () => {
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
  it('인간형 적은 currentMorale을 def.morale.max(미정의 시 100)으로 초기화', () => {
    let found = false;
    for (let i = 0; i < 400; i++) {
      const e = rollEnemy(3);
      if (e.type === 'human') {
        const def = ENEMIES[e.id];
        const expectedMorale = def?.morale?.max ?? 100;
        expect(e.currentMorale).toBe(expectedMorale);
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});

describe('일반 적 행동 데이터와 랭크 프로필 통합', () => {
  it('patternProfile 행동 데이터가 복제된 combatProfile 기술보다 우선한다', () => {
    const profile = buildEnemyProfile({
      id: 'profile_priority',
      attackType: 'ranged',
      patternProfile: {
        role: 'sniper',
        targetPolicy: 'healer',
        defaultAction: {
          actionId: 'data_shot',
          targetPolicy: 'healer',
          hitCount: 1,
          telegraph: { turns: 0 },
          target: { side: 'healer', ranks: [1, 2, 3, 4], count: 1 },
          accuracy: 0.8,
          effects: [{ type: 'damage', value: [11, 17] }],
          motionKey: 'basic_attack',
        },
      },
      specialSkills: [{
        id: 'data_aim',
        targetPolicy: 'healer',
        hitCount: 1,
        telegraph: { turns: 1 },
        target: { side: 'healer', ranks: [1, 2, 3, 4], count: 1 },
        accuracy: 0.9,
        effects: [{ type: 'damage', value: [21, 29] }],
        motionKey: 'aimed_shot',
      }],
      combatProfile: {
        speed: 5,
        startRank: 3,
        skillIds: ['stale_copy'],
        skills: [{
          id: 'stale_copy',
          source: 'enemy',
          usableFrom: [1],
          target: { side: 'ally', ranks: [1], count: 1 },
          accuracy: 1,
          effects: [{ type: 'damage', value: [999, 999] }],
        }],
        ai: 'stale',
      },
    });

    expect(profile.skillIds).toEqual(['data_shot', 'data_aim']);
    expect(profile.skills.map(skill => ({
      id: skill.id,
      effects: skill.effects,
      motionKey: skill.motionKey,
    }))).toEqual([
      {
        id: 'data_shot',
        effects: [{ type: 'damage', value: [11, 17] }],
        motionKey: 'basic_attack',
      },
      {
        id: 'data_aim',
        effects: [{ type: 'damage', value: [21, 29] }],
        motionKey: 'aimed_shot',
      },
    ]);
    expect(profile.ai).toBe('sniper');
  });

  it('환자 좀비는 dormant→wake→startled_lunge 1회 뒤 기본공격으로 복귀한다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    GameState.player.hp = { current: 100, max: 100 };
    GameState.player.diseases = [];
    GameState.player.equipped = {};
    GameState.companions = [];
    GameState.npcs = { states: {} };
    const enemy = instantiateEnemy(ENEMIES.zombie_patient_dormant);

    CombatSystem._setupCombat({
      enemies: [enemy],
      dangerLevel: 1,
      nodeId: 'patient-wake-contract',
    });

    expect(enemy._nextIntent.action).toBe('dormant');

    CombatSystem._runSingleEnemyTurn(0);
    expect(enemy._nextIntent).toMatchObject({
      actionId: 'startled_lunge',
      category: 'special',
      motionKey: 'startled_lunge',
    });

    CombatSystem._runSingleEnemyTurn(0);
    expect(enemy._nextIntent).toMatchObject({
      actionId: 'basic_attack',
      category: 'basic',
      motionKey: 'basic_attack',
    });

    CombatSystem._runSingleEnemyTurn(0);
    expect(enemy._nextIntent.actionId).toBe('basic_attack');
  });
});
