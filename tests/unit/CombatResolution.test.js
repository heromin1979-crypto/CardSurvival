import { describe, expect, it } from 'vitest';
import BALANCE from '../../js/data/gameBalance.js';
import {
  composeAccuracy,
  modifyIncomingDamage,
  modifyOutgoingDamage,
  resolveHitRoll,
  rollCrit,
  weaponAffinityMult,
} from '../../js/systems/combat/CombatResolution.js';

const TOKENS = BALANCE.combat.tokens;

function combatant(overrides = {}) {
  return {
    id: 'unit',
    side: 'ally',
    hp: 20,
    maxHp: 20,
    tokens: {},
    dead: false,
    statusEffects: [],
    ...overrides,
  };
}

describe('composeAccuracy', () => {
  it('sums modifiers and clamps to the [0.05, 1] band', () => {
    expect(composeAccuracy(0.8, { morale: 0.05, night: -0.15 })).toBeCloseTo(0.7);
    expect(composeAccuracy(0.2, { night: -0.5 })).toBeCloseTo(0.05);
    expect(composeAccuracy(0.95, { morale: 0.2 })).toBe(1);
  });

  it('falls back to a safe default when base accuracy is malformed', () => {
    expect(composeAccuracy(Number.NaN, {})).toBeCloseTo(0.7);
  });
});

describe('resolveHitRoll', () => {
  it('consumes an accuracy token from the attacker for a hit bonus', () => {
    const attacker = combatant({ tokens: { accuracy: 1 } });
    const defender = combatant({ side: 'enemy' });
    // 굴림 0.86 < 0.75 + accuracyBonus(0.15) 여야만 명중 → 토큰이 실제 반영됐는지 확인
    const result = resolveHitRoll({
      attacker,
      defender,
      accuracy: 0.75,
      random: () => 0.86,
    });

    expect(result.hit).toBe(true);
    expect(attacker.tokens.accuracy).toBe(0);
  });

  it('consumes a dodge token from the defender and forces a miss', () => {
    const attacker = combatant();
    const defender = combatant({ side: 'enemy', tokens: { dodge: 2 } });
    const result = resolveHitRoll({
      attacker,
      defender,
      accuracy: 1,
      random: () => 0,
    });

    expect(result.hit).toBe(false);
    expect(result.dodged).toBe(true);
    expect(defender.tokens.dodge).toBe(1);
  });

  it('misses plainly when the roll exceeds accuracy', () => {
    const result = resolveHitRoll({
      attacker: combatant(),
      defender: combatant({ side: 'enemy' }),
      accuracy: 0.5,
      random: () => 0.9,
    });

    expect(result.hit).toBe(false);
    expect(result.dodged).toBe(false);
  });
});

describe('rollCrit', () => {
  it('consumes a focus token for bonus crit chance', () => {
    const attacker = combatant({ tokens: { focus: 1 } });
    // 굴림 0.2 는 기본 0.1 로는 실패, focus 보너스 포함(0.1+0.15)이면 성공
    const result = rollCrit({
      attacker,
      critChance: 0.1,
      critMultiplier: 2,
      random: () => 0.2,
    });

    expect(result.crit).toBe(true);
    expect(result.multiplier).toBe(2);
    expect(attacker.tokens.focus).toBe(0);
  });

  it('returns no crit and keeps tokens when chance is zero', () => {
    const attacker = combatant();
    const result = rollCrit({ attacker, critChance: 0, random: () => 0 });
    expect(result.crit).toBe(false);
  });
});

describe('modifyOutgoingDamage', () => {
  it('consumes strength-family tokens for a damage multiplier', () => {
    const attacker = combatant({ tokens: { strength: 1 } });
    const damage = modifyOutgoingDamage(10, attacker);

    expect(damage).toBe(Math.floor(10 * TOKENS.strengthDamageMult));
    expect(attacker.tokens.strength).toBe(0);
  });

  it('consumes hesitation to weaken the attack', () => {
    const attacker = combatant({ tokens: { hesitation: 1 } });
    const damage = modifyOutgoingDamage(10, attacker);

    expect(damage).toBe(Math.floor(10 * TOKENS.hesitationDamageMult));
    expect(attacker.tokens.hesitation).toBe(0);
  });

  it('stacks only one multiplier per token family per attack', () => {
    const attacker = combatant({ tokens: { strength: 1, power: 1 } });
    const damage = modifyOutgoingDamage(10, attacker);

    // strength 와 power 는 같은 "공격 강화" 계열 — 한 공격에 하나만 소비
    expect(damage).toBe(Math.floor(10 * TOKENS.strengthDamageMult));
    expect(attacker.tokens.strength + attacker.tokens.power).toBe(1);
  });
});

