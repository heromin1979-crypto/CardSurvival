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
import EventBus from '../../../js/core/EventBus.js';
import DiseaseSystem from '../../../js/systems/DiseaseSystem.js';
import { DISTRICTS, generateDistrictLoot, getAdjacentDistricts } from '../../../js/data/districts.js';
import { rollEnemyGroup } from '../../../js/data/enemies.js';
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

// ════════ 현실 제약 헬퍼 (요리 도구·스태미나·간이 전투) ════════

// ── 캠프파이어(요리 도구) ── 본체: make_boiled_water/cook_* 는 requiredTools:['campfire']
// 건설 = 구조 재료(돌·판자·장작) + 점화 수단(성냥/라이터/부싯돌/불씨/불꽃, 없으면 마찰용 마른 막대).
// flame_token의 6단계 제작 체인을 "점화 수단 1개 소비"로 근사.
const CAMPFIRE_STRUCT = { pebble: 3, wood_plank: 2, kindling: 3 };
const FIRE_SOURCES = ['flame_token', 'fire_ember', 'matches', 'lighter', 'firestone'];
function _campfire() {
  if (!GameState._simCampfire) GameState._simCampfire = { built: false, durability: 0 };
  return GameState._simCampfire;
}
function hasCampfire() { const c = _campfire(); return c.built && c.durability > 0; }
function actBuildCampfire(inv) {
  const c = _campfire();
  if (c.built && c.durability > 0) return null;
  for (const [id, n] of Object.entries(CAMPFIRE_STRUCT)) if ((inv[id] ?? 0) < n) return null;
  // 점화 수단 확보
  let fire = FIRE_SOURCES.find((f) => (inv[f] ?? 0) > 0);
  if (fire) { if (fire !== 'lighter') dec(inv, fire, 1); }      // lighter는 도구라 미소모
  else if ((inv.dry_wood_stick ?? 0) >= 2) { dec(inv, 'dry_wood_stick', 2); fire = 'friction'; }
  else return null;                                            // 점화 불가 → 건설 불가
  for (const [id, n] of Object.entries(CAMPFIRE_STRUCT)) dec(inv, id, n);
  c.built = true; c.durability = 50;   // items_structures campfire defaultDurability
  return 'buildCampfire';
}
function _useCampfireFuel() { const c = _campfire(); c.durability -= 1; if (c.durability <= 0) { c.built = false; c.durability = 0; } }

// ── 스태미나 (본체 travel 상수) ──
function _stamina() { return GameState.stats?.stamina; }
function staminaBlocked() { const s = _stamina(); return !!(s && s.current <= 0); }
function _drainStamina(base) {
  const s = _stamina(); if (!s) return;
  const low = (s.current / s.max) < (BALANCE.travel?.lowStaminaThreshold ?? 0.3) ? (BALANCE.travel?.lowStaminaPenalty ?? 1.5) : 1;
  s.current = Math.max(0, s.current - Math.ceil(base * low));
}

