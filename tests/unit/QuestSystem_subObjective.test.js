import { describe, it, expect } from 'vitest';
import QuestSystem from '../../js/systems/QuestSystem.js';

describe('QuestSystem._matchSubObjective', () => {
  it('match 필드가 없으면 false (서술형 단계)', () => {
    const so = { id: 'so_x', text: 'Talk to Lee' };
    expect(QuestSystem._matchSubObjective(so, { collected: { clean_water: 5 } })).toBe(false);
  });

  it("collect_item: definitionId 진행도 ≥ count 시 true", () => {
    const so = { id: 'so_w', match: { type: 'collect_item', definitionId: 'bandage', count: 5 } };
    expect(QuestSystem._matchSubObjective(so, { collected: { bandage: 5 } })).toBe(true);
    expect(QuestSystem._matchSubObjective(so, { collected: { bandage: 4 } })).toBe(false);
    expect(QuestSystem._matchSubObjective(so, { collected: {} })).toBe(false);
  });

  it("craft_item with definitionId: craftedRecipes에 포함 시 true", () => {
    const so = { id: 'so_c', match: { type: 'craft_item', definitionId: 'first_aid_kit' } };
    expect(QuestSystem._matchSubObjective(so, { craftedRecipes: ['first_aid_kit'] })).toBe(true);
    expect(QuestSystem._matchSubObjective(so, { craftedRecipes: [] })).toBe(false);
  });

  it("craft_item with category: craftedCategoryCounts ≥ count 시 true", () => {
    const so = { id: 'so_cm', match: { type: 'craft_item', category: 'medical', count: 3 } };
    expect(QuestSystem._matchSubObjective(so, { craftedCategoryCounts: { medical: 3 } })).toBe(true);
    expect(QuestSystem._matchSubObjective(so, { craftedCategoryCounts: { medical: 2 } })).toBe(false);
  });

  it("craft_item with category, no count: craftedCategoryCounts > 0 시 true", () => {
    const so = { id: 'so_cm1', match: { type: 'craft_item', category: 'medical' } };
    expect(QuestSystem._matchSubObjective(so, { craftedCategoryCounts: { medical: 1 } })).toBe(true);
    expect(QuestSystem._matchSubObjective(so, { craftedCategoryCounts: { medical: 0 } })).toBe(false);
  });

  it("visit_district: visitedDistricts에 districtId 포함 시 true", () => {
    const so = { id: 'so_v', match: { type: 'visit_district', districtId: 'mapo' } };
    expect(QuestSystem._matchSubObjective(so, { visitedDistricts: new Set(['mapo']) })).toBe(true);
    expect(QuestSystem._matchSubObjective(so, { visitedDistricts: new Set(['gangnam']) })).toBe(false);
  });

  it("use_item: usedItemCounts ≥ count 시 true", () => {
    const so = { id: 'so_u', match: { type: 'use_item', definitionId: 'bandage', count: 1 } };
    expect(QuestSystem._matchSubObjective(so, { usedItemCounts: { bandage: 1 } })).toBe(true);
    expect(QuestSystem._matchSubObjective(so, { usedItemCounts: { bandage: 0 } })).toBe(false);
  });

  it("treat_npc with npcId: treatedNpcs에 npcId 포함 시 true", () => {
    const so = { id: 'so_t', match: { type: 'treat_npc', npcId: 'npc_wounded_soldier', count: 1 } };
    expect(QuestSystem._matchSubObjective(so, { treatedNpcs: new Set(['npc_wounded_soldier']) })).toBe(true);
    expect(QuestSystem._matchSubObjective(so, { treatedNpcs: new Set() })).toBe(false);
  });

  it("treat_npc without npcId: treatedNpcCount ≥ count 시 true", () => {
    const so = { id: 'so_t2', match: { type: 'treat_npc', count: 2 } };
    expect(QuestSystem._matchSubObjective(so, { treatedNpcCount: 2 })).toBe(true);
    expect(QuestSystem._matchSubObjective(so, { treatedNpcCount: 1 })).toBe(false);
  });

  it("collect_item_type: itemType별 수량 ≥ count 시 true (type 또는 tag)", () => {
    const so = { id: 'so_cit', match: { type: 'collect_item_type', itemType: 'clean', count: 3 } };
    expect(QuestSystem._matchSubObjective(so, { collectedByTypeOrTag: { clean: 3 } })).toBe(true);
    expect(QuestSystem._matchSubObjective(so, { collectedByTypeOrTag: { clean: 2 } })).toBe(false);
  });

  it('알 수 없는 type은 false (안전 폴백)', () => {
    const so = { id: 'so_?', match: { type: 'wibble' } };
    expect(QuestSystem._matchSubObjective(so, {})).toBe(false);
  });
});
