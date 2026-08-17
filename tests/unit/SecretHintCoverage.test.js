// === 비밀 조합 힌트 도달성 ===
// regression: SecretCombinationSystem.init()이 어디에서도 호출되지 않아 _initHintListeners가
// 실행되지 않았고, LOCATION_HINTS·SKILL_HINTS 두 테이블이 통째로 죽어 있었다. 실제로 열리는
// 힌트는 NPCSystem의 NPC_HINT_MAP 12건뿐이었다.
// 또한 힌트 해금이 tierMap[newLevel] 정확 일치라서, 시작 스킬이 티어를 넘는 직업
// (의사 medicine 4 · 엔지니어 crafting 4 · 셰프 cooking 4 등)은 그 티어를 영구히 못 받았다.
import { beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import GameState from '../../js/core/GameState.js';
import SecretCombinationSystem, { SKILL_HINTS, LOCATION_HINTS } from '../../js/systems/SecretCombinationSystem.js';
import SECRET_COMBINATIONS from '../../js/data/secretCombinations.js';
import HIDDEN_LOCATIONS from '../../js/data/hiddenLocations.js';
import { SKILL_DEFS } from '../../js/data/skillDefs.js';

const COMBO_IDS = new Set(SECRET_COMBINATIONS.map(c => c.id));

/** NPCSystem의 NPC_HINT_MAP은 모듈 내부 상수라 소스에서 읽는다 */
function npcHintIds() {
  const src = fs.readFileSync('js/systems/NPCSystem.js', 'utf8');
  const block = src.split('const NPC_HINT_MAP')[1].split('};')[0];
  return [...block.matchAll(/'(sc_[a-z0-9_]+)'/g)].map(m => m[1]);
}

function allHintedIds() {
  return new Set([
    ...Object.values(SKILL_HINTS).flatMap(tiers => Object.values(tiers).flat()),
    ...Object.values(LOCATION_HINTS).flat(),
    ...npcHintIds(),
  ]);
}

beforeEach(() => {
  GameState.discoveries = {
    foundCombinations: [], unlockedHints: [], lastCooldowns: {}, totalFound: 0,
  };
  GameState.player.skills = {};
});

describe('힌트 테이블 정합성', () => {
  it('모든 조합에 최소 하나의 힌트 출처가 있다', () => {
    const hinted = allHintedIds();
    const orphans = SECRET_COMBINATIONS.filter(c => !hinted.has(c.id)).map(c => c.id);
    expect(orphans).toEqual([]);
  });

  it('힌트 테이블이 실존하지 않는 조합을 가리키지 않는다', () => {
    const bogus = [...allHintedIds()].filter(id => !COMBO_IDS.has(id));
    expect(bogus).toEqual([]);
  });

  it('LOCATION_HINTS의 장소 id가 모두 실존한다', () => {
    const locIds = new Set(Object.keys(HIDDEN_LOCATIONS));
    const bogus = Object.keys(LOCATION_HINTS).filter(id => !locIds.has(id));
    expect(bogus).toEqual([]);
  });

  it('SKILL_HINTS의 스킬 id가 모두 실존한다', () => {
    const bogus = Object.keys(SKILL_HINTS).filter(id => !(id in SKILL_DEFS));
    expect(bogus).toEqual([]);
  });

  // 기존 전투 계열 14건이 모두 requiredSkill보다 정확히 1레벨 이른 티어에 있다.
  // "한 단계만 더 올리면 쓸 수 있다"는 예고 패턴이므로 1레벨까지는 허용하고,
  // 그보다 이른 배치만 막는다 — 2레벨 이상 이르면 힌트를 받고도 한참 쓸 수 없다.
  it('힌트 티어가 사용 가능 레벨보다 2단계 이상 이르지 않다', () => {
    const tooEarly = [];
    for (const [skillId, tiers] of Object.entries(SKILL_HINTS)) {
      for (const [tier, ids] of Object.entries(tiers)) {
        for (const id of ids) {
          const need = SECRET_COMBINATIONS.find(c => c.id === id)?.requiredSkill?.[skillId];
          if (need != null && Number(tier) < need - 1) tooEarly.push(`${id}: ${skillId} ${tier} << ${need}`);
        }
      }
    }
    expect(tooEarly).toEqual([]);
  });

  it('이번에 추가한 16건은 사용 가능 레벨 이상에 있다', () => {
    const ADDED = [
      'sc_rain_shower', 'sc_snow_compress', 'sc_natural_antibiotic', 'sc_toxic_mushroom_extract',
      'sc_honey_medicine', 'sc_sling', 'sc_bark_rope', 'sc_dry_grass_kindling', 'sc_pine_cone_fuel',
      'sc_acorn_fire_starter', 'sc_nettle_rope', 'sc_fishing_rod', 'sc_fuel_can_fire',
      'sc_wild_salad', 'sc_bamboo_water', 'sc_wind_stove_campfire',
    ];
    const bad = [];
    for (const id of ADDED) {
      const combo = SECRET_COMBINATIONS.find(c => c.id === id);
      for (const [skillId, need] of Object.entries(combo.requiredSkill ?? {})) {
        const tiers = Object.entries(SKILL_HINTS[skillId] ?? {})
          .filter(([, ids]) => ids.includes(id))
          .map(([t]) => Number(t));
        if (tiers.length && Math.min(...tiers) < need) bad.push(`${id}: ${skillId} ${Math.min(...tiers)} < ${need}`);
      }
    }
    expect(bad).toEqual([]);
    expect(ADDED).toHaveLength(16);
  });
});

describe('힌트 리스너 배선', () => {
  it('main.js가 SecretCombinationSystem.init()을 호출한다', () => {
    const src = fs.readFileSync('js/main.js', 'utf8');
    expect(src).toContain('SecretCombinationSystem.init()');
  });
});

describe('시작 스킬 레벨 소급 해금', () => {
  it('의사(medicine 4)는 medicine 1·2·3 티어 힌트를 모두 받는다', () => {
    GameState.player.skills = { medicine: { level: 4, xp: 0 } };

    SecretCombinationSystem.syncSkillHints();

    const expected = [1, 2, 3].flatMap(t => SKILL_HINTS.medicine[t] ?? []);
    expect(expected.length).toBeGreaterThan(0);
    for (const id of expected) {
      expect(SecretCombinationSystem.isHintUnlocked(id)).toBe(true);
    }
  });

  it('레벨이 낮으면 상위 티어는 열리지 않는다', () => {
    GameState.player.skills = { medicine: { level: 1, xp: 0 } };

    SecretCombinationSystem.syncSkillHints();

    for (const id of SKILL_HINTS.medicine[1] ?? []) {
      expect(SecretCombinationSystem.isHintUnlocked(id)).toBe(true);
    }
    for (const id of SKILL_HINTS.medicine[3] ?? []) {
      expect(SecretCombinationSystem.isHintUnlocked(id)).toBe(false);
    }
  });

  it('독 추출법이 의학 숙련으로 열린다', () => {
    GameState.player.skills = { medicine: { level: 2, xp: 0 } };

    SecretCombinationSystem.syncSkillHints();

    expect(SecretCombinationSystem.isHintUnlocked('sc_toxic_mushroom_extract')).toBe(true);
  });
});