// ── 간이 전투 (탐색 중 조우) ──
function _bestWeapon(inv) {
  let best = null, bestAvg = 5; // 맨손 [3,7] avg 5 — 무기는 그보다 나을 때만
  for (const id of Object.keys(inv)) {
    if ((inv[id] ?? 0) <= 0) continue;
    const dmg = ITEMS[id]?.combat?.damage;
    if (!Array.isArray(dmg)) continue;
    const avg = (dmg[0] + dmg[1]) / 2;
    if (avg > bestAvg) { bestAvg = avg; best = { id, dmg, acc: ITEMS[id].combat.accuracy ?? 0.75 }; }
  }
  return best;
}
// 조우 확률 판정 → 간이 전투. 사망 시 isAlive=false. 반환: 'combat:...' | null(조우 없음)
function _maybeEncounter(inv, cfg) {
  const districtId = GameState.location?.currentDistrict;
  const d = DISTRICTS[districtId];
  if (!d) return null;
  const base   = d.encounterChance ?? 0.08;
  const early  = GameState.time.day <= (BALANCE.encounter?.earlyGameGraceDays ?? 3) ? (BALANCE.encounter?.earlyGameEncounterMult ?? 0.45) : 1;
  const reduct = Math.min(BALANCE.encounter?.reductionCap ?? 0.85, GameState.player?.encounterRateReduct ?? 0);
  if (Math.random() >= base * early * (1 - reduct)) return null;

  const enemies = rollEnemyGroup(d.dangerLevel ?? 2, GameState.noise?.level ?? 0);
  if (cfg.fleePolicy && Math.random() < (BALANCE.combat?.fleeChance ?? 0.6)) {
    const f = GameState.stats.fatigue;
    if (f) f.current = Math.min(f.max ?? 100, f.current + (BALANCE.combat?.fleeFatigue ?? 10));
    EventBus.emit('combatEnd', { outcome: 'fled' });
    return `combat:도주(${enemies.length})`;
  }
  const w = _bestWeapon(inv);
  const pMin = w ? w.dmg[0] : (BALANCE.combat?.unarmedBaseDmg?.[0] ?? 3);
  const pMax = w ? w.dmg[1] : (BALANCE.combat?.unarmedBaseDmg?.[1] ?? 7);
  const pAcc = w ? w.acc : 0.7;
  const cdMult = GameState.player?.combatDmgBonus ?? 1;
  const hp = GameState.player.hp;
  let alive = enemies.filter(e => e.currentHp > 0);
  let round = 0;
  while (alive.length && hp.current > 0 && round < 100) {
    round++;
    if (Math.random() < pAcc) {
      const dmg = Math.max(1, Math.round((pMin + Math.floor(Math.random() * (pMax - pMin + 1))) * cdMult) - (alive[0].defense ?? 0));
      alive[0].currentHp -= dmg;
      if (alive[0].currentHp <= 0) alive.shift();
      if (!alive.length) break;
    }
    for (const e of alive) {
      const rounds = e.attacksPerRound ?? 1;
      for (let i = 0; i < rounds; i++) {
        if (Math.random() < (e.attack?.accuracy ?? 0.6)) {
          const dr = e.attack?.damage ?? [5, 10];
          hp.current = Math.max(0, hp.current - (dr[0] + Math.floor(Math.random() * (dr[1] - dr[0] + 1))));
          const inf = GameState.stats.infection;
          if (inf && (e.infectionChance ?? 0) > 0 && Math.random() < e.infectionChance) inf.current = Math.min(inf.max ?? 100, inf.current + 10);
          if (hp.current <= 0) break;
        }
      }
      if (hp.current <= 0) break;
    }
  }
  if (hp.current <= 0) {
    GameState.player.isAlive = false;
    GameState.player.deathCause = '전투';
    EventBus.emit('combatEnd', { outcome: 'defeat' });
    return `combat:사망(${enemies.length})`;
  }
  EventBus.emit('combatEnd', { outcome: 'victory' });
  return `combat:승리(${enemies.length})`;
}

