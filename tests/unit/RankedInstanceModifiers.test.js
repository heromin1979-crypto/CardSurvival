// === 랭크 스킬 경로가 무기 인스턴스 보정을 읽는다 ===
// regression: buildEquipmentSkill이 아이템 정의만 받고 카드 인스턴스를 받지 않아,
// 조준경(accuracyBonus)·연마(damageBonus)·독날(_poisonDamage)·소음기(_suppressor)가
// 랭크 스킬로 공격할 때 통째로 무시됐다. 레거시 경로에서만 살아 있던 값들이다.
import { beforeEach, describe, expect, it, vi } from 'vitest';
// 믹스인 호스트(CombatSystem)를 통해 호출한다 — _applyCharacterAimIdentity 등이 거기 있다
import CombatSystem from '../../js/systems/CombatSystem.js';
import { buildEquipmentSkill } from '../../js/systems/combat/CombatSkillSystem.js';
import GameState from '../../js/core/GameState.js';
import ITEMS from '../../js/data/items.js';

const WEAPON_ID = 'w1';

function setWeapon(extra = {}) {
  GameState.cards = {
    [WEAPON_ID]: { instanceId: WEAPON_ID, definitionId: 'crowbar', durability: 100, ...extra },
  };
  return GameState.cards[WEAPON_ID];
}

const meleeSkill = () => ({
  id: `equipment:${WEAPON_ID}`,
  source: 'equipment',
  equipmentInstanceId: WEAPON_ID,
  accuracy: 0.70,
  costs: { magazineRound: 0, durability: 5, noise: 30 },
});

beforeEach(() => {
  GameState.cards = {};
  GameState.player.skills = { melee: { level: 0, xp: 0 }, unarmed: { level: 0, xp: 0 }, ranged: { level: 0, xp: 0 } };
});

describe('buildEquipmentSkill — 인스턴스 statusInflict', () => {
  it('인스턴스에 붙은 statusInflict를 스킬 효과로 변환한다', () => {
    const status = { id: 'bleed', name: '출혈', duration: 2, effect: { hpPerRound: -3 }, chance: 0.25 };
    const skill = buildEquipmentSkill(WEAPON_ID, ITEMS.crowbar, { _statusInflict: status });
    const statusEffect = skill.effects.find(e => e.type === 'status');

    expect(statusEffect).toBeTruthy();
    expect(statusEffect.status).toMatchObject({ id: 'bleed', chance: 0.25 });
  });

  it('인스턴스 값이 정의값을 이긴다', () => {
    const status = { id: 'bleed', name: '출혈', duration: 2, effect: { hpPerRound: -3 }, chance: 0.25 };
    const skill = buildEquipmentSkill('w2', ITEMS.spiked_pipe, { _statusInflict: status });
    const statusEffect = skill.effects.find(e => e.type === 'status');

    expect(statusEffect.status.chance).toBe(0.25);   // 정의값 0.40이 아니라 인스턴스값
  });

  it('인스턴스를 넘기지 않으면 기존 동작(정의값)을 유지한다', () => {
    const skill = buildEquipmentSkill('w2', ITEMS.spiked_pipe);
    const statusEffect = skill.effects.find(e => e.type === 'status');

    expect(statusEffect.status).toMatchObject({ id: 'bleed', chance: 0.40 });
  });
});

describe('_rankedAimProfile — 조준경 명중률', () => {
  it('인스턴스 accuracyBonus가 명중률에 반영된다', () => {
    setWeapon();
    const base = CombatSystem._rankedAimProfile({ id: 'player', sourceType: 'player' }, meleeSkill());

    setWeapon({ accuracyBonus: 0.10 });
    const scoped = CombatSystem._rankedAimProfile({ id: 'player', sourceType: 'player' }, meleeSkill());

    expect(scoped.accuracy).toBeGreaterThan(base.accuracy);
  });

  it('보정이 없으면 명중률이 달라지지 않는다', () => {
    setWeapon();
    const a = CombatSystem._rankedAimProfile({ id: 'player', sourceType: 'player' }, meleeSkill());
    setWeapon({ accuracyBonus: 0 });
    const b = CombatSystem._rankedAimProfile({ id: 'player', sourceType: 'player' }, meleeSkill());

    expect(a.accuracy).toBe(b.accuracy);
  });
});

describe('_applyPlayerDamageSuite — 연마·못 개조 데미지', () => {
  it('인스턴스 damageBonus가 피해에 더해진다', () => {
    setWeapon();
    const base = CombatSystem._applyPlayerDamageSuite(20, meleeSkill(), ITEMS.crowbar);

    setWeapon({ damageBonus: 3 });
    const sharpened = CombatSystem._applyPlayerDamageSuite(20, meleeSkill(), ITEMS.crowbar);

    expect(sharpened).toBe(base + 3);
  });
});

describe('_weaponPoisonBonus — 독날', () => {
  it('인스턴스 _poisonDamage를 방어 차감 이후 가산값으로 돌려준다', () => {
    setWeapon({ _poisonDamage: 3 });
    expect(CombatSystem._weaponPoisonBonus(meleeSkill(), 10)).toBe(3);
  });

  it('피해가 0이면 독 피해도 붙지 않는다 (레거시와 동일)', () => {
    setWeapon({ _poisonDamage: 3 });
    expect(CombatSystem._weaponPoisonBonus(meleeSkill(), 0)).toBe(0);
  });

  it('독이 없는 무기는 0이다', () => {
    setWeapon();
    expect(CombatSystem._weaponPoisonBonus(meleeSkill(), 10)).toBe(0);
  });
});

describe('_consumeRankedCosts — 소음기와 내구도 절약', () => {
  it('소음기가 달린 무기는 소음 코스트가 줄어든다', async () => {
    const { default: NoiseSystem } = await import('../../js/systems/NoiseSystem.js');
    const spy = vi.spyOn(NoiseSystem, 'addNoise').mockImplementation(() => {});
    const skill = { ...meleeSkill(), costs: { magazineRound: 0, durability: 0, noise: 30 } };

    setWeapon();
    CombatSystem._consumeRankedCosts({ id: 'player', sourceType: 'player' }, skill);
    expect(spy).toHaveBeenLastCalledWith(30);

    setWeapon({ _suppressor: true, _noiseReduction: 0.5 });
    CombatSystem._consumeRankedCosts({ id: 'player', sourceType: 'player' }, skill);
    expect(spy).toHaveBeenLastCalledWith(15);

    vi.restoreAllMocks();
  });

  it('내구도 절약 보정이 durSaveChance에 더해진다', () => {
    const skill = { ...meleeSkill(), costs: { magazineRound: 0, durability: 5, noise: 0 } };

    // 절약 확률 0.15 미만의 굴림 → 정비유가 있으면 절약된다
    setWeapon({ _durabilitySave: 0.15 });
    vi.spyOn(Math, 'random').mockReturnValue(0.10);
    CombatSystem._consumeRankedCosts({ id: 'player', sourceType: 'player' }, skill);
    expect(GameState.cards[WEAPON_ID].durability).toBe(100);
    vi.restoreAllMocks();

    // 보정이 없으면 같은 굴림에서 차감된다 (스킬 durSaveChance는 레벨 0에서 0)
    setWeapon();
    vi.spyOn(Math, 'random').mockReturnValue(0.10);
    CombatSystem._consumeRankedCosts({ id: 'player', sourceType: 'player' }, skill);
    expect(GameState.cards[WEAPON_ID].durability).toBe(95);
    vi.restoreAllMocks();
  });
});
