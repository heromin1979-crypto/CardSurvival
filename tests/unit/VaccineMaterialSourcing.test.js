// === 역병 백신 합성 재료 획득 경로 ===
import { describe, it, expect } from 'vitest';
import HIDDEN_RECIPES from '../../js/data/hiddenRecipes.js';
import SECRET_ENEMIES from '../../js/data/secretEnemies.js';
import ITEMS from '../../js/data/items.js';

const recipe = HIDDEN_RECIPES.synth_plague_vaccine;

describe('synth_plague_vaccine — 감염 혈액 표본 수급', () => {
  it('0단계는 감염 혈액 표본을 요구한다', () => {
    const stage0 = recipe.stages[0].requiredItems.map(r => r.definitionId);
    expect(stage0).toContain('infected_blood_sample');
  });

  it('해금 조건 보스가 감염 혈액 표본을 확정 드랍한다', () => {
    const boss = SECRET_ENEMIES[recipe.unlockConditions.bossKillId];
    expect(boss).toBeDefined();
    const guaranteed = (boss.dropGuaranteed ?? []).map(d => d.definitionId);
    expect(guaranteed).toContain('infected_blood_sample');
  });

  it('확정 드랍 아이템은 모두 실제 아이템 정의를 가진다', () => {
    const boss = SECRET_ENEMIES[recipe.unlockConditions.bossKillId];
    for (const drop of boss.dropGuaranteed ?? []) {
      expect(ITEMS[drop.definitionId], drop.definitionId).toBeDefined();
    }
  });
});
