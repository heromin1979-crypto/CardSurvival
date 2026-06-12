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
