// === 장전한 화살에 따라 사격 성능이 달라진다 ===
// 화살별 효과는 무기 인스턴스의 loadedAmmoId에서 읽어 WeaponModifiers 번들에 실린다.
// 이미 두 전투 경로가 그 번들을 보고 있으므로 한 곳만 고치면 양쪽에 먹는다.
import { describe, expect, it } from 'vitest';
import { getWeaponModifiers } from '../../js/systems/WeaponModifiers.js';
import { buildEquipmentSkill } from '../../js/systems/combat/CombatSkillSystem.js';
import GameData from '../../js/data/GameData.js';

const bow = (loadedAmmoId, extra = {}) => ({
  instanceId: 'bow_1', definitionId: 'crossbow', durability: 100, loadedAmmoId, ...extra,
});

describe('기본 화살 — 보정 없음', () => {
  it('석궁 화살은 어떤 보정도 얹지 않는다', () => {
    const mods = getWeaponModifiers(bow('crossbow_bolt'));
    expect(mods.damageBonus).toBe(0);
    expect(mods.statusInflict).toBeNull();
    expect(mods.multiTarget).toBe(0);
    expect(mods.noiseOverride).toBeNull();
  });

  it('장전하지 않은 무기도 안전하게 0을 돌려준다', () => {
    expect(getWeaponModifiers(bow(undefined)).damageBonus).toBe(0);
  });
});

describe('강화 석궁 화살 — 피해 +5', () => {
  it('damageBonus에 실린다', () => {
    expect(getWeaponModifiers(bow('improved_crossbow_bolt')).damageBonus).toBe(5);
  });

  it('부착물 보정과 합산된다', () => {
    const mods = getWeaponModifiers(bow('improved_crossbow_bolt', { damageBonus: 3 }));
    expect(mods.damageBonus).toBe(8);
  });
});

describe('화염 화살 — 화상 부여', () => {
  it('statusInflict로 화상이 실린다', () => {
    const mods = getWeaponModifiers(bow('fire_bolt'));
    expect(mods.statusInflict).toMatchObject({ id: 'burn', duration: 2, chance: 0.40 });
    expect(mods.statusInflict.effect.hpPerRound).toBe(-3);
  });

  it('장전 화살이 부착물 상태이상(톱니 출혈)을 덮는다', () => {
    const bleed = { id: 'bleed', name: '출혈', duration: 2, effect: { hpPerRound: -3 }, chance: 0.25 };
    const mods = getWeaponModifiers(bow('fire_bolt', { _serratedMod: true, _statusInflict: bleed }));
    expect(mods.statusInflict.id).toBe('burn');
  });

  it('화살을 장전하지 않으면 부착물 상태이상이 그대로 남는다', () => {
    const bleed = { id: 'bleed', name: '출혈', duration: 2, effect: { hpPerRound: -3 }, chance: 0.25 };
    const mods = getWeaponModifiers(bow('crossbow_bolt', { _statusInflict: bleed }));
    expect(mods.statusInflict.id).toBe('bleed');
  });
});

describe('폭발 석궁 화살 — 피해·광역·소음', () => {
  it('피해 +15, 광역 3명, 소음 25가 실린다', () => {
    const mods = getWeaponModifiers(bow('explosive_bolt'));
    expect(mods.damageBonus).toBe(15);
    expect(mods.multiTarget).toBe(3);
    expect(mods.noiseOverride).toBe(25);
  });
});

describe('랭크 스킬 경로 — 장전 화살이 스킬에 반영된다', () => {
  it('폭발 화살을 장전하면 스킬 타겟 수가 3으로 오른다', () => {
    const plain = buildEquipmentSkill('bow_1', GameData.items.crossbow, bow('crossbow_bolt'));
    const boom  = buildEquipmentSkill('bow_1', GameData.items.crossbow, bow('explosive_bolt'));

    expect(plain.target.count).toBe(1);
    expect(boom.target.count).toBe(3);
  });

  it('화염 화살을 장전하면 상태이상 효과가 붙는다', () => {
    const skill = buildEquipmentSkill('bow_1', GameData.items.crossbow, bow('fire_bolt'));
    const status = skill.effects.find(e => e.type === 'status');
    expect(status?.status).toMatchObject({ id: 'burn', chance: 0.40 });
  });

  it('기본 화살은 상태이상을 붙이지 않는다', () => {
    const skill = buildEquipmentSkill('bow_1', GameData.items.crossbow, bow('crossbow_bolt'));
    expect(skill.effects.some(e => e.type === 'status')).toBe(false);
  });
});
