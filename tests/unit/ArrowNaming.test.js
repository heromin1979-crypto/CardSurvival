// === 화살 어휘 통일 ===
// 같은 물건을 '화살'과 '볼트' 두 어휘로 부르고 있었다.
// 기본 아이템이 이미 '석궁 화살'이므로 화살 쪽으로 맞춘다.
import { describe, expect, it } from 'vitest';
import ITEMS from '../../js/data/items.js';
import BLUEPRINTS from '../../js/data/blueprints.js';
import SECRET_COMBINATIONS from '../../js/data/secretCombinations.js';

const RENAMED = {
  crossbow_bolt:          '석궁 화살',
  explosive_bolt:         '폭발 석궁 화살',
  improved_crossbow_bolt: '강화 석궁 화살',
  fire_bolt:              '화염 화살',
  bolt_shaft:             '화살대',
  bolt_tip:               '화살촉',
};

describe('아이템 이름', () => {
  it.each(Object.entries(RENAMED))('%s → %s', (id, name) => {
    expect(ITEMS[id].name).toBe(name);
  });

  it.each(Object.keys(RENAMED))('%s 설명문에 "볼트"가 남아 있지 않다', id => {
    expect(ITEMS[id].description).not.toContain('볼트');
  });
});

describe('제작 경로 이름', () => {
  it('청사진 이름과 단계 라벨에 "볼트"가 남아 있지 않다', () => {
    for (const bp of Object.values(BLUEPRINTS)) {
      const producesArrow = (bp.output ?? []).some(o => RENAMED[o.definitionId]);
      if (!producesArrow) continue;
      const text = [bp.name, bp.description ?? '', ...(bp.stages ?? []).map(s => s.label ?? '')].join(' ');
      expect(text, `${bp.id}에 "볼트"가 남음`).not.toContain('볼트');
    }
  });

  it('시크릿 조합 이름·힌트·발견 메시지에 "볼트"가 남아 있지 않다', () => {
    for (const combo of SECRET_COMBINATIONS) {
      if (!RENAMED[combo.result?.spawnItem]) continue;
      const text = `${combo.name} ${combo.hint} ${combo.discoveryMsg}`;
      expect(text, `${combo.id}에 "볼트"가 남음`).not.toContain('볼트');
    }
  });
});

describe('스택 설정 등록', () => {
  it('특수 화살 3종이 스택 가능하게 등록되어 있다', () => {
    for (const id of ['improved_crossbow_bolt', 'fire_bolt', 'explosive_bolt']) {
      expect(ITEMS[id].stackable, `${id}가 스택 불가`).toBe(true);
      expect(ITEMS[id].maxStack).toBeGreaterThan(1);
    }
  });
});
