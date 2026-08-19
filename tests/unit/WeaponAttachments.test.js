// === 총기 부착물(조준경·탄약 개조 키트) 장착 회귀 테스트 ===
// regression: 두 아이템은 제작만 되고 무기에 장착하는 배선이 없어,
// "원거리 무기에 장착하는 조준 보조 장치" 같은 설명대로 동작하지 않았다.
// 소음기(apply_suppressor)와 동일한 양방향 규칙 쌍으로 배선한다.
import { describe, it, expect } from 'vitest';
import { findInteraction } from '../../js/data/interactions.js';
import { formatInstanceName, formatCardEffectParts } from '../../js/systems/ItemEffectSystem.js';
import GameData from '../../js/data/GameData.js';

const def  = id => GameData.items[id];
const inst = (definitionId, extra = {}) => ({ instanceId: `${definitionId}_1`, definitionId, ...extra });

// 화약 총기(subtype:'firearm') 전체 — 조준경·탄약 개조 키트 장착 대상
const FIREARMS = ['pistol', 'shotgun', 'rifle', 'm4_carbine', 'confiscated_sniper', 'warlord_rifle', 'silenced_pistol'];
// 탄약을 쓰지만 화약 총기가 아닌 무기 — 장착 대상에서 제외된다
const NON_FIREARMS = ['crossbow', 'crossbow_plus', 'iron_pipe'];

describe('조준경 장착', () => {
  it.each(FIREARMS)('%s에 장착하면 명중률 보너스가 붙고 조준경이 소모된다', id => {
    const scope  = inst('weapon_scope');
    const weapon = inst(id);
    const rule   = findInteraction(def('weapon_scope'), def(id));

    expect(rule).toBeTruthy();
    expect(rule.canApply(scope, weapon).ok).toBe(true);

    const result = rule.apply(scope, weapon);
    expect(weapon._scope).toBe(true);
    expect(weapon.accuracyBonus).toBeCloseTo(0.10, 5);
    expect(result).toMatchObject({ consumeSrc: true, consumeTgt: false });
  });

  it.each(NON_FIREARMS)('%s에는 장착할 수 없다', id => {
    const rule = findInteraction(def('weapon_scope'), def(id));
    expect(rule).toBeTruthy();
    expect(rule.canApply(inst('weapon_scope'), inst(id)).ok).toBe(false);
  });

  it('이미 조준경이 달린 총기에는 중복 장착할 수 없다', () => {
    const rule = findInteraction(def('weapon_scope'), def('pistol'));
    expect(rule.canApply(inst('weapon_scope'), inst('pistol', { _scope: true })).ok).toBe(false);
  });

  it('총기를 조준경 위로 끌어도 동일하게 장착되고 조준경만 소모된다', () => {
    const weapon = inst('pistol');
    const scope  = inst('weapon_scope');
    const rule   = findInteraction(def('pistol'), def('weapon_scope'));

    expect(rule).toBeTruthy();
    expect(rule.canApply(weapon, scope).ok).toBe(true);

    const result = rule.apply(weapon, scope);
    expect(weapon._scope).toBe(true);
    expect(weapon.accuracyBonus).toBeCloseTo(0.10, 5);
    expect(result).toMatchObject({ consumeSrc: false, consumeTgt: true });
  });

  it('기존 명중률 보정(가죽 그립 등)에 누적된다', () => {
    const weapon = inst('pistol', { accuracyBonus: 0.05 });
    findInteraction(def('weapon_scope'), def('pistol')).apply(inst('weapon_scope'), weapon);
    expect(weapon.accuracyBonus).toBeCloseTo(0.15, 5);
  });
});

