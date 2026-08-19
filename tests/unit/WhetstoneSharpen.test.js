// === 숫돌: 연마와 수리 통합 ===
// 이전에는 규칙이 넷이었다. sharpen_melee(근접 전체, 데미지 +3)가 배열에서 앞이라
// 칼에 숫돌을 대면 항상 연마가 먼저 걸리고, sharpen_knife(칼 한 종류, 내구도 복원)는
// 연마를 마친 뒤에야 도달하는 숨은 규칙이었다. 게다가 '완전 복원'이라 적어놓고 70까지만 올렸다.
// 하나의 규칙으로 합치고 대상을 날붙이 전체로 넓힌다.
import { describe, expect, it } from 'vitest';
import { INTERACTION_RULES, findInteraction } from '../../js/data/interactions.js';
import GameData from '../../js/data/GameData.js';
import { formatCardEffectParts } from '../../js/systems/ItemEffectSystem.js';
import ITEMS from '../../js/data/items.js';

const def  = id => GameData.items[id];
const inst = (definitionId, extra = {}) => ({ instanceId: `${definitionId}_1`, definitionId, durability: 100, ...extra });
const stone = (extra = {}) => inst('whetstone', extra);

const BLADES = Object.values(ITEMS)
  .filter(d => d?.type === 'weapon' && d?.weaponType === 'blade')
  .map(d => d.id);
const BLUNTS = ['iron_pipe', 'crowbar', 'baseball_bat'];

describe('이전 규칙 제거', () => {
  it.each(['sharpen_melee', 'sharpen_melee_rev', 'sharpen_knife', 'sharpen_knife_rev'])(
    '%s 규칙이 사라졌다', id => {
      expect(INTERACTION_RULES.some(r => r.id === id)).toBe(false);
    });

  it('통합 규칙 한 쌍만 남는다', () => {
    const ids = INTERACTION_RULES.filter(r => r.source?.id === 'whetstone' || r.target?.id === 'whetstone')
      .map(r => r.id).sort();
    expect(ids).toEqual(['sharpen_blade', 'sharpen_blade_rev']);
  });
});

describe('대상 판정', () => {
  it.each(BLADES)('%s(날붙이)에 숫돌을 쓸 수 있다', id => {
    const rule = findInteraction(def('whetstone'), def(id));
    expect(rule).toBeTruthy();
    expect(rule.canApply(stone(), inst(id, { durability: 50 })).ok).toBe(true);
  });

  it.each(BLUNTS)('%s(둔기)에는 쓸 수 없다', id => {
    const rule = findInteraction(def('whetstone'), def(id));
    if (!rule) return;                                   // 규칙 자체가 안 잡히면 그것으로 충분
    expect(rule.canApply(stone(), inst(id, { durability: 50 })).ok).toBe(false);
  });

  it('날붙이 대상이 14종이다', () => {
    expect(BLADES.length).toBe(14);
  });
});

describe('연마 + 수리를 한 번에 처리한다', () => {
  it('첫 연마는 데미지 +3과 내구도 +30을 함께 준다', () => {
    const blade = inst('machete', { durability: 50 });
    const s = stone();
    const rule = findInteraction(def('whetstone'), def('machete'));

    const result = rule.apply(s, blade);

    expect(blade.sharpened).toBe(true);
    expect(blade.damageBonus).toBe(3);
    expect(blade.durability).toBe(80);
    expect(s.durability).toBe(85);
    expect(result).toMatchObject({ consumeSrc: false, consumeTgt: false });
  });

  it('이미 연마한 무기는 수리만 된다 — 데미지가 더 오르지 않는다', () => {
    const blade = inst('machete', { durability: 40, sharpened: true, damageBonus: 3 });
    const rule = findInteraction(def('whetstone'), def('machete'));

    rule.apply(stone(), blade);

    expect(blade.damageBonus).toBe(3);
    expect(blade.durability).toBe(70);
  });

  it('내구도는 100을 넘지 않는다', () => {
    const blade = inst('knife', { durability: 90 });
    findInteraction(def('whetstone'), def('knife')).apply(stone(), blade);
    expect(blade.durability).toBe(100);
  });

  it('기존 데미지 보정에 누적된다', () => {
    const blade = inst('knife', { durability: 50, damageBonus: 2 });
    findInteraction(def('whetstone'), def('knife')).apply(stone(), blade);
    expect(blade.damageBonus).toBe(5);
  });
});

