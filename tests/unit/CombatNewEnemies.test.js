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