describe('탄약 개조 키트 장착', () => {
  it.each(FIREARMS)('%s에 장착하면 관통·탄창 보정이 붙고 키트가 소모된다', id => {
    const kit    = inst('ammo_mod');
    const weapon = inst(id);
    const rule   = findInteraction(def('ammo_mod'), def(id));

    expect(rule).toBeTruthy();
    expect(rule.canApply(kit, weapon).ok).toBe(true);

    const result = rule.apply(kit, weapon);
    expect(weapon._ammoMod).toBe(true);
    expect(weapon._defensePierce).toBe(3);
    expect(weapon._ammoCapacityBonus).toBe(3);
    expect(result).toMatchObject({ consumeSrc: true, consumeTgt: false });
  });

  it.each(NON_FIREARMS)('%s에는 장착할 수 없다', id => {
    const rule = findInteraction(def('ammo_mod'), def(id));
    expect(rule).toBeTruthy();
    expect(rule.canApply(inst('ammo_mod'), inst(id)).ok).toBe(false);
  });

  it('이미 개조된 총기에는 중복 장착할 수 없다', () => {
    const rule = findInteraction(def('ammo_mod'), def('pistol'));
    expect(rule.canApply(inst('ammo_mod'), inst('pistol', { _ammoMod: true })).ok).toBe(false);
  });

  it('총기를 키트 위로 끌어도 동일하게 장착되고 키트만 소모된다', () => {
    const weapon = inst('pistol');
    const kit    = inst('ammo_mod');
    const rule   = findInteraction(def('pistol'), def('ammo_mod'));

    expect(rule).toBeTruthy();
    const result = rule.apply(weapon, kit);
    expect(weapon._defensePierce).toBe(3);
    expect(weapon._ammoCapacityBonus).toBe(3);
    expect(result).toMatchObject({ consumeSrc: false, consumeTgt: true });
  });
});

describe('부착물은 서로 배타적이지 않다', () => {
  it('소음기·조준경·탄약 개조 키트를 같은 총기에 모두 장착할 수 있다', () => {
    const pistol = inst('pistol');
    findInteraction(def('suppressor'),   def('pistol')).apply(inst('suppressor'),   pistol);
    findInteraction(def('weapon_scope'), def('pistol')).apply(inst('weapon_scope'), pistol);
    findInteraction(def('ammo_mod'),     def('pistol')).apply(inst('ammo_mod'),     pistol);

    expect(pistol._suppressor).toBe(true);
    expect(pistol._scope).toBe(true);
    expect(pistol._ammoMod).toBe(true);
  });
});

describe('부착 상태 표시', () => {
  it('조준경을 단 총기는 이름 뒤에 (조준경)이 붙는다', () => {
    const name = formatInstanceName(inst('pistol', { _scope: true }), def('pistol'));
    expect(name).toContain('조준경');
  });

  it('탄약 개조 키트를 단 총기는 이름 뒤에 (개조탄)이 붙는다', () => {
    const name = formatInstanceName(inst('pistol', { _ammoMod: true }), def('pistol'));
    expect(name).toContain('개조탄');
  });

  it('여러 부착물을 단 총기는 태그가 함께 표시된다', () => {
    const name = formatInstanceName(
      inst('pistol', { _suppressor: true, _scope: true, _ammoMod: true }),
      def('pistol'),
    );
    expect(name).toContain('소음기');
    expect(name).toContain('조준경');
    expect(name).toContain('개조탄');
  });

  it('부착물이 없는 총기 이름은 그대로 유지된다', () => {
    expect(formatInstanceName(inst('pistol'), def('pistol'))).toBe(def('pistol').name);
  });

  it('카드 효과 줄에 명중·방어 무시·탄창 보정이 노출된다', () => {
    const parts = formatCardEffectParts(
      def('pistol'),
      inst('pistol', { _scope: true, accuracyBonus: 0.10, _ammoMod: true, _defensePierce: 3, _ammoCapacityBonus: 3 }),
    );
    const text = parts.join(' | ');
    expect(text).toContain('명중');
    expect(text).toContain('방어 무시');
    expect(text).toContain('탄창');
  });
});
