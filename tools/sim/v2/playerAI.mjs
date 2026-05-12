// === playerAI.mjs ===
// 시뮬 player 자동 행동. 매 day 시작 시 1회 행동.
// 실제 게임의 player input(수면·아이템 소비·이동·탐색·요리·낚시)을 시뮬에서 직접 GameState/simInv 조작으로 대체.
//
// 행동 우선순위 (높은 → 낮은):
//   1. 수면: fatigue > 60 → fatigue ←10 + HP +10
//   2. 수분 보충: hydration < 80 → water류 소비
//   3. 요리: food-category 레시피 가능 시 영양가 최대 산출물 1개 생산 (PR7)
//   4. 영양 보충: nutrition < 30 → 가공식·통조림·고기·생선 우선
//   5. 사기 회복: morale < 30 → onConsume.morale 최대 아이템 1개 소비 (PR7)
//   6. 이동: 음식+물 < 2 + day>3 → 가장 안전한 인접 구
//   7. 탐색: 매일 3회 (자원 채집)
//   8. 낚시: hasFishing 구 + 낚싯대 보유 → 어획 시도 1회 (PR7)
//   9. PR16: 위기 시점 추가 craft — nutrition < 50 또는 morale < 30 → actCook 추가 1회 +
//      cooking lv 0 폴백 actT1Convert 추가 1회. R15-1 craft 발동 빈도 부족 해소.
//
// PR7 단순화:
//   - 요리의 requiredTools(campfire 등) 체크 생략 — simInv는 board card 인스턴스가 없으므로 구조물 모델링 불가.
//     음식 회복량 활성화가 목표이며, "도구 필요"는 시뮬 외 게임 측 모델링 영역.
//   - 낚시 결정성: runner.mjs가 Math.random을 seeded RNG로 monkey-patch 하므로 본 모듈은 Math.random 직접 사용.
//
// PR16 결정성:
//   - 추가 craft 발동 조건은 GameState 결정 값(nutrition·morale 임계)만 사용. RNG 무사용.
//   - actCook·actT1Convert 모두 입력 차감 후 산출이라 무한 펌프 자연 차단 (입력 소진되면 null 반환).

import GameState from '../../../js/core/GameState.js';
import { DISTRICTS, generateDistrictLoot, getAdjacentDistricts } from '../../../js/data/districts.js';
import ITEMS from '../../../js/data/items.js';
import BLUEPRINTS from '../../../js/data/blueprints.js';
import BLUEPRINTS_ADVANCED from '../../../js/data/blueprints_advanced.js';
import BALANCE from '../../../js/data/gameBalance.js';

const SLEEP_FATIGUE_AFTER = 10;
const HP_REGEN_FROM_SLEEP = 10;

// PR15: Tier-2 ability bonus 가산. onConsume 적용 시 player.moraleRecoveryBonus·sketchNotebookBonus·
// lowMoraleRecoveryFatigueBonus를 가산해 R13-1(추정-실측 격차) 해소. RNG 무사용 — 결정성 100%.
function _applyAbilityBonusesToConsume(itemId, deltas) {
  const p = GameState.player;
  const moraleMult = p?.moraleRecoveryBonus ?? 1;
  const sketchOn   = p?.sketchNotebookBonus && itemId === 'sketch_notebook';
  const lowFatBonus= p?.lowMoraleRecoveryFatigueBonus ?? 0;
  const moraleCur  = GameState.stats?.morale?.current ?? 100;
  const out = { ...deltas };
  if (out.morale && moraleMult !== 1) {
    out.morale = out.morale * moraleMult;
  }
  if (sketchOn) {
    if (out.morale)  out.morale  = out.morale * 1.5;
    if (out.fatigue) out.fatigue = out.fatigue * 1.5;
  }
  // 낮은 morale 회복 트리거 (homeless street_solace 사양 §3.3): 회복 직전 morale<30이고 morale 회복량>0일 때 fatigue 추가 감소.
  if (lowFatBonus && (out.morale ?? 0) > 0 && moraleCur < 30) {
    out.fatigue = (out.fatigue ?? 0) + lowFatBonus;
  }
  return out;
}

// PR6: items.js의 onConsume에서 직접 derive — 시뮬 회복량 = game 실측.
// PR15: ability bonus 가산 분기 추가 (R13-1 해소).
function applyOnConsume(itemId) {
  const def = ITEMS[itemId];
  if (!def?.onConsume) return false;
  const deltas = _applyAbilityBonusesToConsume(itemId, def.onConsume);
  for (const [stat, delta] of Object.entries(deltas)) {
    const s = GameState.stats[stat];
    if (!s) continue;
    s.current = Math.max(0, Math.min(s.max, s.current + delta));
  }
  return true;
}

