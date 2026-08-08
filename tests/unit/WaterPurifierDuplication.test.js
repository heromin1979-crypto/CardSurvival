// === 정수기 데이터 중복 정리 테스트 ===
// regression: water_purifier가 아이템 정의 2곳, 청사진 2개, stackConfig 2줄,
// CardFactory 이미지 2줄에 걸쳐 중복돼 있었다. 아이템은 애그리게이터 병합 순서상
// items_structures 쪽이 이겨 items_misc의 medical_structure 정의(effect.waterPerTP)는
// 도달하지 않았고, 청사진 둘은 같은 아이템을 서로 다른 재료로 만들어 제작 목록에
// 나란히 노출됐다.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import ITEMS_MISC from '../../js/data/items_misc.js';
import ITEMS from '../../js/data/items.js';
import BLUEPRINTS from '../../js/data/blueprints.js';
import BLUEPRINTS_ADV from '../../js/data/blueprints_advanced.js';
import HIDDEN_RECIPES from '../../js/data/hiddenRecipes.js';
import { ko, en } from '../../js/data/locales.js';

const ALL_BPS = { ...BLUEPRINTS, ...BLUEPRINTS_ADV, ...HIDDEN_RECIPES };

/** 소스 파일에서 특정 키가 몇 번 선언됐는지 센다 (객체 리터럴 중복 키는 런타임에 사라진다) */
function countSourceKeys(path, pattern) {
  const src = fs.readFileSync(path, 'utf8');
  return [...src.matchAll(pattern)].length;
}

describe('정수기 — 아이템 정의', () => {
  it('items_misc는 water_purifier를 정의하지 않는다', () => {
    expect(ITEMS_MISC.water_purifier).toBeUndefined();
  });

  it('살아남은 정의는 오염 정화를 구현한 utility 쪽이다', () => {
    // ContaminationSystem이 보드의 water_purifier로 인접 물 오염도를 낮춘다.
    expect(ITEMS.water_purifier.subtype).toBe('utility');
    expect(ITEMS.water_purifier.name).toBe('정수기');
  });

  it('도달하지 않던 effect 필드가 남아 있지 않다', () => {
    expect(ITEMS.water_purifier.effect).toBeUndefined();
  });
});

describe('정수기 — 청사진', () => {
  it('정수기를 산출하는 청사진은 하나뿐이다', () => {
    const makers = Object.values(ALL_BPS)
      .filter(bp => bp.output?.some(o => o.definitionId === 'water_purifier'))
      .map(bp => bp.id);
    expect(makers).toEqual(['water_purifier']);
  });

  it('살아남은 청사진에 해금 조건이 있다', () => {
    expect(ALL_BPS.water_purifier.unlockConditions?.minSkillLevel).toBeDefined();
  });
});

describe('정수기 — 중복 선언 제거', () => {
  it('stackConfig에 water_purifier 항목이 하나뿐이다', () => {
    const n = countSourceKeys('js/data/stackConfig.js', /\[\s*'water_purifier'\s*,/g);
    expect(n).toBe(1);
  });

  it('CardFactory 이미지 매핑에 water_purifier 키가 하나뿐이다', () => {
    const n = countSourceKeys('js/ui/CardFactory.js', /^\s{2}water_purifier:\s*'assets\//gm);
    expect(n).toBe(1);
  });
});

describe('정수기 — 영문 이름', () => {
  it('실제 청사진 id에 맞는 영문 키가 있다', () => {
    expect(en['_blueprint.water_purifier']).toBeDefined();
  });

  it('어느 청사진에도 없는 고아 키가 남아 있지 않다', () => {
    expect(en['_blueprint.make_water_purifier']).toBeUndefined();
    expect(ko['_blueprint.make_water_purifier']).toBeUndefined();
  });
});
