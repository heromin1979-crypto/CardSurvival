import { describe, expect, it } from 'vitest';
import { healCombatant } from '../../js/systems/combat/CombatStatusSystem.js';

describe('healCombatant healing_received_down', () => {
  it('중첩된 치료 감소 중 가장 강한 값만 받는 치료량에 적용한다', () => {
    const target = {
      hp: 40,
      maxHp: 100,
      statusEffects: [
        { id: 'healing_received_down', duration: 2, value: 0.5 },
        { id: 'healing_received_down', duration: 1, value: 0.25 },
      ],
    };

    const result = healCombatant(target, 20);

    expect(result).toMatchObject({
      rawAmount: 20,
      multiplier: 0.5,
      prevented: 10,
      healed: 10,
      hpBefore: 40,
      hpAfter: 50,
    });
    expect(target.hp).toBe(50);
  });

  it('두 상태 저장소를 모두 읽고 같은 객체를 한 번만 취급하며 감소 배율을 0 아래로 내리지 않는다', () => {
    const sharedStatus = {
      id: 'healing_received_down',
      duration: 2,
      value: 0.25,
    };
    const target = {
      hp: 40,
      maxHp: 100,
      statusEffects: [sharedStatus],
      _statusEffects: [
        sharedStatus,
        { id: 'healing_received_down', duration: 1, value: 1.5 },
      ],
    };

    const result = healCombatant(target, 20);

    expect(result).toMatchObject({
      rawAmount: 20,
      multiplier: 0,
      prevented: 20,
      healed: 0,
      hpBefore: 40,
      hpAfter: 40,
    });
    expect(target.hp).toBe(40);
  });

  it('만료되거나 다른 종류인 상태는 치료 배율에 반영하지 않는다', () => {
    const target = {
      hp: 40,
      maxHp: 100,
      statusEffects: [
        { id: 'healing_received_down', duration: 0, value: 0.9 },
        { id: 'defense_up', duration: 2, value: 0.5 },
      ],
    };

    const result = healCombatant(target, 20);

    expect(result).toMatchObject({
      rawAmount: 20,
      multiplier: 1,
      prevented: 0,
      healed: 20,
      hpAfter: 60,
    });
  });
});
