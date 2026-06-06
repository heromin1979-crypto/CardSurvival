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
