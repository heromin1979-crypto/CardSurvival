// @vitest-environment happy-dom
// === 의료 시설 5종 기능 배선 테스트 ===
// regression: 수술대·약품 보관장·혈액 은행·인큐베이터·분석실은 설명문에만 기능이
// 적혀 있고 읽는 코드가 없었다. craftingTool: true는 "도구다"라고만 말할 뿐
// 어떤 역할인지 없어 판정에 쓸 수 없어 toolProvides(역할 대체)로 교체했다.
import { describe, it, expect, beforeEach } from 'vitest';
import CraftSystem from '../../js/systems/CraftSystem.js';
import GardenSystem from '../../js/systems/GardenSystem.js';
import HiddenElementSystem from '../../js/systems/HiddenElementSystem.js';
import StructureEffectSystem from '../../js/systems/StructureEffectSystem.js';
import { consumeEffectMultiplier } from '../../js/systems/ItemEffectSystem.js';
import GameState from '../../js/core/GameState.js';
import ITEMS from '../../js/data/items.js';
import BLUEPRINTS from '../../js/data/blueprints.js';
import HIDDEN_RECIPES from '../../js/data/hiddenRecipes.js';

const TP_PER_DAY = 72;

function resetWorld() {
  GameState.cards = {};
  GameState.board = {
    top: [], environment: [],
    middle: Array(20).fill(null),
    bottom: Array(20).fill(null),
  };
  GameState.player = {
    ...(GameState.player ?? {}),
    isAlive: true,
    traits: [],
    diseases: [],
    equipped: {},
    characterId: 'doctor',
    hp: { current: 80, max: 100 },
    structureEffects: null,
    structureDurabilityBonus: 1.0,
    encumbrance: { current: 0, max: 30, tier: 0, tpMult: 1.0, weightPct: 0 },
    skills: {
      medicine: { xp: 0, level: 3 }, crafting: { xp: 0, level: 3 },
      building: { xp: 0, level: 3 }, harvesting: { xp: 0, level: 0 },
    },
  };
  GameState.stats = {
    hydration: { current: 100, max: 200 }, nutrition: { current: 100, max: 200 },
    temperature: { current: 36, max: 100 }, morale: { current: 50, max: 100 },
    stamina: { current: 50, max: 100 }, fatigue: { current: 20, max: 100 },
    radiation: { current: 0, max: 100 },
    infection: { current: 0, max: 100, rateMultiplier: 1.0 },
  };
  GameState.time = { day: 10, totalTP: 720, tpInDay: 0, hour: 12 };
  GameState.location = { currentDistrict: 'junggoo', installedStructures: {} };
  GameState.crafting = { activeQueue: [], maxQueueSize: 3, knownBlueprints: [] };
  GameState.flags = { hiddenRecipesUnlocked: [], hiddenLocationsDiscovered: [], bossesKilled: [] };
  GameState.season = { current: 'spring' };
  GameState.weather = { id: 'sunny' };
  GameState.debug = {};
  StructureEffectSystem.refresh(GameState);
}

function place(definitionId, row = 'middle', overrides = {}) {
  const inst = GameState.createCardInstance(definitionId, overrides);
  GameState.board[row][GameState.board[row].indexOf(null)] = inst.instanceId;
  StructureEffectSystem.refresh(GameState);
  GameState._updateEncumbrance();
  return inst;
}

/** 청사진 재료를 전부 보드에 올린다 */
function stockMaterials(blueprintId) {
  const stage = BLUEPRINTS[blueprintId]?.stages?.[0];
  if (!stage) throw new Error(`청사진을 찾지 못했습니다: ${blueprintId}`);
  for (const req of stage.requiredItems) place(req.definitionId, 'middle', { quantity: req.qty });
}

describe('수술대 — 의료 제작 도구 역할 대체 (toolProvides)', () => {
  beforeEach(resetWorld);

  it('죽은 필드 craftingTool 대신 toolProvides를 선언한다', () => {
    expect(ITEMS.surgical_table.craftingTool).toBeUndefined();
    expect(ITEMS.surgical_table.toolProvides).toContain('medical_station');
  });

  it('의무 거점이 없어도 수술대만으로 의료 청사진을 시작할 수 있다', () => {
    stockMaterials('craft_reinforced_bandage');
    expect(CraftSystem.canStartBlueprint('craft_reinforced_bandage').ok).toBe(false);

    place('surgical_table');
    expect(CraftSystem.canStartBlueprint('craft_reinforced_bandage').ok).toBe(true);
  });

  it('의료 도구를 대체할 뿐 작업대 요구 청사진까지 통과시키지는 않는다', () => {
    place('surgical_table');
    const result = CraftSystem.canStartBlueprint('build_medical_cabinet');
    expect(result.ok).toBe(false);
  });
});

describe('수술대 — 수술 아이템 효과 증폭', () => {
  beforeEach(resetWorld);

  it('수술대가 있으면 surgery 태그 아이템 회복량이 1.4배가 된다', () => {
    const before = consumeEffectMultiplier(ITEMS.surgery_kit).healMult;
    place('surgical_table');
    const after = consumeEffectMultiplier(ITEMS.surgery_kit).healMult;
    expect(after).toBeCloseTo(before * 1.4);
  });

  it('surgery 태그가 없는 의료품에는 증폭이 걸리지 않는다', () => {
    const before = consumeEffectMultiplier(ITEMS.bandage).healMult;
    place('surgical_table');
    expect(consumeEffectMultiplier(ITEMS.bandage).healMult).toBeCloseTo(before);
  });
});