describe('숫돌 소모', () => {
  it('한 번 쓸 때마다 15씩 닳는다', () => {
    const s = stone();
    const rule = findInteraction(def('whetstone'), def('knife'));
    rule.apply(s, inst('knife', { durability: 10 }));
    expect(s.durability).toBe(85);
  });

  it('다 닳으면 숫돌이 소모된다', () => {
    const s = stone({ durability: 15 });
    const rule = findInteraction(def('whetstone'), def('knife'));
    const result = rule.apply(s, inst('knife', { durability: 10 }));
    expect(s.durability).toBe(0);
    expect(result.consumeSrc).toBe(true);
  });

  it('15 미만이면 쓸 수 없다', () => {
    const rule = findInteraction(def('whetstone'), def('knife'));
    expect(rule.canApply(stone({ durability: 10 }), inst('knife', { durability: 10 })).ok).toBe(false);
  });
});

describe('거부 조건', () => {
  it('이미 연마했고 내구도도 최대면 거부한다', () => {
    const rule = findInteraction(def('whetstone'), def('knife'));
    const blade = inst('knife', { durability: 100, sharpened: true });
    expect(rule.canApply(stone(), blade).ok).toBe(false);
  });

  it('연마했어도 내구도가 닳았으면 쓸 수 있다', () => {
    const rule = findInteraction(def('whetstone'), def('knife'));
    const blade = inst('knife', { durability: 60, sharpened: true });
    expect(rule.canApply(stone(), blade).ok).toBe(true);
  });

  it('연마 전이면 내구도가 최대여도 쓸 수 있다', () => {
    const rule = findInteraction(def('whetstone'), def('knife'));
    expect(rule.canApply(stone(), inst('knife', { durability: 100 })).ok).toBe(true);
  });
});

describe('무기를 숫돌 위로 끌어도 동일하다', () => {
  it('역방향에서도 연마와 수리가 함께 적용된다', () => {
    const blade = inst('katana', { durability: 50 });
    const s = stone();
    const rule = findInteraction(def('katana'), def('whetstone'));

    expect(rule).toBeTruthy();
    const result = rule.apply(blade, s);

    expect(blade.sharpened).toBe(true);
    expect(blade.damageBonus).toBe(3);
    expect(blade.durability).toBe(80);
    expect(s.durability).toBe(85);
    expect(result).toMatchObject({ consumeSrc: false, consumeTgt: false });
  });
});

describe('안내 문구가 실제 동작과 맞는다', () => {
  it('힌트에 잘못된 "완전 복원" 표현이 없다', () => {
    for (const r of INTERACTION_RULES.filter(r => r.id.startsWith('sharpen_blade'))) {
      expect(r.hint).not.toContain('완전 복원');
    }
  });

  it('힌트가 내구도와 데미지 수치를 함께 알려준다', () => {
    const rule = findInteraction(def('whetstone'), def('knife'));
    expect(rule.hint).toContain('30');
    expect(rule.hint).toContain('3');
  });
});

describe('연마 수치가 카드에 표시된다', () => {
  it('연마한 무기의 효과 줄에 피해 보너스가 나온다', () => {
    const blade = inst('machete', { durability: 50 });
    findInteraction(def('whetstone'), def('machete')).apply(stone(), blade);

    const parts = formatCardEffectParts(def('machete'), blade).join(' | ');
    expect(parts).toContain('피해 +3');
  });

  it('연마하지 않은 무기에는 나오지 않는다', () => {
    const parts = formatCardEffectParts(def('machete'), inst('machete')).join(' | ');
    expect(parts).not.toContain('피해 +');
  });

  it('가죽 그립 같은 명중 보정도 함께 노출된다', () => {
    const parts = formatCardEffectParts(def('knife'), inst('knife', { accuracyBonus: 0.05 })).join(' | ');
    expect(parts).toContain('명중 +5%');
  });
});
