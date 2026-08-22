// === 장착 아이템 배선 ===
// regression: 장착 후보 95종을 전수 조사했더니 세 갈래로 새고 있었다.
//  1) 방패·훈련용 방패가 armor/offhand라 SLOT_RULES 어디에도 걸리지 않아 장착 자체가 불가능했다.
//     파이프 산탄총은 requiresAmmo가 없어 weapon_main 판정을 못 받았다.
//  2) armor.movePenalty / onWear.waterproof / onWear.restFatigueMult / combat.aoe /
//     combat.special('execute')는 카드에 적혀만 있고 읽는 코드가 없었다.
//  3) 방패에 combat: { damage:[0,0] }가 있어 _getPlayerWeapon이 방패를 공격 무기로 집었다 —
//     방패만 낀 채 싸우면 0딜 공격이 나갔다.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GameState from '../../js/core/GameState.js';
import GameData from '../../js/data/GameData.js';
import ITEMS from '../../js/data/items.js';
import BALANCE from '../../js/data/gameBalance.js';
import BLUEPRINTS from '../../js/data/blueprints.js';
import { LANDMARK_DATA } from '../../js/data/landmarks.js';
import StatSystem from '../../js/systems/StatSystem.js';
import CombatSystem from '../../js/systems/CombatSystem.js';
import EquipmentSystem from '../../js/systems/EquipmentSystem.js';
import { weaponSlotForDefinition } from '../../js/systems/WeaponSlotPolicy.js';
import { isWetWeather } from '../../js/systems/WeatherSystem.js';

function equip(definitionId, slot) {
  const inst = GameState.createCardInstance(definitionId);
  GameState.placeCardInRow(inst.instanceId, 'bottom');
  const ok = EquipmentSystem.equip(inst.instanceId, slot);
  expect(ok, `${definitionId} → ${slot} 장착 실패`).toBeTruthy();
  return inst;
}

beforeEach(() => {
  GameState.cards = {};
  GameState.board = {
    top: [], environment: [],
    middle: Array(10).fill(null), bottom: Array(20).fill(null),
  };
  GameState.player.equipped = {
    head: null, face: null, body: null, hands: null, backpack: null,
    weapon_main: null, weapon_sub: null, boots: null, accessory: null, belt: null,
  };
  GameState.player.skills = {};
  GameState.combat = null;
});

describe('슬롯 매핑', () => {
  it('방패·훈련용 방패는 weapon_sub에 장착된다', () => {
    for (const id of ['shield', 'training_shield', 'reinforced_shield', 'makeshift_shield']) {
      expect(weaponSlotForDefinition(ITEMS[id]), id).toBe('weapon_sub');
    }
  });

  it('파이프 산탄총은 탄약 무기라 weapon_main에 장착된다', () => {
    expect(ITEMS.pipe_shotgun.combat.requiresAmmo).toBe('shotgun_ammo');
    expect(weaponSlotForDefinition(ITEMS.pipe_shotgun)).toBe('weapon_main');
  });

  it('방어구·무기 중 어느 슬롯에도 못 들어가는 것은 투척물뿐이다', () => {
    const orphans = Object.values(ITEMS)
      .filter(d => d.type === 'armor' || d.type === 'weapon')
      .filter(d => d.subtype !== 'throwable')
      .filter(d => !weaponSlotForDefinition(d) && EquipmentSystem.getSlotsForDef(d).length === 0)
      .map(d => d.id);
    expect(orphans).toEqual([]);
  });
});

