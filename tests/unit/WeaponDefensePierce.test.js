// === 탄약 개조 키트 관통 — 적 방어력 무시 ===
// 게임에는 관통 스탯이 없었고 적 방어력은 정액 차감만 있었다.
// 부착물이 무기 인스턴스에 남긴 _defensePierce를 차감 단계에 전달한다.
// 레거시 공격 경로와 랭크 스킬 경로가 각자 _applyEnemyDefense를 들고 있으므로 둘 다 검사한다.
import { describe, expect, it } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import { CombatRankedEffects } from '../../js/systems/combat/CombatRankedEffects.js';
import BALANCE from '../../js/data/gameBalance.js';

const enemy = (overrides = {}) => ({
  id: 'test_enemy',
  currentHp: 200,
  maxHp: 200,
  defense: 5,
  ...overrides,
});

describe.each([
  ['레거시 공격 경로', CombatSystem],
  ['랭크 스킬 경로',   CombatRankedEffects],
])('%s — _applyEnemyDefense', (_label, target) => {
  it('관통값이 없으면 방어력을 그대로 차감한다', () => {
    expect(target._applyEnemyDefense(40, 5)).toBe(35);
  });

  it('관통값만큼 방어력을 깎고 차감한다', () => {
    expect(target._applyEnemyDefense(40, 5, 3)).toBe(38);
  });

  it('관통값이 방어력보다 크면 방어력을 0으로 본다', () => {
    expect(target._applyEnemyDefense(40, 2, 3)).toBe(40);
  });

  it('관통이 있어도 방어 관통 바닥은 유지된다', () => {
    const floorRatio = BALANCE.combat.defenseFloorRatio;
    const damage = 10;
    const expectedFloor = Math.max(1, Math.ceil(damage * floorRatio));
    expect(target._applyEnemyDefense(damage, 100, 3)).toBe(expectedFloor);
  });
});

describe('_resolveDirectEnemyDamage — 관통 전달', () => {
  it('defensePierce 옵션이 방어 차감에 반영된다', () => {
    const plain  = CombatSystem._resolveDirectEnemyDamage(enemy(), 40);
    const pierce = CombatSystem._resolveDirectEnemyDamage(enemy(), 40, { defensePierce: 3 });

    expect(plain.damage).toBe(35);
    expect(pierce.damage).toBe(38);
  });

  it('관통값을 주지 않으면 기존 동작이 변하지 않는다', () => {
    expect(CombatSystem._resolveDirectEnemyDamage(enemy(), 40, {}).damage).toBe(35);
  });

  it('방어 무시(bypassBaseDefense)와 함께 써도 방어력이 음수로 내려가지 않는다', () => {
    const result = CombatSystem._resolveDirectEnemyDamage(enemy(), 40, {
      bypassBaseDefense: true,
      defensePierce: 3,
    });
    expect(result.damage).toBe(40);
  });
});