describe('modifyIncomingDamage', () => {
  it('consumes vulnerable from the defender to amplify damage', () => {
    const defender = combatant({ tokens: { vulnerable: 1 } });
    const damage = modifyIncomingDamage(10, defender);

    expect(damage).toBe(Math.floor(10 * TOKENS.vulnerableDamageMult));
    expect(defender.tokens.vulnerable).toBe(0);
  });

  it('returns damage unchanged without tokens', () => {
    expect(modifyIncomingDamage(10, combatant())).toBe(10);
  });
});

describe('weaponAffinityMult', () => {
  it('applies weakness and resistance multipliers from enemy definitions', () => {
    const enemyDef = { weaknesses: ['blade'], resistances: ['blunt'] };

    expect(weaponAffinityMult('blade', enemyDef))
      .toBe(BALANCE.combat.weaponWeaknessMult);
    expect(weaponAffinityMult('blunt', enemyDef))
      .toBe(BALANCE.combat.weaponResistanceMult);
    expect(weaponAffinityMult('fire', enemyDef)).toBe(1);
    expect(weaponAffinityMult(null, enemyDef)).toBe(1);
  });
});

describe('Track 1 — 전투 디테일 확장', () => {
  it('marked 토큰은 받는 피해를 크게 증폭하고 소비된다', () => {
    const defender = combatant({ tokens: { marked: 1 } });
    const damage = modifyIncomingDamage(10, defender);

    expect(damage).toBe(Math.floor(10 * TOKENS.markedDamageMult));
    expect(defender.tokens.marked).toBe(0);
  });

  it('vulnerable과 marked는 함께 적용된다', () => {
    const defender = combatant({ tokens: { vulnerable: 1, marked: 1 } });
    const damage = modifyIncomingDamage(10, defender);

    expect(damage).toBe(
      Math.floor(Math.floor(10 * TOKENS.vulnerableDamageMult) * TOKENS.markedDamageMult),
    );
  });

  it('죽음의 문턱에 몰린 공격자는 피해가 감소한다', () => {
    const attacker = combatant({ deathsDoor: true });
    const damage = modifyOutgoingDamage(10, attacker);

    expect(damage).toBe(Math.floor(10 * BALANCE.combat.deathsDoor.outgoingDamageMult));
  });

  it('기본 dodge 스탯으로 토큰 없이도 회피가 발생한다', () => {
    const attacker = combatant();
    const defender = combatant({ side: 'enemy', dodge: 0.3 });
    // 명중 굴림 0.1 (성공) → 회피 굴림 0.2 < 0.3 (회피)
    const rolls = [0.1, 0.2];
    const result = resolveHitRoll({
      attacker,
      defender,
      accuracy: 1,
      random: () => rolls.shift() ?? 0.99,
    });

    expect(result.hit).toBe(false);
    expect(result.dodged).toBe(true);
  });

  it('기본 dodge 굴림에 실패하면 정상 명중한다', () => {
    const defender = combatant({ side: 'enemy', dodge: 0.3 });
    const rolls = [0.1, 0.9];
    const result = resolveHitRoll({
      attacker: combatant(),
      defender,
      accuracy: 1,
      random: () => rolls.shift() ?? 0.99,
    });

    expect(result.hit).toBe(true);
  });
});

describe('기본 dodge 스탯 상한', () => {
  // 데이터 실수로 dodge가 1.0 이상 들어가도 회피가 확정되지 않도록 0.9 상한을 유지한다
  it('dodge 스탯은 0.9로 캡되어 그 이상의 굴림은 명중한다', () => {
    const defender = combatant({ side: 'enemy', dodge: 5 });
    const rolls = [0.1, 0.95];
    const result = resolveHitRoll({
      attacker: combatant(),
      defender,
      accuracy: 1,
      random: () => rolls.shift() ?? 0.99,
    });

    expect(result.hit).toBe(true);
    expect(result.dodged).toBe(false);
  });

  it('캡 이내 굴림은 여전히 회피된다', () => {
    const defender = combatant({ side: 'enemy', dodge: 5 });
    const rolls = [0.1, 0.89];
    const result = resolveHitRoll({
      attacker: combatant(),
      defender,
      accuracy: 1,
      random: () => rolls.shift() ?? 0.99,
    });

    expect(result.dodged).toBe(true);
  });
});
