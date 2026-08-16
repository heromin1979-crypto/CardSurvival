// === 시크릿 조합 역방향 드래그 — 장비가 사라지지 않는다 ===
// regression: checkCombination은 양방향으로 매칭하는데(src→tgt / tgt→src)
// applyCombination이 조합 정의의 consumeSrc/consumeTgt를 그대로 돌려줘서,
// 무기를 재료 위로 끌면 재료가 아니라 무기가 소멸했다.
// addEffect도 항상 tgtInst에 붙어 역방향에서는 재료에 효과가 찍혔다.
import { beforeEach, describe, expect, it } from 'vitest';
import GameState from '../../js/core/GameState.js';
import SecretCombinationSystem from '../../js/systems/SecretCombinationSystem.js';
import ITEMS from '../../js/data/items.js';

const def  = id => ITEMS[id];
const inst = definitionId => ({ instanceId: `${definitionId}_1`, definitionId });

beforeEach(() => {
  GameState.discoveries = {
    foundCombinations: [],
    unlockedHints: [],
    lastCooldowns: {},
    totalFound: 0,
  };
  GameState.player.skills = {
    ranged:      { level: 12, xp: 0 },
    melee:       { level: 12, xp: 0 },
    weaponcraft: { level: 12, xp: 0 },
  };
});

describe('checkCombination 방향 판정', () => {
  it('재료를 무기 위로 끌면 정방향으로 매칭한다', () => {
    const check = SecretCombinationSystem.checkCombination(def('mushroom_toxic'), def('crowbar'));
    expect(check.found).toBe(true);
    expect(check.combo.id).toBe('sc_poison_blade');
    expect(check.reversed).toBe(false);
  });

  it('무기를 재료 위로 끌면 역방향으로 매칭했음을 알린다', () => {
    const check = SecretCombinationSystem.checkCombination(def('crowbar'), def('mushroom_toxic'));
    expect(check.found).toBe(true);
    expect(check.combo.id).toBe('sc_poison_blade');
    expect(check.reversed).toBe(true);
  });
});

describe('정방향 드래그 (재료 → 무기)', () => {
  it('재료만 소모되고 무기에 효과가 붙는다', () => {
    const mushroom = inst('mushroom_toxic');
    const weapon   = inst('crowbar');
    const check    = SecretCombinationSystem.checkCombination(def('mushroom_toxic'), def('crowbar'));
    const result   = SecretCombinationSystem.applyCombination(check.combo, mushroom, weapon, check.reversed);

    expect(result.consumeSrc).toBe(true);   // 드래그한 독버섯 소멸
    expect(result.consumeTgt).toBe(false);  // 드랍 대상 무기 유지
    expect(weapon._poisonDamage).toBe(3);
    expect(mushroom._poisonDamage).toBeUndefined();
  });
});

describe('역방향 드래그 (무기 → 재료)', () => {
  it('무기가 아니라 재료가 소모된다', () => {
    const weapon   = inst('crowbar');
    const mushroom = inst('mushroom_toxic');
    const check    = SecretCombinationSystem.checkCombination(def('crowbar'), def('mushroom_toxic'));
    const result   = SecretCombinationSystem.applyCombination(check.combo, weapon, mushroom, check.reversed);

    expect(result.consumeSrc).toBe(false);  // 드래그한 무기는 남는다
    expect(result.consumeTgt).toBe(true);   // 드랍 대상 독버섯이 소멸
  });

  it('효과가 재료가 아니라 무기에 붙는다', () => {
    const weapon   = inst('crowbar');
    const mushroom = inst('mushroom_toxic');
    const check    = SecretCombinationSystem.checkCombination(def('crowbar'), def('mushroom_toxic'));
    SecretCombinationSystem.applyCombination(check.combo, weapon, mushroom, check.reversed);

    expect(weapon._poisonDamage).toBe(3);
    expect(mushroom._poisonDamage).toBeUndefined();
  });
});

describe('양쪽을 모두 소모하는 조합은 방향과 무관하다', () => {
  it('고철 + 스프링은 어느 방향으로 끌어도 탄약 개조 키트 조합으로 잡힌다', () => {
    const forward = SecretCombinationSystem.checkCombination(def('scrap_metal'), def('spring'));
    const reverse = SecretCombinationSystem.checkCombination(def('spring'), def('scrap_metal'));

    expect(forward.combo.id).toBe('sc_ammo_mod');
    expect(reverse.combo.id).toBe('sc_ammo_mod');
    expect(forward.reversed).toBe(false);
    expect(reverse.reversed).toBe(true);
    // 재료 둘 다 소모되므로 방향이 바뀌어도 남는 카드가 달라지지 않는다
    expect(forward.combo.result.consumeSrc).toBe(true);
    expect(forward.combo.result.consumeTgt).toBe(true);
  });
});
