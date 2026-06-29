import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CHARACTERS, getCharacterCombatEffects, getCharacterCombatIdentity } from '../../js/data/characters.js';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState from '../../js/core/GameState.js';
import { guardAction } from '../../js/systems/CombatActions.js';

const CHARACTER_IDS = ['doctor', 'soldier', 'firefighter', 'homeless', 'chef', 'engineer'];

describe('character combat identities', () => {
  it('모든 현재 캐릭터가 고유 전투 정체성을 가진다', () => {
    const passiveIds = new Set();

    for (const id of CHARACTER_IDS) {
      const identity = getCharacterCombatIdentity(id);
      expect(identity, id).toBeTruthy();
      expect(identity.role).toBeTruthy();
      expect(identity.passiveId).toBeTruthy();
      expect(identity.utility).toBeTruthy();
      expect(identity.weaponSynergies.length).toBeGreaterThan(0);
      passiveIds.add(identity.passiveId);
    }

    expect(passiveIds.size).toBe(CHARACTER_IDS.length);
  });

  it('전투 효과 데이터는 캐릭터별로 조회된다', () => {
    expect(getCharacterCombatEffects('soldier').firearmAccBonus).toBeGreaterThan(0);
    expect(getCharacterCombatEffects('firefighter').guardDamageReduceBonus).toBeGreaterThan(0);
    expect(getCharacterCombatEffects('homeless').lowHpEnemyAccuracyPenalty).toBeGreaterThan(0);
    expect(getCharacterCombatEffects('chef').bladeBleedChance).toBeGreaterThan(0);
    expect(getCharacterCombatEffects('engineer').craftedWeaponDmgBonus).toBeGreaterThan(0);
    expect(getCharacterCombatEffects('doctor').firstMedicalItemHealBonus).toBeGreaterThan(0);
  });
});

describe('CombatSystem character combat identity effects', () => {
  beforeEach(() => {
    GameState.player.characterId = null;
    GameState.player.hp = { current: 100, max: 100 };
    GameState.player.healBonus = 1.0;
    GameState.combat = { active: true, log: [], playerStatus: [], enemyStatus: [], fxQueue: [] };
    GameState.cards = {};
  });

  it('군인은 총기 장착 시 명중률과 치명타 보너스를 받는다', () => {
    GameState.player.characterId = 'soldier';
    const firearm = { combat: { requiresAmmo: 'ammo' } };

    const result = CombatSystem._applyCharacterAimIdentity({
      accuracy: 0.70,
      critChance: 0.10,
      weaponDef: firearm,
    });

    expect(result.accuracy).toBeCloseTo(0.78);
    expect(result.critChance).toBeCloseTo(0.15);
  });

  it('군인의 총기 보너스는 근접 무기에는 적용되지 않는다', () => {
    GameState.player.characterId = 'soldier';
    const blade = { weaponType: 'blade', combat: {} };

    const result = CombatSystem._applyCharacterAimIdentity({
      accuracy: 0.70,
      critChance: 0.10,
      weaponDef: blade,
    });

    expect(result).toEqual({ accuracy: 0.70, critChance: 0.10 });
  });

  it('소방관은 방어 행동의 피해 감소율이 더 높다', () => {
    GameState.player.characterId = 'firefighter';
    GameState.combat = {};

    guardAction();

    expect(GameState.combat.playerGuard.damageReduce).toBeGreaterThan(0.5);
  });

  it('노숙인은 체력이 낮을 때 적 명중률을 낮춘다', () => {
    GameState.player.characterId = 'homeless';
    GameState.player.hp = { current: 20, max: 100 };

    expect(CombatSystem._getEnemyAccuracyAgainstPlayer(0.75)).toBeCloseTo(0.63);
  });

  it('셰프는 칼 계열 명중 시 출혈을 걸 수 있다', () => {
    GameState.player.characterId = 'chef';
    const enemy = { _statusEffects: [] };
    const blade = { weaponType: 'blade', tags: ['blade'], combat: {} };
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

    CombatSystem._applyCharacterOnHitIdentity(enemy, blade);

    expect(enemy._statusEffects.find(s => s.id === 'bleed')).toMatchObject({
      id: 'bleed',
      duration: 2,
      effect: { hpLossPerRound: 3 },
    });

    randomSpy.mockRestore();
  });

  it('엔지니어는 직접 제작한 무기로 추가 피해를 준다', () => {
    GameState.player.characterId = 'engineer';
    GameState.cards.crafted_weapon = { instanceId: 'crafted_weapon', _crafted: true };

    expect(CombatSystem._applyCharacterDamageIdentity(40, 'crafted_weapon', { combat: {} })).toBe(46);
  });

  it('의사는 전투당 첫 의료 아이템 회복 보너스를 받는다', () => {
    GameState.player.characterId = 'doctor';
    GameState.player.healBonus = 1.5;
    const medical = { tags: ['medical'] };

    expect(CombatSystem._getMedicalHealMultiplier(medical)).toBeCloseTo(1.75);
    CombatSystem._markMedicalIdentityUse(medical);
    expect(CombatSystem._getMedicalHealMultiplier(medical)).toBeCloseTo(1.5);
  });
});