// PR15: engineer workshop_focus moraleOnCraft 가산 (craft 행위 1회당). dismantle은 시뮬 미모사로 skip.
function _grantCraftMorale() {
  const bonus = GameState.player?.moraleOnCraft ?? 0;
  if (bonus <= 0) return;
  const s = GameState.stats?.morale;
  if (!s) return;
  s.current = Math.max(0, Math.min(s.max, s.current + bonus));
}

const FOOD_IDS = new Set([
  'canned_food', 'preserved_ration', 'energy_bar', 'sandwich', 'baked_bread',
  'dried_meat', 'salted_meat', 'smoked_meat', 'meat_stew', 'wild_wheat', 'flour', 'bread_dough',
  'fish_small', 'fish_medium', 'fish_large', 'fish_cooked', 'cooked_meat',
  'herb', 'nettle', 'cooked_noodles', 'cooked_rice',
]);
const WATER_IDS = new Set([
  'water_bottle', 'rainwater', 'settled_water', 'distilled_water', 'herbal_tea',
  'boiled_water', 'purified_water',
]);

// PR7: 요리 레시피 사전 캐시 (food category만)
const FOOD_BLUEPRINTS = (() => {
  const all = { ...BLUEPRINTS, ...BLUEPRINTS_ADVANCED };
  return Object.values(all).filter(bp => bp?.category === 'food');
})();

// PR7: 낚싯대 후보 (우선 순위: improved > basic > 구형)
const ROD_IDS = ['fishing_rod_improved', 'fishing_rod_basic', 'fishing_rod'];

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
  for (const id of ['water_bottle', 'distilled_water', 'purified_water', 'boiled_water',
                    'settled_water', 'herbal_tea', 'rainwater']) {
    if (dec(inv, id)) {
      applyOnConsume(id);
      return `drink:${id}`;
    }
  }
  return null;
}

