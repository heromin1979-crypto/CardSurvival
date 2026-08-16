// === 무기 인스턴스 보정 공통 모듈 ===
// 개조 효과(조준경·소음기·독날·연마 등)를 읽는 지점이 레거시 공격 경로에만 흩어져 있어
// 랭크 스킬로 공격하면 대부분이 무시됐다. 두 경로가 같은 값을 보도록 한 곳으로 모은다.
import { describe, expect, it } from 'vitest';
import { getWeaponModifiers } from '../../js/systems/WeaponModifiers.js';

const EMPTY = {
  damageBonus: 0,
  accuracyBonus: 0,
  defensePierce: 0,
  poisonDamage: 0,
  noiseReduction: 0,
  durabilitySave: 0,
  statusInflict: null,
};

describe('getWeaponModifiers — 빈 입력', () => {
  it.each([undefined, null, {}])('%p는 0으로 채운 동일 형태를 반환한다', input => {
    expect(getWeaponModifiers(input)).toEqual(EMPTY);
  });

  it('호출부가 옵셔널 체이닝 없이 쓸 수 있도록 모든 키가 항상 존재한다', () => {
    expect(Object.keys(getWeaponModifiers(null)).sort()).toEqual(Object.keys(EMPTY).sort());
  });
});

describe('getWeaponModifiers — 값 읽기', () => {
  it('부착물이 남긴 필드를 그대로 옮긴다', () => {
    const inst = {
      damageBonus: 3,
      accuracyBonus: 0.10,
      _defensePierce: 3,
      _poisonDamage: 3,
      _durabilitySave: 0.15,
    };
    expect(getWeaponModifiers(inst)).toMatchObject({
      damageBonus: 3,
      accuracyBonus: 0.10,
      defensePierce: 3,
      poisonDamage: 3,
      durabilitySave: 0.15,
    });
  });

  it('소음 감소는 _suppressor 플래그가 있을 때만 유효하다', () => {
    expect(getWeaponModifiers({ _noiseReduction: 0.5 }).noiseReduction).toBe(0);
    expect(getWeaponModifiers({ _suppressor: true }).noiseReduction).toBe(0.5);
    expect(getWeaponModifiers({ _suppressor: true, _noiseReduction: 0.3 }).noiseReduction).toBe(0.3);
  });

  it('statusInflict는 인스턴스에 있으면 그대로, 없으면 null이다', () => {
    const status = { id: 'bleed', name: '출혈', duration: 2, effect: { hpPerRound: -3 }, chance: 0.25 };
    expect(getWeaponModifiers({ _statusInflict: status }).statusInflict).toEqual(status);
    expect(getWeaponModifiers({}).statusInflict).toBeNull();
  });
});

describe('getWeaponModifiers — 비정상값 방어', () => {
  it('음수 관통·독피해·내구절약은 0으로 막는다', () => {
    const mods = getWeaponModifiers({ _defensePierce: -5, _poisonDamage: -2, _durabilitySave: -1 });
    expect(mods.defensePierce).toBe(0);
    expect(mods.poisonDamage).toBe(0);
    expect(mods.durabilitySave).toBe(0);
  });

  it('내구 절약과 소음 감소는 1을 넘지 않는다', () => {
    expect(getWeaponModifiers({ _durabilitySave: 5 }).durabilitySave).toBe(1);
    expect(getWeaponModifiers({ _suppressor: true, _noiseReduction: 9 }).noiseReduction).toBe(1);
  });

  it('숫자가 아닌 값은 0으로 취급한다', () => {
    const mods = getWeaponModifiers({
      damageBonus: 'x', accuracyBonus: NaN, _defensePierce: null, _durabilitySave: undefined,
    });
    expect(mods).toMatchObject({ damageBonus: 0, accuracyBonus: 0, defensePierce: 0, durabilitySave: 0 });
  });

  it('데미지·명중 보정은 음수를 허용한다 (페널티 부착물 여지)', () => {
    expect(getWeaponModifiers({ damageBonus: -2, accuracyBonus: -0.05 }))
      .toMatchObject({ damageBonus: -2, accuracyBonus: -0.05 });
  });
});