function actSleep() {
  GameState.stats.fatigue.current = SLEEP_FATIGUE_AFTER;
  const hp = GameState.player.hp;
  hp.current = Math.min(hp.max, hp.current + HP_REGEN_FROM_SLEEP);
  const s = _stamina();   // 본체 Rest 수면 +70
  if (s) s.current = Math.min(s.max, s.current + 70);
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

// 깨끗한 물이 없고 갈증이 위급할 때의 최후 수단 — 오염수 음용(콜레라/이질/방사선/감염 위험).
// 실제 게임 StatSystem.consumeCard 경로의 오염 발병 체크(checkContaminatedConsume)를 직접 호출.
function actDrinkContaminated(inv) {
  if ((inv.contaminated_water ?? 0) <= 0) return null;
  const def = ITEMS.contaminated_water;
  const contam = def?.defaultContamination ?? 85;
  dec(inv, 'contaminated_water', 1);
  applyOnConsume('contaminated_water');   // 수분+60·방사선+10·감염+15 ('contamination'은 player stat 아님 → 무시됨)
  try { DiseaseSystem.checkContaminatedConsume(def, contam, GameState); } catch (e) { /* 발병 체크 실패 무시 */ }
  return 'drinkContaminated';
}

function actEat(inv) {
  const candidates = ['hearty_stew', 'chef_meal_kit',
                      'preserved_ration', 'canned_food', 'meat_stew', 'sandwich', 'baked_bread',
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
  if (staminaBlocked()) return null;       // 스태미나 0 → 탐색 불가
  const districtId = GameState.location?.currentDistrict;
  if (!districtId) return null;
  _drainStamina(BALANCE.travel?.exploreStaminaDrain ?? 5);

  // 본체 _arriveAtDistrict 30일 루팅 게이트 재현
  const loc = GameState.location;
  if (!loc.districtsLooted) loc.districtsLooted = [];
  if (!loc.districtLootDay) loc.districtLootDay = {};
  let lootCards = [];
  if (!loc.districtsLooted.includes(districtId)) {
    lootCards = generateDistrictLoot(districtId);
    loc.districtsLooted.push(districtId);
    loc.districtLootDay[districtId] = GameState.time.day;
  } else {
    const since = GameState.time.day - (loc.districtLootDay[districtId] ?? 0);
    if (since >= (BALANCE.explore?.respawnLootDays ?? 30)) {
      for (const item of generateDistrictLoot(districtId)) {
        if (Math.random() < (BALANCE.explore?.respawnLootChance ?? 0.5)) {
          lootCards.push({ ...item, quantity: Math.max(1, Math.floor((item.quantity ?? 1) / (BALANCE.explore?.respawnLootQtyDivisor ?? 2))) });
        }
      }
      loc.districtLootDay[districtId] = GameState.time.day;
    }
    // else: 이미 루팅함(30일 미경과) → 빈손
  }
  let added = 0;
  for (const item of lootCards) {
    if (item.contamination > 0 && !COOKING_INPUT_ALLOWLIST.has(item.definitionId)) continue;
    simInv[item.definitionId] = (simInv[item.definitionId] ?? 0) + item.quantity;
    added += item.quantity;
  }
  return `explore:${districtId}:+${added}`;
}

// roam 정책: 루팅 고갈 시 fresh(미루팅 또는 30일 경과) 인접 구역으로 이동
function _isFreshDistrict(id) {
  const loc = GameState.location;
  if (!loc.districtsLooted?.includes(id)) return true;
  const since = GameState.time.day - (loc.districtLootDay?.[id] ?? 0);
  return since >= (BALANCE.explore?.respawnLootDays ?? 30);
}

function actMove(cfg = {}) {
  if (staminaBlocked()) return null;
  const districtId = GameState.location?.currentDistrict;
  if (!districtId) return null;
  const adj = getAdjacentDistricts(districtId);
  if (adj.length === 0) return null;
  const dangerCap = cfg.dangerCap ?? 3;
  // fresh + dangerCap 이내 인접 구역
  let candidates = adj.filter(a => (a.dangerLevel ?? 2) <= dangerCap && _isFreshDistrict(a.id));
  if (!candidates.length && cfg.roam === 'aggressive') {
    candidates = adj.filter(a => _isFreshDistrict(a.id));   // 적극형: 위험 감수
  }
  if (!candidates.length) return null;
  let best = candidates[0];
  for (const a of candidates) if ((a.dangerLevel ?? 9) < (best.dangerLevel ?? 9)) best = a;
  _drainStamina(BALANCE.travel?.baseStaminaDrain ?? 10);
  const loc = GameState.location;
  loc.currentDistrict = best.id;
  loc.currentNode = best.id;
  if (loc.nodesVisited && !loc.nodesVisited.includes(best.id)) loc.nodesVisited.push(best.id);
  return `move:${districtId}->${best.id}`;
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
  if (!hasCampfire()) return null;   // 끓이기/조리는 캠프파이어 필요
  if (!dec(simInv, best.input, 1)) return null;
  simInv[best.output] = (simInv[best.output] ?? 0) + 1;
  _useCampfireFuel();
  _grantCraftMorale();
  return `t1Convert:${best.id}->${best.output}`;
}

// needs-aware: 본체 cooking에는 자동 추천이 없음 (SYS_VERIFY_cooking_autopick §5.2 시나리오 γ).
// 시뮬 actCook은 "이상적 player가 결핍 자원을 우선 보충한다"는 행동 모델의 추정치이며 본체와의 1:1 정합이 아님.
function actCook(simInv) {
  if (!hasCampfire()) return null;   // 요리는 캠프파이어 필요
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
  _useCampfireFuel();
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
// 전략 기본값 — 인자 없이 호출하면 현행과 유사한 "안전 이동형" 동작.
// eatThreshold: 영양이 이 값 미만이면 식사. eatMax: 하루 최대 식사 횟수(임계까지 반복).
const STRAT_DEFAULT = { exploresPerDay: 3, dangerCap: 3, roam: 'safe', fleePolicy: false, prioritizeWater: false, eatThreshold: 30, eatMax: 1 };

// 영양이 임계 미만이면 식량이 있는 한 임계까지(또는 eatMax회) 먹는다.
function _eatToThreshold(simInv, s, push) {
  for (let k = 0; k < (s.eatMax ?? 1); k += 1) {
    if ((GameState.stats?.nutrition?.current ?? 100) >= (s.eatThreshold ?? 30)) break;
    const e = actEat(simInv);
    if (!e) break;
    push(e);
  }
}

export function runDayAI(simInv, cfg = {}) {
  const s = { ...STRAT_DEFAULT, ...cfg };
  const actions = [];
  const push = (a) => { if (a) actions.push(a); };
  const dead = () => !GameState.player.isAlive;
  const cookingLv = () => GameState.player?.skills?.cooking?.level ?? GameState.player?.skills?.cooking ?? 0;

  // 1. 수면 (피로·스태미나 회복)
  if (GameState.stats.fatigue.current > 60) push(actSleep());
  // 2. 수분 (물 우선 전략은 더 일찍·자주). 깨끗한 물이 없고 위급하면 오염수라도 마심(질병 위험).
  if (GameState.stats.hydration.current < (s.prioritizeWater ? 120 : 80)) {
    const drank = actDrinkWater(simInv);
    if (drank) push(drank);
    else if (GameState.stats.hydration.current < 50) push(actDrinkContaminated(simInv));
  }
  // 3. 캠프파이어 건설 → 요리 (요리는 캠프파이어 필요)
  push(actBuildCampfire(simInv));
  if (hasCampfire()) {
    push(actCook(simInv));
    if (cookingLv() === 0) push(actT1Convert(simInv));
  }
  // 4. 영양 보충 (전략 임계·횟수만큼)
  _eatToThreshold(simInv, s, push);
  // 5. 사기 회복
  push(actBoostMorale(simInv));

  // 6. 탐색 루프 — 고갈된(이미 턴) 구역은 헛탐색하지 않고 fresh 구역으로 먼저 이동.
  //    갈 fresh 구역이 없으면 탐색 중단(0개 반복 시도 방지).
  for (let i = 0; i < s.exploresPerDay; i += 1) {
    if (staminaBlocked()) break;
    if (!_isFreshDistrict(GameState.location.currentDistrict)) {
      if (s.roam === 'stay') break;     // 정착형: 더 털 곳 없으면 탐색 종료
      const mv = actMove(s);
      if (!mv) break;                    // 이동 가능한 fresh 구역 없음 → 탐색 종료
      push(mv);
    }
    const ex = actExplore(simInv);
    if (!ex) break;
    push(ex);
    push(_maybeEncounter(simInv, s));   // 조우 시 간이 전투
    if (dead()) return actions;          // 전투 사망
  }

  // 7. 낚시
  push(actFish(simInv));

  // 8. 위기 craft (캠프파이어 필요)
  const nutCur2 = GameState.stats?.nutrition?.current ?? 100;
  const nutMax2 = GameState.stats?.nutrition?.max ?? 100;
  const moraleCur2 = GameState.stats?.morale?.current ?? 100;
  if ((nutCur2 < nutMax2 * 0.5 || moraleCur2 < 30) && hasCampfire()) {
    push(actCook(simInv));
    if (cookingLv() === 0) push(actT1Convert(simInv));
  }

  // 9. 탐색·요리로 확보한 식량으로 추가 식사 (식량 파밍형이 굶지 않도록)
  _eatToThreshold(simInv, s, push);

  return actions;
}

// reset 시 init용 (시뮬 외부 호출)
export function createSimInventoryFromCharacter(characterConfig) {
  return { ...characterConfig.startInv };
}