function actEat(inv) {
  const candidates = ['preserved_ration', 'canned_food', 'meat_stew', 'sandwich', 'baked_bread',
                      'cooked_rice', 'cooked_noodles', 'fish_cooked', 'cooked_meat',
                      'dried_meat', 'salted_meat', 'smoked_meat', 'energy_bar',
                      'fish_large', 'fish_medium', 'fish_small', 'herb'];
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

// PR7: 오염 자원 회피하되 cooking 입력 후보(contaminated_water)는 허용 — actDrinkWater 후보에 없으므로 raw drinking은 차단됨.
const COOKING_INPUT_ALLOWLIST = new Set(['contaminated_water']);

function actExplore(simInv) {
  const districtId = GameState.location?.currentDistrict;
  if (!districtId) return null;
  const loot = generateDistrictLoot(districtId);
  let added = 0;
  for (const item of loot) {
    if (item.contamination > 0 && !COOKING_INPUT_ALLOWLIST.has(item.definitionId)) continue;
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

// ─── PR7: 요리 ─────────────────────────────────────────────────
function _hasAllInputs(simInv, bp) {
  for (const stage of bp.stages ?? []) {
    for (const req of stage.requiredItems ?? []) {
      if ((simInv[req.definitionId] ?? 0) < req.qty) return false;
    }
  }
  return true;
}

function _consumeInputs(simInv, bp) {
  for (const stage of bp.stages ?? []) {
    for (const req of stage.requiredItems ?? []) {
      dec(simInv, req.definitionId, req.qty);
    }
  }
}

function _hasMeaningfulInputs(bp) {
  // requiredItems가 비어 있는 레시피(harvest_* 등 구조물 산출)는 시뮬에서 무한 펌프 차단.
  for (const stage of bp.stages ?? []) {
    if ((stage.requiredItems ?? []).length > 0) return true;
  }
  return false;
}

// M3 #14b: 본체 interactions.js T1 카드 변환 규칙 read-only 인용.
// blueprint requiredSkills 잠금을 우회하는 본체 경로 (예: cooking lv 0 직업이
// `instant_noodles + campfire` 카드 드롭으로 `cooked_noodles` 생성).
// 시뮬은 campfire 카드 인스턴스를 모델링하지 않으므로 actCook 패턴과 동일하게
// requiredTools(campfire) 체크 생략. 입력 카드 보유 + 출력 onConsume benefit > 0만 검증.
// 결정성: RNG 무사용. 단순 입력 차감·출력 가산.
const T1_TRANSFORMS = [
  { id: 'cook_noodles_t1',      input: 'instant_noodles',    output: 'cooked_noodles' },
  { id: 'cook_rice_t3',         input: 'rice',               output: 'cooked_rice'    },
  { id: 'boil_contaminated_t5', input: 'contaminated_water', output: 'boiled_water'   },
  { id: 'boil_rainwater_t7',    input: 'rainwater',          output: 'boiled_water'   },
];

// T1 변환 시도. actCook 산출이 없을 때 폴백으로 호출.
// 기준: needs-aware와 동일한 benefit 비교 — 입력 차감 후 출력의 onConsume 영양·수분 합산.
function actT1Convert(simInv) {
  const nutCur = GameState.stats?.nutrition?.current ?? 100;
  const nutMax = GameState.stats?.nutrition?.max ?? 100;
  const needsNutrition = nutCur < nutMax * 0.5;
  let best = null;
  let bestN = -1;
  for (const rule of T1_TRANSFORMS) {
    if ((simInv[rule.input] ?? 0) < 1) continue;
    const onC = ITEMS[rule.output]?.onConsume;
    const n = onC?.nutrition ?? 0;
    const h = onC?.hydration ?? 0;
    const benefit = needsNutrition ? (n * 3 + h) : (n + h * 1.5);
    if (benefit <= 0) continue;
    if (benefit > bestN) { bestN = benefit; best = rule; }
  }
  if (!best) return null;
  if (!dec(simInv, best.input, 1)) return null;
  simInv[best.output] = (simInv[best.output] ?? 0) + 1;
  _grantCraftMorale();
  return `t1Convert:${best.id}->${best.output}`;
}

// needs-aware: 본체 cooking에는 자동 추천이 없음 (SYS_VERIFY_cooking_autopick §5.2 시나리오 γ).
// 시뮬 actCook은 "이상적 player가 결핍 자원을 우선 보충한다"는 행동 모델의 추정치이며 본체와의 1:1 정합이 아님.
function actCook(simInv) {
  const cookingLv = GameState.player?.skills?.cooking?.level ?? GameState.player?.skills?.cooking ?? 0;
  const nutCur = GameState.stats?.nutrition?.current ?? 100;
  const nutMax = GameState.stats?.nutrition?.max ?? 100;
  const needsNutrition = nutCur < nutMax * 0.5;
  let best = null;
  let bestN = -1;
  for (const bp of FOOD_BLUEPRINTS) {
    if (!_hasMeaningfulInputs(bp)) continue;
    const minSkill = bp.requiredSkills?.cooking ?? 0;
    if (minSkill > cookingLv) continue;
    if (!_hasAllInputs(simInv, bp)) continue;
    const outId = bp.output?.[0]?.definitionId;
    if (!outId) continue;
    // 산출물이 onConsume.nutrition 또는 onConsume.hydration을 주는 경우만 — 가공재 derive(예: vegetable, rice)는 식사 효과 없음으로 제외.
    const onC = ITEMS[outId]?.onConsume;
    const n = onC?.nutrition ?? 0;
    const h = onC?.hydration ?? 0;
    const benefit = needsNutrition ? (n * 3 + h) : (n + h * 1.5);
    if (benefit <= 0) continue;
    if (benefit > bestN) { bestN = benefit; best = bp; }
  }
  if (!best) return null;
  _consumeInputs(simInv, best);
  for (const o of best.output ?? []) {
    simInv[o.definitionId] = (simInv[o.definitionId] ?? 0) + o.qty;
  }
  _grantCraftMorale();
  return `cook:${best.id}->${best.output[0].definitionId}`;
}

// ─── PR7: 사기 회복 ────────────────────────────────────────────
function actBoostMorale(simInv) {
  if ((GameState.stats?.morale?.current ?? 100) >= 30) return null;
  let bestId = null;
  let bestMorale = 0;
  for (const id of Object.keys(simInv)) {
    if ((simInv[id] ?? 0) <= 0) continue;
    const m = ITEMS[id]?.onConsume?.morale ?? 0;
    if (m > bestMorale) { bestMorale = m; bestId = id; }
  }
  if (!bestId || bestMorale <= 0) return null;
  if (!dec(simInv, bestId)) return null;
  applyOnConsume(bestId);
  return `moraleBoost:${bestId}(+${bestMorale})`;
}

// ─── PR7: 낚시 ────────────────────────────────────────────────
function _pickFishId(fishingLv) {
  const rareChance = (fishingLv / 20) * BALANCE.fishing.rareFishChanceMax;
  if (Math.random() < rareChance) return 'fish_large';
  return Math.random() < 0.55 ? 'fish_small' : 'fish_medium';
}

function actFish(simInv) {
  const districtId = GameState.location?.currentDistrict;
  const d = DISTRICTS[districtId];
  if (!d?.hasFishing) return null;
  let rodId = null;
  for (const id of ROD_IDS) {
    if ((simInv[id] ?? 0) > 0) { rodId = id; break; }
  }
  // PR9 옵션 C-a 시뮬 모방: hangang sublocation 진입 보상을 모델링하지 않으므로
  // hasFishing 구역 도달 + rod 미보유 시 1회 한정 fishing_rod_basic 자동 지급.
  // (게임 본체: ExploreSystem._grantFirstEnterReward + landmarks.js firstEnterReward)
  if (!rodId && !simInv.__hangangRodGranted) {
    simInv.fishing_rod_basic = (simInv.fishing_rod_basic ?? 0) + 1;
    simInv.__hangangRodGranted = true;
    rodId = 'fishing_rod_basic';
  }
  if (!rodId) return null;
  const fishingLv = GameState.player?.skills?.fishing?.level ?? GameState.player?.skills?.fishing ?? 0;
  const B = BALANCE.fishing;
  let chance = B.baseCatchChance + (fishingLv / 20) * (B.maxCatchChance - B.baseCatchChance);
  if (rodId === 'fishing_rod_improved') chance += B.rodImprovedBonus;
  if (Math.random() >= chance) return null;
  const fishId = _pickFishId(fishingLv);
  simInv[fishId] = (simInv[fishId] ?? 0) + 1;
  return `fish:+1:${fishId}@${districtId}`;
}

// ─── runDayAI ─────────────────────────────────────────────────
export function runDayAI(simInv) {
  const actions = [];

  if (GameState.stats.fatigue.current > 60) actions.push(actSleep());
  if (GameState.stats.hydration.current < 80) {
    const a = actDrinkWater(simInv);
    if (a) actions.push(a);
  }
  // PR7: 식사 전에 요리 시도 — 영양가 큰 가공식 우선 산출
  const c = actCook(simInv);
  if (c) actions.push(c);
  // M3 #14b: 본체 interactions.js T1 변환 경로 모사 — cooking lv 0 직업 한정.
  // 본체에서 cooking lv 0 직업은 cook_noodles 등 requiredSkills.cooking ≥ 1 blueprint 잠금이지만
  // 카드 드롭 변환(T1: instant_noodles+campfire → cooked_noodles)으로 cooked_noodles 산출 가능.
  // cooking lv ≥1 직업은 blueprint 경로(actCook)로 충분 — T1 적용 시 회차당 1건 추가 산출되어 회귀 발생.
  const cookingLvForT1 = GameState.player?.skills?.cooking?.level ?? GameState.player?.skills?.cooking ?? 0;
  if (cookingLvForT1 === 0) {
    const t1 = actT1Convert(simInv);
    if (t1) actions.push(t1);
  }
  if (GameState.stats.nutrition.current < 30) {
    const a = actEat(simInv);
    if (a) actions.push(a);
  }
  // PR7: 사기 회복
  const mb = actBoostMorale(simInv);
  if (mb) actions.push(mb);

  // PR5.5: 자원 부족 시 안전 구로 이동
  const { food, water } = countByType(simInv);
  if ((food + water) < 2 && GameState.time.day > 3) {
    const m = actMove();
    if (m) actions.push(m);
  }
  // 매일 3회 탐색
  for (let i = 0; i < 3; i += 1) {
    const e = actExplore(simInv);
    if (e) actions.push(e);
  }
  // PR7: 낚시 — 한강 인접 구에서 낚싯대 보유 시
  const f = actFish(simInv);
  if (f) actions.push(f);

  // PR16: 탐색 후 위기 시점 추가 craft — R15-1 완전 해소. nutrition<50 또는 morale<30 결정 임계.
  // 탐색으로 입력 자원이 보충된 직후 시점에 추가 발동 → chef·pharmacist·homeless cook 산출물 +1, cooking lv 0
  // 4직업 T1 변환 +1. 무한 펌프는 입력 차감 후 산출 패턴으로 자연 차단.
  const nutCur2 = GameState.stats?.nutrition?.current ?? 100;
  const nutMax2 = GameState.stats?.nutrition?.max ?? 100;
  const moraleCur2 = GameState.stats?.morale?.current ?? 100;
  if (nutCur2 < nutMax2 * 0.5 || moraleCur2 < 30) {
    const c2 = actCook(simInv);
    if (c2) actions.push(c2);
    const cookingLv2 = GameState.player?.skills?.cooking?.level ?? GameState.player?.skills?.cooking ?? 0;
    if (cookingLv2 === 0) {
      const t1b = actT1Convert(simInv);
      if (t1b) actions.push(t1b);
    }
  }

  return actions;
}

// reset 시 init용 (시뮬 외부 호출)
export function createSimInventoryFromCharacter(characterConfig) {
  return { ...characterConfig.startInv };
}
