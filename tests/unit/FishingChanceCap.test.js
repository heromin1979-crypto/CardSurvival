// @vitest-environment happy-dom
// === 어획 확률 상한 테스트 ===
// gameBalance에 maxCatchChance: 0.70이 있었지만 읽는 코드가 없었고,
// FishingSystem은 Math.min(0.90, ...)으로 하드코딩된 값을 썼다. 이름은
// "최대 어획 확률"인데 값은 스킬 곡선의 도달점이라 어느 쪽이 의도인지
// 알 수 없었다. 역할이 다른 두 상한을 이름으로 갈라 둘 다 읽히게 한다.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import BALANCE from '../../js/data/gameBalance.js';
import { SKILL_DEFS } from '../../js/data/skillDefs.js';

const B   = BALANCE.fishing;
const SRC = readFileSync(join(dirname(fileURLToPath(import.meta.url)),
  '../../js/systems/FishingSystem.js'), 'utf8');

describe('상한 상수가 역할대로 나뉜다', () => {
  it('스킬 도달점이 실제 스킬 곡선의 Lv.20 값과 같다', () => {
    expect(SKILL_DEFS.fishing.getBonuses(20).catchChance)
      .toBeCloseTo(B.skillCatchChanceCap, 10);
  });

  it('최종 상한이 스킬 도달점보다 높다', () => {
    // 같거나 낮으면 Lv.20 이후 낚싯대·미끼·날씨가 통째로 무의미해진다.
    expect(B.hardCatchChanceCap).toBeGreaterThan(B.skillCatchChanceCap);
  });

  it('하한이 0보다 크다', () => {
    expect(B.minCatchChance).toBeGreaterThan(0);
    expect(B.minCatchChance).toBeLessThan(B.skillCatchChanceCap);
  });

  it('사라진 이름을 아무도 참조하지 않는다', () => {
    expect(B.maxCatchChance).toBeUndefined();
  });
});

describe('FishingSystem이 상수를 실제로 읽는다', () => {
  it('확률 상한이 하드코딩되어 있지 않다', () => {
    expect(SRC).toContain('B.hardCatchChanceCap');
    expect(SRC).toContain('B.minCatchChance');
    expect(SRC).not.toMatch(/Math\.min\(0\.90,\s*Math\.max\(0\.05/);
  });

  it('통발 상한도 상수를 읽는다 (같은 종류의 하드코딩)', () => {
    expect(SRC).toContain('B.trapMaxCatch');
  });
});

describe('상위 장비가 실제로 이득이 된다', () => {
  const skill20 = SKILL_DEFS.fishing.getBonuses(20).catchChance;
  const cap = (v) => Math.min(B.hardCatchChanceCap, Math.max(B.minCatchChance, v));

  it('Lv.20에서도 전설 낚싯대가 기본 낚싯대보다 낫다', () => {
    expect(cap(skill20 + B.rodAdvancedBonus))
      .toBeGreaterThan(cap(skill20 + B.rodBasicBonus));
  });

  it('Lv.20에서도 미끼가 이득이다', () => {
    expect(cap(skill20 + B.baitWormBonus)).toBeGreaterThan(cap(skill20));
  });

  it('낚싯대 등급이 순서대로 오른다', () => {
    expect(B.rodAdvancedBonus).toBeGreaterThan(B.rodImprovedBonus);
    expect(B.rodImprovedBonus).toBeGreaterThan(B.rodBasicBonus);
  });
});