describe('약품 보관장 — 의료품 무게 면제', () => {
  beforeEach(resetWorld);

  it('보관장이 없으면 휴대한 의료품 무게가 그대로 잡힌다', () => {
    place('bandage', 'bottom', { quantity: 5 });
    const weight = ITEMS.bandage.weight * 5;
    expect(GameState.player.encumbrance.current).toBeCloseTo(weight);
  });

  it('보관장이 있으면 의료품 무게가 적재량에서 빠진다', () => {
    place('bandage', 'bottom', { quantity: 5 });
    place('medical_cabinet');
    GameState._updateEncumbrance();
    expect(GameState.player.encumbrance.current).toBe(0);
  });

  it('면제는 선언된 개수까지만 적용된다', () => {
    const slots = ITEMS.medical_cabinet.storageCapacity;
    place('bandage', 'bottom', { quantity: slots + 3 });
    place('medical_cabinet');
    GameState._updateEncumbrance();
    expect(GameState.player.encumbrance.current).toBeCloseTo(ITEMS.bandage.weight * 3);
  });

  it('의료품이 아닌 짐은 면제 대상이 아니다', () => {
    place('scrap_metal', 'bottom', { quantity: 2 });
    place('medical_cabinet');
    GameState._updateEncumbrance();
    expect(GameState.player.encumbrance.current).toBeCloseTo(ITEMS.scrap_metal.weight * 2);
  });
});

describe('혈액 은행 · 인큐베이터 — 자동 산출', () => {
  beforeEach(resetWorld);

  it('혈액 은행은 수혈 키트를 주기 산출로 선언한다', () => {
    expect(ITEMS.blood_bank.harvest.itemId).toBe('field_transfusion_kit');
    expect(ITEMS[ITEMS.blood_bank.harvest.itemId]).toBeDefined();
  });

  it('인큐베이터는 감염 혈액 표본을 주기 산출로 선언한다', () => {
    expect(ITEMS.incubator.harvest.itemId).toBe('infected_blood_sample');
    expect(ITEMS[ITEMS.incubator.harvest.itemId]).toBeDefined();
  });

  it('주기가 지나면 혈액 은행이 수혈 키트를 산출한다', () => {
    const inst = place('blood_bank');
    inst._lastGrowTP = GameState.time.totalTP;
    GameState.time.totalTP += ITEMS.blood_bank.harvest.harvestDays * TP_PER_DAY;
    GardenSystem.tick();
    expect(GameState.countOnBoard('field_transfusion_kit'))
      .toBe(ITEMS.blood_bank.harvest.qty);
  });

  it('주기 전에는 산출하지 않는다', () => {
    const inst = place('blood_bank');
    inst._lastGrowTP = GameState.time.totalTP;
    GameState.time.totalTP += TP_PER_DAY;
    GardenSystem.tick();
    expect(GameState.countOnBoard('field_transfusion_kit')).toBe(0);
  });
});

describe('실내 의료 시설 — 계절 영향 예외', () => {
  beforeEach(resetWorld);

  it('겨울에도 혈액 은행은 산출을 멈추지 않는다', () => {
    GameState.time.day = 300;  // 겨울
    GameState.season = { current: 'winter' };
    const inst = place('blood_bank');
    inst._lastGrowTP = GameState.time.totalTP;
    GameState.time.totalTP += ITEMS.blood_bank.harvest.harvestDays * TP_PER_DAY;
    GardenSystem.tick();
    expect(GameState.countOnBoard('field_transfusion_kit')).toBeGreaterThan(0);
  });

  it('텃밭은 겨울에 여전히 멈춘다', () => {
    GameState.time.day = 300;
    GameState.season = { current: 'winter' };
    const inst = place('garden_bed_veggie');
    inst._lastGrowTP = GameState.time.totalTP;
    GameState.time.totalTP += ITEMS.garden_bed_veggie.harvest.harvestDays * TP_PER_DAY;
    GardenSystem.tick();
    expect(GameState.countOnBoard('vegetable')).toBe(0);
  });
});

describe('분석실 — 연구 레시피 해금', () => {
  const RESEARCH_RECIPES = ['synthesize_antibiotics', 'make_surgical_anesthetic', 'brew_universal_cure'];

  beforeEach(resetWorld);

  it('대상 레시피가 분석실을 해금 조건으로 선언한다', () => {
    for (const id of RESEARCH_RECIPES) {
      expect(HIDDEN_RECIPES[id].unlockConditions?.requiredStructure).toBe('analysis_lab');
    }
  });

  it('분석실이 없으면 해금되지 않는다', () => {
    HiddenElementSystem._checkRecipeUnlocks();
    for (const id of RESEARCH_RECIPES) {
      expect(GameState.flags.hiddenRecipesUnlocked).not.toContain(id);
    }
  });

  it('분석실을 보유하면 연구 레시피가 해금된다', () => {
    place('analysis_lab');
    HiddenElementSystem._checkRecipeUnlocks();
    for (const id of RESEARCH_RECIPES) {
      expect(GameState.flags.hiddenRecipesUnlocked).toContain(id);
    }
  });
});
