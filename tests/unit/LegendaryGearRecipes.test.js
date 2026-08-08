// === 보스 드롭 전설 장비 제작 레시피 ===
// 각 장비의 dismantle 산출물이 곧 재료 구성이라는 대칭을 고정한다.
import { describe, it, expect } from 'vitest';
import ITEMS from '../../js/data/items.js';
import HIDDEN_RECIPES from '../../js/data/hiddenRecipes.js';
import SECRET_ENEMIES from '../../js/data/secretEnemies.js';

// [레시피 id, 산출 장비 id, 해금 보스 id]
const CASES = [
  ['forge_crocodile_scale_armor', 'crocodile_scale_armor', 'boss_sewer_king'],
  ['weave_acid_resistant_cloak',  'acid_resistant_cloak',  'boss_acid_queen'],
  ['craft_tiger_fang_necklace',   'tiger_fang_necklace',   'boss_mutant_alpha_tiger'],
  ['forge_frost_blade',           'frost_blade',           'boss_frozen_giant'],
  ['assemble_warlord_rifle',      'warlord_rifle',         'boss_raider_warlord'],
];

const materialsOf = recipe =>
  (recipe.stages ?? []).flatMap(s => s.requiredItems ?? []);

describe('전설 장비 — 제작 레시피 존재', () => {
  for (const [recipeId, itemId, bossId] of CASES) {
    const recipe = HIDDEN_RECIPES[recipeId];

    it(`${itemId}: 레시피가 존재하고 해당 장비를 산출한다`, () => {
      expect(recipe).toBeDefined();
      expect(recipe.output).toEqual([{ definitionId: itemId, qty: 1 }]);
    });

    it(`${itemId}: 재료가 해체 산출물과 같은 구성이다`, () => {
      const need = Object.fromEntries(materialsOf(recipe).map(m => [m.definitionId, m.qty]));
      const back = Object.fromEntries(ITEMS[itemId].dismantle.map(d => [d.definitionId, d.qty]));
      expect(need).toEqual(back);
    });

    it(`${itemId}: 해금 보스가 재료를 실제로 드랍한다`, () => {
      expect(recipe.unlockConditions.bossKillId).toBe(bossId);
      const boss = SECRET_ENEMIES[bossId];
      const drops = [...(boss.dropGuaranteed ?? []), ...(boss.lootTable ?? [])]
        .map(d => d.definitionId);
      const bossMats = materialsOf(recipe)
        .map(m => m.definitionId)
        .filter(id => ITEMS[id].subtype === 'boss_drop');
      expect(bossMats.length).toBeGreaterThan(0);
      for (const mat of bossMats) expect(drops).toContain(mat);
    });

    it(`${itemId}: 요구 도구가 제작 가능한 실제 아이템이다`, () => {
      for (const tool of recipe.requiredTools ?? []) {
        expect(ITEMS[tool], tool).toBeDefined();
      }
    });
  }
});
