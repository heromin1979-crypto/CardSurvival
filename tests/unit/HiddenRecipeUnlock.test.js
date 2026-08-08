// === 히든 레시피 해금 경로 테스트 ===
// regression: 히든 레시피 52종 중 19종에 unlockConditions가 없었다.
// HiddenElementSystem._checkRecipeUnlocks는 조건이 없으면 건너뛰므로,
// 이 19종은 필요한 재료 두 장을 우연히 겹쳐보는 unlockByAttempt로만 발견됐다.
// 명검·카타나·엑소수트·야시경 등 레전더리급이 사실상 도달 불가였다.
import { describe, it, expect, beforeEach } from 'vitest';
import HiddenElementSystem from '../../js/systems/HiddenElementSystem.js';
import GameState from '../../js/core/GameState.js';
import HIDDEN_RECIPES from '../../js/data/hiddenRecipes.js';
import BLUEPRINTS from '../../js/data/blueprints.js';
import BLUEPRINTS_ADV from '../../js/data/blueprints_advanced.js';

const ALL = { ...BLUEPRINTS, ...BLUEPRINTS_ADV, ...HIDDEN_RECIPES };

function resetWorld() {
  GameState.cards = {};
  GameState.board = {
    top: [], environment: [],
    middle: Array(20).fill(null),
    bottom: Array(20).fill(null),
  };
  GameState.player = {
    ...(GameState.player ?? {}),
    isAlive: true, characterId: 'engineer', equipped: {}, diseases: [],
    skills: {},
  };
  GameState.time = { day: 60, totalTP: 4320, tpInDay: 0, hour: 12 };
  GameState.location = { currentDistrict: 'junggoo', installedStructures: {} };
  GameState.flags = { hiddenRecipesUnlocked: [], hiddenLocationsDiscovered: [], bossesKilled: [] };
}

function setSkills(skills) {
  GameState.player.skills = Object.fromEntries(
    Object.entries(skills).map(([id, level]) => [id, { xp: 0, level }]),
  );
}

describe('히든 레시피 — 해금 경로 보장', () => {
  it('모든 히든 레시피에 unlockConditions가 있다', () => {
    const orphans = Object.values(HIDDEN_RECIPES)
      .filter(bp => bp.hidden && !bp.unlockConditions)
      .map(bp => bp.id);
    expect(orphans, `해금 조건이 없는 레시피: ${orphans.join(', ')}`).toEqual([]);
  });

  it('조건이 비어 있는 객체만 들어 있지 않다', () => {
    const empty = Object.values(HIDDEN_RECIPES)
      .filter(bp => bp.hidden && Object.keys(bp.unlockConditions ?? {}).length === 0)
      .map(bp => bp.id);
    expect(empty).toEqual([]);
  });

  it('minSkillLevel을 쓰는 레시피는 제작 요구 스킬을 넘지 않는다', () => {
    // 해금 문턱이 제작 요구치보다 높으면 배운 뒤에도 만들 수 없는 레시피가 된다.
    const broken = [];
    for (const bp of Object.values(ALL)) {
      const cond = bp.unlockConditions?.minSkillLevel;
      if (!cond || !bp.requiredSkills) continue;
      for (const [skill, level] of Object.entries(cond)) {
        if (level > (bp.requiredSkills[skill] ?? 0)) broken.push(`${bp.id}:${skill}`);
      }
    }
    expect(broken).toEqual([]);
  });
});

describe('히든 레시피 — 스킬 도달 시 해금', () => {
  beforeEach(resetWorld);

  it('스킬이 모자라면 해금되지 않는다', () => {
    setSkills({ weaponcraft: 10 });
    HiddenElementSystem._checkRecipeUnlocks();
    expect(GameState.flags.hiddenRecipesUnlocked).not.toContain('forge_master_blade');
  });

  it('요구 스킬에 도달하면 해금된다', () => {
    setSkills({ weaponcraft: 12 });
    HiddenElementSystem._checkRecipeUnlocks();
    expect(GameState.flags.hiddenRecipesUnlocked).toContain('forge_master_blade');
  });

  it('복수 스킬 조건은 전부 충족해야 한다', () => {
    setSkills({ building: 12, crafting: 4 });   // crafting 5 필요
    HiddenElementSystem._checkRecipeUnlocks();
    expect(GameState.flags.hiddenRecipesUnlocked).not.toContain('build_watchtower');

    setSkills({ building: 12, crafting: 5 });
    HiddenElementSystem._checkRecipeUnlocks();
    expect(GameState.flags.hiddenRecipesUnlocked).toContain('build_watchtower');
  });

  it('야전 수술대도 스킬만으로 해금된다', () => {
    setSkills({ medicine: 10, building: 6 });
    HiddenElementSystem._checkRecipeUnlocks();
    expect(GameState.flags.hiddenRecipesUnlocked).toContain('build_surgery_station');
  });
});
