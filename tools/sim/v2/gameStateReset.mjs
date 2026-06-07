// === gameStateReset.mjs ===
// 회차 사이 GameState 데이터 필드 reset.
// CharCreate.js의 setup 로직을 시뮬 환경에서 모방 (UI/board 카드 부분은 생략).

import GameState from '../../../js/core/GameState.js';
import CHARACTERS from '../../../js/data/characters.js';
import { buildCharacterConfig } from './characterAdapter.mjs';

let INITIAL_SNAPSHOT = null;

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function deepCloneData(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepCloneData);
  if (obj instanceof Set) return new Set(obj);
  if (obj instanceof Map) return new Map(obj);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'function') continue;
    out[k] = deepCloneData(v);
  }
  return out;
}

export function captureInitialState() {
  if (INITIAL_SNAPSHOT) return;
  INITIAL_SNAPSHOT = {};
  for (const [k, v] of Object.entries(GameState)) {
    if (typeof v === 'function') continue;
    INITIAL_SNAPSHOT[k] = deepCloneData(v);
  }
}

export function resetGameStateForRun({ characterId }) {
  if (!INITIAL_SNAPSHOT) captureInitialState();

  // 시스템 init()이 첫 회차에 새로 만든 키(hospital·ecology·npcs·companions·
  // groupStats·mental·body)는 bootstrap 이전에 찍은 스냅샷에 없어 복원 대상이
  // 아니다. 삭제하지 않으면 직전 회차의 값이 다음 회차로 누수돼 결정성이 깨진다.
  // 스냅샷에 없는 키를 먼저 제거해 매 회차 동일 출발점을 보장한다.
  for (const k of Object.keys(GameState)) {
    if (typeof GameState[k] === 'function') continue;
    if (!(k in INITIAL_SNAPSHOT)) delete GameState[k];
  }

  for (const [k, v] of Object.entries(INITIAL_SNAPSHOT)) {
    if (typeof GameState[k] === 'function') continue;
    GameState[k] = deepCloneData(v);
  }

  const cc = buildCharacterConfig(characterId);

  const ch = CHARACTERS.find(c => c.id === characterId);

  GameState.player.characterId   = cc.id;
  GameState.player.hp            = { current: cc.maxHp, max: cc.maxHp };
  GameState.player.strength      = ch?.strength ?? 60;
  GameState.player.endurance     = ch?.endurance ?? 60;
  GameState.player.isAlive       = true;
  GameState.player.deathCause    = null;

  GameState.stats.stamina        = { current: cc.stamina, max: cc.stamina, decayPerTP: 0 };
  GameState.stats.morale.current = cc.morale;
  GameState.stats.fatigue.current = cc.fatigue;
  GameState.stats.hydration.current = 200;
  GameState.stats.nutrition.current = 80;

  GameState.location.currentDistrict = cc.startDistrict;
  GameState.location.currentNode     = cc.startDistrict;
  // 현실 제약: 구역 루팅 30일 잠금 추적 (본체 ExploreSystem._arriveAtDistrict 모방)
  GameState.location.districtsLooted = [];
  GameState.location.districtLootDay = {};
  GameState.location.nodesVisited    = [cc.startDistrict];
  // 현실 제약: 요리 도구(캠프파이어) 상태 — 시뮬 전용 핸들
  GameState._simCampfire = { built: false, durability: 0 };

  // PR7: startingSkills를 GameState.player.skills.{id}.level에 주입.
  // (이전: 시뮬은 initial snapshot의 level:0 그대로 사용 → 직업별 cooking·harvesting 보너스 무효화 → AI 요리 차단)
  for (const [skillId, level] of Object.entries(cc.skills ?? {})) {
    if (GameState.player.skills?.[skillId]) {
      GameState.player.skills[skillId].level = level;
    } else if (GameState.player.skills) {
      GameState.player.skills[skillId] = { level, xp: 0 };
    }
  }

  GameState.time.day      = 1;
  GameState.time.tpInDay  = 0;
  GameState.time.totalTP  = 0;

  // abilities effect 적용 (CharCreate.js:255~285 모방, 핵심만)
  for (const ability of cc.abilities ?? []) {
    const e = ability.effect ?? {};
    if (e.healBonus)         GameState.player.healBonus = e.healBonus;
    if (e.noiseReduct)       GameState.player.noiseReduct = e.noiseReduct;
    if (e.combatDmgBonus)    GameState.player.combatDmgBonus = e.combatDmgBonus;
    if (e.critBonus)         GameState.player.critBonus = e.critBonus;
    if (e.toxinDetect)       GameState.player.toxinDetect = e.toxinDetect;
    if (e.knifeDmgBonus)     GameState.player.knifeDmgBonus = e.knifeDmgBonus;
    if (e.encounterRateReduct) GameState.player.encounterRateReduct = e.encounterRateReduct;
    if (e.encounterMultDays) {
      GameState.player.encounterMultDaysEnd     = 1 + e.encounterMultDays.days - 1;
      GameState.player.encounterMultDuringGrace = e.encounterMultDays.mult;
    }
    // PR15: Tier-2 ability bonus 필드 노출 (R13-1 해소). playerAI.mjs가 GameState.player에서 직접 참조.
    if (e.moraleRecoveryBonus)            GameState.player.moraleRecoveryBonus = e.moraleRecoveryBonus;
    if (e.lowMoraleRecoveryFatigueBonus)  GameState.player.lowMoraleRecoveryFatigueBonus = e.lowMoraleRecoveryFatigueBonus;
    if (e.moraleOnCraft)                  GameState.player.moraleOnCraft = e.moraleOnCraft;
    if (e.moraleOnDismantle)              GameState.player.moraleOnDismantle = e.moraleOnDismantle;
    if (e.sketchNotebookBonus)            GameState.player.sketchNotebookBonus = e.sketchNotebookBonus;
  }

  return GameState;
}
