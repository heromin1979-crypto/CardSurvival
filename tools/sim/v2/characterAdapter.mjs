// === characterAdapter.mjs ===
// 게임의 characters.js를 시뮬용 character config으로 변환.
// 단일 진리: characters.js. 시뮬 측 직업 정의 하드코딩 0건.
//
// stamina 공식 (CharCreate.js:227 정식): strength × endurance / 50
// 시작 인벤토리: water_bottle (CharCreate.js:614 _getStarterItems)
//                 + abilities[].effect.startingItems
//
// SIM_COMBAT_DEFAULTS는 시뮬 자체 보정.
// (게임의 CombatSystem이 derive하는 동일 공식 식별 시 import로 교체 — TODO)

import CHARACTERS from '../../../js/data/characters.js';

const SIM_COMBAT_DEFAULTS = {
  doctor:      { combatDmgWeapon: [8, 16],  combatDmgUnarmed: [3, 7],  combatAcc: 0.65, fleeBase: 0.65 },
  soldier:     { combatDmgWeapon: [14, 28], combatDmgUnarmed: [8, 14], combatAcc: 0.82, fleeBase: 0.35 },
  firefighter: { combatDmgWeapon: [12, 25], combatDmgUnarmed: [6, 12], combatAcc: 0.78, fleeBase: 0.50 },
  homeless:    { combatDmgWeapon: [7, 14],  combatDmgUnarmed: [4, 8],  combatAcc: 0.58, fleeBase: 0.70 },
  engineer:    { combatDmgWeapon: [9, 18],  combatDmgUnarmed: [4, 9],  combatAcc: 0.70, fleeBase: 0.55 },
  chef:        { combatDmgWeapon: [9, 18],  combatDmgUnarmed: [4, 8],  combatAcc: 0.62, fleeBase: 0.62 },
};

const STARTER_BASE = ['water_bottle'];

export function buildCharacterConfig(charId) {
  const ch = CHARACTERS.find(c => c.id === charId);
  if (!ch) throw new Error(`[characterAdapter] unknown character: ${charId}`);

  const extraStart = ch.abilities
    ?.flatMap(a => a.effect?.startingItems ?? []) ?? [];
  const startInv = {};
  for (const id of [...STARTER_BASE, ...extraStart]) {
    startInv[id] = (startInv[id] ?? 0) + 1;
  }

  const stamina = Math.round(ch.strength * ch.endurance / 50);

  const combatDefaults = SIM_COMBAT_DEFAULTS[charId];
  if (!combatDefaults) {
    throw new Error(`[characterAdapter] no SIM_COMBAT_DEFAULTS for ${charId}`);
  }

  return {
    id: ch.id,
    name: ch.name,
    icon: ch.portrait,
    maxHp: ch.maxHp,
    stamina,
    morale: 70,
    fatigue: 10,
    startDistrict: ch.homeDist,
    startInv,
    skills: { ...(ch.startingSkills ?? {}) },
    abilities: ch.abilities ?? [],
    ...combatDefaults,
  };
}

export function listCharacterIds() {
  return CHARACTERS.map(c => c.id);
}

export function getCharacterCount() {
  return CHARACTERS.length;
}
