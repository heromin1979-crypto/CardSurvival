// === gameStateFactory ===
// PR1 stub. 시뮬용 GameState 객체 초기화.
// PR2에서 게임의 GameState.js 직접 import + reset 헬퍼와 통합 예정.

import { buildCharacterConfig } from './characterAdapter.mjs';

export function createSimGameState({ characterId, seed = 0 }) {
  const cc = buildCharacterConfig(characterId);

  return {
    _runId: null,
    _seed: seed,

    time: {
      day: 1,
      tpInDay: 0,
      totalTP: 0,
      hour: 6,
    },

    player: {
      isAlive: true,
      hp: { current: cc.maxHp, max: cc.maxHp },
      strength: 0, // PR2에서 characters.js로부터 보강
      endurance: 0,
      maxCarryWeight: 0,
      characterId: cc.id,
      currentDistrict: cc.startDistrict,
    },

    stats: {
      hydration:   { current: 200, max: 288, decayPerTP: 0 },
      nutrition:   { current: 80,  max: 100, decayPerTP: 0 },
      temperature: { current: 50,  max: 100, decayPerTP: 0 },
      morale:      { current: cc.morale, max: 100, decayPerTP: 0 },
      radiation:   { current: 0,   max: 100, decayPerTP: 0 },
      infection:   { current: 0,   max: 100, decayPerTP: 0 },
      fatigue:     { current: cc.fatigue, max: 100, decayPerTP: 0 },
      stamina:     { current: cc.stamina, max: cc.stamina, decayPerTP: 0 },
    },

    inv: { ...cc.startInv },

    flags: {},

    _cc: cc, // sim character config 보존 (디버그)

    // PR2에서 보강될 필드:
    //   board, location, npcs, companions, weather, season, ...
  };
}
