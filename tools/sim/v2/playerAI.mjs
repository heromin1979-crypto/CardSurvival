// === playerAI.mjs ===
// 시뮬 player 자동 행동 (1차 기본). 매 day 시작 시 1회 행동.
// 실제 게임의 player input(수면·아이템 소비·이동·탐색)을 시뮬에서 직접 GameState 조작으로 대체.
//
// 행동 우선순위 (높은 → 낮은):
//   1. 수면: fatigue > 60 → fatigue ←10 (수면 가정, 1일 1회 한정)
//   2. 수분 보충: hydration < 80 → water_bottle 소비
//   3. 영양 보충: nutrition < 30 → canned_food 또는 preserved_ration 소비
//   4. 이동: (PR5 1차에서는 생략) - 시작 구 유지

import GameState from '../../../js/core/GameState.js';
import { DISTRICTS, generateDistrictLoot, getAdjacentDistricts } from '../../../js/data/districts.js';
import ITEMS from '../../../js/data/items.js';

const SLEEP_FATIGUE_AFTER = 10;
const HP_REGEN_FROM_SLEEP = 10;

// PR6: items.js의 onConsume에서 직접 derive — 시뮬 회복량 = game 실측
function applyOnConsume(itemId) {
  const def = ITEMS[itemId];
  if (!def?.onConsume) return false;
  for (const [stat, delta] of Object.entries(def.onConsume)) {
    const s = GameState.stats[stat];
    if (!s) continue;
    s.current = Math.max(0, Math.min(s.max, s.current + delta));
  }
  // 음식·물 외 효과(morale, fatigue-)도 자동 반영
  return true;
}

const FOOD_IDS = new Set([
  'canned_food', 'preserved_ration', 'energy_bar', 'sandwich', 'baked_bread',
  'dried_meat', 'salted_meat', 'meat_stew', 'wild_wheat', 'flour', 'bread_dough',
  'fish', 'cooked_fish', 'herb', 'nettle',
]);
const WATER_IDS = new Set([
  'water_bottle', 'rainwater', 'settled_water', 'distilled_water', 'herbal_tea',
]);

function dec(inv, id, n = 1) {
  if ((inv[id] ?? 0) >= n) {
    inv[id] -= n;
    if (inv[id] <= 0) delete inv[id];
    return true;
  }
  return false;
}

function actSleep() {
  GameState.stats.fatigue.current = SLEEP_FATIGUE_AFTER;
  const hp = GameState.player.hp;
  hp.current = Math.min(hp.max, hp.current + HP_REGEN_FROM_SLEEP);
  return 'sleep';
}

function actDrinkWater(inv) {
  for (const id of ['water_bottle', 'distilled_water', 'settled_water', 'herbal_tea', 'rainwater']) {
    if (dec(inv, id)) {
      applyOnConsume(id);
      return `drink:${id}`;
    }
  }
  return null;
}

function actEat(inv) {
  const candidates = ['preserved_ration', 'canned_food', 'meat_stew', 'sandwich', 'baked_bread',
                      'dried_meat', 'salted_meat', 'smoked_meat', 'energy_bar', 'cooked_fish', 'herb'];
  for (const id of candidates) {
    if (dec(inv, id)) {
      applyOnConsume(id);
      return `eat:${id}`;
    }
  }
  return null;
}

function countByType(simInv) {
  let food = 0, water = 0;
  for (const [id, qty] of Object.entries(simInv)) {
    if (FOOD_IDS.has(id)) food += qty;
    if (WATER_IDS.has(id)) water += qty;
  }
  return { food, water };
}

function actExplore(simInv) {
  const districtId = GameState.location?.currentDistrict;
  if (!districtId) return null;
  const loot = generateDistrictLoot(districtId);
  let added = 0;
  for (const item of loot) {
    if (item.contamination > 0) continue; // 오염 자원 회피 (1차 단순화)
    simInv[item.definitionId] = (simInv[item.definitionId] ?? 0) + item.quantity;
    added += item.quantity;
  }
  return `explore:${districtId}:+${added}`;
}

function actMove() {
  const districtId = GameState.location?.currentDistrict;
  if (!districtId) return null;
  const adj = getAdjacentDistricts(districtId);
  if (adj.length === 0) return null;
  // 가장 낮은 dangerLevel 인접 구로 이동
  let best = null;
  for (const a of adj) {
    if (!best || a.dangerLevel < best.dangerLevel) best = a;
  }
  if (!best) return null;
  if (best.dangerLevel < DISTRICTS[districtId].dangerLevel) {
    GameState.location.currentDistrict = best.id;
    GameState.location.currentNode = best.id;
    return `move:${districtId}->${best.id}`;
  }
  return null;
}

export function runDayAI(simInv) {
  const actions = [];

  if (GameState.stats.fatigue.current > 60) actions.push(actSleep());
  if (GameState.stats.hydration.current < 80) {
    const a = actDrinkWater(simInv);
    if (a) actions.push(a);
  }
  if (GameState.stats.nutrition.current < 30) {
    const a = actEat(simInv);
    if (a) actions.push(a);
  }

  // PR5.5: 자원 채집
  const { food, water } = countByType(simInv);
  // 자원 부족 시 인접 안전 구로 이동
  if ((food + water) < 2 && GameState.time.day > 3) {
    const m = actMove();
    if (m) actions.push(m);
  }
  // 매일 3회 탐색 (active gameplay 가정)
  for (let i = 0; i < 3; i += 1) {
    const e = actExplore(simInv);
    if (e) actions.push(e);
  }

  return actions;
}

// reset 시 init용 (시뮬 외부 호출)
export function createSimInventoryFromCharacter(characterConfig) {
  return { ...characterConfig.startInv };
}
