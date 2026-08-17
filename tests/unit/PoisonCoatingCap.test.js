// === 독 도포 상한 ===
// regression: sc_poison_blade의 addEffect가 _poisonDamage에 무제한 누적돼(쿨다운도 없음)
// 독버섯을 반복 드래그하면 방어를 무시하는 피해(CombatSystem의 bonusAfterDefense)를
// 끝없이 쌓을 수 있었다. 반대로 절구로 추출한 독은 1회로 막혀 있어, 값싼 경로가
// 비싼 경로보다 무조건 강한 역전 상태였다.
// 설계: 독버섯 직접 도포는 rawMax까지, 추출한 독은 extractedMax까지 누적한다.
import { beforeEach, describe, expect, it } from 'vitest';
import GameState from '../../js/core/GameState.js';
import SlotResolver from '../../js/board/SlotResolver.js';
import { getWeaponModifiers } from '../../js/systems/WeaponModifiers.js';
import BALANCE from '../../js/data/gameBalance.js';
import BLUEPRINTS from '../../js/data/blueprints.js';

const CAP = () => BALANCE.combat.poisonCoating;

function place(definitionId, quantity = 1) {
  const inst = GameState.createCardInstance(definitionId, { quantity });
  GameState.placeCardInRow(inst.instanceId, 'bottom');
  return inst;
}

function coatWithRaw(weaponId) {
  const shroom = place('mushroom_toxic');
  SlotResolver.resolveSecretCombo(shroom.instanceId, weaponId);
}

function coatWithExtract(weaponId) {
  const vial = place('poison');
  SlotResolver.resolveInteraction(vial.instanceId, weaponId);
}

beforeEach(() => {
  GameState.cards = {};
  GameState.board = {
    top: [], environment: [],
    middle: Array(10).fill(null), bottom: Array(20).fill(null),
  };
  GameState.discoveries = {
    foundCombinations: [], unlockedHints: [], lastCooldowns: {}, totalFound: 0,
  };
  GameState.player.skills = {
    weaponcraft: { level: 12, xp: 0 }, medicine: { level: 12, xp: 0 },
  };
});

describe('밸런스 상수', () => {
  it('독 도포 상한이 정의돼 있다', () => {
    expect(CAP().perApply).toBe(3);
    expect(CAP().rawMax).toBe(3);
    expect(CAP().extractedMax).toBe(9);
  });
});

describe('독버섯 직접 도포 — rawMax까지', () => {
  it('1회 도포로 상한에 닿는다', () => {
    const weapon = place('crowbar');

    coatWithRaw(weapon.instanceId);

    expect(GameState.cards[weapon.instanceId]._poisonDamage).toBe(CAP().rawMax);
  });

  it('상한에 닿은 뒤에는 더 오르지 않고 독버섯도 소모되지 않는다', () => {
    const weapon = place('crowbar');
    coatWithRaw(weapon.instanceId);

    const extra = place('mushroom_toxic', 5);
    SlotResolver.resolveSecretCombo(extra.instanceId, weapon.instanceId);

    expect(GameState.cards[weapon.instanceId]._poisonDamage).toBe(CAP().rawMax);
    expect(GameState.countOnBoard('mushroom_toxic')).toBe(5);
  });
});

describe('추출한 독 도포 — extractedMax까지', () => {
  it('3회 누적하면 상한 9에 닿는다', () => {
    const weapon = place('crowbar');

    coatWithExtract(weapon.instanceId);
    expect(GameState.cards[weapon.instanceId]._poisonDamage).toBe(3);
    coatWithExtract(weapon.instanceId);
    expect(GameState.cards[weapon.instanceId]._poisonDamage).toBe(6);
    coatWithExtract(weapon.instanceId);
    expect(GameState.cards[weapon.instanceId]._poisonDamage).toBe(CAP().extractedMax);
  });

  it('상한에 닿은 뒤에는 독이 소모되지 않는다', () => {
    const weapon = place('crowbar');
    for (let i = 0; i < 3; i++) coatWithExtract(weapon.instanceId);

    const vial = place('poison');
    SlotResolver.resolveInteraction(vial.instanceId, weapon.instanceId);

    expect(GameState.cards[weapon.instanceId]._poisonDamage).toBe(CAP().extractedMax);
    expect(GameState.cards[vial.instanceId]).toBeDefined();
  });

  it('전투 계산에 상한값이 그대로 반영된다', () => {
    const weapon = place('crowbar');
    for (let i = 0; i < 3; i++) coatWithExtract(weapon.instanceId);

    const mods = getWeaponModifiers(GameState.cards[weapon.instanceId]);

    expect(Math.floor(mods.poisonDamage)).toBe(CAP().extractedMax);
  });
});

describe('두 경로 조합 — 비싼 경로가 더 강하다', () => {
  it('독버섯으로 3까지 올린 무기를 추출한 독으로 9까지 올릴 수 있다', () => {
    const weapon = place('crowbar');

    coatWithRaw(weapon.instanceId);
    expect(GameState.cards[weapon.instanceId]._poisonDamage).toBe(3);

    coatWithExtract(weapon.instanceId);
    coatWithExtract(weapon.instanceId);

    expect(GameState.cards[weapon.instanceId]._poisonDamage).toBe(CAP().extractedMax);
  });
});

describe('독 추출물 합성 청사진', () => {
  it('이름대로 독을 산출한다', () => {
    expect(BLUEPRINTS.synthesize_poison.output).toEqual([{ definitionId: 'poison', qty: 1 }]);
  });

  it('설명에 존재하지 않는 함정 용도를 적지 않는다', () => {
    expect(BLUEPRINTS.synthesize_poison.description).not.toContain('함정');
  });
});
