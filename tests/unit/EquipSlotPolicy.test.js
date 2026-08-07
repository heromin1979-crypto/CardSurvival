// === 장착 슬롯 정책 — 방패·장갑·나이프 회귀 테스트 ===
// regression: 방패(subtype shield)·깨진 유리병(구 subtype knife)·전투 장갑류
// (구 consumable/enhancement)가 어느 슬롯에도 장착 불가였던 문제.
import { describe, it, expect } from 'vitest';
import { weaponSlotForDefinition } from '../../js/systems/WeaponSlotPolicy.js';
import EquipmentSystem from '../../js/systems/EquipmentSystem.js';
import ITEMS from '../../js/data/items.js';

describe('weaponSlotForDefinition', () => {
  it('방패(subtype shield)는 weapon_sub로 배정된다', () => {
    expect(weaponSlotForDefinition(ITEMS.reinforced_shield)).toBe('weapon_sub');
    expect(weaponSlotForDefinition(ITEMS.makeshift_shield)).toBe('weapon_sub');
  });

  it('깨진 유리병은 melee로 정규화되어 weapon_sub로 배정된다', () => {
    expect(ITEMS.broken_bottle.subtype).toBe('melee');
    expect(weaponSlotForDefinition(ITEMS.broken_bottle)).toBe('weapon_sub');
  });

  it('무기가 아닌 도구는 무기 슬롯에 배정되지 않는다', () => {
    expect(weaponSlotForDefinition(ITEMS.sickle)).toBeNull();
    expect(weaponSlotForDefinition(ITEMS.scalpel)).toBeNull();
    expect(weaponSlotForDefinition(ITEMS.sound_dampener)).toBeNull();
  });
});

describe('EquipmentSystem.getSlotsForDef', () => {
  it('방패 2종은 weapon_sub 슬롯에 장착 가능하다', () => {
    expect(EquipmentSystem.getSlotsForDef(ITEMS.reinforced_shield)).toContain('weapon_sub');
    expect(EquipmentSystem.getSlotsForDef(ITEMS.makeshift_shield)).toContain('weapon_sub');
  });

  it('전투 장갑·철권 건틀릿은 hands 슬롯에 장착 가능하다', () => {
    expect(EquipmentSystem.getSlotsForDef(ITEMS.combat_gloves)).toEqual(['hands']);
    expect(EquipmentSystem.getSlotsForDef(ITEMS.iron_gauntlet)).toEqual(['hands']);
  });

  it('장갑류는 맨손 데미지 보너스를 정의한다', () => {
    expect(ITEMS.combat_gloves.onWear.unarmedDmgBonus).toBeGreaterThan(0);
    expect(ITEMS.iron_gauntlet.onWear.unarmedDmgBonus)
      .toBeGreaterThan(ITEMS.combat_gloves.onWear.unarmedDmgBonus);
  });

  it('방패 2종은 장착 중 피해 감소(onWear)를 정의한다', () => {
    expect(ITEMS.reinforced_shield.onWear.damageReduction).toBeGreaterThan(0);
    expect(ITEMS.makeshift_shield.onWear.damageReduction).toBeGreaterThan(0);
  });

  it('낫·메스 같은 일반 도구는 장착 슬롯이 없다', () => {
    expect(EquipmentSystem.getSlotsForDef(ITEMS.sickle)).toEqual([]);
    expect(EquipmentSystem.getSlotsForDef(ITEMS.scalpel)).toEqual([]);
  });
});