describe('장착 효과 집계', () => {
  it('기본값 — movePenalty 0, restFatigueMult 1, waterproof false', () => {
    const a = StatSystem.getArmorEffects();
    expect(a.movePenalty).toBe(0);
    expect(a.restFatigueMult).toBe(1);
    expect(a.waterproof).toBe(false);
  });

  it('강철 장갑판 — armor.movePenalty가 이동 TP를 늘린다', () => {
    equip('armor_plate', 'body');
    expect(StatSystem.getArmorEffects().movePenalty).toBeCloseTo(0.1);
    // 10TP 이동이 11TP가 된다
    expect(StatSystem.applyTravelCost(10)).toBe(11);
  });

  it('이동 감소와 이동 패널티는 같은 축에서 상쇄된다', () => {
    equip('crew_pass', 'accessory');       // travelCostReduction 0.5
    equip('armor_plate', 'body');          // movePenalty 0.1
    const a = StatSystem.getArmorEffects();
    expect(a.travelCostReduction - a.movePenalty).toBeCloseTo(0.4);
    expect(StatSystem.applyTravelCost(10)).toBe(6);
  });

  it('movePenalty 합산에는 상한이 있다', () => {
    expect(BALANCE.armor.movePenaltyCap).toBeGreaterThan(0);
    const armors = Object.values(ITEMS).filter(d => d.armor?.movePenalty > 0);
    const raw = armors.reduce((s, d) => s + d.armor.movePenalty, 0);
    expect(raw).toBeGreaterThan(BALANCE.armor.movePenaltyCap);
  });

  it('낡은 담요 — 체온 하강 완화와 휴식 피로 회복 배율이 집계된다', () => {
    equip('old_blanket', 'body');
    const a = StatSystem.getArmorEffects();
    expect(a.coldResistMult).toBeCloseTo(0.8);
    expect(a.restFatigueMult).toBeCloseTo(1.2);
  });

  it('악어 비늘 갑옷 — waterproof가 집계된다', () => {
    equip('crocodile_scale_armor', 'body');
    expect(StatSystem.getArmorEffects().waterproof).toBe(true);
  });

  it('훈련용 방패 — 장착하면 실제 피해 감소가 붙는다', () => {
    equip('training_shield', 'weapon_sub');
    expect(StatSystem.getArmorEffects().damageReduction).toBeCloseTo(0.06);
  });
});

describe('방수 — 비·눈 체온 하강 무효', () => {
  it('비·눈 계열만 젖는 날씨로 본다 (산성비 제외)', () => {
    expect(isWetWeather('rainy')).toBe(true);
    expect(isWetWeather('snow')).toBe(true);
    expect(isWetWeather('blizzard')).toBe(true);
    expect(isWetWeather('acid_rain')).toBe(false);
    expect(isWetWeather('hot')).toBe(false);
  });
});

describe('방패는 공격 무기가 아니다', () => {
  it('방패 4종에는 combat이 없다', () => {
    for (const id of ['shield', 'training_shield', 'reinforced_shield', 'makeshift_shield']) {
      expect(ITEMS[id].combat, id).toBeUndefined();
    }
  });

  it('방패만 장착하면 무기 목록에 잡히지 않는다', () => {
    equip('reinforced_shield', 'weapon_sub');
    expect(CombatSystem.getAvailableWeapons()).toEqual([]);
    expect(CombatSystem._getPlayerWeapon()).toBeNull();
  });

  it('보드에 둔 방패도 공격 버튼으로 뜨지 않는다', () => {
    const inst = GameState.createCardInstance('makeshift_shield');
    GameState.placeCardInRow(inst.instanceId, 'middle');
    expect(CombatSystem.getAvailableWeapons()).toEqual([]);
  });
});

describe('처형 — combat.special: execute', () => {
  function setupCombat(hpRatio) {
    const weapon = GameState.createCardInstance('confiscated_sniper');
    GameState.placeCardInRow(weapon.instanceId, 'bottom');
    const enemy = { id: 'e1', name: '적', maxHp: 100, currentHp: Math.round(100 * hpRatio) };
    GameState.combat = { enemies: [enemy], log: [], targetIndex: 0 };
    return { weaponId: weapon.instanceId, enemy };
  }

  it('체력이 절반 미만이면 즉사시킨다', () => {
    const { weaponId, enemy } = setupCombat(0.4);
    expect(CombatSystem._applyExecuteFinisher(enemy, weaponId)).toBe(true);
    expect(enemy.currentHp).toBe(0);
  });

  it('절반 이상이면 발동하지 않는다', () => {
    const { weaponId, enemy } = setupCombat(0.6);
    expect(CombatSystem._applyExecuteFinisher(enemy, weaponId)).toBe(false);
    expect(enemy.currentHp).toBe(60);
  });

  it('보스에게는 발동하지 않는다', () => {
    const { weaponId, enemy } = setupCombat(0.2);
    enemy.isBoss = true;
    expect(CombatSystem._applyExecuteFinisher(enemy, weaponId)).toBe(false);
    expect(enemy.currentHp).toBe(20);
  });

  it('처형 능력이 없는 무기로는 발동하지 않는다', () => {
    const weapon = GameState.createCardInstance('rifle');
    GameState.placeCardInRow(weapon.instanceId, 'bottom');
    const enemy = { id: 'e1', name: '적', maxHp: 100, currentHp: 10 };
    GameState.combat = { enemies: [enemy], log: [], targetIndex: 0 };
    expect(CombatSystem._applyExecuteFinisher(enemy, weapon.instanceId)).toBe(false);
    expect(enemy.currentHp).toBe(10);
  });
});

describe('장착 아이템 획득 경로', () => {
  // regression: 정의만 있고 청사진·루팅·드랍·보상 어디에도 없어 평생 못 얻는 장착품이 8종 있었다.
  const ORPHANS = [
    ['hiking_boots', 'make_hiking_boots'],
    ['hazmat_boots', 'make_hazmat_boots'],
    ['makeshift_shield', 'make_makeshift_shield'],
    ['messenger_bag', 'make_messenger_bag'],
    ['military_bag', 'make_military_bag'],
    ['gas_mask_filter', 'make_gas_mask_filter'],
    ['broken_bottle', 'break_bottle'],
  ];

  it.each(ORPHANS)('%s는 %s 청사진으로 만든다', (itemId, bpId) => {
    const bp = BLUEPRINTS[bpId];
    expect(bp, bpId).toBeDefined();
    expect(bp.output.some(o => o.definitionId === itemId)).toBe(true);
    for (const stage of bp.stages) {
      for (const r of stage.requiredItems) expect(ITEMS[r.definitionId], r.definitionId).toBeDefined();
    }
  });

  it('히든 청사진은 unlockConditions.minSkillLevel이 requiredSkills와 일치한다', () => {
    for (const [, bpId] of ORPHANS) {
      const bp = BLUEPRINTS[bpId];
      if (!bp.hidden) continue;
      expect(bp.unlockConditions?.minSkillLevel, bpId).toEqual(bp.requiredSkills);
    }
  });

  it('산탄총은 약탈자 요새에서 나온다', () => {
    const drops = [];
    for (const lm of Object.values(LANDMARK_DATA)) {
      for (const s of lm.subLocations ?? []) {
        if ((s.lootTable ?? []).some(e => (e.definitionId ?? e.id) === 'shotgun')) drops.push(s.id);
      }
    }
    expect(drops.length).toBeGreaterThan(0);
  });
});

describe('선언만 남은 필드가 없다', () => {
  const DEAD_KEYS = ['warmthBonus', 'sleepFatigueMult', 'equipSlot', 'defense'];

  it('장착 아이템에 죽은 최상위 필드가 남아 있지 않다', () => {
    const offenders = Object.values(ITEMS)
      .filter(d => d.type === 'armor' || d.type === 'weapon' || (d.type === 'tool' && ['bag', 'protection'].includes(d.subtype)))
      .filter(d => DEAD_KEYS.some(k => d[k] !== undefined))
      .map(d => d.id);
    expect(offenders).toEqual([]);
  });

  it('방패 계열에 combat.defense·noiseOnAttack가 남아 있지 않다', () => {
    const offenders = Object.values(ITEMS)
      .filter(d => d.combat && (d.combat.defense !== undefined || d.combat.noiseOnAttack !== undefined))
      .map(d => d.id);
    expect(offenders).toEqual([]);
  });
});
